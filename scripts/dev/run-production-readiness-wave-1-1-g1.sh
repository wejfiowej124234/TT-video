#!/usr/bin/env bash
# Production Readiness Wave 1.1 · G1 Gate
# Domains: Browser UAT + Manual Validation (Master Matrix)
# SSOT: registry/production-readiness-master-matrix.v1.yaml
#       docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="evidence/GO_production_readiness/wave-1-1-g1/${STAMP}"
mkdir -p "$EVID"

fail() { echo "PR-WAVE-1-1-G1: FAIL $*" | tee -a "$EVID/run.log"; exit 1; }
ok() { echo "PR-WAVE-1-1-G1: OK $*" | tee -a "$EVID/run.log"; }

echo "=== Production Readiness Wave 1.1 · G1 Gate · $STAMP ===" | tee "$EVID/run.log"

# ── Preflight: local stack ──
if ! curl -sf --max-time 10 http://127.0.0.1:8080/health >/dev/null; then
  fail "API :8080 not up — run scripts/start-api-with-seed.bat or ./scripts/start_dev.sh"
fi
if ! curl -sf --max-time 10 -o /dev/null http://127.0.0.1:3012/; then
  fail "Frontend :3012 not up"
fi
ok "Local API :8080 + FE :3012 up"

SESS="evidence/manual-uat/sessions/${STAMP}"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
mkdir -p "$SESS"
rm -rf evidence/manual-uat/sessions/latest
ln -sfn "$STAMP" evidence/manual-uat/sessions/latest

# ── Step 1: Manual UAT session (G1 — cfg drift gate optional; UAT track) ──
if [[ "${SKIP_CFG_DRIFT_CLOSURE:-}" != "1" ]]; then
  bash scripts/dev/verify-cfg-drift-closure.sh >/dev/null && ok "cfg-drift-closure PASS" || {
    echo "WARN cfg-drift-closure FAIL — continuing G1 UAT (set SKIP_CFG_DRIFT_CLOSURE=1 to silence)" | tee -a "$EVID/run.log"
  }
else
  ok "cfg-drift-closure SKIPPED (G1 UAT track)"
fi

powershell.exe -NoProfile -File scripts/dev/verify-seed-test-accounts-login.ps1 2>&1 | tee -a "$EVID/seed-login.log" || fail "Step 6b5 seed login verify"
bash scripts/dev/probe-manual-uat-checklist-routes.sh "$SESS/checklist-probes.jsonl" || fail "checklist route probe"
python "$ROOT/scripts/dev/init-manual-uat-session.py" --stamp "$STAMP" --commit "$SHA" --session-dir "$SESS"
cp -r "$SESS" "$EVID/manual-uat-session" 2>/dev/null || true
ok "Manual UAT session $SESS"

# ── Step 2: Browser walkthrough (Playwright · C1–E2) ──
export MANUAL_UAT_SESSION_DIR="$SESS"
bash scripts/dev/run-manual-uat-browser-walkthrough.sh 2>&1 | tee -a "$EVID/browser-walkthrough.log"

# ── Step 3: Defect register baseline (P0/P1 must be 0 for G1) ──
SUMMARY="$SESS/SUMMARY.json"
python "$ROOT/scripts/dev/generate-manual-uat-dashboard.py" 2>&1 | tee -a "$EVID/dashboard.log"

# ── Step 4: Sync Master Matrix gap closure from session ──
node "$ROOT/scripts/dev/sync-production-readiness-g1-matrix.cjs" \
  --session-dir "$SESS" \
  --evidence-dir "$EVID" 2>&1 | tee -a "$EVID/matrix-sync.log"

# ── Step 5: Validate G1 gate ──
node "$ROOT/scripts/dev/validate-production-readiness-g1-gate.cjs" \
  --evidence-dir "$EVID" 2>&1 | tee -a "$EVID/g1-gate.log"

ok "Wave 1.1 evidence: $EVID"
echo "TT_PRODUCTION_READINESS_WAVE_1_1_G1: see $EVID/g1-gate-signoff.json"
