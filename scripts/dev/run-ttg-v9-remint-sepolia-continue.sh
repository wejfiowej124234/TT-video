#!/usr/bin/env bash
# Continue V9 remint Sepolia drill from addresses.env (post partial deploy).
# STOP: V9_REMINT_SEPOLIA_PASS_STOP · no Mainnet
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_ttg_v9_remint_sepolia"
# shellcheck disable=SC1091
source "$ROOT/scripts/dev/.env.phase2-chain-deploy.local"
# shellcheck disable=SC1091
source "$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local"
# shellcheck disable=SC1091
source "$EV/addresses.env"
[[ "${PRIVATE_KEY}" != 0x* ]] && export PRIVATE_KEY="0x$PRIVATE_KEY"
PK="$PRIVATE_KEY"
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
echo "RPC host=$(python -c "from urllib.parse import urlparse; print(urlparse('$RPC').netloc)")"
BUY=1000000
BURN_AMT_WEI=1000000000000000000000000000
DELAY="${TIMELOCK_DELAY:-90}"

cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }
fail() { echo "STOP $*" >&2; exit 2; }
ok() { echo "OK $*"; }
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
  status=$(cast receipt --rpc-url "$RPC" "$hash" status 2>/dev/null || true)
  status=$(echo "$status" | awk '{print $1}' | tr -d '\r')
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

# --- close batch2 RETURN if needed ---
B2_CLOSED=$(batch_field 2 8)
if [[ "$B2_CLOSED" != "true" && "$B2_CLOSED" != "1" ]]; then
  wait_until_ts "$(batch_field 2 2)"
  VAULT_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")
  send "closeBatchReturn_2" "$MARKET" "closeBatchReturn(uint256)" 2
  VAULT_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")
  python -c "raise SystemExit(0 if int('$VAULT_AFTER')>int('$VAULT_BEFORE') else 1)" || fail "RETURN vault not up"
  ok "batch2 RETURN"
fi

# --- batches 3-5 buy+RETURN ---
for id in 3 4 5; do
  CLOSED=$(batch_field "$id" 8)
  if [[ "$CLOSED" == "true" || "$CLOSED" == "1" ]]; then
    ok "batch $id already closed"; continue
  fi
  B_START=$(batch_field "$id" 1)
  B_END=$(batch_field "$id" 2)
  NOW=$(rpc_ts)
  if python -c "raise SystemExit(0 if int('$NOW')>=int('$B_END') else 1)"; then
    # expired unarmed -> cancel
    send "closeBatchReturn_${id}" "$MARKET" "closeBatchReturn(uint256)" "$id"
    continue
  fi
  wait_until_ts "$B_START"
  TTG_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER")")
  SINK_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$USDC" "balanceOf(address)(uint256)" "$P4CAP")")
  send "buy_batch_${id}" "$MARKET" "buy(uint256,uint256)" "$id" "$BUY"
  TTG_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER")")
  SINK_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$USDC" "balanceOf(address)(uint256)" "$P4CAP")")
  DELTA_USDC=$(python -c "print(int('$SINK_AFTER')-int('$SINK_BEFORE'))")
  [[ "$DELTA_USDC" == "$BUY" ]] || fail "usdc sink batch $id"
  QUOTE=$(cast_u "$(cast call --rpc-url "$RPC" "$MARKET" "quoteTtg(uint256,uint256)(uint256)" "$id" "$BUY")")
  DELTA_TTG=$(python -c "print(int('$TTG_AFTER')-int('$TTG_BEFORE'))")
  [[ "$DELTA_TTG" == "$QUOTE" ]] || fail "ttg quote batch $id"
  wait_until_ts "$B_END"
  VAULT_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")
  send "closeBatchReturn_${id}" "$MARKET" "closeBatchReturn(uint256)" "$id"
  VAULT_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")
  python -c "raise SystemExit(0 if int('$VAULT_AFTER')>int('$VAULT_BEFORE') else 1)" || fail "RETURN $id"
  ok "batch $id RETURN"
done

# --- pause / rescue / UUPS after windows ---
send "pause" "$MARKET" "pause()"
expect_revert "buy_while_paused" "$MARKET" "buy(uint256,uint256)" 3 "$BUY"
DATA=$(cast calldata "unpause()")
SALT=$(cast keccak "ttg-v9-unpause-post")
send "schedule_unpause" "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$MARKET" 0 "$DATA" "$SALT"
OPID=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$MARKET" 0 "$DATA" "$SALT")")
wait_op_ready "$OPID"
send "execute_unpause" "$TIMELOCK" "execute(bytes32)" "$OPID"

# mint junk into vault if needed
JUNK_BAL=$(cast_u "$(cast call --rpc-url "$RPC" "$JUNK" "balanceOf(address)(uint256)" "$VAULT")")
if [[ "$JUNK_BAL" == "0" ]]; then
  send "junk_mint_vault" "$JUNK" "mint(address,uint256)" "$VAULT" 1000000000000000000000
fi
expect_revert "rescue_ttg" "$VAULT" "rescueForeignERC20(address,address,uint256)" "$TTG" "$DEPLOYER" 1
RDATA=$(cast calldata "rescueForeignERC20(address,address,uint256)" "$JUNK" "$DEPLOYER" 1000000000000000000)
RSALT=$(cast keccak "ttg-v9-rescue-junk-2")
send "schedule_rescue" "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$VAULT" 0 "$RDATA" "$RSALT"
ROP=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$VAULT" 0 "$RDATA" "$RSALT")")
wait_op_ready "$ROP"
send "execute_rescue" "$TIMELOCK" "execute(bytes32)" "$ROP"

expect_revert "uups_eoa_vault" "$VAULT" "upgradeToAndCall(address,bytes)" "$VAULT_V2" 0x
expect_revert "uups_eoa_market" "$MARKET" "upgradeToAndCall(address,bytes)" "$MARKET_V2" 0x
INV_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$VAULT" "inventory()(uint256)")")
UDATA=$(cast calldata "upgradeToAndCall(address,bytes)" "$VAULT_V2" 0x)
USALT=$(cast keccak "ttg-v9-vault-uups-2")
send "schedule_uups" "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$VAULT" 0 "$UDATA" "$USALT"
UOP=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$VAULT" 0 "$UDATA" "$USALT")")
wait_op_ready "$UOP"
send "execute_uups" "$TIMELOCK" "execute(bytes32)" "$UOP"
INV_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$VAULT" "inventory()(uint256)")")
[[ "$INV_AFTER" == "$INV_BEFORE" ]] || fail "inventory changed"
VER=$(cast call --rpc-url "$RPC" "$VAULT" "version()(string)" || true)
echo "$VER" | grep -qi v2 || fail "vault not v2"

# G6 cutover check
expect_revert "legacy_schedule" "$TIMELOCK" "scheduleByGovernor(address,uint256,bytes,bytes32)" "$VAULT" 0 0x "$(cast keccak legacy-x)"
CUR=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "governor()(address)")")
[[ "${CUR,,}" == "${GOVERNOR,,}" ]] || fail "governor mismatch"

# governance burn
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
MAX=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "MAX_SUPPLY()(uint256)")")
SUPPLY_BEFORE=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "totalSupply()(uint256)")")
send "gov_execute_burn" "$GOVERNOR" "execute(uint256)" "$PID"
SUPPLY_AFTER=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "totalSupply()(uint256)")")
python -c "raise SystemExit(0 if int('$SUPPLY_BEFORE')-int('$SUPPLY_AFTER')==int('$BURN_AMT_WEI') else 1)" || fail "burn supply"

# events harvest + stamp
python - <<PY
import json, time, subprocess
from pathlib import Path
evidence = Path(r"""$EV""")
rpc = r"""$RPC"""
txs=[]
for line in (evidence/"txs.tsv").read_text(encoding="utf-8").splitlines():
    if not line.strip(): continue
    label, tx = line.split("\t",1)
    txs.append({"label":label,"tx":tx})
    try:
        out=subprocess.check_output(["cast","receipt","--rpc-url",rpc,tx,"--json"], text=True, stderr=subprocess.DEVNULL)
        receipt=json.loads(out)
        with (evidence/"events.tsv").open("a",encoding="utf-8") as f:
            f.write(f"{label}\t{tx}\tlogs={len(receipt.get('logs') or [])}\tstatus={receipt.get('status')}\n")
    except Exception as e:
        with (evidence/"events.tsv").open("a",encoding="utf-8") as f:
            f.write(f"{label}\t{tx}\tlogs=ERR\t{e}\n")
payload={
  "stamp":"V9_REMINT_SEPOLIA_PASS_STOP",
  "phase":"②",
  "chain_id":11155111,
  "not_production_go":True,
  "mainnet_broadcast":"FORBIDDEN",
  "monetary_invariant":"MAX_SUPPLY=25T NO_FURTHER_MINT",
  "timelock_delay_seconds_rehearsal":int("$DELAY"),
  "timelock_delay_mainnet_keep_hours":48,
  "ops_wallets_mode":"SEPOLIA_DEPLOYER_TRIPLE_ALIAS",
  "deployer":"$DEPLOYER",
  "addresses":{
    "usdc_mock":"$USDC","ttg_v9":"$TTG","vault":"$VAULT","market":"$MARKET",
    "governor_v9":"$GOVERNOR","legacy_governor":"$LEGACY_GOV","mock_timelock":"$TIMELOCK",
    "p4cap_keep":"$P4CAP","vault_v2":"$VAULT_V2","market_v2":"$MARKET_V2","junk":"$JUNK"
  },
  "notes":[
    "batch1 closed CANCELLED_UNARMED after deploy overrun",
    "batch2 buy+RETURN completed",
    "batches 3-5 buy+RETURN on live/rescheduled windows",
    "pause/rescue/UUPS/gov-burn after sale windows"
  ],
  "governance_burn_wei":"$BURN_AMT_WEI",
  "supply_before_burn":"$SUPPLY_BEFORE",
  "supply_after_burn":"$SUPPLY_AFTER",
  "max_supply_wei":"$MAX",
  "transactions":txs,
  "issued_at":time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
}
(evidence/"V9_REMINT_SEPOLIA_PASS_STOP.json").write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
print("wrote", evidence/"V9_REMINT_SEPOLIA_PASS_STOP.json")
PY
ok "V9_REMINT_SEPOLIA_PASS_STOP issued; Mainnet FORBIDDEN"
