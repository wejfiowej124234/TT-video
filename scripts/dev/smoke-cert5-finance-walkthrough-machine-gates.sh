#!/usr/bin/env bash
# Cert #5 Finance walkthrough machine gates — Four-Ledger PASS + cutover/HAT evidence (② only)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "smoke-cert5-finance-walkthrough-machine: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-cert5-finance-walkthrough-machine: OK $*"; }

[[ -f "$ROOT/docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md" ]] \
  || fail "missing GovFreeze V2 baseline"

STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || fail "missing GO_ttg_cert session"
C4="$ROOT/evidence/GO_ttg_cert/${STAMP}/walkthrough/safe/SAFE-WALKTHROUGH-SIGNOFF.json"
[[ -f "$C4" ]] || fail "Cert #4 SAFE-WALKTHROUGH-SIGNOFF required"

FL="$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z/four-ledger-reconcile.json"
[[ -f "$FL" ]] || fail "missing four-ledger-reconcile.json"
VERDICT="$(python - <<'PY'
import json
from pathlib import Path
print(json.loads(Path("evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z/four-ledger-reconcile.json").read_text(encoding="utf-8"))["verdict"])
PY
)"
[[ "$VERDICT" == "PASS" ]] || fail "four-ledger verdict=$VERDICT (need PASS)"
ok "four-ledger PASS + Cert #4 prerequisite"

python "$ROOT/scripts/dev/run-cert5-finance-three-role-matrix-checks.py" \
  --out "$ROOT/evidence/GO_ttg_cert/.cert5-matrix-checks.json" \
  --flow-map-out "$ROOT/evidence/GO_ttg_cert/.cert5-finance-flow-map.json" \
  || fail "finance three-role matrix checks"

echo "TT_CERT5_FINANCE_WALKTHROUGH_MACHINE: OK"
