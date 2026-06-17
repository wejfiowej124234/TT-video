#!/usr/bin/env bash
# Governance Documentation Drift Cleanup Program · D1～D10 证据归档（机读键/快照 only）
#
#   bash scripts/dev/record-governance-doc-drift-cleanup-d1-d10.sh
#
# 诚实边界: 文档漂移清零 ≠ Cert #7 finalize ≠ ② staging GO ≠ ③ Production GO
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_governance_doc_drift_cleanup/${STAMP}"
mkdir -p "$EVID"

fail() { echo "GOV_DOC_DRIFT_D1_D10: FAIL $*" >&2; exit 1; }

python "$ROOT/scripts/dev/apply-ttg-cert-tier-upgrades.py" >"$EVID/apply-tier.log" 2>&1 \
  || fail "apply-tier"
python "$ROOT/scripts/dev/assert-ttg-stats-triple-sync.py" >"$EVID/triple-sync.log" 2>&1 \
  || fail "triple-sync"
python "$ROOT/scripts/dev/validate-ttg-governance-cert-gates-registry.py" >"$EVID/registry-validate.log" 2>&1 \
  || fail "registry validate"

grep -E 'TTG_GOV_(MTM|FINAL_CLOSURE|FCC):' \
  "$ROOT/docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md" \
  "$ROOT/docs/spec/governance-token/TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md" \
  "$ROOT/docs/spec/governance-token/TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md" \
  >"$EVID/machine-keys-snapshot.txt" || true

grep -E 'G24-(MTM|FCC|GECP|ENT100|360)-01' \
  "$ROOT/docs/spec/governance-token/country-pool-settlement-gate2.4-prerequisites-checklist.md" \
  >"$EVID/gate24-snapshot.txt" || true

grep -E 'TTG_GOV_(FINAL_CLOSURE|FCC|MTM):' \
  "$ROOT/docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md" \
  >"$EVID/govfreeze-baseline-snapshot.txt" || true

export TTG_ROOT="$ROOT" TTG_EVID="$EVID" TTG_STAMP="$STAMP"
python - <<'PY'
import json, re, time, os
from pathlib import Path

root = Path(os.environ["TTG_ROOT"])
evid = Path(os.environ["TTG_EVID"])
stamp = os.environ["TTG_STAMP"]

def grab_key(path, pat):
    t = (root / path).read_text(encoding="utf-8")
    m = re.search(pat, t)
    return m.group(1) if m else ""

payload = {
    "schema": "traveltrust.governance-doc-drift-cleanup-d1-d10.v1",
    "program": "Governance Documentation Drift Cleanup Program",
    "phase": "②",
    "stamp_utc": stamp,
    "scope": "D1～D10 machine keys · Gate-2.4 snapshots · GovFreeze baseline · §14 doc sync · registry index · apply-tier",
    "forbidden_in_program": [
        "business logic",
        "tokenomics",
        "govfreeze parameters",
        "cert status overrides",
    ],
    "d_items": {
        "D1": "Gate-2.4 G24-MTM-01",
        "D2": "Gate-2.4 G24-FCC-01",
        "D3": "Gate-2.4 G24-GECP-01",
        "D4": "G24-ENT100-01 / G24-360-01 CLOSURE_ENT",
        "D5": "GOV-FREEZE-V2 baseline L15-17",
        "D6": "Final Closure §14 Cert #6 checkbox",
        "D7": "Final Closure §13 OPS stats",
        "D8": "CONTRIBUTING pre-push TTG Cert row",
        "D9": "registry/README ttg-governance-cert-gates",
        "D10": "apply-ttg-cert-tier-upgrades.py patches",
    },
    "machine_keys": {
        "mtm": grab_key(
            "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md",
            r"`(TTG_GOV_MTM: [^`]+)`",
        ),
        "final_closure": grab_key(
            "docs/spec/governance-token/TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md",
            r"`(TTG_GOV_FINAL_CLOSURE: [^`]+)`",
        ),
        "fcc": grab_key(
            "docs/spec/governance-token/TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md",
            r"`(TTG_GOV_FCC: [^`]+)`",
        ),
    },
    "gates": {
        "apply_tier": "PASS",
        "triple_sync": "PASS",
        "registry_validate": "PASS",
    },
    "cert_queue_note": "D1～D10 不修改 cert_queue_completed · active Cert #7 由 Phase B 轨推进",
    "recorded_at_unix": int(time.time()),
}
eid = evid / "DRIFT-CLEANUP-D1-D10.v1.json"
eid.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
(evid / "FREEZE-RUN-SUMMARY.txt").write_text(
    "GOV_DOC_DRIFT_D1_D10: OK stamp=" + stamp + " triple_sync=PASS\n", encoding="utf-8"
)
print("GOV_DOC_DRIFT_D1_D10: OK", eid)
PY

echo "$STAMP" >"$ROOT/evidence/GO_governance_doc_drift_cleanup/latest-stamp.txt"
echo "GOV_DOC_DRIFT_D1_D10: OK stamp=${STAMP} dir=${EVID}"
