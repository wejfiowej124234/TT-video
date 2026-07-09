#!/usr/bin/env bash
# Manual UAT C1–E2 · browser walkthrough + register results (① local).
# SSOT: docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

SESS="${MANUAL_UAT_SESSION_DIR:-evidence/manual-uat/sessions/latest}"
RESULTS="$SESS/browser-walkthrough-results.json"
export MANUAL_UAT_BROWSER_RESULTS_JSON="$ROOT/$RESULTS"

curl -sf http://127.0.0.1:8080/health >/dev/null || { echo "FAIL API :8080"; exit 1; }
curl -sf -o /dev/null http://127.0.0.1:3012/ || { echo "FAIL FE :3012"; exit 1; }

echo "=== Manual UAT browser walkthrough → $SESS ==="
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
export PLAYWRIGHT_API_BASE_URL="${PLAYWRIGHT_API_BASE_URL:-http://127.0.0.1:8080}"
export PLAYWRIGHT_REUSE_FE_SERVER=1
export PLAYWRIGHT_REUSE_API_SERVER=1

set +e
(cd "$ROOT/frontend" && npx playwright test e2e/manual-uat-c1e2-browser-walkthrough.spec.ts \
  --project=chromium --reporter=list) 2>&1 | tee "$SESS/browser-walkthrough.log"
PW_RC=$?
set -e

[[ -f "$RESULTS" ]] || { echo "FAIL no results JSON"; exit 1; }

python "$ROOT/scripts/dev/apply-manual-uat-browser-results.py" \
  --results "$RESULTS" --session-dir "$SESS"
APPLY_RC=$?

if [[ "$PW_RC" -ne 0 || "$APPLY_RC" -ne 0 ]]; then
  echo "TT_MANUAL_UAT_BROWSER_WALKTHROUGH: FAIL (pw=$PW_RC apply=$APPLY_RC)"
  exit 1
fi
echo "TT_MANUAL_UAT_BROWSER_WALKTHROUGH: PASS"
