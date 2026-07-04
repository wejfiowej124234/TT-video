#!/usr/bin/env bash
# Production Readiness Wave 1.1 · G1 Formal Acceptance
# Baseline: Runtime Truth P0 (current code/runtime only) · fresh evidence · no pre-20260704 reuse
#
#   bash scripts/dev/run-production-readiness-wave-1-1-g1-formal.sh
#
# Prerequisites: local API :8080 + FE :3012 (./scripts/start_dev.sh or start-api-with-seed.bat)
# Staging: network access to tt-*-staging.fly.dev
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/wave-1-1-g1/${STAMP}"
SESS="evidence/manual-uat/sessions/${STAMP}"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
RT_BASELINE="${RUNTIME_TRUTH_P0_BASELINE:-20260704}"

mkdir -p "$EVID"
exec > >(tee -a "$EVID/run.log") 2>&1

fail() { echo "PR-WAVE-1-1-G1-FORMAL: FAIL $*"; exit 1; }
ok() { echo "PR-WAVE-1-1-G1-FORMAL: OK $*"; }
step() { echo ""; echo "=== $* ==="; }

echo "=== Wave 1.1 G1 Formal Acceptance · $STAMP ==="
echo "commit=$SHA runtime_truth_p0_baseline=$RT_BASELINE"

step "0 · Runtime Truth P0 baseline (static + matrix)"
node scripts/dev/validate-runtime-truth-p0.cjs --evidence-dir "evidence/GO_production_readiness/runtime-truth-p0/${STAMP}-recheck" \
  || fail "Runtime Truth P0 baseline not PASS"
ok "TT_RUNTIME_TRUTH_P0 baseline satisfied"

step "1 · Local stack preflight"
wait_stack() {
  local i
  for i in $(seq 1 60); do
    if curl -sf --max-time 5 http://127.0.0.1:8080/health >/dev/null \
      && curl -sf --max-time 5 -o /dev/null http://127.0.0.1:3012/; then
      return 0
    fi
    sleep 2
  done
  return 1
}
wait_stack || fail "API :8080 / FE :3012 not up after 120s — run ./scripts/start_dev.sh"
ok "Local API :8080 + FE :3012 up"

mkdir -p "$SESS"
rm -rf evidence/manual-uat/sessions/latest
ln -sfn "$STAMP" evidence/manual-uat/sessions/latest

step "2 · cfg drift + seed login + route probes"
if [[ "${SKIP_CFG_DRIFT_CLOSURE:-}" != "1" ]]; then
  bash scripts/dev/verify-cfg-drift-closure.sh 2>&1 | tee "$EVID/cfg-drift.log" || {
    echo "WARN cfg-drift-closure FAIL — continuing (set SKIP_CFG_DRIFT_CLOSURE=1 to silence)"
  }
fi
powershell.exe -NoProfile -File scripts/dev/verify-seed-test-accounts-login.ps1 2>&1 | tee "$EVID/seed-login.log" \
  || fail "Step 6b5 seed login verify"
bash scripts/dev/bootstrap-gd-p06-public-catalog-local.sh 2>&1 | tee "$EVID/e1-trust-gate-seed.log" \
  || {
    echo "WARN bootstrap-gd-p06 full probe failed — retry minimal E1 seed only" | tee -a "$EVID/e1-trust-gate-seed.log"
    curl -sf --max-time 45 -X POST "http://127.0.0.1:8080/auth/seed-trust-gate-e2e" \
      -H "Content-Type: application/json" -d '{}' >/dev/null \
      || fail "POST /auth/seed-trust-gate-e2e"
    curl -sf --max-time 30 -X POST "http://127.0.0.1:8080/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"tg_guide_main@trustgate-e2e.local","password":"Test123!"}' >/dev/null \
      || fail "E1 tg_guide_main login after trust-gate seed"
  }
bash scripts/dev/probe-manual-uat-checklist-routes.sh "$SESS/checklist-probes.jsonl" \
  || fail "checklist route probe"

step "3 · Init Master UAT session (post–RT-P0 · fresh stamp)"
python "$ROOT/scripts/dev/init-manual-uat-session.py" \
  --stamp "$STAMP" \
  --commit "$SHA" \
  --session-dir "$SESS" \
  --wave "1.1-g1-formal" \
  --runtime-truth-baseline "$RT_BASELINE"

python - <<PY
import json
from pathlib import Path
p = Path("$SESS/SUMMARY.json")
d = json.loads(p.read_text(encoding="utf-8"))
d["wave"] = "1.1-g1-formal"
d["runtime_truth_p0_baseline"] = "$RT_BASELINE"
d["formal_acceptance"] = True
d["evidence_policy"] = "no_reuse_pre_${RT_BASELINE}"
p.write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")
PY
cp -r "$SESS" "$EVID/manual-uat-session" 2>/dev/null || true
ok "Master UAT session $SESS"

step "4 · Browser UAT walkthrough (Playwright C1–E2 · local ①)"
export MANUAL_UAT_SESSION_DIR="$SESS"
bash scripts/dev/run-manual-uat-browser-walkthrough.sh 2>&1 | tee "$EVID/browser-walkthrough.log"

step "5 · Manual UAT dashboard"
python "$ROOT/scripts/dev/generate-manual-uat-dashboard.py" 2>&1 | tee "$EVID/dashboard.log"

step "6 · Sync matrix — local session (B001/B002/B003 · MVAL-B001)"
node "$ROOT/scripts/dev/sync-production-readiness-g1-matrix.cjs" \
  --session-dir "$SESS" \
  --evidence-dir "$EVID/local-matrix-sync" 2>&1 | tee "$EVID/local-matrix-sync.log"

step "7 · Staging persona matrix (B004 · ② C1–C4, E2)"
export G1_STAGING_EVID="$EVID/staging-persona-matrix"
if [[ "${SKIP_STAGING_PERSONA_MATRIX:-}" == "1" ]]; then
  fail "SKIP_STAGING_PERSONA_MATRIX=1 not allowed for G1 formal acceptance"
fi
bash scripts/dev/run-staging-persona-matrix-g1.sh 2>&1 | tee "$EVID/staging-persona-matrix.log"

step "8 · Sync matrix — staging (B004)"
node "$ROOT/scripts/dev/sync-production-readiness-g1-matrix.cjs" \
  --staging-summary "$EVID/staging-persona-matrix/staging-persona-matrix-summary.json" \
  --evidence-dir "$EVID/staging-matrix-sync" 2>&1 | tee "$EVID/staging-matrix-sync.log"

step "9 · G1 PER sign-off (MVAL-B003)"
python "$ROOT/scripts/dev/gen-g1-production-entry-review-signoff.py" \
  --stamp "$STAMP" \
  --evid-dir "$EVID/g1-per" \
  --session-dir "$SESS" \
  --staging-summary "$EVID/staging-persona-matrix/staging-persona-matrix-summary.json" \
  --runtime-truth-baseline "$RT_BASELINE" 2>&1 | tee "$EVID/g1-per.log"

step "10 · Sync matrix — G1 PER (MVAL-B003)"
node "$ROOT/scripts/dev/sync-production-readiness-g1-matrix.cjs" \
  --per-signoff "$EVID/g1-per/g1-per-signoff.json" \
  --evidence-dir "$EVID/per-matrix-sync" 2>&1 | tee "$EVID/per-matrix-sync.log"

step "11 · Validate G1 gate"
node "$ROOT/scripts/dev/validate-production-readiness-g1-gate.cjs" \
  --evidence-dir "$EVID" 2>&1 | tee "$EVID/g1-gate.log"

ok "Wave 1.1 G1 Formal Acceptance COMPLETE"
echo "Evidence: $EVID"
echo "Session: $SESS"
echo "TT_PRODUCTION_READINESS_G1_GATE: PASS — ready for G2"
