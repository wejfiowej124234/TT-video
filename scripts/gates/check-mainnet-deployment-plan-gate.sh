#!/usr/bin/env bash
# Gate: P3-04 Mainnet Deployment Plan SSOT ready (plan only — no deploy).
#
#   bash scripts/gates/check-mainnet-deployment-plan-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLAN="$ROOT/registry/mainnet-deployment-plan.v1.yaml"
DOC="$ROOT/docs/spec/governance-token/MAINNET-DEPLOYMENT-PLAN-v1.md"
CLOSEOUT="$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline/P3-04-DEPLOYMENT-PLAN-CLOSEOUT.md"
ADDR_GATE="$ROOT/scripts/gates/check-mainnet-address-planning-gate.sh"

fail() {
  echo "check-mainnet-deployment-plan-gate: FAIL $*" >&2
  exit 2
}

[[ -f "$PLAN" ]] || fail "missing registry/mainnet-deployment-plan.v1.yaml"
[[ -f "$DOC" ]] || fail "missing MAINNET-DEPLOYMENT-PLAN-v1.md"
[[ -f "$CLOSEOUT" ]] || fail "missing P3-04-DEPLOYMENT-PLAN-CLOSEOUT.md"

# P3-03 prerequisite
bash "$ADDR_GATE" >/dev/null || fail "P3-03 address planning gate must PASS first"

PY=python
command -v python >/dev/null 2>&1 || PY=python3
command -v "$PY" >/dev/null 2>&1 || fail "python required"

"$PY" - "$PLAN" "$ROOT" <<'PY' || fail "registry validation error"
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML required", file=sys.stderr)
    sys.exit(1)

plan_path = Path(sys.argv[1])
root = Path(sys.argv[2])
data = yaml.safe_load(plan_path.read_text(encoding="utf-8"))

required = [
    "schema",
    "preconditions",
    "deployment_order",
    "evidence_chain",
    "rollback_plan",
    "abi_002",
    "verdict",
]
for k in required:
    if k not in data:
        print(f"missing key: {k}", file=sys.stderr)
        sys.exit(1)

if data.get("schema") != "traveltrust.mainnet_deployment_plan.v1":
    print("schema mismatch", file=sys.stderr)
    sys.exit(1)

if data.get("verdict") != "MAINNET_DEPLOYMENT_PLAN_READY":
    print("verdict must be MAINNET_DEPLOYMENT_PLAN_READY", file=sys.stderr)
    sys.exit(1)
if data.get("verdict_status") != "PASS":
    print("verdict_status must be PASS", file=sys.stderr)
    sys.exit(1)
if data.get("execution_status") != "PLAN_ONLY":
    print("execution_status must be PLAN_ONLY", file=sys.stderr)
    sys.exit(1)

net = data.get("network") or {}
if net.get("broadcast_authorized") is not False:
    print("network.broadcast_authorized must be false", file=sys.stderr)
    sys.exit(1)

abi = data.get("abi_002") or {}
if abi.get("status") != "DEPLOYMENT_PREPARATION_READY":
    print("abi_002.status must be DEPLOYMENT_PREPARATION_READY", file=sys.stderr)
    sys.exit(1)
for bad in abi.get("not_status") or []:
    if abi.get("status") == bad:
        print(f"abi_002 must not be {bad}", file=sys.stderr)
        sys.exit(1)

steps = data.get("deployment_order") or []
if len(steps) < 7:
    print(f"deployment_order needs >=7 steps, got {len(steps)}", file=sys.stderr)
    sys.exit(1)

# ABI-002 prep artifacts on disk
for rel in [
    "contracts/abi/EscrowV2.json",
    "contracts/abi/EscrowFactoryV2.json",
    "contracts/script/DeployEscrowFactoryV2.s.sol",
]:
    if not (root / rel).is_file():
        print(f"missing ABI-002 artifact: {rel}", file=sys.stderr)
        sys.exit(1)

baseline = yaml.safe_load(
    (root / "registry/phase3-production-entry-baseline.v1.yaml").read_text(encoding="utf-8")
)
if not baseline.get("p3_03_complete"):
    print("p3_03_complete must be true", file=sys.stderr)
    sys.exit(1)

print("registry-validate: OK")
PY

# Dry-run simulation (no broadcast)
node "$ROOT/scripts/dev/run-mainnet-deployment-plan-dry-run.cjs" >/dev/null || fail "dry-run failed"

echo "check-mainnet-deployment-plan-gate: PASS MAINNET_DEPLOYMENT_PLAN_READY"
