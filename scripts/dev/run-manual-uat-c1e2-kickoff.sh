#!/usr/bin/env bash
# Manual UAT C1–E2 · official kickoff (① · product validation).
# SSOT: docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md
# Usage: bash scripts/dev/run-manual-uat-c1e2-kickoff.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SESS="evidence/manual-uat/sessions/${STAMP}"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

fail() { echo "manual-uat-kickoff: FAIL $*" >&2; exit 1; }
ok() { echo "manual-uat-kickoff: OK $*"; }

echo "=== Manual UAT C1–E2 kickoff $STAMP ==="

bash scripts/dev/verify-cfg-drift-closure.sh >/dev/null || fail "verify-cfg-drift-closure (config maintenance gate)"
ok "Configuration maintenance gate PASS (FROZEN · no sprint)"

curl -sf --max-time 10 http://127.0.0.1:8080/health >/dev/null || fail "API :8080 not up — run scripts/start_dev.sh or start-api-with-seed.bat"
curl -sf --max-time 10 -o /dev/null http://127.0.0.1:3012/ || fail "Frontend :3012 not up"
ok "API :8080 + FE :3012 up"

powershell.exe -NoProfile -File scripts/dev/verify-seed-test-accounts-login.ps1 || fail "Step 6b5 seed login verify"
ok "Step 6b5 matrix login (C1 C2 C3 C4 E2)"

mkdir -p "$SESS"
rm -rf evidence/manual-uat/sessions/latest
ln -sfn "$STAMP" evidence/manual-uat/sessions/latest

bash scripts/dev/probe-manual-uat-checklist-routes.sh "$SESS/checklist-probes.jsonl" || fail "checklist route probe"

python "$ROOT/scripts/dev/init-manual-uat-session.py" --stamp "$STAMP" --commit "$SHA" --session-dir "$SESS"

python scripts/dev/generate-manual-uat-dashboard.py
ok "Session $SESS · dashboard regenerated"
echo "TT_MANUAL_UAT_KICKOFF: PASS"
echo "Next: browser 手测 docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md §1 — 勾选后更新 $SESS/UI-CHECKLIST.md"
