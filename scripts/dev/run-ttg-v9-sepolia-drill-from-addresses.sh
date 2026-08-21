#!/usr/bin/env bash
# Complete Sepolia remint/regression drill against an already-deployed V9 stack
# when batch windows expired during slow forge broadcast.
# Usage: source addresses.env first OR pass EVIDENCE dir with addresses.env
# STOP stamps left to caller.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="${TTG_V9_EVIDENCE_DIR:-$ROOT/evidence/GO_ttg_v9_remint_sepolia}"
# shellcheck disable=SC1091
source "$ROOT/scripts/dev/.env.phase2-chain-deploy.local"
# shellcheck disable=SC1091
source "$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local"
# shellcheck disable=SC1091
source "$EV/addresses.env"
[[ "${PRIVATE_KEY}" != 0x* ]] && export PRIVATE_KEY="0x$PRIVATE_KEY"
PK="$PRIVATE_KEY"
BUY="${BUY_USDC:-1000000}"
BURN_AMT_WEI="${BURN_AMT_WEI:-1000000000000000000000000000}"
DELAY="${TIMELOCK_DELAY:-90}"
WINDOW="${WINDOW_SECONDS:-300}"
LEAD="${RESCHED_LEAD_SECONDS:-180}"

RPC_CANDIDATES=(
  "https://sepolia.gateway.tenderly.co"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "${CHAIN_RPC_URL:-}"
)
pick() {
  for r in "${RPC_CANDIDATES[@]}"; do
    [[ -z "$r" ]] && continue
    cid=$(cast chain-id --rpc-url "$r" 2>/dev/null || true)
    [[ "$cid" == "11155111" ]] && { echo "$r"; return 0; }
  done
  return 1
}
RPC="$(pick)"
cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }
fail() { echo "TTG_V9_DRILL: STOP $*" >&2; exit 2; }
ok() { echo "TTG_V9_DRILL: OK $*"; }
append() { printf '%s\t%s\n' "$1" "$2" >> "$EV/txs.tsv"; ok "tx $1 $2"; }

send() {
  local label="$1"; shift
  local out hash status try
  for try in 1 2 3 4 5; do
    out=$(cast send --rpc-url "$RPC" --private-key "$PK" --legacy --gas-price 8gwei --json "$@" 2>&1) && break
    echo "$out" >&2
    RPC="$(pick)" || true
    sleep 3
  done
  hash=$(OUT_JSON="$out" python - <<'PY'
import json,os,re
t=os.environ["OUT_JSON"]
try:
 d=json.loads(t); print(d.get("transactionHash") or d.get("hash") or "")
except Exception:
 m=re.search(r"0x[a-fA-F0-9]{64}", t); print(m.group(0) if m else "")
PY
)
  [[ "$hash" == 0x* && ${#hash} -eq 66 ]] || fail "send $label no hash"
  append "$label" "$hash"
  status=$(cast receipt --rpc-url "$RPC" "$hash" status 2>/dev/null | awk '{print $1}' | tr -d '\r')
  [[ "$status" == "0x1" || "$status" == "1" ]] || fail "revert $label $hash status=$status"
}

expect_revert() {
  local label="$1"; shift
  if cast send --rpc-url "$RPC" --private-key "$PK" --legacy --gas-price 8gwei "$@" >/dev/null 2>&1; then
    fail "expected revert $label"
  fi
  ok "revert OK $label"
}

rpc_ts() { cast_u "$(cast block --rpc-url "$RPC" -f timestamp 2>/dev/null || true)"; }
rpc_block() { cast_u "$(cast block-number --rpc-url "$RPC" 2>/dev/null || echo 0)"; }
wait_until_ts() {
  local target="$1" now spun=0
  while true; do
    now="$(rpc_ts)"
    [[ -n "$now" && "$now" =~ ^[0-9]+$ ]] || { spun=$((spun+1)); [[ $spun -lt 80 ]] || fail "rpc_ts"; sleep 3; continue; }
    python -c "raise SystemExit(0 if int('$now')>=int('$target') else 1)" && break
    sleep 3
  done
}
wait_until_block() {
  local target="$1" now
  while true; do
    now="$(rpc_block)"
    python -c "raise SystemExit(0 if int('$now')>=int('$target') else 1)" && break
    sleep 4
  done
}
wait_op_ready() {
  local opid="$1" ready
  ready=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$opid" | sed -n '1p')")
  wait_until_ts "$ready"
}
batch_field() {
  cast_u "$(cast call --rpc-url "$RPC" "$MARKET" "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" "$1" | sed -n "$2p")"
}

: > "$EV/txs.tsv"
ok "drill RPC host=$(python -c "from urllib.parse import urlparse; print(urlparse('$RPC').netloc)")"

MAX=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "MAX_SUPPLY()(uint256)")")
SUPPLY0=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "totalSupply()(uint256)")")
[[ "$MAX" == "25000000000000000000000000000000" ]] || fail "MAX_SUPPLY"
[[ "$SUPPLY0" == "$MAX" ]] || fail "genesis supply"

# Close expired unarmed; schedule fresh windows for unopened future batches
NOW=$(rpc_ts)
: > "$EV/resched.tsv"
NEED_RESCHED=0
for id in 1 2 3 4 5; do
  CLOSED=$(batch_field "$id" 8)
  ARMED=$(batch_field "$id" 7)
  START=$(batch_field "$id" 1)
  END=$(batch_field "$id" 2)
  if [[ "$CLOSED" == "true" || "$CLOSED" == "1" ]]; then
    ok "batch $id already closed"; continue
  fi
  if python -c "raise SystemExit(0 if int('$NOW')>=int('$END') else 1)"; then
    if [[ "$ARMED" != "true" && "$ARMED" != "1" ]]; then
      send "close_cancel_$id" "$MARKET" "closeBatchReturn(uint256)" "$id"
    else
      send "close_return_$id" "$MARKET" "closeBatchReturn(uint256)" "$id"
    fi
    continue
  fi
  # still open or future — if start already passed, keep window; else will reschedule all remaining together
  if python -c "raise SystemExit(0 if int('$NOW') < int('$START') else 1)"; then
    NEED_RESCHED=1
  fi
done

if [[ "$NEED_RESCHED" == "1" ]]; then
  NOW=$(rpc_ts)
  BASE=$((NOW + LEAD + DELAY + 30))
  idx=0
  for id in 1 2 3 4 5; do
    CLOSED=$(batch_field "$id" 8)
    ARMED=$(batch_field "$id" 7)
    START=$(batch_field "$id" 1)
    [[ "$CLOSED" == "true" || "$CLOSED" == "1" ]] && continue
    [[ "$ARMED" == "true" || "$ARMED" == "1" ]] && continue
    python -c "raise SystemExit(0 if int('$NOW') < int('$START') else 1)" || continue
    CAP=$(batch_field "$id" 3)
    PX=$(batch_field "$id" 4)
    S=$((BASE + idx * WINDOW))
    E=$((S + WINDOW))
    DATA=$(cast calldata "setUnopenedBatchParams(uint256,uint64,uint64,uint256,uint32)" "$id" "$S" "$E" "$CAP" "$PX")
    SALT=$(cast keccak "ttg-v9-drill-resched-$id-$S")
    send "schedule_resched_$id" "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$MARKET" 0 "$DATA" "$SALT"
    echo "$id $S $E $DATA $SALT" >> "$EV/resched.tsv"
    idx=$((idx + 1))
  done
  if [[ -s "$EV/resched.tsv" ]]; then
    ok "waiting Timelock delay=${DELAY}s for window refresh"
    sleep $((DELAY + 5))
    while IFS=' ' read -r id S E DATA SALT; do
      [[ -z "$id" ]] && continue
      OP=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$MARKET" 0 "$DATA" "$SALT")")
      wait_op_ready "$OP"
      send "execute_resched_$id" "$TIMELOCK" "execute(bytes32)" "$OP"
    done < "$EV/resched.tsv"
  fi
fi

# Buy+RETURN remaining openable batches
for id in 1 2 3 4 5; do
  CLOSED=$(batch_field "$id" 8)
  if [[ "$CLOSED" == "true" || "$CLOSED" == "1" ]]; then
    ok "skip closed batch $id"; continue
  fi
  B_START=$(batch_field "$id" 1)
  B_END=$(batch_field "$id" 2)
  NOW=$(rpc_ts)
  if python -c "raise SystemExit(0 if int('$NOW')>=int('$B_END') else 1)"; then
    send "close_late_$id" "$MARKET" "closeBatchReturn(uint256)" "$id"
    continue
  fi
  wait_until_ts "$B_START"
  if [[ "$id" -eq 2 ]]; then
    # optional: expired prior buy may already be closed
    true
  fi
  TTG_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER")")
  SINK_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$USDC" "balanceOf(address)(uint256)" "$P4CAP")")
  send "buy_batch_$id" "$MARKET" "buy(uint256,uint256)" "$id" "$BUY"
  TTG_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER")")
  SINK_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$USDC" "balanceOf(address)(uint256)" "$P4CAP")")
  [[ "$(python -c "print(int('$SINK_AFTER')-int('$SINK_BEFORE'))")" == "$BUY" ]] || fail "usdc sink $id"
  QUOTE=$(cast_u "$(cast call --rpc-url "$RPC" "$MARKET" "quoteTtg(uint256,uint256)(uint256)" "$id" "$BUY")")
  [[ "$(python -c "print(int('$TTG_AFTER')-int('$TTG_BEFORE'))")" == "$QUOTE" ]] || fail "quote $id"
  wait_until_ts "$B_END"
  VAULT_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")
  send "closeBatchReturn_$id" "$MARKET" "closeBatchReturn(uint256)" "$id"
  VAULT_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")
  python -c "raise SystemExit(0 if int('$VAULT_AFTER')>int('$VAULT_BEFORE') else 1)" || fail "RETURN $id"
  ok "batch $id RETURN"
done

# Post-sale: pause / rescue / UUPS / cutover / gov burn
send "pause" "$MARKET" "pause()"
expect_revert "buy_while_paused" "$MARKET" "buy(uint256,uint256)" 1 "$BUY"
DATA=$(cast calldata "unpause()")
SALT=$(cast keccak "ttg-v9-unpause-drill-$(date +%s)")
send "schedule_unpause" "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$MARKET" 0 "$DATA" "$SALT"
OPID=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$MARKET" 0 "$DATA" "$SALT")")
wait_op_ready "$OPID"
send "execute_unpause" "$TIMELOCK" "execute(bytes32)" "$OPID"

JUNK_BAL=$(cast_u "$(cast call --rpc-url "$RPC" "$JUNK" "balanceOf(address)(uint256)" "$VAULT")")
if [[ "$JUNK_BAL" == "0" ]]; then
  send "junk_mint_vault" "$JUNK" "mint(address,uint256)" "$VAULT" 1000000000000000000000
fi
expect_revert "rescue_ttg" "$VAULT" "rescueForeignERC20(address,address,uint256)" "$TTG" "$DEPLOYER" 1
RDATA=$(cast calldata "rescueForeignERC20(address,address,uint256)" "$JUNK" "$DEPLOYER" 1000000000000000000)
RSALT=$(cast keccak "ttg-v9-rescue-drill-$(date +%s)")
send "schedule_rescue" "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$VAULT" 0 "$RDATA" "$RSALT"
ROP=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$VAULT" 0 "$RDATA" "$RSALT")")
wait_op_ready "$ROP"
send "execute_rescue" "$TIMELOCK" "execute(bytes32)" "$ROP"

expect_revert "uups_eoa_vault" "$VAULT" "upgradeToAndCall(address,bytes)" "$VAULT_V2" 0x
expect_revert "uups_eoa_market" "$MARKET" "upgradeToAndCall(address,bytes)" "$MARKET_V2" 0x
INV_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$VAULT" "inventory()(uint256)")")
UDATA=$(cast calldata "upgradeToAndCall(address,bytes)" "$VAULT_V2" 0x)
USALT=$(cast keccak "ttg-v9-uups-drill-$(date +%s)")
send "schedule_uups" "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$VAULT" 0 "$UDATA" "$USALT"
UOP=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$VAULT" 0 "$UDATA" "$USALT")")
wait_op_ready "$UOP"
send "execute_uups" "$TIMELOCK" "execute(bytes32)" "$UOP"
INV_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$VAULT" "inventory()(uint256)")")
[[ "$INV_AFTER" == "$INV_BEFORE" ]] || fail "inventory changed"
echo "$(cast call --rpc-url "$RPC" "$VAULT" "version()(string)" || true)" | grep -qi v2 || fail "vault not v2"

expect_revert "legacy_schedule" "$TIMELOCK" "scheduleByGovernor(address,uint256,bytes,bytes32)" "$VAULT" 0 0x "$(cast keccak legacy-drill)"
CUR=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "governor()(address)")")
[[ "${CUR,,}" == "${GOVERNOR,,}" ]] || fail "governor mismatch"

send "delegate" "$TTG" "delegate(address)" "$DEPLOYER"
wait_until_block "$(python -c "print(int('$(rpc_block)')+2)")"
BURN_CDATA=$(cast calldata "executeGovernanceBurn(uint256)" "$BURN_AMT_WEI")
send "gov_propose" "$GOVERNOR" "propose(address[],uint256[],bytes[],string)" \
  "[$VAULT]" "[0]" "[$BURN_CDATA]" "v9 sepolia governance burn 1B"
PID=$(cast_u "$(cast call --rpc-url "$RPC" "$GOVERNOR" "proposalCount()(uint256)")")
VSTART=$(cast_u "$(cast call --rpc-url "$RPC" "$GOVERNOR" "proposals(uint256)(address,uint256,uint256,uint256,bool,bool,bytes32,uint256,uint256,uint256)" "$PID" | sed -n '3p')")
VEND=$(cast_u "$(cast call --rpc-url "$RPC" "$GOVERNOR" "proposals(uint256)(address,uint256,uint256,uint256,bool,bool,bytes32,uint256,uint256,uint256)" "$PID" | sed -n '4p')")
wait_until_block "$VSTART"
send "gov_vote" "$GOVERNOR" "castVote(uint256,uint8)" "$PID" 1
wait_until_block "$(python -c "print(int('$VEND')+1)")"
STATE=$(cast_u "$(cast call --rpc-url "$RPC" "$GOVERNOR" "state(uint256)(uint8)" "$PID")")
[[ "$STATE" == "4" ]] || fail "not Succeeded state=$STATE"
send "gov_queue" "$GOVERNOR" "queue(uint256)" "$PID"
QOP=$(cast_u "$(cast call --rpc-url "$RPC" "$GOVERNOR" "proposals(uint256)(address,uint256,uint256,uint256,bool,bool,bytes32,uint256,uint256,uint256)" "$PID" | sed -n '7p')")
wait_op_ready "$QOP"
SUPPLY_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "totalSupply()(uint256)")")
send "gov_execute_burn" "$GOVERNOR" "execute(uint256)" "$PID"
SUPPLY_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "totalSupply()(uint256)")")
python -c "raise SystemExit(0 if int('$SUPPLY_BEFORE')-int('$SUPPLY_AFTER')==int('$BURN_AMT_WEI') else 1)" || fail "burn supply"
ok "drill complete supply_after=$SUPPLY_AFTER"
echo "$SUPPLY_BEFORE" > "$EV/supply_before_burn.txt"
echo "$SUPPLY_AFTER" > "$EV/supply_after_burn.txt"
echo "$MAX" > "$EV/max_supply.txt"
