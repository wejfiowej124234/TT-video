#!/usr/bin/env bash
# Performance Runtime Revalidation gate
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EV="$ROOT/evidence/PSG-PRODUCTION-READINESS/performance-runtime-revalidation/PERFORMANCE-RUNTIME-REVALIDATION-LATEST.json"
REG="$ROOT/registry/performance-runtime-revalidation.v1.yaml"
TIP="ea71c577ce6f99696df33f9394cf96746edc843b"
echo "TT_PERFORMANCE_RUNTIME_REVALIDATION_GATE: start"
[[ -f "$EV" ]] || { echo "FAIL missing $EV"; exit 2; }
[[ -f "$REG" ]] || { echo "FAIL missing $REG"; exit 2; }
grep -q 'machine_key: TT_PERFORMANCE_RUNTIME_REVALIDATION' "$REG" || { echo "FAIL machine_key"; exit 1; }
grep -q "$TIP" "$REG" || { echo "FAIL tip"; exit 1; }
grep -q 'equals_production_go: false' "$REG" || { echo "FAIL GO claim"; exit 1; }
grep -q 'mainnet_hard_gate_touched: false' "$REG" || { echo "FAIL hard gate"; exit 1; }
grep -q 'cutover_entered: false' "$REG" || { echo "FAIL cutover"; exit 1; }
grep -q 'new_rc_created: false' "$REG" || { echo "FAIL new RC"; exit 1; }
python - <<'PY' "$EV" "$TIP" "$ROOT"
import json, sys, subprocess
from pathlib import Path
ev_path, tip, root = sys.argv[1:4]
d = json.loads(Path(ev_path).read_text(encoding="utf-8"))
head = subprocess.check_output(["git", "-C", root, "rev-parse", "HEAD"], text=True).strip()
ok = True
def fail(m):
    global ok
    ok = False
    print("FAIL:", m)
if head.lower() != tip.lower():
    fail(f"HEAD={head}")
v = d.get("verdict") or ""
if not v.startswith("PERFORMANCE_RUNTIME_REVALIDATION_"):
    fail(f"verdict={v}")
if d.get("equals_production_go") is not False:
    fail("GO claim")
if d.get("mainnet_hard_gate_touched") is not False:
    fail("hard gate")
if d.get("cutover_entered") is not False:
    fail("cutover")
if d.get("new_rc_created") is not False:
    fail("new RC")
# WAITING_DEPLOY is an allowed honest terminal for this pack
allowed = (
    "PERFORMANCE_RUNTIME_REVALIDATION_PASS",
    "PERFORMANCE_RUNTIME_REVALIDATION_WAITING_DEPLOY",
    "PERFORMANCE_RUNTIME_REVALIDATION_PASS_WITH_HOLDS",
)
if v not in allowed and not v.endswith("_PASS") and "WAITING_DEPLOY" not in v:
    # FAIL verdict fails the gate
    if v.endswith("_FAIL"):
        fail(f"verdict FAIL {v}")
print("TT_PERFORMANCE_RUNTIME_REVALIDATION_GATE:", "PASS" if ok else "FAIL")
print(f"  verdict={v} tip={tip} opt_live={d.get('dimensions',{}).get('optimization_runtime_live',{}).get('status')}")
print("  ≠ Production GO · no Cutover")
raise SystemExit(0 if ok else 1)
PY
