#!/usr/bin/env bash
# CORS / Env / Stripe / Sepolia 对拍清单（tt-web-staging ↔ tt-api-staging）
#
#   bash scripts/dev/check-staging-web-alignment.sh
#   bash scripts/dev/check-staging-web-alignment.sh --web-base https://tt-web-staging.fly.dev
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
EXPECT_CHAIN_ID="${STAGING_CHAIN_ID:-11155111}"
BUILD_ENV="${STAGING_WEB_BUILD_ENV:-$ROOT/deploy/fly/tt-web-staging/build.env.local}"
ONBOARDING="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"

merge_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$f"
}

merge_env_file "$ONBOARDING"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --web-base) WEB_BASE="$2"; shift 2 ;;
    --api-base) API_BASE="$2"; shift 2 ;;
    --chain-id) EXPECT_CHAIN_ID="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

WEB_BASE="${WEB_BASE%/}"
API_BASE="${API_BASE%/}"

pass=0
fail_n=0
warn_n=0

pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }

section() { echo ""; echo "=== $* ==="; }

section "1 · API 可达"
api_hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "${API_BASE}/health" 2>/dev/null || echo 000)"
if [[ "$api_hc" == "200" ]]; then pass "${API_BASE}/health → 200"; else fail "${API_BASE}/health → $api_hc"; fi

section "2 · CORS（浏览器 Origin → API）"
cors_check() {
  local path="$1"
  curl -sS -D - -o /dev/null -X OPTIONS "${API_BASE}${path}" \
    -H "Origin: ${WEB_BASE}" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null \
    | tr -d '\r' | grep -i '^access-control-allow-origin:' | head -1 || true
}
cors_hdr="$(cors_check /meta)"
if echo "$cors_hdr" | grep -qi "$WEB_BASE"; then
  pass "OPTIONS /meta allows Origin ${WEB_BASE}"
else
  fail "CORS missing ${WEB_BASE} on /meta — patch tt-api-staging CORS_ORIGINS and redeploy API"
  echo "       hint: CORS_ORIGINS=${WEB_BASE},http://localhost:3012,http://127.0.0.1:3012" >&2
fi
gov_cors="$(cors_check /api/v1/governance/proposals)"
if echo "$gov_cors" | grep -qi "$WEB_BASE"; then
  pass "OPTIONS /api/v1/governance/proposals allows Origin ${WEB_BASE}"
else
  fail "CORS missing ${WEB_BASE} on /api/v1/* — required for /auth and legacy cross-origin probes"
  echo "       hint: bash scripts/dev/patch-tt-api-staging-cors.sh" >&2
fi

section "3 · Sepolia /meta 对拍"
meta_json="$(curl -sS --max-time 45 "${API_BASE}/meta" 2>/dev/null || echo '{}')"
meta_chain_id="$(echo "$meta_json" | python -c "import json,sys; d=json.load(sys.stdin); print((d.get('chain') or {}).get('chain_id',''))" 2>/dev/null || echo "")"
if [[ "$meta_chain_id" == "$EXPECT_CHAIN_ID" ]]; then
  pass "GET /meta chain.chain_id = ${EXPECT_CHAIN_ID} (Sepolia)"
else
  fail "chain.chain_id expected ${EXPECT_CHAIN_ID}, got '${meta_chain_id}'"
fi

for pair in \
  "escrow_factory_address:ESCROW_FACTORY_ADDRESS:${ESCROW_FACTORY_ADDRESS:-}" \
  "fee_router_address:FEE_ROUTER_ADDRESS:${FEE_ROUTER_ADDRESS:-}" \
  "governor_address:GOVERNOR_ADDRESS:${GOVERNOR_ADDRESS:-}"; do
  key="${pair%%:*}"
  rest="${pair#*:}"
  label="${rest%%:*}"
  expected="${rest#*:}"
  got="$(echo "$meta_json" | python -c "import json,sys; d=json.load(sys.stdin); c=(d.get('chain') or {}).get('contracts') or {}; print(c.get('${key}') or '')" 2>/dev/null || echo "")"
  if [[ -n "$got" && "$got" != "null" ]]; then
    pass "meta chain.contracts.${key} = ${got}"
  else
    warn "meta chain.contracts.${key} null/missing (strict E2E meta guard may need PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1)"
  fi
done

section "4 · 前端 build env（NEXT_PUBLIC_*）"
merge_key() {
  local k="$1"
  if [[ -f "$BUILD_ENV" ]]; then
    grep -E "^[[:space:]]*${k}=" "$BUILD_ENV" 2>/dev/null | tail -1 | sed "s/^[^=]*=//" | tr -d '\r' || true
  fi
}
for k in NEXT_PUBLIC_API_BASE_URL NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_CHAIN_ID NEXT_PUBLIC_RPC_URL; do
  v="$(merge_key "$k")"
  if [[ -n "$v" ]]; then pass "build.env ${k}=${v}"; else warn "build.env missing ${k} (deploy script will default)"; fi
done
be_api="$(merge_key NEXT_PUBLIC_API_BASE_URL)"
be_chain="$(merge_key NEXT_PUBLIC_CHAIN_ID)"
[[ -z "$be_api" || "$be_api" == "$API_BASE" ]] && pass "NEXT_PUBLIC_API_BASE_URL ↔ API_BASE" || fail "NEXT_PUBLIC_API_BASE_URL=${be_api} ≠ ${API_BASE}"
[[ -z "$be_chain" || "$be_chain" == "$EXPECT_CHAIN_ID" ]] && pass "NEXT_PUBLIC_CHAIN_ID ↔ Sepolia" || fail "NEXT_PUBLIC_CHAIN_ID=${be_chain} ≠ ${EXPECT_CHAIN_ID}"

section "5 · Stripe test（API 侧 · 非 live）"
stripe_enabled="$(echo "$meta_json" | python -c "
import json,sys
d=json.load(sys.stdin)
for path in [('onboarding',), ('stripe',)]:
  o=d
  for p in path:
    o=(o or {}).get(p) if isinstance(o,dict) else None
print('1' if str((d.get('onboarding') or {}).get('stripe_enabled','')).lower() in ('1','true') else '')
" 2>/dev/null || echo "")"
if [[ -n "$stripe_enabled" ]]; then
  pass "API meta indicates onboarding Stripe enabled (test mode expected on staging)"
else
  warn "Cannot confirm Stripe test from /meta — verify TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1 + sk_test_* on tt-api-staging"
fi
warn "Stripe live keys on staging = BLOCKER (G-1 isolation)"

section "6 · Staging 前端 URL"
web_hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "${WEB_BASE}/" 2>/dev/null || echo 000)"
if [[ "$web_hc" == "200" ]]; then
  pass "${WEB_BASE}/ → 200 (browsable)"
else
  warn "${WEB_BASE}/ → ${web_hc} (deploy with: bash scripts/dev/deploy-tt-web-staging.sh)"
fi

echo ""
echo "check-staging-web-alignment: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
echo "边界：② staging 可浏览 UI · PHASE2_GO_READY ≠ Production GO · G7 CDN/HLS = PREP_PASS"
[[ "$fail_n" -eq 0 ]] || exit 2
