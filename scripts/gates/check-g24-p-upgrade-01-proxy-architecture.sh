#!/usr/bin/env bash
# G24-P-UPGRADE-01 · Sepolia broadcast 前 Proxy 架构闸（逐个核查 · 禁止裸 Implementation 基线）
#
#   bash scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh
#
# SSOT: docs/spec/governance-token/G24-P-UPGRADE-01-proxy-architecture-gate.md
#       registry/g24-p-upgrade-01-contract-posture.v1.yaml
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

REGISTRY="$ROOT/registry/g24-p-upgrade-01-contract-posture.v1.yaml"
DEPLOY_SCRIPT="$ROOT/contracts/script/DeployGovFreezeV1Stack.s.sol"
EVID="$ROOT/evidence/GO_local_gov_freeze_v1_onchain/g24-p-upgrade-01"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$EVID"

fail() { echo "G24-P-UPGRADE-01: FAIL $*" >&2; echo "G24_P_UPGRADE_01_SUMMARY: FAIL $*" >>"$EVID/g24-p-upgrade-01-${STAMP}.log"; exit 1; }
pass() { echo "G24-P-UPGRADE-01: PASS $*"; echo "G24_P_UPGRADE_01_SUMMARY: PASS $*" >>"$EVID/g24-p-upgrade-01-${STAMP}.log"; }

LOG="$EVID/g24-p-upgrade-01-${STAMP}.log"
: >"$LOG"

PY="python"
if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
  PY="python3"
fi

echo "G24-P-UPGRADE-01 audit · $STAMP" | tee -a "$LOG"

[[ -f "$REGISTRY" ]] || fail "missing registry $REGISTRY"
[[ -f "$DEPLOY_SCRIPT" ]] || fail "missing $DEPLOY_SCRIPT"
[[ -f "$ROOT/contracts/src/upgrade/TimelockUpgradeableProxy.sol" ]] || fail "missing TimelockUpgradeableProxy.sol"

# 1 · Deploy 脚本 posture（Implementation 可 new · 正式基线须 Proxy）
export ROOT
$PY - <<'PY' >>"$LOG" 2>&1 || fail "deploy script posture check"
import os, pathlib, re, sys
root = pathlib.Path(os.environ["ROOT"])
script = (root / "contracts/script/DeployGovFreezeV1Stack.s.sol").read_text(encoding="utf-8")
required = [
    "deployTimelockControlledProxy",
    "TimelockUpgradeableProxy",
    "GOV_FREEZE_V1_GOVERNOR_PROXY",
    "TREASURY_P4_CAP_PROXY",
    "PRIMARY_MARKET_PROXY",
    "SEAT_REGISTRY_PROXY",
]
for pat in required:
    if pat not in script:
        print(f"missing required pattern: {pat}", file=sys.stderr)
        sys.exit(1)
forbidden = [
    "new GovernanceTreasuryP4Cap(",
    "new TtgPrimaryMarketV1(",
    "new TtgSeatConcentrationRegistry(",
    "new TravelTrustGovernor(",
    "new RegionStewardStakePool(",
]
for pat in forbidden:
    lines = script.splitlines()
    for i, line in enumerate(lines):
        if pat not in line:
            continue
        window = " ".join(lines[max(0, i - 2) : i + 1])
        if re.search(r"\b\w*Impl\b", window):
            continue
        print(f"bare baseline deploy forbidden: {line.strip()}", file=sys.stderr)
        sys.exit(1)
print("deploy script posture OK")
PY

# 2 · CountryPool / Settlement Immutable 豁免 · 源码无 Proxy 升级面
for imm in \
  "contracts/src/CountryPoolNetProfitLedger.sol" \
  "contracts/src/StewardPathVault.sol" \
  "contracts/src/UnallocatedStewardPathVault.sol"
do
  [[ -f "$ROOT/$imm" ]] || fail "missing immutable core $imm"
  if grep -qE "upgradeTo|TimelockUpgradeableProxy|UUPSUpgradeable" "$ROOT/$imm" 2>/dev/null; then
    fail "$imm must remain non-proxy immutable (G23-04)"
  fi
  echo "IMMUTABLE_EXEMPT OK: $imm" >>"$LOG"
done

# 3 · Timelock 控制面 · delay immutable
grep -q "immutable delay" "$ROOT/contracts/src/GovernanceTimelock.sol" \
  || fail "GovernanceTimelock must keep immutable delay (CONTROLLER_NON_UPGRADEABLE)"

# 4 · forge · Proxy 单元 + GOV HAT
(
  cd "$ROOT/contracts"
  forge test --match-contract TtgGovFreezeV1ProxyArchitecture -vv >>"$LOG" 2>&1
) || fail "forge test TtgGovFreezeV1ProxyArchitecture"

(
  cd "$ROOT/contracts"
  forge test --match-contract TtgGovFreezeV1Enforcement -vv >>"$LOG" 2>&1
) || fail "forge test TtgGovFreezeV1Enforcement regression"

export G24_STAMP="$STAMP"
export G24_EVID="$EVID"

$PY - <<'PY' >>"$LOG"
import json, os
report = {
  "gate_id": "G24-P-UPGRADE-01",
  "stamp_utc": os.environ["G24_STAMP"],
  "verdict": "PASS",
  "registry": "registry/g24-p-upgrade-01-contract-posture.v1.yaml",
  "deploy_script": "contracts/script/DeployGovFreezeV1Stack.s.sol",
  "contracts_audited": [
    "TravelTrustGovernor",
    "GovernanceTimelock",
    "GovernanceTreasuryP4Cap",
    "TtgPrimaryMarketV1",
    "TtgSeatConcentrationRegistry",
    "RegionStewardStakePool",
    "CountryPoolNetProfitLedger",
    "CountryPoolSettlement"
  ],
  "policy": "PROXY_REQUIRED shells via TimelockUpgradeableProxy admin=Timelock; IMMUTABLE_EXEMPT CountryPool/Settlement; CONTROLLER_NON_UPGRADEABLE Timelock"
}
open(os.path.join(os.environ["G24_EVID"], f"g24-p-upgrade-01-audit-{os.environ['G24_STAMP']}.json"), "w", encoding="utf-8").write(json.dumps(report, indent=2))
print("wrote audit json")
PY

pass "all posture checks · forge green · audit json → $EVID/g24-p-upgrade-01-audit-${STAMP}.json"
echo "G24_P_UPGRADE_01_SUMMARY: PASS stamp=${STAMP}"
exit 0
