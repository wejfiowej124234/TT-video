#!/usr/bin/env bash
# Phase ② · C11 staging community route gate smoke（② 槽 · 非 Phase ② GO）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
API_BASE="${API_BASE%/}"
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
fi
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${C11_STAGING_EVIDENCE_OUT:-$ROOT/evidence/GO_phase2_testnet_20260526/community/C11}"

fail() { echo "smoke-community-c11-staging-route-gate: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-community-c11-staging-route-gate: OK $*"; }

echo "== smoke-community-c11-staging-route-gate (② C11) API=$API_BASE =="

for slot in C1 C2 C3 C4 C5 C6 C7 C8 C9 C10; do
  st="$ROOT/evidence/GO_phase2_testnet_20260526/community/${slot}/STATUS.txt"
  [[ -f "$st" ]] || fail "missing evidence ${slot}/STATUS.txt"
  grep -q "^status: PASS" "$st" || fail "${slot} STATUS not PASS"
  ok "evidence ${slot} PASS"
done

hc="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"
ok "health 200"

mkdir -p "$EVID"

echo "--- run-check-04-routes (STRICT_WARNINGS=1) ---"
STRICT_WARNINGS=1 bash "$ROOT/scripts/run-check-04-routes.sh"
ok "run-check-04-routes exit 0"
echo '{"exit_code":0,"ok":true,"command":"bash scripts/run-check-04-routes.sh"}' > "$EVID/check-04-routes-result.json"

echo "--- Playwright frontend route probes ---"
export C11_STAGING_EVIDENCE_RUN=1
export C11_STAGING_EVIDENCE_OUT="$EVID"
export PLAYWRIGHT_E2E_NO_WEBSERVER=1
export PLAYWRIGHT_FULL_STACK=0
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
export PLAYWRIGHT_API_BASE_URL="$API_BASE"

cd "$ROOT/frontend"
MSYS_NO_PATHCONV=1 npx playwright test e2e/community-c11-staging-route-gate.spec.ts --project=chromium
cd "$ROOT"

[[ -f "$EVID/browser-route-probes.json" ]] || fail "browser-route-probes.json missing"
ok "browser route probes written"

echo "--- gen route-gate-report.json ---"
python "$ROOT/scripts/gen-community-c11-route-gate.py" \
  --repo-root "$ROOT" \
  --evidence-dir "$EVID" \
  --stamp "$STAMP" \
  --api-base "$API_BASE" \
  --check-04-result "$EVID/check-04-routes-result.json" \
  --browser-probes "$EVID/browser-route-probes.json"

echo "TT_COMMUNITY_C11_STAGING_ROUTE_GATE_SMOKE: OK"
