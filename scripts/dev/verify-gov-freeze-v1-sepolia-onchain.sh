#!/usr/bin/env bash
# TTG-TOKENOMICS-FREEZE-V1 · Sepolia 链上参数对拍（五项 · Phase ② 审计基线）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "GOV_FREEZE_V1_SEPOLIA_ONCHAIN_VERIFY: FAIL $*" >&2; exit 1; }

RPC="${CHAIN_RPC_URL:-}"
[[ -n "$RPC" ]] || fail "CHAIN_RPC_URL required"
if ! cast chain-id --rpc-url "$RPC" >/dev/null 2>&1; then
  RPC="https://ethereum-sepolia-rpc.publicnode.com"
  export CHAIN_RPC_URL="$RPC"
fi

require_addr() {
  local name="$1"
  local val="${!name:-}"
  [[ -n "$val" && "$val" != "0x0000000000000000000000000000000000000000" ]] || fail "${name} required"
}

require_addr GOVERNOR_ADDRESS
require_addr TIMELOCK_ADDRESS
require_addr TREASURY_P4_CAP_ADDRESS
require_addr PRIMARY_MARKET_ADDRESS
require_addr SEAT_REGISTRY_ADDRESS

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${GOV_FREEZE_V1_EVID_DIR:-$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/${STAMP}}"
mkdir -p "$EVID"
REPORT="$EVID/sepolia-onchain-alignment.json"
BASELINE="$EVID/PHASE2-GOV-FREEZE-V1-SEPOLIA-BASELINE-VERIFY.json"

cast_call() {
  cast call "$1" "${@:2}" --rpc-url "$RPC"
}

checks=0
pass() { checks=$((checks + 1)); echo "CHECK PASS: $*"; }

# G24-P-UPGRADE-01 · Shell 正式地址须为 Timelock 控制的 Proxy
proxy_admin_ok() {
  local label="$1"
  local proxy="$2"
  local admin
  admin="$(cast_call "$proxy" "admin()(address)" | awk '{print $1}')"
  local impl
  impl="$(cast_call "$proxy" "implementation()(address)" | awk '{print $1}')"
  [[ "${admin,,}" == "${TIMELOCK_ADDRESS,,}" ]] \
    || fail "${label} proxy admin=${admin} expected Timelock ${TIMELOCK_ADDRESS}"
  [[ -n "$impl" && "$impl" != "0x0000000000000000000000000000000000000000" ]] \
    || fail "${label} proxy implementation slot empty"
  pass "G24-P-UPGRADE-01 ${label} proxy admin=Timelock impl=${impl}"
}

proxy_admin_ok "Governor" "$GOVERNOR_ADDRESS"
proxy_admin_ok "TreasuryP4Cap" "$TREASURY_P4_CAP_ADDRESS"
proxy_admin_ok "PrimaryMarket" "$PRIMARY_MARKET_ADDRESS"
proxy_admin_ok "SeatRegistry" "$SEAT_REGISTRY_ADDRESS"
if [[ -n "${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS:-}" ]]; then
  proxy_admin_ok "StakePool" "$REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS"
fi

quorum_bps="$(cast_call "$GOVERNOR_ADDRESS" "quorumNumeratorBps()(uint256)" | awk '{print $1}')"
max_vote_bps="$(cast_call "$GOVERNOR_ADDRESS" "maxVotingPowerPerAddressBps()(uint256)" | awk '{print $1}')"
tl_delay="$(cast_call "$TIMELOCK_ADDRESS" "delay()(uint256)" | awk '{print $1}')"
tl_gov="$(cast_call "$TIMELOCK_ADDRESS" "governor()(address)" | awk '{print $1}')"
cap_bps="$(cast_call "$TREASURY_P4_CAP_ADDRESS" "treasuryP4DeployCapBps()(uint256)" | awk '{print $1}')"
wallet_cap="$(cast_call "$PRIMARY_MARKET_ADDRESS" "perWalletCapTtg()(uint256)" | awk '{print $1}')"
min_usdc="$(cast_call "$PRIMARY_MARKET_ADDRESS" "minPurchaseUsdc()(uint256)" | awk '{print $1}')"
round1="$(cast_call "$PRIMARY_MARKET_ADDRESS" "roundCapTtg(uint256)(uint256)" 0 | awk '{print $1}')"
round2="$(cast_call "$PRIMARY_MARKET_ADDRESS" "roundCapTtg(uint256)(uint256)" 1 | awk '{print $1}')"
round3="$(cast_call "$PRIMARY_MARKET_ADDRESS" "roundCapTtg(uint256)(uint256)" 2 | awk '{print $1}')"
max_stake="$(cast_call "$SEAT_REGISTRY_ADDRESS" "maxAggregateStakePerEntity()(uint256)" | awk '{print $1}')"
seat_pool="$(cast_call "$SEAT_REGISTRY_ADDRESS" "stakePool()(address)" | awk '{print $1}')"

[[ "$quorum_bps" == "400" ]] && pass "GOV-02 quorum=400" || fail "GOV-02 quorum=${quorum_bps} expected 400"
[[ "$max_vote_bps" == "400" ]] && pass "GOV-03 vote cap=400" || fail "GOV-03 vote cap=${max_vote_bps} expected 400"
[[ "$tl_delay" == "172800" ]] && pass "GOV-02 timelock=172800" || fail "GOV-02 timelock=${tl_delay} expected 172800"
[[ "${tl_gov,,}" == "${GOVERNOR_ADDRESS,,}" ]] && pass "Timelock.governor wired" || fail "Timelock governor mismatch"
[[ "$cap_bps" == "3000" ]] && pass "GOV-01 cap=3000" || fail "GOV-01 cap=${cap_bps} expected 3000"
[[ "$wallet_cap" == "25000000000000000000000" ]] && pass "GOV-04 wallet cap" || fail "GOV-04 wallet cap mismatch"
[[ "$min_usdc" == "100000000" ]] && pass "GOV-04 min USDC" || fail "GOV-04 min USDC mismatch"
[[ "$round1" == "500000000000000000000000" ]] && pass "GOV-04 round1" || fail "round1 mismatch"
[[ "$round2" == "500000000000000000000000" ]] && pass "GOV-04 round2" || fail "round2 mismatch"
[[ "$round3" == "1000000000000000000000000" ]] && pass "GOV-04 round3" || fail "round3 mismatch"
[[ "$max_stake" == "400000000000000000000000" ]] && pass "GOV-03 max aggregate stake" || fail "max stake mismatch"

export GOV_READ_QUORUM="$quorum_bps" GOV_READ_MAX_VOTE="$max_vote_bps" GOV_READ_TL_DELAY="$tl_delay"
export GOV_READ_TL_GOV="$tl_gov" GOV_READ_CAP_BPS="$cap_bps" GOV_READ_WALLET_CAP="$wallet_cap"
export GOV_READ_MIN_USDC="$min_usdc" GOV_READ_ROUND1="$round1" GOV_READ_ROUND2="$round2"
export GOV_READ_ROUND3="$round3" GOV_READ_MAX_STAKE="$max_stake" GOV_READ_SEAT_POOL="$seat_pool"

PY="python"
if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
  PY="python3"
fi

export GOV_FREEZE_V1_VERIFY_STAMP="$STAMP"
export GOV_FREEZE_V1_VERIFY_CHECKS="$checks"
export GOV_FREEZE_V1_REPORT="$REPORT"
export GOV_FREEZE_V1_BASELINE="$BASELINE"

$PY - <<'PY'
import json, os, pathlib
report = {
  "document_id": "TTG-TOKENOMICS-FREEZE-V1",
  "phase": "②",
  "phase2_audit_baseline": True,
  "stamp_utc": os.environ["GOV_FREEZE_V1_VERIFY_STAMP"],
  "chain_id": 11155111,
  "addresses": {
    "governor": os.environ["GOVERNOR_ADDRESS"],
    "timelock": os.environ["TIMELOCK_ADDRESS"],
    "treasury_p4_cap": os.environ["TREASURY_P4_CAP_ADDRESS"],
    "primary_market": os.environ["PRIMARY_MARKET_ADDRESS"],
    "seat_registry": os.environ["SEAT_REGISTRY_ADDRESS"],
    "stake_pool_proxy": os.environ.get("REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS", ""),
    "governance_token_reused": os.environ.get("GOVERNANCE_TOKEN_ADDRESS", ""),
  },
  "g24_p_upgrade_01": {
    "proxy_architecture_verified": True,
    "proxy_admin": "GOV_FREEZE_V1_TIMELOCK",
  },
  "reads": {
    "governor_quorum_bps": int(os.environ["GOV_READ_QUORUM"]),
    "governor_max_voting_power_bps": int(os.environ["GOV_READ_MAX_VOTE"]),
    "timelock_delay_seconds": int(os.environ["GOV_READ_TL_DELAY"]),
    "timelock_governor": os.environ["GOV_READ_TL_GOV"],
    "treasury_p4_deploy_cap_bps": int(os.environ["GOV_READ_CAP_BPS"]),
    "primary_market_per_wallet_cap_ttg": os.environ["GOV_READ_WALLET_CAP"],
    "primary_market_min_usdc": os.environ["GOV_READ_MIN_USDC"],
    "primary_market_round_caps_ttg": [
      os.environ["GOV_READ_ROUND1"],
      os.environ["GOV_READ_ROUND2"],
      os.environ["GOV_READ_ROUND3"],
    ],
    "seat_registry_max_aggregate_stake": os.environ["GOV_READ_MAX_STAKE"],
    "seat_registry_stake_pool": os.environ["GOV_READ_SEAT_POOL"],
  },
  "expected_ssot": {
    "GOV-01": {"treasury_p4_deploy_cap_bps": 3000},
    "GOV-02": {"governance_quorum_bps": 400, "governance_timelock_delay_seconds": 172800},
    "GOV-03": {"max_voting_power_per_address_bps": 400, "max_aggregate_seat_stake_per_entity_bps": 400},
    "GOV-04": {
      "public_sale_per_wallet_cap_ttg": "25000000000000000000000",
      "public_sale_min_purchase_usdc": "100000000",
    },
  },
  "checks_passed": int(os.environ["GOV_FREEZE_V1_VERIFY_CHECKS"]),
  "verdict": "PASS",
}
report_path = pathlib.Path(os.environ["GOV_FREEZE_V1_REPORT"])
baseline_path = pathlib.Path(os.environ["GOV_FREEZE_V1_BASELINE"])
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
baseline_path.write_text(
    json.dumps({"baseline_id": "PHASE2-GOV-FREEZE-V1-SEPOLIA", "verdict": "PASS", "report": report}, indent=2),
    encoding="utf-8",
)
print("wrote", report_path)
PY

echo "GOV_FREEZE_V1_SEPOLIA_ONCHAIN_VERIFY: PASS checks=${checks} report=${REPORT}"
exit 0
