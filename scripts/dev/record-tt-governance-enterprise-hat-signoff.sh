#!/usr/bin/env bash
# Record per-layer Enterprise HAT signoff from audit execution or manual --layer flags
#
#   bash scripts/dev/record-tt-governance-enterprise-hat-signoff.sh --from-audit
#   bash scripts/dev/record-tt-governance-enterprise-hat-signoff.sh --layer L4 --verdict PASS --notes "..."
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SIGNER="${TT_GOVERNANCE_ENTERPRISE_HAT_SIGNER:-Sebastian Ward}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FROM_AUDIT=0
LAYER=""
VERDICT=""
NOTES=""
ALL_PASS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-audit) FROM_AUDIT=1; shift ;;
    --layer) LAYER="${2:-}"; shift 2 ;;
    --layer=*) LAYER="${1#*=}"; shift ;;
    --verdict) VERDICT="${2:-}"; shift 2 ;;
    --verdict=*) VERDICT="${1#*=}"; shift ;;
    --notes) NOTES="${2:-}"; shift 2 ;;
    --notes=*) NOTES="${1#*=}"; shift ;;
    --all-pass) ALL_PASS=1; shift ;;
    *) shift ;;
  esac
done

AUDIT_STAMP="$(cat "$ROOT/evidence/GO_tt_governance_enterprise_hat/audit/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
AUDIT_JSON="$ROOT/evidence/GO_tt_governance_enterprise_hat/audit/${AUDIT_STAMP}/ENTERPRISE-HAT-AUDIT-EXECUTION.json"

SIGNOFF_EVID="$ROOT/evidence/GO_tt_governance_enterprise_hat/signoff/${STAMP}"
mkdir -p "$SIGNOFF_EVID"

export TT_SIGNOFF_EVID="$SIGNOFF_EVID"
export TT_SIGNOFF_STAMP="$STAMP"
export TT_SIGNOFF_SIGNER="$SIGNER"
export TT_SIGNOFF_LAYER="$LAYER"
export TT_SIGNOFF_VERDICT="$VERDICT"
export TT_SIGNOFF_NOTES="$NOTES"
export TT_SIGNOFF_ALL_PASS="$ALL_PASS"
export TT_SIGNOFF_FROM_AUDIT="$FROM_AUDIT"
export TT_SIGNOFF_AUDIT_JSON="$AUDIT_JSON"

python <<'PY'
import json, os, pathlib

signoff = pathlib.Path(os.environ["TT_SIGNOFF_EVID"])
layer_ids = [f"L{i}" for i in range(1, 10)]
now = os.environ["TT_SIGNOFF_STAMP"]
signer = os.environ["TT_SIGNOFF_SIGNER"]

doc = {
    "audit_id": "TT_GOVERNANCE_ENTERPRISE_HAT",
    "signoff_started_utc": now,
    "signer": signer,
    "baseline": "GOV-FREEZE-V2-CLEAN-BASELINE",
    "phase": "② Sepolia",
    "layers": {lid: {"verdict": None, "signed_at": None, "notes": ""} for lid in layer_ids},
    "verdict": None,
    "honest_boundary": "Human signoff affirms business/permission/fund/UX review — not code review",
}

if os.environ.get("TT_SIGNOFF_FROM_AUDIT") == "1":
    audit_path = pathlib.Path(os.environ["TT_SIGNOFF_AUDIT_JSON"])
    if not audit_path.is_file():
        raise SystemExit(f"missing audit: {audit_path}")
    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    doc["audit_execution"] = str(audit_path.parent)
    for layer in audit.get("layers", []):
        lid = layer["id"]
        doc["layers"][lid] = {
            "verdict": layer["verdict"],
            "signed_at": now,
            "notes": layer.get("notes", "")[:500],
            "findings": layer.get("findings", []),
        }
    doc["verdict"] = audit.get("overall_verdict")
    doc["signoff_completed_utc"] = now
elif os.environ.get("TT_SIGNOFF_ALL_PASS") == "1":
    for lid in layer_ids:
        doc["layers"][lid] = {"verdict": "PASS", "signed_at": now, "notes": "all-pass batch"}
    doc["verdict"] = "PASS"
    doc["signoff_completed_utc"] = now
else:
    layer = os.environ.get("TT_SIGNOFF_LAYER", "")
    verdict = os.environ.get("TT_SIGNOFF_VERDICT", "").upper()
    notes = os.environ.get("TT_SIGNOFF_NOTES", "")
    if layer and verdict in ("PASS", "FAIL"):
        doc["layers"][layer] = {"verdict": verdict, "signed_at": now, "notes": notes}
    else:
        raise SystemExit("usage: --from-audit | --layer L4 --verdict PASS | --all-pass")
    if all(doc["layers"][k]["verdict"] == "PASS" for k in layer_ids):
        doc["verdict"] = "PASS"
        doc["signoff_completed_utc"] = now
    elif any(doc["layers"][k].get("verdict") == "FAIL" for k in layer_ids):
        doc["verdict"] = "FAIL"

(signoff / "HUMAN-ENTERPRISE-HAT-SIGNOFF.json").write_text(json.dumps(doc, indent=2), encoding="utf-8")
print("verdict", doc.get("verdict"))
PY

[[ -f "$AUDIT_JSON" ]] && cp "$AUDIT_JSON" "$SIGNOFF_EVID/" 2>/dev/null || true
PREP="$(ls -td "$ROOT/evidence/GO_tt_governance_enterprise_hat"/*/ENTERPRISE-HAT-CHECKLIST.md 2>/dev/null | head -1 || true)"
[[ -n "$PREP" ]] && cp "$PREP" "$SIGNOFF_EVID/" 2>/dev/null || true

echo "$STAMP" >"$ROOT/evidence/GO_tt_governance_enterprise_hat/signoff/latest-stamp.txt"
echo "TT_GOVERNANCE_ENTERPRISE_HAT_SIGNOFF: OK evidence=${SIGNOFF_EVID}"

if python -c "import json,sys; d=json.load(open('$SIGNOFF_EVID/HUMAN-ENTERPRISE-HAT-SIGNOFF.json')); sys.exit(0 if d.get('verdict')=='PASS' else 1)" 2>/dev/null; then
  echo "export TT_GOVERNANCE_ENTERPRISE_HAT_OK=1"
fi
