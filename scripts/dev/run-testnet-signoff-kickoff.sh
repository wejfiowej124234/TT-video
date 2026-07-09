#!/usr/bin/env bash
# ② Testnet Sign-off · official kickoff (product validation · no config sprint).
# SSOT: docs/runbook/TT-TESTNET-SIGNOFF-CHECKLIST.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SESS="evidence/manual-uat/sessions/${STAMP}"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
MANUAL_BASE="${MANUAL_UAT_BASELINE:-20260630T142222Z}"

fail() { echo "testnet-signoff-kickoff: FAIL $*" >&2; exit 1; }
ok() { echo "testnet-signoff-kickoff: OK $*"; }

echo "=== Testnet Sign-off kickoff $STAMP ==="
echo "① baseline: Manual UAT session $MANUAL_BASE (27/27)"

# Optional ① maintenance — local stack flake must not block ② staging kickoff
if curl -sf http://127.0.0.1:8080/health >/dev/null 2>&1; then
  if bash scripts/dev/verify-cfg-drift-closure.sh >/dev/null 2>&1; then
    ok "Configuration maintenance gate PASS (FROZEN · no sprint)"
  else
    echo "testnet-signoff-kickoff: WARN local cfg maintenance — ② kickoff continues (file DEFECT/REG if drift real)"
  fi
else
  ok "Local API down — ② staging-only kickoff (no ① cfg gate)"
fi

mkdir -p "$SESS"
bash scripts/dev/probe-testnet-signoff-checklist.sh "$SESS/testnet-probes.jsonl" || fail "staging probe"
ok "Staging env/chain probes"

python "$ROOT/scripts/dev/init-testnet-signoff-session.py" \
  --stamp "$STAMP" \
  --commit "$SHA" \
  --session-dir "$SESS" \
  --manual-uat-session "$MANUAL_BASE"

python "$ROOT/scripts/dev/apply-testnet-signoff-probes.py" --session-dir "$SESS" --probes "$SESS/testnet-probes.jsonl"

rm -rf evidence/manual-uat/sessions/latest
ln -sfn "$STAMP" evidence/manual-uat/sessions/latest

python scripts/dev/generate-manual-uat-dashboard.py
ok "Session $SESS · dashboard updated"
echo "TT_TESTNET_SIGNOFF_KICKOFF: PASS"
echo "Next: domain scripts per TT-TESTNET-SIGNOFF-CHECKLIST §1 (T-RBAC-01 … T-GRAD-01)"
