#!/usr/bin/env bash
# Governance Concentration Audit · Sepolia · GOV-02/GOV-03 vs high-TTG holder (HAT-R1 wallet)
#
#   bash scripts/dev/run-governance-concentration-audit-sepolia.sh
#
# Validates quorum / vote cap / Seat stake limits and documents capture-risk posture.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${GOV_CONCENTRATION_EVID:-$ROOT/evidence/GO_governance_concentration_audit_sepolia/${STAMP}}"
mkdir -p "$EVID"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || { echo "GOV_CONCENTRATION_AUDIT: FAIL missing env" >&2; exit 2; }
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

bash "$ROOT/scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh" >>"$EVID/audit.log" 2>&1

RPC="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
PK="${HAT_R1_WALLET_PK:-${PRIVATE_KEY:-}}"
[[ -n "$PK" ]] || { echo "GOV_CONCENTRATION_AUDIT: FAIL PRIVATE_KEY required" >&2; exit 2; }
WALLET="${AUDIT_WALLET:-$(cast wallet address --private-key "$PK")}"
J_HEX="0x$(python -c "print('${HAT_R1_JURISDICTION:-KR}'.encode().hex())")"
HAT_EVID="$(hat_r1_resolve_evid_dir "$ROOT")"
PROP_ID="${AUDIT_PROPOSAL_ID:-$(cat "$HAT_EVID/MINIMAL_PROPOSAL_ID.txt" 2>/dev/null || echo 1)}"

cast_call() { cast call "$1" "${@:2}" --rpc-url "$RPC"; }

SUPPLY="$(cast_call "$GOVERNANCE_TOKEN_ADDRESS" "totalSupply()(uint256)" | awk '{print $1}')"
BAL="$(cast_call "$GOVERNANCE_TOKEN_ADDRESS" "balanceOf(address)(uint256)" "$WALLET" | awk '{print $1}')"
QUORUM="$(cast_call "$GOVERNOR_ADDRESS" "quorumNumeratorBps()(uint256)" | awk '{print $1}')"
MAXV="$(cast_call "$GOVERNOR_ADDRESS" "maxVotingPowerPerAddressBps()(uint256)" | awk '{print $1}')"
DELAY="$(cast_call "$TIMELOCK_ADDRESS" "delay()(uint256)" | awk '{print $1}')"
MAXSTAKE="$(cast_call "$SEAT_REGISTRY_ADDRESS" "maxAggregateStakePerEntity()(uint256)" | awk '{print $1}')"
STAKE_RAW="$(cast_call "$REGION_STEWARD_STAKE_POOL_ADDRESS" "stakes(address,bytes2)(uint256,uint256,uint256,bool,bool,uint256)" "$WALLET" "$J_HEX")"
STAKED="$(echo "$STAKE_RAW" | head -1 | awk '{print $1}')"
PROP_RAW="$(cast_call "$GOVERNOR_ADDRESS" "proposals(uint256)(address,uint256,uint256,uint256,bool,bool,bytes32,uint256,uint256,uint256)" "$PROP_ID")"
FOR_V="$(echo "$PROP_RAW" | sed -n '8p' | awk '{print $1}')"
AG_V="$(echo "$PROP_RAW" | sed -n '9p' | awk '{print $1}')"
AB_V="$(echo "$PROP_RAW" | sed -n '10p' | awk '{print $1}')"
FOR_V="${FOR_V:-0}"
AG_V="${AG_V:-0}"

export GOV_CONCENTRATION_EVID="$EVID"
export GOV_CONCENTRATION_STAMP="$STAMP"
export AUDIT_WALLET="$WALLET"
export AUDIT_TOTAL_SUPPLY_WEI="$SUPPLY"
export AUDIT_WALLET_BALANCE_WEI="$BAL"
export AUDIT_STAKED_WEI="$STAKED"
export AUDIT_QUORUM_BPS="$QUORUM"
export AUDIT_MAX_VOTE_BPS="$MAXV"
export AUDIT_TIMELOCK_DELAY_SEC="$DELAY"
export AUDIT_MAX_AGGREGATE_STAKE_WEI="$MAXSTAKE"
export AUDIT_PROPOSAL_FOR_VOTES_WEI="$FOR_V"
export AUDIT_PROPOSAL_AGAINST_VOTES_WEI="$AG_V"

python "$ROOT/scripts/dev/lib/governance-concentration-audit-report.py" | tee -a "$EVID/audit.log"
echo "$STAMP" >"$ROOT/evidence/GO_governance_concentration_audit_sepolia/latest-stamp.txt"
