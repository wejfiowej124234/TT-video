#!/usr/bin/env bash
# Resume post-sale half of Sepolia regression drill (pause → UUPS → gov burn).
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
fail() { echo "TTG_V9_POST: STOP $*" >&2; exit 2; }
ok() { echo "TTG_V9_POST: OK $*"; }
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
  ok "wait op readyAt=$ready"
  wait_until_ts "$ready"
}

ok "post-sale resume RPC host=$(python -c "from urllib.parse import urlparse; print(urlparse('$RPC').netloc)")"

VER=$(cast call --rpc-url "$RPC" "$VAULT" "version()(string)" 2>/dev/null || true)
if echo "$VER" | grep -qi v2; then
  ok "vault already v2 — skip pause/rescue/uups"
else
  PAUSED=$(cast_u "$(cast call --rpc-url "$RPC" "$MARKET" "paused()(bool)")")
  if [[ "$PAUSED" != "true" && "$PAUSED" != "1" ]]; then
    send "pause" "$MARKET" "pause()"
  else
    ok "already paused"
  fi
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
  [[ "$INV_AFTER" == "$INV_BEFORE" ]] || fail "inventory changed before=$INV_BEFORE after=$INV_AFTER"
  echo "$(cast call --rpc-url "$RPC" "$VAULT" "version()(string)" || true)" | grep -qi v2 || fail "vault not v2"
  ok "uups vault inventory preserved=$INV_AFTER"
fi

expect_revert "legacy_schedule" "$TIMELOCK" "scheduleByGovernor(address,uint256,bytes,bytes32)" "$VAULT" 0 0x "$(cast keccak legacy-drill)"
CUR=$(cast_u "$(cast call --rpc-url "$RPC" "$TIMELOCK" "governor()(address)")")
[[ "${CUR,,}" == "${GOVERNOR,,}" ]] || fail "governor mismatch"

SUPPLY_NOW=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "totalSupply()(uint256)")")
MAX=$(cast_u "$(cast call --rpc-url "$RPC" "$TTG" "MAX_SUPPLY()(uint256)")")
if [[ "$SUPPLY_NOW" != "$MAX" ]]; then
  ok "burn already applied supply=$SUPPLY_NOW — stamp only"
else
  send "delegate" "$TTG" "delegate(address)" "$DEPLOYER"
  wait_until_block "$(python -c "print(int('$(rpc_block)')+2)")"
  BURN_CDATA=$(cast calldata "executeGovernanceBurn(uint256)" "$BURN_AMT_WEI")
  send "gov_propose" "$GOVERNOR" "propose(address[],uint256[],bytes[],string)" \
    "[$VAULT]" "[0]" "[$BURN_CDATA]" "v9 sepolia regression burn 1B"
  PID=$(cast_u "$(cast call --rpc-url "$RPC" "$GOVERNOR" "proposalCount()(uint256)")")
  VSTART=$(cast_u "$(cast call --rpc-url "$RPC" "$GOVERNOR" "proposals(uint256)(address,uint256,uint256,uint256,bool,bool,bytes32,uint256,uint256,uint256)" "$PID" | sed -n '3p')")
  VEND=$(cast_u "$(cast call --rpc-url "$RPC" "$GOVERNOR" "proposals(uint256)(address,uint256,uint256,uint256,bool,bool,bytes32,uint256,uint256,uint256)" "$PID" | sed -n '4p')")
  ok "proposal=$PID voteStart=$VSTART voteEnd=$VEND"
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
  echo "$SUPPLY_BEFORE" > "$EV/supply_before_burn.txt"
  echo "$SUPPLY_AFTER" > "$EV/supply_after_burn.txt"
  echo "$MAX" > "$EV/max_supply.txt"
  ok "drill complete supply_after=$SUPPLY_AFTER"
fi

python - <<PY
import json, time
from pathlib import Path
root = Path(".") / "evidence" / "GO_ttg_v9_audit"
root.mkdir(parents=True, exist_ok=True)
ev = Path("evidence/GO_ttg_v9_remint_sepolia")
sb = (ev / "supply_before_burn.txt").read_text(encoding="utf-8").strip() if (ev / "supply_before_burn.txt").exists() else ""
sa = (ev / "supply_after_burn.txt").read_text(encoding="utf-8").strip() if (ev / "supply_after_burn.txt").exists() else ""
d = {
  "stamp": "V9_SEPOLIA_REGRESSION_PASS",
  "phase": "Regression #1 post Audit #1 R1",
  "candidate_commit_hint": "1826010bb",
  "ts_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
  "chain_id": 11155111,
  "addresses": {
    "ttg": "$TTG",
    "vault": "$VAULT",
    "market": "$MARKET",
    "governor": "$GOVERNOR",
    "timelock": "$TIMELOCK",
  },
  "notes": [
    "Batches 1-3 close_cancel unarmed due to forge --slow window overrun; buy+RETURN proven on batches 4-5",
    "Full post-sale: pause/unpause Timelock, rescue!=TTG, UUPS Timelock-only, Governor burn 1B",
    "Mainnet broadcast FORBIDDEN; TT_PRODUCTION_GO unchanged",
  ],
  "supply_before_burn": sb,
  "supply_after_burn": sa,
  "txs_tsv": str(ev / "txs.tsv"),
}
(root / "V9_SEPOLIA_REGRESSION_PASS.json").write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")
(ev / "V9_SEPOLIA_REGRESSION_PASS.json").write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")
print("STAMPED", root / "V9_SEPOLIA_REGRESSION_PASS.json")
PY
