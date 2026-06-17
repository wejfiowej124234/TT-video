#!/usr/bin/env bash
# Production web/API alignment（PI3-002 Execution · Sepolia scope · 148）
#
#   PROD_WEB_BASE=https://app.example.com PROD_API_BASE=https://api.example.com \
#     bash scripts/dev/check-production-web-alignment.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_BASE="${PROD_WEB_BASE:-}"
API_BASE="${PROD_API_BASE:-}"
EXPECT_CHAIN_ID="${PROD_CHAIN_ID:-11155111}"
BUILD_ENV="${PROD_WEB_BUILD_ENV:-$ROOT/deploy/fly/tt-web-prod/build.env.local}"

if [[ -z "$WEB_BASE" || -z "$API_BASE" ]]; then
  echo "check-production-web-alignment: set PROD_WEB_BASE and PROD_API_BASE" >&2
  exit 2
fi

WEB_BASE="${WEB_BASE%/}"
API_BASE="${API_BASE%/}"

pass=0
fail_n=0
warn_n=0

pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }
section() { echo ""; echo "=== $* ==="; }

merge_key() {
  local k="$1"
  if [[ -f "$BUILD_ENV" ]]; then
    grep -E "^[[:space:]]*${k}=" "$BUILD_ENV" 2>/dev/null | tail -1 | sed "s/^[^=]*=//" | tr -d '\r' || true
  fi
}

section "0 · Sepolia Production scope (148)"
if [[ "$EXPECT_CHAIN_ID" == "11155111" ]]; then
  pass "PROD_CHAIN_ID=11155111 (Sepolia scope)"
else
  fail "PROD_CHAIN_ID=${EXPECT_CHAIN_ID} — 148 selects Sepolia 11155111 for prod scope"
fi

section "1 · API TLS + /health"
api_hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "${API_BASE}/health" 2>/dev/null || echo 000)"
ssl_api="$(curl -sS -o /dev/null -w '%{ssl_verify_result}' --max-time 30 "${API_BASE}/health" 2>/dev/null || echo 9)"
if [[ "$api_hc" == "200" && "$ssl_api" == "0" ]]; then
  pass "${API_BASE}/health → 200 · TLS verify ok"
else
  fail "${API_BASE}/health → ${api_hc} ssl=${ssl_api}"
fi

section "2 · CORS preflight (prod FE → prod API)"
cors_hdr="$(curl -sS -D - -o /dev/null -X OPTIONS "${API_BASE}/meta" \
  -H "Origin: ${WEB_BASE}" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null \
  | tr -d '\r' | grep -i '^access-control-allow-origin:' | head -1 || true)"
if echo "$cors_hdr" | grep -qi "$WEB_BASE"; then
  pass "OPTIONS /meta allows Origin ${WEB_BASE}"
else
  fail "CORS missing ${WEB_BASE} — run: PROD_WEB_BASE=${WEB_BASE} bash scripts/dev/patch-tt-api-prod-cors.sh"
fi
ac_creds="$(curl -sS -D - -o /dev/null -X OPTIONS "${API_BASE}/meta" \
  -H "Origin: ${WEB_BASE}" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null \
  | tr -d '\r' | grep -i '^access-control-allow-credentials:' | head -1 || true)"
if echo "$ac_creds" | grep -qi 'true'; then
  pass "access-control-allow-credentials: true"
else
  warn "credentials header not confirmed on OPTIONS /meta"
fi

section "3 · /meta Sepolia chain_id"
meta_json="$(curl -sS --max-time 45 "${API_BASE}/meta" 2>/dev/null || echo '{}')"
meta_chain_id="$(echo "$meta_json" | python -c "import json,sys; d=json.load(sys.stdin); print((d.get('chain') or {}).get('chain_id',''))" 2>/dev/null || echo "")"
if [[ "$meta_chain_id" == "$EXPECT_CHAIN_ID" ]]; then
  pass "GET /meta chain.chain_id = ${EXPECT_CHAIN_ID}"
else
  fail "chain.chain_id expected ${EXPECT_CHAIN_ID}, got '${meta_chain_id}'"
fi

section "4 · NEXT_PUBLIC_* / build.env 对拍"
if [[ -f "$BUILD_ENV" ]]; then
  pass "build.env.local present (${BUILD_ENV})"
else
  warn "missing ${BUILD_ENV} — copy from build.env.sepolia-prod.example"
fi
for k in NEXT_PUBLIC_API_BASE_URL NEXT_PUBLIC_SITE_URL API_REWRITE_TARGET NEXT_PUBLIC_CHAIN_ID; do
  v="$(merge_key "$k")"
  if [[ -n "$v" ]]; then pass "build.env ${k}=${v}"; else warn "build.env missing ${k}"; fi
done
be_api="$(merge_key NEXT_PUBLIC_API_BASE_URL)"
be_site="$(merge_key NEXT_PUBLIC_SITE_URL)"
be_rewrite="$(merge_key API_REWRITE_TARGET)"
be_chain="$(merge_key NEXT_PUBLIC_CHAIN_ID)"
[[ -z "$be_api" || "$be_api" == "$API_BASE" ]] && pass "NEXT_PUBLIC_API_BASE_URL ↔ PROD_API_BASE" || fail "NEXT_PUBLIC_API_BASE_URL=${be_api} ≠ ${API_BASE}"
[[ -z "$be_site" || "$be_site" == "$WEB_BASE" ]] && pass "NEXT_PUBLIC_SITE_URL ↔ PROD_WEB_BASE" || fail "NEXT_PUBLIC_SITE_URL=${be_site} ≠ ${WEB_BASE}"
[[ -z "$be_rewrite" || "$be_rewrite" == "$API_BASE" ]] && pass "API_REWRITE_TARGET ↔ PROD_API_BASE" || fail "API_REWRITE_TARGET=${be_rewrite} ≠ ${API_BASE}"
[[ -z "$be_chain" || "$be_chain" == "$EXPECT_CHAIN_ID" ]] && pass "NEXT_PUBLIC_CHAIN_ID ↔ Sepolia" || fail "NEXT_PUBLIC_CHAIN_ID=${be_chain}"

section "5 · Production web reachable"
web_hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "${WEB_BASE}/" 2>/dev/null || echo 000)"
if [[ "$web_hc" =~ ^(200|307|308)$ ]]; then
  pass "${WEB_BASE}/ → ${web_hc}"
else
  fail "${WEB_BASE}/ → ${web_hc}"
fi

section "6 · 145/146 freeze flags (build.env · static)"
for flag in NEXT_PUBLIC_CATALOG_API_ENABLED CATALOG_SERVER_GEO_VALIDATION; do
  v="$(merge_key "$flag")"
  if [[ -z "$v" || "$v" == "0" ]]; then
    pass "${flag} unset or 0 (145/146 freeze)"
  else
    fail "${flag}=${v} — prod default must stay 0 per 120/146"
  fi
done

echo ""
echo "check-production-web-alignment: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
[[ "$fail_n" -eq 0 ]] || exit 2
