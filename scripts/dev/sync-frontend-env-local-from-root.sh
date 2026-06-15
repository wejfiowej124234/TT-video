#!/usr/bin/env bash
# Unix：与 sync-frontend-env-local-from-root.ps1 同源；供 start_dev.sh 调用
# NEXT_PUBLIC_* 仅反映根 .env；须与目标链部署一致（见 docs/spec/14-合约-API-ABI-前后端对齐.md）。
# GOVERNANCE_TOKEN_ADDRESS -> NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS（TTG；非 Governor）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
OUT="$ROOT/frontend/.env.local"
MARK_BEGIN="# --- BEGIN TT NEXT_PUBLIC sync ---"
MARK_END="# --- END TT NEXT_PUBLIC sync ---"

# Strip all historical TT NEXT_PUBLIC sync blocks before rebuild (fixes empty/duplicate orphans).
if [[ -f "$OUT" ]]; then
  PRE="$(mktemp)"
  awk '
    /^# --- BEGIN TT NEXT_PUBLIC sync/ { skip=1; next }
    skip && /^# --- END TT NEXT_PUBLIC sync/ { skip=0; next }
    skip { next }
    { print }
  ' "$OUT" >"$PRE"
  mv "$PRE" "$OUT"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "sync-frontend-env: skip (no root .env)"
  exit 0
fi

get_val() {
  local k="$1" line v=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^[[:space:]]*${k}= ]]; then
      v="$(echo "$line" | sed "s/^[[:space:]]*${k}=//" | sed 's/\r$//' | sed 's/^"\(.*\)"$/\1/')"
    fi
  done <"$ENV_FILE"
  echo -n "$v"
}

# 决定写入 NEXT_PUBLIC_API_BASE_URL 的端口（须为 traveltrust-api 监听端口，不可与 Next 3012 混写，否则浏览器拿到 HTML → api_html_not_json）
# 优先级：环境变量 API_LISTEN_PORT（start_dev 传入）> 根 .env API_LISTEN_PORT > 根 .env PORT；若 PORT 为 3012/3000 且无显式监听覆盖，则改用 8080 并告警
if [[ -n "${API_LISTEN_PORT:-}" ]]; then
  PORT="${API_LISTEN_PORT}"
elif [[ -n "$(get_val API_LISTEN_PORT)" ]]; then
  PORT="$(get_val API_LISTEN_PORT)"
else
  PORT="$(get_val PORT)"
  [[ -z "${PORT// }" ]] && PORT=8080
  if [[ "$PORT" == "3012" || "$PORT" == "3000" ]]; then
    echo "sync-frontend-env: WARN: root .env PORT=$PORT looks like a Next.js dev port, not traveltrust-api. Using 8080 for NEXT_PUBLIC_API_BASE_URL. Set PORT=8080 or API_LISTEN_PORT=8080 in .env." >&2
    PORT=8080
  fi
fi
API_BASE="http://127.0.0.1:${PORT}"

TMP="$(mktemp)"
{
  echo "$MARK_BEGIN"
  echo "# 与仓库根 .env 同源"
  echo "NEXT_PUBLIC_API_BASE_URL=${API_BASE}"
  v="$(get_val CHAIN_ID)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_CHAIN_ID=${v}"
  v="$(get_val CHAIN_RPC_URL)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_RPC_URL=${v}"
  v="$(get_val FEE_ROUTER_ADDRESS)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_FEE_ROUTER_ADDRESS=${v}"
  v="$(get_val ESCROW_FACTORY_ADDRESS)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=${v}"
  v="$(get_val REGISTRY_ADDRESS)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_REGISTRY_ADDRESS=${v}"
  v="$(get_val GUIDE_STAKING_ADDRESS)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_GUIDE_STAKING_ADDRESS=${v}"
  v="$(get_val STAKING_PROVIDER_ADDRESS)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS=${v}"
  v="$(get_val REGION_STEWARD_STAKE_POOL_ADDRESS)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS=${v}"
  gov="$(get_val GOVERNANCE_TOKEN_ADDRESS)"
  [[ -z "${gov// }" ]] && gov="$(get_val GOVERNANCE_VOTES_TOKEN_ADDRESS)"
  [[ -n "${gov// }" ]] && echo "NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=${gov}"
  st="$(get_val SETTLEMENT_TOKEN)"
  [[ -z "$st" ]] && st="$(get_val PAYMENT_TOKEN)"
  [[ -n "$st" ]] && echo "NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS=${st}"
  v="$(get_val INVESTOR_DISTRIBUTION_CLAIM_ADDRESS)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS=${v}"
  v="$(get_val COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=${v}"
  v="$(get_val TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES=${v}"
  v="$(get_val NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES)"
  [[ -z "${v// }" ]] && v="$(get_val TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES)"
  [[ -n "${v// }" ]] && echo "NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=${v}"
  v="$(get_val COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS)" && [[ -n "$v" ]] && echo "NEXT_PUBLIC_COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS=${v}"
  cid="$(get_val CHAIN_ID)"
  if [[ "${cid// }" == "31337" ]]; then
    echo "NEXT_PUBLIC_ONBOARDING_LOCAL_DEV_TOOLS=1"
  fi
  echo "$MARK_END"
} > "$TMP"

MANAGED='^(NEXT_PUBLIC_API_BASE_URL|NEXT_PUBLIC_CHAIN_ID|NEXT_PUBLIC_RPC_URL|NEXT_PUBLIC_FEE_ROUTER_ADDRESS|NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS|NEXT_PUBLIC_REGISTRY_ADDRESS|NEXT_PUBLIC_GUIDE_STAKING_ADDRESS|NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS|NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS|NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS|NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS|NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS|NEXT_PUBLIC_COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS|NEXT_PUBLIC_ONBOARDING_LOCAL_DEV_TOOLS|NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL|NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES|NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES)='
KEPT="$(mktemp)"
if [[ -f "$OUT" ]]; then
  inside=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "$MARK_BEGIN" ]] || [[ "$line" == "# --- BEGIN TT NEXT_PUBLIC sync ("* ]]; then inside=1; continue; fi
    if [[ "$line" == "$MARK_END" ]]; then inside=0; continue; fi
    [[ "$inside" -eq 1 ]] && continue
    if [[ "$line" =~ $MANAGED ]]; then continue; fi
    # Drop stale boilerplate from prior sync runs (keep real manual overrides only).
    if [[ "$line" == "# frontend/.env.local"* ]]; then continue; fi
    if [[ "$line" == "# --- 以下为手动配置"* ]] || [[ "$line" == "# --- Manual lines"* ]]; then continue; fi
    if [[ "$line" == "# Same source as root .env"* ]] || [[ "$line" == "# 与仓库根 .env 同源"* ]]; then continue; fi
    [[ -z "${line// }" ]] && continue
    printf '%s\n' "$line" >> "$KEPT"
  done < "$OUT"
fi

{
  echo "# frontend/.env.local — maintained by sync-frontend-env-local-from-root.sh"
  if [[ -s "$KEPT" ]]; then
    echo "# --- 以下为手动配置（未被同步覆盖）---"
    cat "$KEPT"
    echo ""
  fi
  cat "$TMP"
} > "$OUT"
rm -f "$TMP" "$KEPT"

cid="$(get_val CHAIN_ID)"
rpc="$(get_val CHAIN_RPC_URL)"
if [[ -n "${cid// }" && -z "${rpc// }" ]]; then
  echo "sync-frontend-env: WARN — CHAIN_ID set but CHAIN_RPC_URL empty; chain reads / wagmi may fail" >&2
fi
gt="$(get_val GOVERNANCE_TOKEN_ADDRESS)"
if [[ -n "${cid// }" && -z "${gt// }" ]]; then
  echo "sync-frontend-env: WARN — CHAIN_ID set but GOVERNANCE_TOKEN_ADDRESS empty; governance token UI may miss NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS" >&2
fi

echo "sync-frontend-env: wrote $OUT"
