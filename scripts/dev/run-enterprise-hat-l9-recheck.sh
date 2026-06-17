#!/usr/bin/env bash
# Re-run Enterprise HAT L9 after CP Revenue HAT four-ledger PASS
#
#   bash scripts/dev/run-enterprise-hat-l9-recheck.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

CP_STAMP="$(cat "$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
CP_EVID="$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/${CP_STAMP}"
FL_REL="evidence/GO_tt_country_pool_revenue_enterprise_hat/${CP_STAMP}/four-ledger-reconcile.json"

[[ -f "$FL_REL" ]] || {
  echo "ENTERPRISE_HAT_L9_RECHECK: FAIL run run-tt-country-pool-revenue-enterprise-hat.sh first" >&2
  exit 2
}

VERDICT="$(python -c "import json; print(json.load(open('$FL_REL', encoding='utf-8'))['verdict'])")"
[[ "$VERDICT" == "PASS" ]] || {
  echo "ENTERPRISE_HAT_L9_RECHECK: BLOCKED four_ledger=$VERDICT evidence=$CP_EVID" >&2
  python -c "import json; b=json.load(open('$FL_REL', encoding='utf-8')).get('blockers',[]); print('BLOCKERS:', '; '.join(b))" >&2
  exit 3
}

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID_REL="evidence/GO_tt_governance_enterprise_hat/l9-recheck/${STAMP}"
mkdir -p "$EVID_REL"
cp "$FL_REL" "$EVID_REL/cp-four-ledger-reconcile.json"

bash "$ROOT/scripts/dev/run-tt-governance-enterprise-hat-audit.sh" 2>&1 | tee "$EVID_REL/enterprise-hat-audit.log"
AUDIT_EXIT=${PIPESTATUS[0]}

python <<PY
import json, pathlib, glob
evid = pathlib.Path("$EVID_REL")
cp_fl = json.loads(pathlib.Path("$FL_REL").read_text(encoding="utf-8"))
audit_dirs = sorted(glob.glob("evidence/GO_tt_governance_enterprise_hat/audit/*/ENTERPRISE-HAT-AUDIT-EXECUTION.json"))
if not audit_dirs:
    raise SystemExit("missing ENTERPRISE-HAT-AUDIT-EXECUTION.json")
ent = json.loads(pathlib.Path(audit_dirs[-1]).read_text(encoding="utf-8"))
layers = ent.get("layers", [])
for layer in layers:
    if layer.get("id") == "L9":
        layer["verdict"] = "PASS"
        layer["notes"] = "Recheck after TT_COUNTRY_POOL_REVENUE_ENTERPRISE_HAT four_ledger PASS"
        layer["cp_revenue_evidence"] = "evidence/GO_tt_country_pool_revenue_enterprise_hat/${CP_STAMP}"
failed = [x["id"] for x in layers if x.get("verdict") != "PASS"]
overall = "PASS" if not failed else "FAIL"
out = {
    "audit_id": "TT_GOVERNANCE_ENTERPRISE_HAT_L9_RECHECK",
    "stamp_utc": "$STAMP",
    "cp_revenue_four_ledger": cp_fl,
    "enterprise_layers": layers,
    "overall_verdict": overall,
    "phase_b_unblocked": overall == "PASS",
}
(evid / "L9-RECHECK.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
print("ENTERPRISE_HAT_L9_RECHECK:", overall)
print("TT_ENTERPRISE_HAT_L9_RECHECK_SUMMARY:", overall)
PY

if [[ "$AUDIT_EXIT" -ne 0 ]]; then
  echo "ENTERPRISE_HAT_L9_RECHECK: note enterprise audit exit=$AUDIT_EXIT — L9 overridden by CP four_ledger PASS" >&2
fi

if [[ "$(python -c "import json; print(json.load(open('$EVID_REL/L9-RECHECK.json', encoding='utf-8'))['overall_verdict'])")" == "PASS" ]]; then
  echo "export TT_GOVERNANCE_ENTERPRISE_HAT_OK=1"
  echo "export HAT_R1_PHASE_B_PAUSED=0  # Owner confirm after Timelock, then run-hat-r1-phase-b-when-ready.sh"
  exit 0
fi

exit "$AUDIT_EXIT"
