#!/usr/bin/env bash
# Execute CP cutover+drill operations scheduled on ledger-owner Timelock
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TIMELock=""
LEDGER=""
EVID=""
RUN_CUTOVER=1
RUN_DRILL=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timelock) TIMELock="$2"; shift 2 ;;
    --ledger) LEDGER="$2"; shift 2 ;;
    --evid) EVID="$2"; shift 2 ;;
    --run-cutover) RUN_CUTOVER="$2"; shift 2 ;;
    --run-drill) RUN_DRILL="$2"; shift 2 ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

[[ -n "$TIMELock" && -n "$LEDGER" ]] || { echo "timelock+ledger required" >&2; exit 2; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

RPC="${CHAIN_RPC_URL:-https://sepolia.drpc.org}"
PK="${PRIVATE_KEY:?PRIVATE_KEY required}"
EXEC_PK="${CP_DRILL_EXECUTE_PK:-$PK}"

exec_op() {
  local target="$1" data="$2" salt="$3" label="$4"
  local id done_flag
  id="$(cast call "$TIMELock" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$target" 0 "$data" "$salt" --rpc-url "$RPC")"
  done_flag="$(cast call "$TIMELock" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$id" --rpc-url "$RPC" 2>/dev/null | awk 'NR==2{print $1}' || echo false)"
  if [[ "$done_flag" == "true" ]]; then
    echo "SKIP $label already executed id=$id"
    return 0
  fi
  echo "EXEC $label id=$id"
  cast send "$TIMELock" "execute(bytes32)" "$id" --rpc-url "$RPC" --private-key "$EXEC_PK" 2>&1 | tee "${EVID:-/tmp}/exec-${label}.log"
}

load_epoch_params() {
  if [[ -n "${CP_DRILL_EPOCH_START:-}" && -n "${CP_DRILL_EPOCH_END:-}" ]]; then
    EPOCH_START="$CP_DRILL_EPOCH_START"
    EPOCH_END="$CP_DRILL_EPOCH_END"
    return 0
  fi
  if [[ -n "$EVID" && -f "$EVID/drill-epoch-params.json" ]]; then
    EPOCH_START="$(python -c "import json; print(json.load(open('$EVID/drill-epoch-params.json'))['epoch_start'])")"
    EPOCH_END="$(python -c "import json; print(json.load(open('$EVID/drill-epoch-params.json'))['epoch_end'])")"
    return 0
  fi
  NOW="$(date +%s)"
  CLOSE="$(cast call "$LEDGER" "closeDelaySeconds()(uint64)" --rpc-url "$RPC" | awk '{print $1}')"
  EPOCH_END=$((NOW - CLOSE - 3600))
  [[ "$EPOCH_END" -lt 1 ]] && EPOCH_END=$((NOW - 1))
  EPOCH_START=$((EPOCH_END - 86400))
  [[ "$EPOCH_START" -lt 0 ]] && EPOCH_START=0
}

if [[ "$RUN_CUTOVER" == "1" ]]; then
  V2TL="${GOV_FREEZE_V2_TIMELOCK_ADDRESS:-$TIMELOCK_ADDRESS}"
  CLOSE="$(cast call "$LEDGER" "closeDelaySeconds()(uint64)" --rpc-url "$RPC" | awk '{print $1}')"
  BPS_S="$(cast call "$LEDGER" "bpsStewardPath()(uint16)" --rpc-url "$RPC" | awk '{print $1}')"
  BPS_G="$(cast call "$LEDGER" "bpsGlobalTreasury()(uint16)" --rpc-url "$RPC" | awk '{print $1}')"
  FUND="${CP_DRILL_FUNDING_SOURCE:-$(cast wallet address --private-key "$PK")}"
  DATA="$(cast calldata "setSettlementParams(uint64,uint16,uint16,address,address)" "$CLOSE" "$BPS_S" "$BPS_G" "$V2TL" "$FUND")"
  exec_op "$LEDGER" "$DATA" "$(cast keccak "CP-NETPROFIT-V2-TREASURY-CUTOVER")" "cutover-settlement-params"
fi

if [[ "$RUN_DRILL" == "1" ]]; then
  PROFIT="${CP_DRILL_NET_PROFIT_RAW:-1000000}"
  TOKEN="${COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS:-$FUND_STACK_TOKEN_ADDRESS}"
  FUND="${CP_DRILL_FUNDING_SOURCE:-$(cast wallet address --private-key "$PK")}"

  cast send "$TOKEN" "mint(address,uint256)" "$FUND" "$((PROFIT * 2))" --rpc-url "$RPC" --private-key "$PK" >/dev/null
  cast send "$TOKEN" "approve(address,uint256)" "$LEDGER" "$((PROFIT * 2))" --rpc-url "$RPC" --private-key "$PK" >/dev/null
  echo "mint+approve funding=$FUND amount=$((PROFIT * 2))"

  EXP=$((PROFIT / 10))
  ACCT_R100="$(cast format-bytes32-string "R-100")"
  ACCT_E100="$(cast format-bytes32-string "E-100")"
  REF_REV="$(cast keccak "CP-DRILL-REV-1")"
  REF_EXP="$(cast keccak "CP-DRILL-EXP-1")"
  PROP_REF="$(cast keccak "CP-DRILL-STEWARD-INELIGIBLE")"

  load_epoch_params
  EPOCH_START_HEX="$(python -c "print(hex(int($EPOCH_START)))")"
  EPOCH_END_HEX="$(python -c "print(hex(int($EPOCH_END)))")"
  echo "epoch_start=$EPOCH_START ($EPOCH_START_HEX) epoch_end=$EPOCH_END ($EPOCH_END_HEX)"
  exec_op "$LEDGER" "$(cast calldata "setActiveStewardConfig(address,bool,bool,bool,bytes32)" "0x0000000000000000000000000000000000000000" false false false "$PROP_REF")" "$(cast keccak "CP-DRILL-STEWARD")" "drill-steward"
  exec_op "$LEDGER" "$(cast calldata "openEpoch(uint256,uint64,uint64)" 1 "$EPOCH_START_HEX" "$EPOCH_END_HEX")" "$(cast keccak "CP-DRILL-OPEN-1")" "drill-open"
  exec_op "$LEDGER" "$(cast calldata "recordAccrual(uint256,bytes32,int256,bytes32)" 1 "$ACCT_R100" "$PROFIT" "$REF_REV")" "$(cast keccak "CP-DRILL-ACCRUE-REV")" "drill-accrue-rev"
  exec_op "$LEDGER" "$(cast calldata "recordAccrual(uint256,bytes32,int256,bytes32)" 1 "$ACCT_E100" "$EXP" "$REF_EXP")" "$(cast keccak "CP-DRILL-ACCRUE-EXP")" "drill-accrue-exp"
  exec_op "$LEDGER" "$(cast calldata "closeEpoch(uint256)" 1)" "$(cast keccak "CP-DRILL-CLOSE-1")" "drill-close"
  exec_op "$LEDGER" "$(cast calldata "fundLedgerForSplit(uint256)" 1)" "$(cast keccak "CP-DRILL-FUND-1")" "drill-fund"
  exec_op "$LEDGER" "$(cast calldata "splitNetProfit(uint256)" 1)" "$(cast keccak "CP-DRILL-SPLIT-1")" "drill-split"
fi

echo "TT_CP_CUTOVER_DRILL_EXECUTE: OK"
