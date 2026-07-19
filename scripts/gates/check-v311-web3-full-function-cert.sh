#!/usr/bin/env bash
# Gate: TT_V311_WEB3_FULL_FUNCTION_CERT must be PASS in latest Evidence + registry
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "TT_V311_WEB3_FULL_FUNCTION_CERT: FAIL — $*" >&2; exit 2; }

REG=registry/psg-v311-web3-full-function-cert.v1.yaml
VER=evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.txt
JSON=evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json

[[ -f "$REG" ]] || fail "missing registry"
[[ -f "$VER" ]] || fail "missing verdict — run scripts/dev/run-v311-web3-full-function-cert.sh"
grep -q 'TT_V311_WEB3_FULL_FUNCTION_CERT: PASS' "$VER" || fail "verdict not PASS (see $VER)"
grep -q '^status: PASS' "$REG" || fail "registry status not PASS"

PY=python; command -v python >/dev/null 2>&1 || PY=python3
"$PY" - <<'PY' || fail "verdict json incomplete"
import json
from pathlib import Path
d=json.loads(Path("evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json").read_text(encoding="utf-8"))
assert d.get("verdict")=="PASS", d.get("verdict")
c=d["counts"]
assert c.get("FAIL",1)==0 and c.get("OWNER_REQUIRED",1)==0, c
assert d.get("honest_boundary",{}).get("tt_psg_sepolia_freeze")=="NOT_CLAIMED"
print("gate_json_ok", c)
PY

echo "TT_V311_WEB3_FULL_FUNCTION_CERT: GATE_OK"
exit 0
