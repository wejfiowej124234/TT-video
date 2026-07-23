#!/usr/bin/env bash
# Production Performance Certification Deep Audit gate
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EV="$ROOT/evidence/PSG-PRODUCTION-READINESS/production-performance-certification-deep-audit/PRODUCTION-PERFORMANCE-CERTIFICATION-DEEP-AUDIT-LATEST.json"
REG="$ROOT/registry/production-performance-certification-deep-audit.v1.yaml"
LEDGER="$ROOT/evidence/PSG-PRODUCTION-READINESS/production-performance-certification-deep-audit/PERFORMANCE-PROBLEM-LEDGER-LATEST.json"
TIP="ea71c577ce6f99696df33f9394cf96746edc843b"
PIN="PSG-REL-20260720-WEB3-CAND-V2"

echo "TT_PRODUCTION_PERFORMANCE_CERTIFICATION_DEEP_AUDIT_GATE: start"

[[ -f "$EV" ]] || { echo "FAIL missing $EV"; exit 2; }
[[ -f "$REG" ]] || { echo "FAIL missing $REG"; exit 2; }
[[ -f "$LEDGER" ]] || { echo "FAIL missing ledger"; exit 2; }

grep -q 'machine_key: TT_PRODUCTION_PERFORMANCE_CERTIFICATION_DEEP_AUDIT' "$REG" || { echo "FAIL machine_key"; exit 1; }
grep -q "$TIP" "$REG" || { echo "FAIL tip"; exit 1; }
grep -q "$PIN" "$REG" || { echo "FAIL pin"; exit 1; }
grep -q 'equals_production_go: false' "$REG" || { echo "FAIL GO claim"; exit 1; }
grep -q 'psg_egm_mutated: false' "$REG" || { echo "FAIL EGM"; exit 1; }
grep -q 'mainnet_hard_gate_touched: false' "$REG" || { echo "FAIL hard gate"; exit 1; }
grep -q 'physical_safari_oa02_pass: false' "$REG" || { echo "FAIL Safari fake green"; exit 1; }
grep -q 'new_rc_created: false' "$REG" || { echo "FAIL new RC"; exit 1; }

python - <<'PY' "$EV" "$TIP" "$PIN" "$ROOT"
import json, sys, subprocess
from pathlib import Path

ev_path, tip, pin, root = sys.argv[1:5]
d = json.loads(Path(ev_path).read_text(encoding="utf-8"))
head = subprocess.check_output(["git", "-C", root, "rev-parse", "HEAD"], text=True).strip()
ok = True

def fail(msg):
    global ok
    ok = False
    print("FAIL:", msg)

v = d.get("verdict") or ""
if not str(v).startswith("PRODUCTION_PERFORMANCE_CERTIFICATION_DEEP_AUDIT_PASS"):
    fail(f"verdict={v!r}")
if d.get("equals_production_go") is True:
    fail("equals_production_go")
if d.get("p0_open_count", 1) != 0:
    fail(f"p0_open_count={d.get('p0_open_count')}")
if d.get("psg_egm_mutated") or d.get("economic_model_mutated") or d.get("new_rc_created"):
    fail("forbidden mutation")
if d.get("mainnet_hard_gate_touched"):
    fail("hard gate")
if (d.get("unique_rc_tip") or "").lower() != tip.lower():
    fail("tip")
if d.get("psg_release_version") != pin:
    fail("pin")
if head.lower() != tip.lower():
    fail(f"HEAD {head}")
holds = d.get("holds") or {}
if holds.get("physical_safari_oa02_pass") is True or holds.get("cwv_lab_pass") is True:
    fail("Safari/CWV fake green")
run = d.get("evidence_run") or ""
if not run or not (Path(root) / run / "LIVE-PERF-PROBES.json").exists():
    fail("missing live probes evidence")

if not ok:
    sys.exit(1)
print("TT_PRODUCTION_PERFORMANCE_CERTIFICATION_DEEP_AUDIT_GATE: PASS")
print(f"  verdict={v}")
print(f"  tip={tip} pin={pin} p0=0")
print("  Safari/CWV WAITING_ENV · ≠ Production GO")
sys.exit(0)
PY
