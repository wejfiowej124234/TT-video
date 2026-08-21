#!/usr/bin/env bash
# TTG V9 Sepolia Regression #2 — MUST bind V9_AUDIT_CANDIDATE_R2_FINAL Exact bytes.
# Requires: TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK=1
# Stamps ONLY: V9_SEPOLIA_REGRESSION2_PASS
# Does NOT stamp TOPOLOGY_PASS or MAINNET_READY_STOP (those follow Full Topology Audit).
# FORBID Mainnet broadcast / Production GO
set -euo pipefail

# SUPERSEDED_AS_OFFICIAL_V9_ENTRY — Design Lock is sole ACTIVE (V9_AUDIT_CANDIDATE_DESIGN_LOCK).
# Historical Remint/R2 path. DO_NOT_USE for Official deploy/audit/cutover unless override.
if [[ "${TTG_V9_ALLOW_LEGACY_R2_REMINT:-0}" != "1" ]]; then
  echo "LEGACY_R2_REMINT_REFUSED: set TTG_V9_ALLOW_LEGACY_R2_REMINT=1 only for historical replay" >&2
  exit 2
fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

CANDIDATE_ID="${TTG_V9_CANDIDATE_ID:-V9_AUDIT_CANDIDATE_R2_FINAL}"
MANIFEST="$ROOT/evidence/GO_ttg_v9_audit/${CANDIDATE_ID}_MANIFEST.json"
[[ -f "$MANIFEST" ]] || { echo "TTG_V9_SEPOLIA_REGRESSION2: STOP missing $MANIFEST" >&2; exit 2; }

echo "TTG_V9_SEPOLIA_REGRESSION2: candidate=$CANDIDATE_ID"
echo "TTG_V9_SEPOLIA_REGRESSION2: rebuild Exact bytes then remint Sepolia"
(
  cd "$ROOT/contracts"
  FOUNDRY_PROFILE=ttg_v9 forge build
)
bash "$ROOT/scripts/dev/run-ttg-v9-remint-local-gate.sh"
bash "$ROOT/scripts/dev/run-ttg-v9-remint-sepolia.sh"

python - <<PY
import json, time, hashlib
from pathlib import Path
root = Path(".")
src = root / "evidence/GO_ttg_v9_remint_sepolia/V9_REMINT_SEPOLIA_PASS_STOP.json"
out = root / "evidence/GO_ttg_v9_audit/V9_SEPOLIA_REGRESSION2_PASS.json"
man = root / "evidence/GO_ttg_v9_audit/${CANDIDATE_ID}_MANIFEST.json"
d = json.loads(src.read_text(encoding="utf-8"))
m = json.loads(man.read_text(encoding="utf-8"))
d["stamp"] = "V9_SEPOLIA_REGRESSION2_PASS"
d["phase"] = "Regression #2 Final Candidate"
d["candidate"] = m.get("candidate_id")
d["candidate_manifest"] = man.as_posix()
d["candidate_manifest_sha256"] = "sha256:" + hashlib.sha256(man.read_bytes()).hexdigest()
d["after_audit3"] = True
d["binds_r1_final"] = False
d["binds_r2_final"] = True
d["not_topology_pass"] = True
d["not_production_go"] = True
d["mainnet_broadcast"] = "FORBIDDEN"
d["issued_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")
print("wrote", out)
print("NOTE: do NOT stamp MAINNET_READY until Full Topology Audit PASS")
PY
echo "TTG_V9_SEPOLIA_REGRESSION2: V9_SEPOLIA_REGRESSION2_PASS · next=Full Topology Audit on R2_FINAL"
