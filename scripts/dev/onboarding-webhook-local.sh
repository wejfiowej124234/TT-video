#!/usr/bin/env bash
# 96-18 · 本地 / 测试网：内网 webhook 将 **pending** 标为 **paid**（无 PSP）。
# 前置：API 已挂载 **DATABASE_URL** + **chain_off.db_pool**；**INTERNAL_API_SECRET** 与请求头一致。
# 可选：与 API 同值的 **ONBOARDING_WEBHOOK_HMAC_SECRET** → 本脚本自动加 **X-Onboarding-Webhook-Signature: v1=<hex>**。
# 若 API 设 **ONBOARDING_INTERNAL_WEBHOOK_ALLOWLIST_CIDRS**，须能解析对端 IP：本脚本默认加 **X-Forwarded-For**（可用 **ONBOARDING_WEBHOOK_X_FORWARDED_FOR** 覆盖，默认 127.0.0.1）。
# 若 API 设 **ONBOARDING_INTERNAL_WEBHOOK_REQUIRE_HTTPS_FORWARDED=1**，本脚本默认加 **X-Forwarded-Proto: https**（可用 **ONBOARDING_WEBHOOK_X_FORWARDED_PROTO** 覆盖）。
#
# 用法（仓库根）：
#   export INTERNAL_API_SECRET=…
#   export API_BASE_URL=http://127.0.0.1:8080   # 测试网则改为 https://your-api…
#   # 可选：export ONBOARDING_WEBHOOK_HMAC_SECRET=…   # 须与 API 进程相同
#   bash scripts/dev/onboarding-webhook-local.sh <idempotency_key> [provider_event_id]
#
set -euo pipefail

IDEM="${1:?usage: $0 <idempotency_key> [provider_event_id]}"
PEVID="${2:-evt_local_$(date +%s)}"
API="${API_BASE_URL:-http://127.0.0.1:8080}"
API="${API%/}"
SECRET="${INTERNAL_API_SECRET:?set INTERNAL_API_SECRET}"

if [[ "$IDEM" == *\"* ]] || [[ "$IDEM" == *$'\n'* ]] || [[ "$IDEM" == *$'\r'* ]] ||
  [[ "$PEVID" == *\"* ]] || [[ "$PEVID" == *$'\n'* ]] || [[ "$PEVID" == *$'\r'* ]]; then
  echo "error: idempotency_key / provider_event_id must not contain quotes or newlines (use a plain UUID)." >&2
  exit 1
fi
# printf 拼接 JSON；键值须与 **payment-intents** 返回的 **idempotency_key** 一致。
BODY=$(printf '{"schema_version":1,"idempotency_key":"%s","provider_event_id":"%s","outcome":"succeeded"}' "$IDEM" "$PEVID")

EXTRA=()
if [[ -n "${ONBOARDING_WEBHOOK_HMAC_SECRET:-}" ]]; then
  SIG_HEX=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$ONBOARDING_WEBHOOK_HMAC_SECRET" 2>/dev/null | awk '{print $NF}')
  EXTRA+=( -H "X-Onboarding-Webhook-Signature: v1=${SIG_HEX}" )
fi

XFF="${ONBOARDING_WEBHOOK_X_FORWARDED_FOR:-127.0.0.1}"
EXTRA+=( -H "X-Forwarded-For: ${XFF}" )
PROTO="${ONBOARDING_WEBHOOK_X_FORWARDED_PROTO:-https}"
EXTRA+=( -H "X-Forwarded-Proto: ${PROTO}" )

curl -sS -X POST "${API}/api/v1/internal/onboarding/payments/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Secret: ${SECRET}" \
  "${EXTRA[@]}" \
  -d "$BODY"
echo
