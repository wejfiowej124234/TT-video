#!/usr/bin/env bash
# TTG_V9_REMINT_SEPOLIA — Final Norm full lifecycle on Sepolia (② only)
#
# Deploys: TravelTrustGovernanceTokenV9 + UUPS Vault/PM + GovernorV9 + MockTimelock
# Drills: genesis 25T · five-batch buy+RETURN · pause/rescue · UUPS deny/allow ·
#         Governor cutover · propose→vote→Timelock delay→governance burn · supply invariant
# Auth: TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK=1
# STOP: V9_REMINT_SEPOLIA_PASS_STOP · FORBID Mainnet · FORBID TT_PRODUCTION_GO flip
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REHEARSAL_ENV="${TTG_V9_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_remint_sepolia"
DEPLOY_LOG="$EVIDENCE/deploy.forge.log"
SEPOLIA_CHAIN_ID=11155111
SCRIPT="src/ttg-v9/TtgV9RemintSepoliaRehearsal.s.sol:TtgV9RemintSepoliaRehearsal"
WINDOW=300
BUY_USDC=1000000
# Compressed Sepolia delay (Norm Mainnet KEEP Timelock remains 48h). Override via env.
# Keep well below batch WINDOW so pause→unpause fits inside batch 1.
TIMELOCK_DELAY="${TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS:-90}"
BURN_AMT_WEI="1000000000000000000000000000" # 1e9 ether = 1B TTG

fail() { echo "TTG_V9_REMINT_SEPOLIA: STOP $*" >&2; exit 2; }
ok() { echo "TTG_V9_REMINT_SEPOLIA: OK $*"; }

cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    [[ -z "$val" ]] && continue
    export "$key=$val"
  done < "$f"
}

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE (need CHAIN_RPC_URL / PRIVATE_KEY)"
load_env_file "$ENV_FILE"
load_env_file "$REHEARSAL_ENV"

if ! is_truthy "${TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK:-}"; then
  fail "set TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK=1 (Owner ② Sepolia V9 remint only)"
fi
if is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}"; then
  fail "refusing: TRAVELTRUST_MAINNET_BROADCAST_OK is set"
fi

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
export TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS="$TIMELOCK_DELAY"

RPC_CANDIDATES=(
  "https://sepolia.gateway.tenderly.co"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "${CHAIN_RPC_URL}"
)
pick_sepolia_rpc() {
  local _rpc _cid _code
  for _rpc in "${RPC_CANDIDATES[@]}"; do
    _cid="$(cast chain-id --rpc-url "$_rpc" 2>/dev/null || true)"
    [[ "$_cid" == "$SEPOLIA_CHAIN_ID" ]] || continue
    _code="$(cast code 0x0000000000000000000000000000000000000001 --rpc-url "$_rpc" 2>/dev/null || true)"
    if [[ "$_code" == 0x* ]]; then
      echo "$_rpc"
      return 0
    fi
  done
  return 1
}
CHAIN_RPC_URL="$(pick_sepolia_rpc)" || fail "no healthy full-state Sepolia RPC"
ok "using Sepolia RPC host=$(python -c "from urllib.parse import urlparse; print(urlparse('$CHAIN_RPC_URL').netloc)")"

[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "PRIVATE_KEY unset (Owner-local env only)"
if [[ "$PRIVATE_KEY" != 0x* && "$PRIVATE_KEY" != 0X* ]]; then
  export PRIVATE_KEY="0x${PRIVATE_KEY}"
fi
command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

mkdir -p "$EVIDENCE"
: > "$EVIDENCE/txs.tsv"
: > "$EVIDENCE/events.tsv"

if [[ "${V9_REMINT_SEPOLIA_RESUME:-0}" != "1" ]]; then
  ok "① local remint gate"
  bash "$ROOT/scripts/dev/run-ttg-v9-remint-local-gate.sh" || fail "local remint gate failed"
fi

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || true)"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "refusing broadcast: chain_id=${CHAIN_ID:-unset}"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
BAL_WEI="0"
for _try in 1 2 3 4 5 6; do
  _raw="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || true)"
  BAL_WEI="$(cast_u "${_raw:-0}")"
  [[ -n "$BAL_WEI" && "$BAL_WEI" =~ ^[0-9]+$ ]] || BAL_WEI="0"
  if [[ "$(python -c "print(int('${BAL_WEI}') >= int('80000000000000000'))")" == "True" ]]; then
    break
  fi
  sleep 3
done
MIN_WEI="80000000000000000" # 0.08 ETH Sepolia (full remint deploy)
if [[ "$(python -c "print(int('${BAL_WEI}') < int('${MIN_WEI}'))")" == "True" ]]; then
  fail "deployer Sepolia ETH below 0.08 (have ${BAL_WEI} wei)"
fi
ok "Sepolia deployer funded (address only)"

if [[ "${V9_REMINT_SEPOLIA_RESUME:-0}" == "1" ]]; then
  [[ -f "$DEPLOY_LOG" ]] || fail "resume requires $DEPLOY_LOG"
  [[ -f "$EVIDENCE/addresses.env" ]] || fail "resume requires addresses.env"
  # shellcheck disable=SC1090
  source "$EVIDENCE/addresses.env"
  ok "resume from prior deploy (no re-deploy)"
else
  ok "broadcast Final Norm remint deploy"
  DEPLOY_OK=0
  for _try in 1 2 3 4 5; do
    if (
      cd "$ROOT/contracts"
      FOUNDRY_PROFILE=ttg_v9_broadcast forge script "$SCRIPT" \
        --rpc-url "$CHAIN_RPC_URL" \
        --private-key "$PRIVATE_KEY" \
        --sender "$DEPLOYER" \
        --chain-id "$SEPOLIA_CHAIN_ID" \
        --broadcast \
        --legacy \
        --slow \
        -vv
    ) | tee "$DEPLOY_LOG"; then
      if grep -q "ONCHAIN EXECUTION COMPLETE & SUCCESSFUL" "$DEPLOY_LOG" \
        && grep -qE '^[[:space:]]*governor[[:space:]]+0x' "$DEPLOY_LOG"; then
        DEPLOY_OK=1
        break
      fi
    fi
    CHAIN_RPC_URL="$(pick_sepolia_rpc)" || true
    [[ -n "${CHAIN_RPC_URL:-}" ]] || fail "lost Sepolia RPC mid-retry"
    ok "deploy retry $_try"
    sleep 25
  done
  [[ "$DEPLOY_OK" == "1" ]] || fail "forge broadcast failed after retries"

  parse_log() { grep -E "^[[:space:]]*$1[[:space:]]" "$DEPLOY_LOG" | awk '{print $NF}' | tail -1; }
  USDC="$(parse_log usdc)"
  TTG="$(parse_log ttg)"
  VAULT="$(parse_log vault)"
  MARKET="$(parse_log market)"
  GOVERNOR="$(parse_log governor)"
  LEGACY_GOV="$(parse_log legacyGovernor)"
  TIMELOCK="$(parse_log timelock)"
  P4CAP="$(parse_log p4capKeep)"
  VAULT_V2="$(parse_log vaultV2)"
  MARKET_V2="$(parse_log marketV2)"
  JUNK="$(parse_log junk)"
  BATCH1_START="$(cast_u "$(parse_log batch1Start)")"
  DELAY_LOG="$(cast_u "$(parse_log timelockDelay)")"
  [[ -n "$DELAY_LOG" ]] && TIMELOCK_DELAY="$DELAY_LOG"

  cat > "$EVIDENCE/addresses.env" <<EOF
USDC=$USDC
TTG=$TTG
VAULT=$VAULT
MARKET=$MARKET
GOVERNOR=$GOVERNOR
LEGACY_GOV=$LEGACY_GOV
TIMELOCK=$TIMELOCK
P4CAP=$P4CAP
VAULT_V2=$VAULT_V2
MARKET_V2=$MARKET_V2
JUNK=$JUNK
BATCH1_START=$BATCH1_START
TIMELOCK_DELAY=$TIMELOCK_DELAY
DEPLOYER=$DEPLOYER
EOF
fi

[[ "$USDC" == 0x* && "$TTG" == 0x* && "$VAULT" == 0x* && "$MARKET" == 0x* && "$GOVERNOR" == 0x* && "$TIMELOCK" == 0x* ]] \
  || fail "parse deploy addresses failed"
ok "deployed ttg=$TTG governor=$GOVERNOR market=$MARKET"

append_tx() {
  local label="$1" hash="$2"
  [[ "$hash" == 0x* && ${#hash} -eq 66 ]] || fail "missing tx hash for $label (got '$hash')"
  printf '%s\t%s\n' "$label" "$hash" >> "$EVIDENCE/txs.tsv"
  ok "tx $label $hash"
}

send() {
  local label="$1"
  shift
  local out hash status
  out="$(cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --json "$@" 2>&1)" || {
    echo "$out" >&2
    fail "cast send failed: $label"
  }
  hash="$(OUT_JSON="$out" python - <<'PY'
import json, os, re
t = os.environ.get("OUT_JSON", "")
try:
    d = json.loads(t)
    print(d.get("transactionHash") or d.get("hash") or "")
except Exception:
    m = re.search(r"0x[a-fA-F0-9]{64}", t)
    print(m.group(0) if m else "")
PY
)"
  append_tx "$label" "$hash"
  status="$(cast receipt --rpc-url "$CHAIN_RPC_URL" "$hash" --json 2>/dev/null | python -c "import sys,json; print(json.load(sys.stdin).get('status',''))" || true)"
  [[ "$status" == "0x1" || "$status" == "1" ]] || fail "tx reverted: $label $hash status=$status"
}

expect_revert() {
  local label="$1"
  shift
  if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" "$@" >/dev/null 2>&1; then
    fail "expected revert: $label"
  fi
  ok "expected revert OK: $label"
}

rpc_ts() {
  local out="" _try
  for _try in 1 2 3 4 5 6 7 8; do
    out="$(cast_u "$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp 2>/dev/null || true)")"
    if [[ -n "$out" && "$out" =~ ^[0-9]+$ ]]; then
      echo "$out"
      return 0
    fi
    CHAIN_RPC_URL="$(pick_sepolia_rpc)" || true
    sleep 2
  done
  echo ""
}

rpc_block() {
  cast_u "$(cast block-number --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 0)"
}

wait_until_ts() {
  local target now spun=0
  target="$(cast_u "$1")"
  [[ -n "$target" && "$target" =~ ^[0-9]+$ ]] || fail "wait_until_ts bad target"
  while true; do
    now="$(rpc_ts)"
    [[ -n "$now" && "$now" =~ ^[0-9]+$ ]] || { spun=$((spun+1)); [[ $spun -lt 80 ]] || fail "rpc_ts unavailable"; sleep 3; continue; }
    if [[ "$(python -c "print(int('$now') >= int('$target'))")" == "True" ]]; then break; fi
    sleep 3
  done
}

wait_until_block() {
  local target now spun=0
  target="$(cast_u "$1")"
  while true; do
    now="$(rpc_block)"
    [[ -n "$now" && "$now" =~ ^[0-9]+$ ]] || { spun=$((spun+1)); [[ $spun -lt 80 ]] || fail "block number unavailable"; sleep 3; continue; }
    if [[ "$(python -c "print(int('$now') >= int('$target'))")" == "True" ]]; then break; fi
    sleep 4
  done
}

batch_field() {
  local out="" _try
  for _try in 1 2 3 4 5 6 7 8; do
    out="$(
      cast call --rpc-url "$CHAIN_RPC_URL" "$MARKET" \
        "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" "$1" 2>/dev/null \
        | sed -n "$2p"
    )"
    out="$(cast_u "$out")"
    if [[ -n "$out" ]]; then echo "$out"; return 0; fi
    sleep 2
  done
  fail "batch_field empty batch=$1 line=$2"
}

wait_op_ready() {
  local opid="$1"
  local ready
  ready="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$opid" 2>/dev/null | sed -n '1p')")"
  [[ -n "$ready" && "$ready" =~ ^[0-9]+$ && "$ready" != "0" ]] || fail "operations.readyAt missing for $opid"
  wait_until_ts "$ready"
}

# --- Genesis invariants ---
MAX="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "MAX_SUPPLY()(uint256)")")"
SUPPLY0="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "totalSupply()(uint256)")")"
[[ "$MAX" == "25000000000000000000000000000000" ]] || fail "MAX_SUPPLY != 25T wei"
[[ "$SUPPLY0" == "$MAX" ]] || fail "genesis totalSupply != MAX_SUPPLY"
VAULT_BAL="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")"
TL_BAL="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$TIMELOCK")")"
DEP_BAL="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER")")"
# deployer holds 3+5+7 = 15% = 3.75T
[[ "$VAULT_BAL" == "12500000000000000000000000000000" ]] || fail "vault != 12.5T"
[[ "$TL_BAL" == "8750000000000000000000000000000" ]] || fail "timelock != 8.75T"
[[ "$DEP_BAL" == "3750000000000000000000000000000" ]] || fail "ops alias != 3.75T"
# No mint selector: cast must fail (ABI / revert). Treat any non-success as OK.
if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" "$TTG" "mint(address,uint256)" "$DEPLOYER" 1 >/dev/null 2>&1; then
  fail "mint unexpectedly succeeded"
fi
ok "G1/G2 genesis + NO_MINT surface"

# --- Five-batch drill ---
ok "begin five-batch RETURN drill"
for id in 1 2 3 4 5; do
  B_START="$(batch_field "$id" 1)"
  B_END="$(batch_field "$id" 2)"
  NOW="$(rpc_ts)"
  if [[ "$(python -c "print(int('$NOW') >= int('$B_END'))")" == "True" ]]; then
    fail "batch $id window already ended — re-deploy fresh"
  fi
  wait_until_ts "$B_START"

  if [[ "$id" -eq 2 ]]; then
    expect_revert "buy_expired_batch1_during_batch2" "$MARKET" "buy(uint256,uint256)" 1 "$BUY_USDC"
  fi

  TTG_BEFORE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER")")"
  SINK_BEFORE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC" "balanceOf(address)(uint256)" "$P4CAP")")"
  send "buy_batch_${id}" "$MARKET" "buy(uint256,uint256)" "$id" "$BUY_USDC"
  TTG_AFTER="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER")")"
  SINK_AFTER="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC" "balanceOf(address)(uint256)" "$P4CAP")")"
  DELTA_TTG="$(python -c "print(int('$TTG_AFTER')-int('$TTG_BEFORE'))")"
  DELTA_USDC="$(python -c "print(int('$SINK_AFTER')-int('$SINK_BEFORE'))")"
  [[ "$DELTA_USDC" == "$BUY_USDC" ]] || fail "USDC sink delta batch $id"
  QUOTE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$MARKET" "quoteTtg(uint256,uint256)(uint256)" "$id" "$BUY_USDC")")"
  [[ "$DELTA_TTG" == "$QUOTE" ]] || fail "TTG out != quote batch $id"
  FROZEN="$(batch_field "$id" 9)"
  [[ "$FROZEN" == "true" || "$FROZEN" == "1" ]] || fail "batch $id not frozen"

  if [[ "$id" -eq 1 ]]; then
    send "pause" "$MARKET" "pause()"
    expect_revert "buy_while_paused" "$MARKET" "buy(uint256,uint256)" 1 "$BUY_USDC"
    # unpause is Timelock-only — schedule + wait + execute (fits inside WINDOW)
    DATA="$(cast calldata "unpause()")"
    SALT="$(cast keccak "ttg-v9-unpause-1")"
    send "schedule_unpause" "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$MARKET" 0 "$DATA" "$SALT"
    OPID="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$MARKET" 0 "$DATA" "$SALT")")"
    wait_op_ready "$OPID"
    send "execute_unpause" "$TIMELOCK" "execute(bytes32)" "$OPID"
    expect_revert "vault_pull_not_market" "$VAULT" "pull(uint256)" 1
  fi

  wait_until_ts "$B_END"
  VAULT_BEFORE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")"
  send "closeBatchReturn_${id}" "$MARKET" "closeBatchReturn(uint256)" "$id"
  VAULT_AFTER="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")"
  [[ "$(python -c "print(int('$VAULT_AFTER') > int('$VAULT_BEFORE'))")" == "True" ]] || fail "RETURN did not increase vault batch $id"
  ok "batch $id RETURN_TO_PUBLIC_VAULT"
done

# --- Rescue (after sale windows; Timelock delay does not race batches) ---
expect_revert "rescue_ttg_forbidden_vault" "$VAULT" "rescueForeignERC20(address,address,uint256)" "$TTG" "$DEPLOYER" 1
RDATA="$(cast calldata "rescueForeignERC20(address,address,uint256)" "$JUNK" "$DEPLOYER" 1000000000000000000)"
RSALT="$(cast keccak "ttg-v9-rescue-junk")"
send "schedule_rescue_junk" "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$VAULT" 0 "$RDATA" "$RSALT"
ROP="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$VAULT" 0 "$RDATA" "$RSALT")")"
wait_op_ready "$ROP"
send "execute_rescue_junk" "$TIMELOCK" "execute(bytes32)" "$ROP"
ok "rescue foreign OK; TTG rescue denied"

# --- UUPS deny / allow ---
expect_revert "uups_vault_eoa_denied" "$VAULT" "upgradeToAndCall(address,bytes)" "$VAULT_V2" 0x
expect_revert "uups_market_eoa_denied" "$MARKET" "upgradeToAndCall(address,bytes)" "$MARKET_V2" 0x
INV_BEFORE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$VAULT" "inventory()(uint256)")")"
UDATA="$(cast calldata "upgradeToAndCall(address,bytes)" "$VAULT_V2" 0x)"
USALT="$(cast keccak "ttg-v9-vault-uups")"
send "schedule_vault_uups" "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$VAULT" 0 "$UDATA" "$USALT"
UOP="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$VAULT" 0 "$UDATA" "$USALT")")"
wait_op_ready "$UOP"
send "execute_vault_uups" "$TIMELOCK" "execute(bytes32)" "$UOP"
INV_AFTER="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$VAULT" "inventory()(uint256)")")"
[[ "$INV_AFTER" == "$INV_BEFORE" ]] || fail "vault inventory changed across UUPS"
VER="$(cast call --rpc-url "$CHAIN_RPC_URL" "$VAULT" "version()(string)" 2>/dev/null || true)"
echo "$VER" | grep -q "v2" || fail "vault version not v2 after upgrade"
ok "UUPS deny EOA + Timelock upgrade preserves inventory"

# --- G6 cutover: legacy cannot schedule ---
expect_revert "legacy_gov_cannot_schedule" "$TIMELOCK" \
  "scheduleByGovernor(address,uint256,bytes,bytes32)" "$VAULT" 0 0x "$(cast keccak legacy-fail)"
CUR_GOV="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" "governor()(address)")")"
[[ "${CUR_GOV,,}" == "${GOVERNOR,,}" ]] || fail "timelock governor != V9 Governor"
ok "G6 cutover: only GovernorV9 is live"

# --- Governance burn: delegate → propose → vote → queue → delay → execute ---
send "delegate_self" "$TTG" "delegate(address)" "$DEPLOYER"
# need past votes: wait 2 blocks
wait_until_block "$(python -c "print(int('$(rpc_block)') + 2)")"

# Build propose args via cast
BURN_CDATA="$(cast calldata "executeGovernanceBurn(uint256)" "$BURN_AMT_WEI")"
send "gov_propose_burn" "$GOVERNOR" \
  "propose(address[],uint256[],bytes[],string)" \
  "[$VAULT]" "[0]" "[$BURN_CDATA]" "v9 sepolia governance burn 1B"

PID="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$GOVERNOR" "proposalCount()(uint256)")")"
[[ -n "$PID" && "$PID" != "0" ]] || fail "proposalCount empty"
# vote window from proposals mapping (fields: proposer,snapshot,voteStart,voteEnd,...)
VSTART="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$GOVERNOR" "proposals(uint256)(address,uint256,uint256,uint256,bool,bool,bytes32,uint256,uint256,uint256)" "$PID" | sed -n '3p')")"
VEND="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$GOVERNOR" "proposals(uint256)(address,uint256,uint256,uint256,bool,bool,bytes32,uint256,uint256,uint256)" "$PID" | sed -n '4p')")"
[[ -n "$VSTART" && -n "$VEND" ]] || fail "proposal vote window parse failed"
wait_until_block "$VSTART"
send "gov_vote_for" "$GOVERNOR" "castVote(uint256,uint8)" "$PID" 1
wait_until_block "$(python -c "print(int('$VEND') + 1)")"

STATE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$GOVERNOR" "state(uint256)(uint8)" "$PID")")"
# Succeeded = 4
[[ "$STATE" == "4" ]] || fail "proposal not Succeeded (state=$STATE)"
send "gov_queue" "$GOVERNOR" "queue(uint256)" "$PID"
QUEUED_OP="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$GOVERNOR" "proposals(uint256)(address,uint256,uint256,uint256,bool,bool,bytes32,uint256,uint256,uint256)" "$PID" | sed -n '7p')")"
ok "proposal $PID queued op=$QUEUED_OP; waiting Timelock delay=${TIMELOCK_DELAY}s (Sepolia compressed; Mainnet KEEP=48h)"
wait_op_ready "$QUEUED_OP"

SUPPLY_BEFORE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "totalSupply()(uint256)")")"
send "gov_execute_burn" "$GOVERNOR" "execute(uint256)" "$PID"
SUPPLY_AFTER="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "totalSupply()(uint256)")")"
[[ "$(python -c "print(int('$SUPPLY_BEFORE') - int('$SUPPLY_AFTER') == int('$BURN_AMT_WEI'))")" == "True" ]] \
  || fail "supply did not drop by burn amount"
[[ "$(python -c "print(int('$SUPPLY_AFTER') < int('$MAX') and int('$SUPPLY_AFTER') > 0)")" == "True" ]] \
  || fail "post-burn supply invariant"
ok "governance burn executed; supply decreased; MAX_SUPPLY unchanged"

# Indexer-oriented event harvest (receipt logs presence)
python - <<PY
import json, time, subprocess, os
from pathlib import Path
evidence = Path(r"""$EVIDENCE""")
rpc = r"""$CHAIN_RPC_URL"""
txs = []
for line in (evidence / "txs.tsv").read_text(encoding="utf-8").splitlines():
    if not line.strip():
        continue
    label, tx = line.split("\t", 1)
    txs.append({"label": label, "tx": tx})
    try:
        out = subprocess.check_output(
            ["cast", "receipt", "--rpc-url", rpc, tx, "--json"],
            text=True, stderr=subprocess.DEVNULL
        )
        receipt = json.loads(out)
        nlogs = len(receipt.get("logs") or [])
        with (evidence / "events.tsv").open("a", encoding="utf-8") as f:
            f.write(f"{label}\t{tx}\tlogs={nlogs}\tstatus={receipt.get('status')}\n")
    except Exception as e:
        with (evidence / "events.tsv").open("a", encoding="utf-8") as f:
            f.write(f"{label}\t{tx}\tlogs=ERR\t{e}\n")

payload = {
  "stamp": "V9_REMINT_SEPOLIA_PASS_STOP",
  "phase": "②",
  "chain_id": $SEPOLIA_CHAIN_ID,
  "not_production_go": True,
  "mainnet_broadcast": "FORBIDDEN",
  "monetary_invariant": "MAX_SUPPLY=25T NO_FURTHER_MINT",
  "timelock_delay_seconds_rehearsal": int("$TIMELOCK_DELAY"),
  "timelock_delay_mainnet_keep_hours": 48,
  "timelock_note": "Sepolia uses MockV9Timelock with compressed delay; Official Mainnet KEEP Timelock remains 48h",
  "ops_wallets_mode": "SEPOLIA_DEPLOYER_TRIPLE_ALIAS",
  "ops_wallets_mainnet_norm": {
    "team": "0x010365F0835323826569D61D0E13E6F8d25F6828",
    "marketing": "0xe1e732EfBf9B010a9204054467256d3d93f3CdD4",
    "treasury": "0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736",
  },
  "keep_mainnet": ["Money_Path", "P4Cap_live_address_as_sink", "Official_Timelock_48h"],
  "deployer": "$DEPLOYER",
  "addresses": {
    "usdc_mock": "$USDC",
    "ttg_v9": "$TTG",
    "vault": "$VAULT",
    "market": "$MARKET",
    "governor_v9": "$GOVERNOR",
    "legacy_governor": "$LEGACY_GOV",
    "mock_timelock": "$TIMELOCK",
    "p4cap_keep": "$P4CAP",
  },
  "genesis_checks": {
    "max_supply_wei": "$MAX",
    "vault_12_5t": True,
    "timelock_8_75t": True,
    "ops_alias_3_75t": True,
  },
  "sale": {
    "window_seconds": $WINDOW,
    "buy_usdc_raw_per_batch": $BUY_USDC,
    "close_policy_all_batches": "RETURN_TO_PUBLIC_VAULT",
    "closeBatchBurn": "REMOVED",
  },
  "governance_burn_wei": "$BURN_AMT_WEI",
  "supply_before_burn": "$SUPPLY_BEFORE",
  "supply_after_burn": "$SUPPLY_AFTER",
  "drills_pass": [
    "genesis_25t_allocation",
    "no_mint",
    "five_batch_buy_return",
    "pause_unpause_via_timelock",
    "rescue_foreign_deny_ttg",
    "uups_deny_eoa",
    "uups_timelock_upgrade",
    "governor_cutover",
    "gov_propose_vote_queue_delay_execute_burn",
    "supply_never_increases",
  ],
  "transactions": txs,
  "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
}
(evidence / "V9_REMINT_SEPOLIA_PASS_STOP.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
(evidence / "v9-remint-sepolia-rehearsal.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print("wrote", evidence / "V9_REMINT_SEPOLIA_PASS_STOP.json")
PY

ok "V9_REMINT_SEPOLIA_PASS_STOP issued; Mainnet FORBIDDEN; TT_PRODUCTION_GO unchanged"
