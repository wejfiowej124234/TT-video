#!/usr/bin/env bash
# TT-B435 §3.4：在仓库根执行；与运行中 API 的密钥一致。
# 自动加载仓库根 .env（与 b435-sepolia-stake-first-payment 相同），并去掉 Windows CRLF。
# 可选：export B435_EVIDENCE_RUN_DIR=evidence/b435_fullstack_fund_testnet_closeout/run_<UTC>
# 若未设 ADMIN_BEARER_TOKEN：可 export B435_AUTO_ADMIN_BEARER_MINT=1，在 API 已开启
#   TRAVELTRUST_TESTNET_ADMIN_BEARER_MINT=1 且具备 DATABASE_URL/管理员用户时，由脚本 POST
#   /api/v1/internal/testnet-mint-admin-bearer 取得 tts_… token（仅测试网）。
#
# **indexer-reconcile** 请求体（默认仅 `{"persist":true}`）：
#   B435_INCLUDE_FEE_ROUTER_B383=1
#     → `include_fee_router_platform_fee_routed_log_count_chain_vs_db_observability:true`（**TT-B383**）
#   B435_INCLUDE_REVENUE_PIPELINE_B386_BUNDLE=1
#     → `include_revenue_pipeline_log_count_chain_vs_db_bundle_observability:true`（**B-386** 三腿汇总；隐式含 B-383 等）
#   VERIFY_FEE_ROUTER_EVENTS_RPC=1..20
#     → `verify_fee_router_events_rpc`（**B-081** receipt 校验；与下两项联可做 pin）
#   FEE_ROUTER_VERIFY_TX_HASH=0x…  可选
#   FEE_ROUTER_VERIFY_LOG_INDEX=n  可选（同一 tx 多条 PlatformFeeRouted 时建议设）
# 启用以上任一扩展字段须本机有 **jq**（用于拼 JSON）。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# 调用方若在 source 前已 export API_BASE_URL / B435_EVIDENCE_RUN_DIR（例如 API 实际监听非 8080），勿被 .env 覆盖。
_CALLER_API_BASE="${API_BASE_URL:-}"
_CALLER_RUN_DIR="${B435_EVIDENCE_RUN_DIR:-}"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi
if [[ -n "$_CALLER_API_BASE" ]]; then export API_BASE_URL="$_CALLER_API_BASE"; fi
if [[ -n "$_CALLER_RUN_DIR" ]]; then export B435_EVIDENCE_RUN_DIR="$_CALLER_RUN_DIR"; fi

_strip_cr() { printf '%s' "${1//$'\r'/}"; }

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="$(_strip_cr "$BASE")"
RUN_DIR="${B435_EVIDENCE_RUN_DIR:-evidence/b435_fullstack_fund_testnet_closeout/run_20260416T122500Z}"
RUN_DIR="$(_strip_cr "$RUN_DIR")"
SEC="$(_strip_cr "${INTERNAL_API_SECRET:-}")"
ADM="$(_strip_cr "${ADMIN_BEARER_TOKEN:-}")"

if [[ -z "$SEC" ]]; then
  echo "INTERNAL_API_SECRET is empty; internal routes will 403." >&2
  echo "  Set it in $ROOT/.env then: set -a && source .env && set +a" >&2
  exit 1
fi

if [[ -z "$ADM" && "${B435_AUTO_ADMIN_BEARER_MINT:-0}" == "1" ]]; then
  echo "=== POST testnet-mint-admin-bearer (B435_AUTO_ADMIN_BEARER_MINT=1) ===" >&2
  mint_body="$(curl -sS -X POST "$BASE/api/v1/internal/testnet-mint-admin-bearer" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: $SEC" \
    -d '{}')" || true
  if command -v jq >/dev/null 2>&1; then
    tok="$(printf '%s' "$mint_body" | jq -r '.token // empty')"
    if [[ -n "$tok" ]]; then
      ADM="$tok"
      echo "Using ADMIN_BEARER_TOKEN from testnet mint (session issued)." >&2
    else
      echo "$mint_body" | jq . >&2 2>/dev/null || echo "$mint_body" >&2
      echo "testnet-mint-admin-bearer did not return token (API needs TRAVELTRUST_TESTNET_ADMIN_BEARER_MINT=1, DATABASE_URL, admin user)." >&2
      exit 1
    fi
  else
    echo "B435_AUTO_ADMIN_BEARER_MINT=1 requires jq to parse mint response; install jq or set ADMIN_BEARER_TOKEN manually." >&2
    exit 1
  fi
fi

if [[ -z "$ADM" ]]; then
  echo "ADMIN_BEARER_TOKEN is empty; overview will 401." >&2
  echo "  Set ADMIN_BEARER_TOKEN in $ROOT/.env, or set B435_AUTO_ADMIN_BEARER_MINT=1 with API TRAVELTRUST_TESTNET_ADMIN_BEARER_MINT=1." >&2
  exit 1
fi

mkdir -p "$RUN_DIR"

build_reconcile_body() {
  local inc383="${B435_INCLUDE_FEE_ROUTER_B383:-0}"
  local inc386="${B435_INCLUDE_REVENUE_PIPELINE_B386_BUNDLE:-0}"
  local vrpc="${VERIFY_FEE_ROUTER_EVENTS_RPC:-}"
  vrpc="${vrpc//$'\r'/}"
  local txh="${FEE_ROUTER_VERIFY_TX_HASH:-}"
  txh="${txh//$'\r'/}"
  local li="${FEE_ROUTER_VERIFY_LOG_INDEX:-}"
  li="${li//$'\r'/}"

  if [[ "$inc383" != "1" && "$inc386" != "1" && -z "$vrpc" && -z "$txh" && -z "$li" ]]; then
    printf '%s' '{"persist":true}'
    return 0
  fi
  if ! command -v jq >/dev/null 2>&1; then
    echo "b435-evidence-internal-curls: extended reconcile body requires jq (brew install jq / apt install jq)." >&2
    exit 1
  fi
  jq -nc \
    --argjson persist true \
    --arg inc383 "$inc383" \
    --arg inc386 "$inc386" \
    --arg vrpc "$vrpc" \
    --arg txh "$txh" \
    --arg li "$li" \
    '
    {persist: $persist}
    | (if $inc383 == "1" then . + {include_fee_router_platform_fee_routed_log_count_chain_vs_db_observability: true} else . end)
    | (if $inc386 == "1" then . + {include_revenue_pipeline_log_count_chain_vs_db_bundle_observability: true} else . end)
    | (if ($vrpc | test("^[0-9]+$")) and (($vrpc | tonumber) >= 1) and (($vrpc | tonumber) <= 20)
        then . + {verify_fee_router_events_rpc: ($vrpc | tonumber)} else . end)
    | (if ($txh | length) > 0 then . + {fee_router_verify_tx_hash: $txh} else . end)
    | (if ($li | length) > 0 and ($li | test("^-?[0-9]+$"))
        then . + {fee_router_verify_log_index: ($li | tonumber)} else . end)
    '
}

RECONCILE_BODY="$(build_reconcile_body)"

echo "=== POST indexer-tick ==="
curl -sS -X POST "$BASE/api/v1/internal/indexer-tick" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Secret: $SEC" \
  -d '{}' \
  | tee "$RUN_DIR/indexer_tick.json" \
  | { command -v jq >/dev/null && jq . || cat; }

echo
echo "=== POST indexer-reconcile (persist) ==="
curl -sS -X POST "$BASE/api/v1/internal/indexer-reconcile" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Secret: $SEC" \
  -d "$RECONCILE_BODY" \
  | tee "$RUN_DIR/reconcile.json" \
  | { command -v jq >/dev/null && jq . || cat; }

echo
echo "=== GET admin observability overview ==="
curl -sS --max-time 180 "$BASE/api/v1/admin/observability/overview" \
  -H "Authorization: Bearer $ADM" \
  | tee "$RUN_DIR/overview.json" \
  | { command -v jq >/dev/null && jq . || cat; }

echo
echo "Wrote: $RUN_DIR/indexer_tick.json, reconcile.json, overview.json"
