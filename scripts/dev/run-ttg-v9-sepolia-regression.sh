#!/usr/bin/env bash
# TTG V9 Sepolia Regression after Audit R1
# Requires: TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK=1
# STOP: V9_SEPOLIA_REGRESSION_PASS · FORBID Mainnet
set -euo pipefail

# SUPERSEDED_AS_OFFICIAL_V9_ENTRY — Design Lock is sole ACTIVE (V9_AUDIT_CANDIDATE_DESIGN_LOCK).
# Historical Remint/R2 path. DO_NOT_USE for Official deploy/audit/cutover unless override.
if [[ "${TTG_V9_ALLOW_LEGACY_R2_REMINT:-0}" != "1" ]]; then
  echo "LEGACY_R2_REMINT_REFUSED: set TTG_V9_ALLOW_LEGACY_R2_REMINT=1 only for historical replay" >&2
  exit 2
fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "TTG_V9_SEPOLIA_REGRESSION: running remint local gate + remint Sepolia lifecycle"
bash "$ROOT/scripts/dev/run-ttg-v9-remint-local-gate.sh"
bash "$ROOT/scripts/dev/run-ttg-v9-remint-sepolia.sh"

EV_SRC="$ROOT/evidence/GO_ttg_v9_remint_sepolia/V9_REMINT_SEPOLIA_PASS_STOP.json"
EV_OUT_DIR="$ROOT/evidence/GO_ttg_v9_audit"
mkdir -p "$EV_OUT_DIR"
python - <<PY
import json, time
from pathlib import Path
src = Path(r"""$EV_SRC""")
out = Path(r"""$EV_OUT_DIR""") / "V9_SEPOLIA_REGRESSION_PASS.json"
d = json.loads(src.read_text(encoding="utf-8"))
d["stamp"] = "V9_SEPOLIA_REGRESSION_PASS"
d["phase"] = "②.5_regression"
d["after_internal_audit_r1"] = True
d["not_production_go"] = True
d["mainnet_broadcast"] = "FORBIDDEN"
d["issued_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
out.write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")
print("wrote", out)
PY
echo "TTG_V9_SEPOLIA_REGRESSION: V9_SEPOLIA_REGRESSION_PASS · Mainnet still FORBIDDEN"
