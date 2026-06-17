#!/usr/bin/env bash
# GovFreeze V2 Clean Baseline · Sepolia 链上验收（GOV + 五类 allow + 10 国 Stake Pool）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "GOV_FREEZE_V2_SEPOLIA_ONCHAIN_VERIFY: FAIL $*" >&2; exit 1; }

RPC="${CHAIN_RPC_URL:-}"
[[ -n "$RPC" ]] || fail "CHAIN_RPC_URL required"
if ! cast chain-id --rpc-url "$RPC" >/dev/null 2>&1; then
  RPC="https://ethereum-sepolia-rpc.publicnode.com"
  export CHAIN_RPC_URL="$RPC"
fi

GOVERNOR_ADDRESS="${GOV_FREEZE_V2_GOVERNOR_ADDRESS:-${GOVERNOR_ADDRESS:-}}"
TIMELOCK_ADDRESS="${GOV_FREEZE_V2_TIMELOCK_ADDRESS:-${TIMELOCK_ADDRESS:-}}"
TREASURY_P4_CAP_ADDRESS="${GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS:-${TREASURY_P4_CAP_ADDRESS:-}}"
PRIMARY_MARKET_ADDRESS="${GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS:-${PRIMARY_MARKET_ADDRESS:-}}"
SEAT_REGISTRY_ADDRESS="${GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS:-${SEAT_REGISTRY_ADDRESS:-}}"
REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS="${GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS:-${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS:-}}"

export GOVERNOR_ADDRESS TIMELOCK_ADDRESS TREASURY_P4_CAP_ADDRESS PRIMARY_MARKET_ADDRESS
export SEAT_REGISTRY_ADDRESS REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${GOV_FREEZE_V2_EVID_DIR:-$ROOT/evidence/GO_phase2_gov_freeze_v2_clean_baseline/${STAMP}}"
mkdir -p "$EVID"
export GOV_FREEZE_V1_EVID_DIR="$EVID"

bash "$ROOT/scripts/dev/verify-gov-freeze-v1-sepolia-onchain.sh" || fail "GOV-01～04 base verify"

checks=0
pass() { checks=$((checks + 1)); echo "V2 CHECK PASS: $*"; }

cast_call() { cast call "$1" "${@:2}" --rpc-url "$RPC"; }

for label_addr in \
  "Governor:$GOVERNOR_ADDRESS" \
  "PrimaryMarket:$PRIMARY_MARKET_ADDRESS" \
  "TreasuryP4:$TREASURY_P4_CAP_ADDRESS" \
  "SeatRegistry:$SEAT_REGISTRY_ADDRESS" \
  "StakePool:$REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS"; do
  label="${label_addr%%:*}"
  addr="${label_addr##*:}"
  allowed="$(cast_call "$TIMELOCK_ADDRESS" "allowedExecutionTarget(address)(bool)" "$addr" | awk '{print $1}')"
  [[ "$allowed" == "true" ]] && pass "allowedExecutionTarget ${label}" || fail "allowedExecutionTarget ${label}=false"
done

export REGION_STEWARD_STAKE_POOL_ADDRESS="$REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS"
export AUDIT_POOL="$REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS"
export STAKE_POOL_BOOTSTRAP_EVID="$EVID"
bash "$ROOT/scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh" --strict || fail "stake pool 10-country bootstrap"

seat_pool="$(cast_call "$SEAT_REGISTRY_ADDRESS" "stakePool()(address)" | awk '{print $1}')"
[[ "${seat_pool,,}" == "${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS,,}" ]] \
  && pass "SeatRegistry.stakePool wired" || fail "SeatRegistry.stakePool mismatch"

PY="python"
command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1 && PY="python3"
export GOV_FREEZE_V2_VERIFY_STAMP="$STAMP" GOV_FREEZE_V2_VERIFY_CHECKS="$checks"
export GOV_FREEZE_V2_REPORT="$EVID/gov-freeze-v2-onchain-verify.json"
$PY <<'PY'
import json, os, pathlib
p = pathlib.Path(os.environ["GOV_FREEZE_V2_REPORT"])
report = {
    "baseline_id": "GOV-FREEZE-V2-CLEAN-BASELINE",
    "stamp_utc": os.environ["GOV_FREEZE_V2_VERIFY_STAMP"],
    "verdict": "PASS",
    "v2_extra_checks": int(os.environ.get("GOV_FREEZE_V2_VERIFY_CHECKS", "0")),
    "addresses": {
        "timelock": os.environ.get("TIMELOCK_ADDRESS", ""),
        "governor": os.environ.get("GOVERNOR_ADDRESS", ""),
        "treasury_p4_cap": os.environ.get("TREASURY_P4_CAP_ADDRESS", ""),
        "primary_market": os.environ.get("PRIMARY_MARKET_ADDRESS", ""),
        "seat_registry": os.environ.get("SEAT_REGISTRY_ADDRESS", ""),
        "stake_pool_proxy": os.environ.get("REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS", ""),
    },
}
p.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("wrote", p)
PY

echo "GOV_FREEZE_V2_SEPOLIA_ONCHAIN_VERIFY: PASS checks=${checks} report=${EVID}/gov-freeze-v2-onchain-verify.json"
exit 0
