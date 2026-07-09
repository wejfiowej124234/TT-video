#!/usr/bin/env bash
# Gate: P3-03 Mainnet Address Planning SSOT ready (planning only — no deploy).
#
#   bash scripts/gates/check-mainnet-address-planning-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REG="$ROOT/registry/mainnet-address-registry.v1.yaml"
DOC="$ROOT/docs/spec/governance-token/MAINNET-ADDRESS-PLANNING-v1.md"
CLOSEOUT="$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline/P3-03-MAINNET-ADDRESS-PLANNING-CLOSEOUT.md"

fail() {
  echo "check-mainnet-address-planning-gate: FAIL $*" >&2
  exit 2
}

[[ -f "$REG" ]] || fail "missing registry/mainnet-address-registry.v1.yaml"
[[ -f "$DOC" ]] || fail "missing MAINNET-ADDRESS-PLANNING-v1.md"
[[ -f "$CLOSEOUT" ]] || fail "missing P3-03-MAINNET-ADDRESS-PLANNING-CLOSEOUT.md"

PY=python
command -v python >/dev/null 2>&1 || PY=python3
command -v "$PY" >/dev/null 2>&1 || fail "python required"

"$PY" - "$REG" <<'PY' || fail "registry validation error"
import re
import sys

try:
    import yaml
except ImportError:
  print("PyYAML required", file=sys.stderr)
  sys.exit(1)

path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    data = yaml.safe_load(f)

required_top = [
    "schema",
    "network",
    "contracts",
    "permission_model",
    "upgrade_plan",
    "deployment_sequence",
    "verdict",
]
for key in required_top:
    if key not in data:
        print(f"missing top-level key: {key}", file=sys.stderr)
        sys.exit(1)

if data.get("schema") != "traveltrust.mainnet_address_registry.v1":
    print("schema mismatch", file=sys.stderr)
    sys.exit(1)

net = data.get("network") or {}
if net.get("id") != "ethereum_mainnet":
    print("network.id must be ethereum_mainnet", file=sys.stderr)
    sys.exit(1)
if net.get("chain_id") != 1:
    print("network.chain_id must be 1", file=sys.stderr)
    sys.exit(1)
if net.get("deploy_status") != "NOT_STARTED":
    print("network.deploy_status must be NOT_STARTED for P3-03", file=sys.stderr)
    sys.exit(1)

# TravelTrust deploy slots must not contain non-TBD mainnet addresses
addr_re = re.compile(r"^0x[0-9a-fA-F]{40}$")
allowed_external = {
    (data.get("contracts") or {})
    .get("external_tokens", {})
    .get("usdc", {})
    .get("address", "")
    .lower()
}

def walk(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{path}.{k}" if path else k
            if k in ("address", "proxy_address", "implementation_address"):
                if isinstance(v, str) and addr_re.match(v):
                    if v.lower() not in allowed_external:
                        print(
                            f"forbidden mainnet address at {p}: {v} (use TBD)",
                            file=sys.stderr,
                        )
                        sys.exit(1)
            walk(v, p)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            walk(item, f"{path}[{i}]")

walk(data.get("contracts"))
walk(data.get("operational_wallets"))

if data.get("verdict") != "MAINNET_ADDRESS_PLANNING_READY":
    print("verdict must be MAINNET_ADDRESS_PLANNING_READY", file=sys.stderr)
    sys.exit(1)
if data.get("verdict_status") != "PASS":
    print("verdict_status must be PASS", file=sys.stderr)
    sys.exit(1)

print("registry-validate: OK")
PY

echo "check-mainnet-address-planning-gate: PASS MAINNET_ADDRESS_PLANNING_READY"
