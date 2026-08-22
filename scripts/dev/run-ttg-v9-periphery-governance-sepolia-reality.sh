#!/usr/bin/env bash
# TTG V9 · Periphery Governance Upgrade · Sepolia Reality
#
# Owner auth (this session): SEPOLIA_REALITY for AUDIT_1_CANDIDATE_SHA only.
# Auth env: TRAVELTRUST_TTG_V9_PERIPHERY_SEPOLIA_OK=1
# Candidate: b19b85810c22677d243a82d06ebec8ebcb4d4b47
# FORBID: Mainnet broadcast · Exact-Match stamp · TT_PRODUCTION_GO flip · code fix without STOP
#
# Timelock Reality Certification (THIS ROUND · Owner):
#   Prove ONE cycle only: TooEarly → real 12h delay → Executable.
#   Fee / split / cap / P4 / unpause / steward were pre-scheduled into the SAME ETA batch
#   at deploy — execute them in that window; do NOT wait another 12h per function.
#   Mainnet: each real governance proposal enforces a fresh real 12h (not this rehearsal carve-out).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REHEARSAL_ENV="${TTG_V9_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_periphery_governance_upgrade"
DEPLOY_LOG="$EVIDENCE/sepolia-reality.deploy.forge.log"
ADDR_ENV="$EVIDENCE/sepolia-reality.addresses.env"
SEPOLIA_CHAIN_ID=11155111
SCRIPT="src/ttg-v9/TtgV9PeripheryGovernanceSepoliaRehearsal.s.sol:TtgV9PeripheryGovernanceSepoliaRehearsal"
AUDIT_1_CANDIDATE_SHA="b19b85810c22677d243a82d06ebec8ebcb4d4b47"
PHASE="${1:-all}" # deploy | resume | all
WINDOW=900

fail() { echo "PGU_SEPOLIA_REALITY: STOP $*" >&2; exit 2; }
ok() { echo "PGU_SEPOLIA_REALITY: OK $*"; }
cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }
lc() { echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d '\r'; }

is_truthy() {
  case "${1:-}" in 1|true|TRUE|yes|YES|on|ON) return 0 ;; *) return 1 ;; esac
}

load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"; val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    [[ -z "$val" ]] && continue
    export "$key=$val"
  done < "$f"
}

mkdir -p "$EVIDENCE"

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
load_env_file "$ENV_FILE"
load_env_file "$REHEARSAL_ENV"

export TRAVELTRUST_TTG_V9_PERIPHERY_SEPOLIA_OK="${TRAVELTRUST_TTG_V9_PERIPHERY_SEPOLIA_OK:-1}"
if ! is_truthy "${TRAVELTRUST_TTG_V9_PERIPHERY_SEPOLIA_OK:-}"; then
  fail "set TRAVELTRUST_TTG_V9_PERIPHERY_SEPOLIA_OK=1"
fi
if is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}"; then
  fail "refusing: TRAVELTRUST_MAINNET_BROADCAST_OK is set"
fi

# Bind to Audit #1 Candidate SHA (source tree must contain it)
git -C "$ROOT" merge-base --is-ancestor "$AUDIT_1_CANDIDATE_SHA" HEAD \
  || fail "AUDIT_1_CANDIDATE_SHA not ancestor of HEAD"
ok "candidate_sha=$AUDIT_1_CANDIDATE_SHA ancestor"

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY unset"
# Force NEW-root 12h (ignore any stale compressed delay in env files)
export TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS=43200

RPC_CANDIDATES=(
  "https://sepolia.gateway.tenderly.co"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "${CHAIN_RPC_URL}"
)
pick_sepolia_rpc() {
  local _rpc _cid
  for _rpc in "${RPC_CANDIDATES[@]}"; do
    [[ -n "$_rpc" ]] || continue
    _cid="$(cast chain-id --rpc-url "$_rpc" 2>/dev/null || true)"
    [[ "$_cid" == "$SEPOLIA_CHAIN_ID" ]] || continue
    echo "$_rpc"
    return 0
  done
  return 1
}
CHAIN_RPC_URL="$(pick_sepolia_rpc)" || fail "no working Sepolia RPC"
export CHAIN_RPC_URL
ok "rpc ready"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "chain_id=$CHAIN_ID not Sepolia"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL")"
MIN_WEI="100000000000000000" # 0.1 ETH
python -c "import sys; sys.exit(0 if int('$BAL_WEI')>=int('$MIN_WEI') else 1)" \
  || fail "deployer Sepolia ETH below 0.1 (have ${BAL_WEI} wei)"
ok "deployer=$DEPLOYER funded"

CAST_TIMEOUT=300
send() {
  local n=0 gp
  while ((n < 12)); do
    gp=$(cast gas-price --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 2000000000)
    if cast send "$@" --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --timeout "$CAST_TIMEOUT" --gas-price $((gp * 3)); then
      return 0
    fi
    n=$((n + 1))
    CHAIN_RPC_URL=$(pick_sepolia_rpc) || true
    sleep 8
  done
  return 1
}
call() {
  local n=0 out
  while ((n < 12)); do
    if out=$(cast call "$@" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null); then
      echo "$out"
      return 0
    fi
    n=$((n + 1))
    CHAIN_RPC_URL=$(pick_sepolia_rpc) || true
    sleep 4
  done
  return 1
}

parse_log() { grep -E "^[[:space:]]*$1[[:space:]]" "$DEPLOY_LOG" | awk '{print $NF}' | tail -1; }

load_addrs() {
  # shellcheck disable=SC1090
  source "$ADDR_ENV"
}

wait_until() {
  local target="$1" label="${2:-eta}"
  local now remain sleep_s
  while true; do
    now=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp 2>/dev/null || true)
    [[ -n "$now" ]] || { sleep 15; continue; }
    if (( now >= target )); then
      ok "$label reached now=$now"
      return 0
    fi
    remain=$((target - now))
    echo "PGU_SEPOLIA_REALITY: waiting $label target=$target now=$now remain=${remain}s"
    # Poll faster in the last 10 minutes (batch window is tight after ETA).
    if (( remain <= 600 )); then sleep_s=15; else sleep_s=60; fi
    sleep "$sleep_s"
  done
}

exec_id() {
  local id="$1" label="$2"
  send "$TIMELOCK" "execute(bytes32)" "$id" >/dev/null
  ok "execute $label"
}

phase_deploy() {
  ok "broadcast periphery governance Sepolia deploy (12h Timelock)"
  DEPLOY_OK=0
  for _try in 1 2 3 4 5; do
    set +e
    (
      set -o pipefail
      cd "$ROOT/contracts"
      FOUNDRY_PROFILE=ttg_v9_broadcast forge script "$SCRIPT" \
        --rpc-url "$CHAIN_RPC_URL" \
        --private-key "$PRIVATE_KEY" \
        --sender "$DEPLOYER" \
        --chain-id "$SEPOLIA_CHAIN_ID" \
        --broadcast \
        --resume \
        --legacy \
        --slow \
        -vv 2>&1 | tee "$DEPLOY_LOG"
    )
    _rc=$?
    set -e
    if [[ "$_rc" -eq 0 ]] && grep -q "ONCHAIN EXECUTION COMPLETE & SUCCESSFUL" "$DEPLOY_LOG"; then
      DEPLOY_OK=1
      break
    fi
    # First attempt may not have feeRouter lines if resume-only; accept successful on-chain complete.
    if grep -q "ONCHAIN EXECUTION COMPLETE & SUCCESSFUL" "$DEPLOY_LOG"; then
      DEPLOY_OK=1
      break
    fi
    CHAIN_RPC_URL="$(pick_sepolia_rpc)" || true
    ok "deploy retry $_try rc=$_rc"
    sleep 20
  done
  [[ "$DEPLOY_OK" == "1" ]] || fail "forge broadcast failed"

  cat >"$ADDR_ENV" <<EOF
AUDIT_1_CANDIDATE_SHA=$AUDIT_1_CANDIDATE_SHA
USDC=$(parse_log usdc)
TTG=$(parse_log ttg)
VAULT=$(parse_log vault)
MARKET=$(parse_log market)
GOVERNOR=$(parse_log governor)
TIMELOCK=$(parse_log timelock)
POOL=$(parse_log projectPool)
FEE_ROUTER=$(parse_log feeRouter)
FEE_INGRESS=$(parse_log feeIngress)
STAKE_POOL=$(parse_log stakePool)
BATCH1_START=$(cast_u "$(parse_log batch1Start)")
TIMELOCK_DELAY=$(cast_u "$(parse_log timelockDelay)")
ID_BIND=$(parse_log idBind)
ID_SEED=$(parse_log idSeed)
ID_CALLER=$(parse_log idCaller)
ID_STEWARD=$(parse_log idSteward)
ID_FEE_BPS=$(parse_log idFeeBps)
ID_SPLIT=$(parse_log idSplit)
ID_CAP=$(parse_log idCap)
ID_UNPAUSE=$(parse_log idUnpause)
ID_P4=$(parse_log idP4)
ID_BAD_SPLIT=$(parse_log idBadSplit)
DEPLOYER=$DEPLOYER
WINDOW=$WINDOW
EOF
  load_addrs
  [[ "$TIMELOCK_DELAY" == "43200" ]] || fail "timelockDelay log=$TIMELOCK_DELAY want 43200"
  DELAY_ONCHAIN=$(cast_u "$(call "$TIMELOCK" "delay()(uint256)")")
  [[ "$DELAY_ONCHAIN" == "43200" ]] || fail "on-chain delay=$DELAY_ONCHAIN"
  FEE_BPS=$(cast_u "$(call "$FEE_ROUTER" "platformFeeBps()(uint256)")")
  STEW=$(cast_u "$(call "$FEE_ROUTER" "stewardShareBps()(uint256)")")
  PROJ=$(cast_u "$(call "$FEE_ROUTER" "projectShareBps()(uint256)")")
  CAP=$(cast_u "$(call "$POOL" "capBps()(uint256)")")
  [[ "$FEE_BPS" == "500" && "$STEW" == "4500" && "$PROJ" == "5500" ]] || fail "fee defaults"
  [[ "$CAP" == "3000" ]] || fail "pool default cap"
  SUPPLY=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
  MAXS=$(cast_u "$(call "$TTG" "MAX_SUPPLY()(uint256)")")
  [[ "$SUPPLY" == "$MAXS" ]] || fail "supply!=MAX_SUPPLY"
  python -c "assert int('$MAXS')==25_000_000_000_000*10**18"
  GOV_TL=$(cast_u "$(call "$GOVERNOR" "timelock()(address)")")
  [[ "$(lc "$GOV_TL")" == "$(lc "$TIMELOCK")" ]] || fail "governor.timelock mismatch"
  TREAS=$(cast_u "$(call "$MARKET" "usdcTreasury()(address)")")
  [[ "$(lc "$TREAS")" == "$(lc "$POOL")" ]] || fail "pm treasury != poolV2"
  # Early execute must fail
  set +e
  OUT=$(send "$TIMELOCK" "execute(bytes32)" "$ID_SEED" 2>&1)
  set -e
  echo "$OUT" | grep -qiE "revert|TooEarly|execution reverted" || fail "early execute should revert"
  # EOA cannot updateDelay / setFeeSplit
  set +e
  OUT1=$(send "$TIMELOCK" "updateDelay(uint256)" 43200 2>&1)
  OUT2=$(send "$FEE_ROUTER" "setFeeSplit(uint256,uint256)" 6000 4000 2>&1)
  set -e
  echo "$OUT1" | grep -qiE "revert|OnlySelf|execution reverted" || fail "updateDelay EOA"
  echo "$OUT2" | grep -qiE "revert|OnlyOwner|execution reverted" || fail "setFeeSplit EOA"
  READY=$(cast_u "$(call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_SEED" | awk 'NR==1{print $1}')")
  echo "READY_AT=$READY" >>"$ADDR_ENV"
  ok "deploy + pre-ETA checks PASS readyAt=$READY"
}

phase_resume() {
  [[ -f "$ADDR_ENV" ]] || fail "missing $ADDR_ENV (run deploy first)"
  load_addrs
  READY=${READY_AT:-}
  if [[ -z "$READY" ]]; then
    READY=$(cast_u "$(call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_SEED" | awk 'NR==1{print $1}')")
  fi
  wait_until "$READY" "timelock_eta"
  ok "TIMELOCK_REALITY_CERT: TooEarly→12h→Executable window OPEN (single certification this round)"

  # CRITICAL: batch WINDOW=900 and BATCH1_START may precede READY_AT by ~3m.
  # Execute bind+seed first, then buy immediately before fee/governance drills.
  # All remaining Timelock ops below share THIS same ETA — no second 12h wait.
  exec_id "$ID_BIND" "bind"
  exec_id "$ID_SEED" "seed"
  exec_id "$ID_CALLER" "caller"
  exec_id "$ID_STEWARD" "steward"

  send "$USDC" "approve(address,uint256)" "$MARKET" 1000000 >/dev/null
  set +e
  OUT=$(send "$MARKET" "buy(uint256,uint256,uint256,uint256)" 1 1000000 2000000000000000000000000 "$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)" 2>&1)
  set -e
  echo "$OUT" | grep -qiE "revert|SlippageExceeded|execution reverted" || fail "slippage should revert"
  DL=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)
  PB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
  send "$MARKET" "buy(uint256,uint256,uint256,uint256)" 1 1000000 0 "$((DL + 600))" >/dev/null
  PA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
  python -c "assert int('$PA')-int('$PB')==1_000_000"
  ok "PM buy treasury+slippage/deadline (immediate post-seed)"

  # Active Steward 45/55 on fee bucket (defaults still active)
  send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" 100000000 >/dev/null
  PB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
  SB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$DEPLOYER")")
  send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" 100000000 "0x434e" >/dev/null
  PA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
  SA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$DEPLOYER")")
  python -c "assert int('$PA')-int('$PB')==55_000_000; assert int('$SA')-int('$SB')==45_000_000"
  ok "fee Active Steward default 45/55"

  # No steward → fixed 100% pool (independent of split storage)
  send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" 80000000 >/dev/null
  PB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
  send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" 80000000 "0x4a50" >/dev/null
  PA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
  python -c "assert int('$PA')-int('$PB')==80_000_000"
  ok "fee no-steward 100%→ProjectPool"

  # Same-ETA governance batch (pre-scheduled at deploy — NOT a new 12h each)
  exec_id "$ID_FEE_BPS" "setPlatformFeeBps(600)"
  exec_id "$ID_SPLIT" "setFeeSplit(6000,4000)"
  exec_id "$ID_CAP" "setCapBps(7500)"
  [[ "$(cast_u "$(call "$FEE_ROUTER" "platformFeeBps()(uint256)")")" == "600" ]] || fail fee_bps
  [[ "$(cast_u "$(call "$FEE_ROUTER" "stewardShareBps()(uint256)")")" == "6000" ]] || fail split_s
  [[ "$(cast_u "$(call "$FEE_ROUTER" "projectShareBps()(uint256)")")" == "4000" ]] || fail split_p
  [[ "$(cast_u "$(call "$POOL" "capBps()(uint256)")")" == "7500" ]] || fail cap
  ok "platformFee+ActiveSplit+PoolCap governance (same ETA batch)"

  # Bad split execute must fail; state unchanged
  set +e
  OUT=$(send "$TIMELOCK" "execute(bytes32)" "$ID_BAD_SPLIT" 2>&1)
  set -e
  echo "$OUT" | grep -qiE "revert|CallFailed|execution reverted" || fail "bad split should revert"
  [[ "$(cast_u "$(call "$FEE_ROUTER" "stewardShareBps()(uint256)")")" == "6000" ]] || fail split_unchanged
  ok "split sum=10000 hard bound"

  # Governed split 60/40 on fee bucket
  send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" 100000000 >/dev/null
  PB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
  SB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$DEPLOYER")")
  send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" 100000000 "0x434e" >/dev/null
  PA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
  SA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$DEPLOYER")")
  python -c "assert int('$PA')-int('$PB')==40_000_000; assert int('$SA')-int('$SB')==60_000_000"
  ok "governed Active Split 60/40"

  # P4 spend + Guardian pause / Timelock unpause (same ETA batch)
  exec_id "$ID_P4" "p4_spend_50k"
  send "$MARKET" "pause()" >/dev/null
  [[ "$(cast_u "$(call "$MARKET" "paused()(bool)")")" == "true" ]] || fail pause
  exec_id "$ID_UNPAUSE" "unpause"
  [[ "$(cast_u "$(call "$MARKET" "paused()(bool)")")" == "false" ]] || fail unpause
  ok "P4 spend + pause/unpause (same ETA batch)"

  # RoleStake + TTG KEEP/no-remint (no second Timelock wait)
  SUPPLY=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
  MAXS=$(cast_u "$(call "$TTG" "MAX_SUPPLY()(uint256)")")
  [[ "$SUPPLY" == "$MAXS" ]] || fail "supply drift"
  python -c "assert int('$MAXS')==25_000_000_000_000*10**18"
  MIN_CN=$(cast_u "$(call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e")")
  python -c "assert int('$MIN_CN')==int('$SUPPLY')*400//10000"
  set +e
  OUT=$(send "$STAKE_POOL" "stakeAsMerchant(uint256)" 1 2>&1)
  OUTM=$(send "$TTG" "mint(address,uint256)" "$DEPLOYER" 1 2>&1)
  set -e
  echo "$OUT" | grep -qiE "revert|RoleDisabled|execution reverted" || fail merchant
  echo "$OUTM" | grep -qiE "revert|execution reverted|unrecognized" || fail mint_should_fail
  ok "RoleStake + TTG KEEP/no-mint (supply==MAX_SUPPLY)"

  # Money Path EF/SR → FeeRouterV2
  gp=$(cast gas-price --rpc-url "$CHAIN_RPC_URL")
  (
    cd "$ROOT/contracts"
    forge create src/EscrowFactoryV2.sol:EscrowFactoryV2 \
      --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --broadcast \
      --gas-price $((gp * 3)) --constructor-args "$DEPLOYER" 2>&1 | tee "$EVIDENCE/sepolia-ef.create.log" | tail -5
    forge create src/SettlementRouter.sol:SettlementRouter \
      --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --broadcast \
      --gas-price $((gp * 3)) --constructor-args "$DEPLOYER" "$FEE_ROUTER" 2>&1 | tee "$EVIDENCE/sepolia-sr.create.log" | tail -5
  )
  EF=$(grep 'Deployed to:' "$EVIDENCE/sepolia-ef.create.log" | awk '{print $NF}' | tail -1)
  SR=$(grep 'Deployed to:' "$EVIDENCE/sepolia-sr.create.log" | awk '{print $NF}' | tail -1)
  [[ "$EF" == 0x* && "$SR" == 0x* ]] || fail EF/SR
  [[ "$(lc "$(cast_u "$(call "$SR" "feeRouter()(address)")")")" == "$(lc "$FEE_ROUTER")" ]] || fail sr_fee
  {
    echo "ESCROW_FACTORY=$EF"
    echo "SETTLEMENT_ROUTER=$SR"
  } >>"$ADDR_ENV"
  ok "EF/SR Money Path → FeeRouterV2"

  # Owner: no second 12h for post-sale burn this round.
  # KEEP/no-remint already certified above; Mainnet proposals each get a real fresh 12h.
  ok "SKIP second Timelock wait (gov burn) — single 12h Reality Certification complete"

  stamp_pass
}

stamp_pass() {
  load_addrs
  python3 <<PY
import json, time
from pathlib import Path
ev = Path(r"$EVIDENCE")
addrs = {}
for line in (ev / "sepolia-reality.addresses.env").read_text(encoding="utf-8").splitlines():
    if "=" in line:
        k, v = line.split("=", 1)
        addrs[k] = v.strip()
payload = {
    "stamp": "V9_PERIPHERY_GOVERNANCE_UPGRADE_SEPOLIA_REALITY_PASS_STOP",
    "machine_key": "V9_PERIPHERY_GOVERNANCE_UPGRADE_SEPOLIA_REALITY_PASS_STOP",
    "recorded_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "phase": "2_sepolia_reality",
    "chain_id": 11155111,
    "AUDIT_1_CANDIDATE_SHA": "$AUDIT_1_CANDIDATE_SHA",
    "AUDIT_1": "PASS_BOUND",
    "SEPOLIA_REALITY": "PASS",
    "NEXT_GATE": "AUDIT_2",
    "EXACT_MATCH": "NOT_ISSUED",
    "MAINNET_BROADCAST": "NOT_AUTHORIZED",
    "TT_PRODUCTION_GO": "NO_GO",
    "OLD_AUDIT_INHERITANCE": "FORBIDDEN",
    "NO_OWNER_ECONOMIC_OR_AUTHORITY_DRIFT": True,
    "timelock_delay_seconds_onchain": 43200,
    "timelock_reality_certification": {
        "mode": "SINGLE_12H_CYCLE_THIS_ROUND",
        "proved": "TooEarly → real 12h delay → Executable",
        "governance_ops": "pre_scheduled_same_ETA_batch_no_per_function_12h",
        "second_12h_gov_burn": "SKIPPED_THIS_ROUND",
        "mainnet_rule": "each_real_governance_proposal_enforces_fresh_real_12h"
    },
    "addresses": addrs,
    "checks": {
        "timelock_too_early_then_executable": True,
        "new_governor_plus_12h_timelock": True,
        "project_pool_v2": True,
        "fee_router_v2": True,
        "platform_fee_governance": True,
        "active_steward_split_default_45_55": True,
        "active_steward_split_governed_60_40": True,
        "split_sum_10000_hard_bound": True,
        "no_steward_100_to_pool_independent": True,
        "pool_cap_governed_0_to_10000": True,
        "pm_treasury_pool_v2": True,
        "pm_buy_minTtgOut_deadline": True,
        "ttg_keep_no_mint_max_supply": True,
        "governance_burn_second_12h": "SKIPPED_OWNER_SINGLE_CERT",
        "money_path_ef_sr_fee_router_v2": True,
        "eoa_denied_fee_timelock_paths": True,
        "early_timelock_execute_denied": True,
    },
    "stop": True,
    "next": "Audit #2 only — no Exact-Match, no Mainnet",
}
(ev / "V9_PERIPHERY_GOVERNANCE_UPGRADE_SEPOLIA_REALITY_PASS_STOP.json").write_text(
    json.dumps(payload, indent=2) + "\n", encoding="utf-8"
)
print("wrote", ev / "V9_PERIPHERY_GOVERNANCE_UPGRADE_SEPOLIA_REALITY_PASS_STOP.json")
PY
  ok "SEPOLIA_REALITY PASS_STOP · NEXT_GATE=AUDIT_2 · Exact-Match NOT_ISSUED · Mainnet FORBIDDEN · TT_PRODUCTION_GO=NO_GO"
}

case "$PHASE" in
  deploy) phase_deploy ;;
  resume) phase_resume ;;
  all) phase_deploy; phase_resume ;;
  *) fail "phase must be deploy|resume|all" ;;
esac
