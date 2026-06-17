#!/usr/bin/env bash
# PI3-006 · Production cutover smoke (go-live §7 · Owner · prod URLs)
#
#   PROD_API_BASE=https://api.<domain> \
#   PROD_WEB_BASE=https://app.<domain> \
#     bash scripts/dev/run-production-cutover-smoke.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PI3_006_CUTOVER_SMOKE_DIR:-$ROOT/evidence/pi3_006_go_live_production_cutover/cutover-smoke-${STAMP}}"
API="${PROD_API_BASE:-${API_BASE:-}}"
WEB="${PROD_WEB_BASE:-${WEB_BASE:-}}"
API="${API%/}"
WEB="${WEB%/}"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/smoke.log") 2>&1

fail=0
record() { echo "SMOKE $1: $2 — $3"; [[ "$2" == "PASS" ]] || fail=1; }

echo "== production cutover smoke · ${STAMP} =="
echo "SSOT: go-live §7 · PRODUCTION-CUTOVER-RUNBOOK-SEPOLIA-SCOPE.md"

if [[ -z "$API" || -z "$WEB" ]]; then
  echo "SKIP: PROD_API_BASE and PROD_WEB_BASE required for live cutover smoke"
  echo "NOT_RUN" > "$OUT/verdict.txt"
  cat > "$OUT/summary.json" <<EOF
{"kind":"traveltrust.pi3_006_cutover_smoke.v1","verdict":"NOT_RUN","reason":"PROD_API_BASE/PROD_WEB_BASE unset"}
EOF
  exit 0
fi

echo "api=${API} web=${WEB}"

hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${API}/health" 2>/dev/null || echo 000)"
[[ "$hc" == "200" ]] && record "HEALTH" PASS "GET /health → ${hc}" || record "HEALTH" FAIL "GET /health → ${hc}"

meta="$OUT/meta.json"
curl -sS --max-time 20 "${API}/meta" -o "$meta" 2>/dev/null || true
if [[ -s "$meta" ]]; then
  chain_id="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('chain',{}).get('chain_id',''))" "$meta" 2>/dev/null || echo "")"
  [[ "$chain_id" == "11155111" ]] && record "META_CHAIN" PASS "chain_id=11155111 (Sepolia)" || record "META_CHAIN" WARN "chain_id=${chain_id} (expected 11155111 for Sepolia scope)"
  record "META" PASS "GET /meta OK"
else
  record "META" FAIL "GET /meta failed"
fi

whc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${WEB}/" 2>/dev/null || echo 000)"
[[ "$whc" == "200" || "$whc" == "307" || "$whc" == "308" ]] && record "WEB" PASS "GET / → ${whc}" || record "WEB" FAIL "GET / → ${whc}"

internal_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 -X POST \
  "${API}/api/v1/internal/indexer-tick" -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo 000)"
if [[ "$internal_code" == "403" || "$internal_code" == "401" ]]; then
  record "INTERNAL_EXPOSURE" PASS "indexer-tick without secret → ${internal_code}"
elif [[ "$internal_code" == "200" ]]; then
  record "INTERNAL_EXPOSURE" FAIL "indexer-tick reachable without secret"
else
  record "INTERNAL_EXPOSURE" WARN "internal probe HTTP ${internal_code}"
fi

verdict="PASS"
[[ "$fail" -ne 0 ]] && verdict="FAIL"
echo "$verdict" > "$OUT/verdict.txt"
python - "$OUT/summary.json" "$verdict" "$STAMP" "$API" "$WEB" <<'PY'
import json, sys
path, verdict, stamp, api, web = sys.argv[1:6]
json.dump({
    "kind": "traveltrust.pi3_006_cutover_smoke.v1",
    "recorded_utc": stamp,
    "verdict": verdict,
    "prod_api_base": api,
    "prod_web_base": web,
    "production_scope": "PRODUCTION_SCOPE_SEPOLIA",
}, open(path, "w", encoding="utf-8"), indent=2)
PY

echo "Evidence: $OUT"
echo "TT_PI3_006_CUTOVER_SMOKE: ${verdict}"
exit $fail
