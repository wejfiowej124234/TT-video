#!/usr/bin/env bash
# TTG_V9_DESIGN_LOCK_SEPOLIA — ② Design Lock full topology on Sepolia
#
# Baseline: TT-TTG-V9-OWNER-DESIGN-LOCK + V9_DESIGN_LOCK_LOCAL_PASS
# Auth: TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK=1 (+ Owner chat auth this session)
# STOP: V9_DESIGN_LOCK_SEPOLIA_PASS_STOP → freeze V9_AUDIT_CANDIDATE_DESIGN_LOCK
# FORBID: Mainnet broadcast · inherit R2_FINAL PASS · auto TT_PRODUCTION_GO
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REHEARSAL_ENV="${TTG_V9_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_design_lock_sepolia"
AUDIT_EV="$ROOT/evidence/GO_ttg_v9_audit"
DEPLOY_LOG="$EVIDENCE/deploy.forge.log"
SEPOLIA_CHAIN_ID=11155111
SCRIPT="src/ttg-v9/TtgV9DesignLockSepoliaRehearsal.s.sol:TtgV9DesignLockSepoliaRehearsal"
TIMELOCK_DELAY="${TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS:-90}"
LEGACY_SAFE="0x96491aa894658ff7946506318c49F3c76b8f40e7"
LEGACY_P4CAP="0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF"

fail() { echo "TTG_V9_DESIGN_LOCK_SEPOLIA: STOP $*" >&2; exit 2; }
ok() { echo "TTG_V9_DESIGN_LOCK_SEPOLIA: OK $*"; }

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

mkdir -p "$EVIDENCE" "$AUDIT_EV"

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE (need CHAIN_RPC_URL / PRIVATE_KEY)"
load_env_file "$ENV_FILE"
load_env_file "$REHEARSAL_ENV"

if ! is_truthy "${TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK:-}"; then
  fail "set TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK=1"
fi
if is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}"; then
  fail "refusing: TRAVELTRUST_MAINNET_BROADCAST_OK is set"
fi

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY unset"
export TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS="$TIMELOCK_DELAY"

ok "① Design Lock local gate"
bash "$ROOT/scripts/dev/run-ttg-v9-design-lock-local-gate.sh"

RPC_CANDIDATES=(
  "https://sepolia.gateway.tenderly.co"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "${CHAIN_RPC_URL}"
)
pick_sepolia_rpc() {
  local _rpc _cid
  for _rpc in "${RPC_CANDIDATES[@]}"; do
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
MIN_WEI="80000000000000000"
if [[ "$(python -c "print(int('${BAL_WEI}') < int('${MIN_WEI}'))")" == "True" ]]; then
  fail "deployer Sepolia ETH below 0.08 (have ${BAL_WEI} wei)"
fi
ok "deployer=$DEPLOYER funded"

ok "broadcast Design Lock Sepolia deploy"
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
      && grep -qE '^[[:space:]]*feeRouter[[:space:]]+0x' "$DEPLOY_LOG"; then
      DEPLOY_OK=1
      break
    fi
  fi
  CHAIN_RPC_URL="$(pick_sepolia_rpc)" || true
  [[ -n "${CHAIN_RPC_URL:-}" ]] || fail "lost Sepolia RPC"
  ok "deploy retry $_try"
  sleep 20
done
[[ "$DEPLOY_OK" == "1" ]] || fail "forge broadcast failed"

parse_log() { grep -E "^[[:space:]]*$1[[:space:]]" "$DEPLOY_LOG" | awk '{print $NF}' | tail -1; }
USDC="$(parse_log usdc)"
TTG="$(parse_log ttg)"
VAULT="$(parse_log vault)"
MARKET="$(parse_log market)"
GOVERNOR="$(parse_log governor)"
TIMELOCK="$(parse_log timelock)"
POOL="$(parse_log projectPool)"
FEE_ROUTER="$(parse_log feeRouter)"
FEE_INGRESS="$(parse_log feeIngress)"
STAKE_POOL="$(parse_log stakePool)"
BATCH1_START="$(cast_u "$(parse_log batch1Start)")"
ID_BIND="$(parse_log idBind)"
ID_SEED="$(parse_log idSeed)"
ID_CALLER="$(parse_log idCaller)"
DELAY_LOG="$(cast_u "$(parse_log timelockDelay)")"
[[ -n "$DELAY_LOG" ]] && TIMELOCK_DELAY="$DELAY_LOG"

cat > "$EVIDENCE/addresses.env" <<EOF
USDC=$USDC
TTG=$TTG
VAULT=$VAULT
MARKET=$MARKET
GOVERNOR=$GOVERNOR
TIMELOCK=$TIMELOCK
POOL=$POOL
FEE_ROUTER=$FEE_ROUTER
FEE_INGRESS=$FEE_INGRESS
STAKE_POOL=$STAKE_POOL
BATCH1_START=$BATCH1_START
TIMELOCK_DELAY=$TIMELOCK_DELAY
ID_BIND=$ID_BIND
ID_SEED=$ID_SEED
ID_CALLER=$ID_CALLER
DEPLOYER=$DEPLOYER
LEGACY_SAFE=$LEGACY_SAFE
LEGACY_P4CAP=$LEGACY_P4CAP
EOF
ok "deployed pool=$POOL feeRouter=$FEE_ROUTER ttg=$TTG"

# Wait Timelock delay then execute bind/seed/caller
ok "waiting Timelock delay ${TIMELOCK_DELAY}s"
sleep "$((TIMELOCK_DELAY + 5))"
for ID in "$ID_BIND" "$ID_SEED" "$ID_CALLER"; do
  cast send "$TIMELOCK" "execute(bytes32)" "$ID" \
    --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
done
ok "timelock executed bind+seed+feeCaller"

# ZERO ACTIVE legacy refs
ADMIN="$(cast call "$TIMELOCK" "admin()(address)" --rpc-url "$CHAIN_RPC_URL")"
[[ "${ADMIN,,}" != "${LEGACY_SAFE,,}" ]] || fail "Timelock admin is LEGACY Safe"
USDC_TREAS="$(cast call "$MARKET" "usdcTreasury()(address)" --rpc-url "$CHAIN_RPC_URL")"
[[ "${USDC_TREAS,,}" == "${POOL,,}" ]] || fail "market usdcTreasury != NEW pool"
[[ "${USDC_TREAS,,}" != "${LEGACY_P4CAP,,}" ]] || fail "market still points LEGACY P4Cap"
ok "ZERO ACTIVE Safe/legacy P4Cap on Official path"

# Deploy KEEP-shaped EscrowFactory + SettlementRouter (0.8.19) retargeted to NEW FeeRouter
ok "deploy EscrowFactoryV2 + SettlementRouter → feeRouter cutover"
(
  cd "$ROOT/contracts"
  EF_OUT="$(forge create src/EscrowFactoryV2.sol:EscrowFactoryV2 \
    --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy \
    --constructor-args "$DEPLOYER" 2>&1 | tee "$EVIDENCE/ef.create.log")"
  SR_OUT="$(forge create src/SettlementRouter.sol:SettlementRouter \
    --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy \
    --constructor-args "$DEPLOYER" "$FEE_ROUTER" 2>&1 | tee "$EVIDENCE/sr.create.log")"
  echo "$EF_OUT" | tee -a "$EVIDENCE/ef.create.log" >/dev/null
  echo "$SR_OUT" | tee -a "$EVIDENCE/sr.create.log" >/dev/null
)
EF="$(grep -E 'Deployed to:' "$EVIDENCE/ef.create.log" | awk '{print $NF}' | tail -1)"
SR="$(grep -E 'Deployed to:' "$EVIDENCE/sr.create.log" | awk '{print $NF}' | tail -1)"
[[ "$EF" == 0x* && "$SR" == 0x* ]] || fail "EF/SR deploy parse failed"
SR_FR="$(cast call "$SR" "feeRouter()(address)" --rpc-url "$CHAIN_RPC_URL")"
[[ "${SR_FR,,}" == "${FEE_ROUTER,,}" ]] || fail "SettlementRouter.feeRouter mismatch"
echo "ESCROW_FACTORY=$EF" >> "$EVIDENCE/addresses.env"
echo "SETTLEMENT_ROUTER=$SR" >> "$EVIDENCE/addresses.env"
ok "EF=$EF SR=$SR feeRouter wired"

# Fee 45/55 with Active Steward
STEWARD="$(cast wallet address --private-key "$PRIVATE_KEY")" # same deployer as payout for drill
# setStewardPayout via Timelock
DATA_PAY="$(cast calldata "setStewardPayout(bytes2,address)" "0x434e" "$DEPLOYER")" # CN
SALT_PAY="$(cast keccak "dl-pay-cn-1")"
ID_PAY="$(cast call "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" \
  "$FEE_ROUTER" 0 "$DATA_PAY" "$SALT_PAY" --rpc-url "$CHAIN_RPC_URL")"
cast send "$TIMELOCK" "setAllowedExecutionTarget(address,bool)" "$FEE_ROUTER" true \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null || true
cast send "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" \
  "$FEE_ROUTER" 0 "$DATA_PAY" "$SALT_PAY" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
sleep "$((TIMELOCK_DELAY + 3))"
cast send "$TIMELOCK" "execute(bytes32)" "$ID_PAY" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
ok "steward payout CN set"

FEE_AMT=100000000 # 100 USDC (6 dec)
cast send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" "$FEE_AMT" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
POOL_BEFORE="$(cast call "$USDC" "balanceOf(address)(uint256)" "$POOL" --rpc-url "$CHAIN_RPC_URL")"
STEW_BEFORE="$(cast call "$USDC" "balanceOf(address)(uint256)" "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL")"
cast send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" "$FEE_AMT" "0x434e" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
POOL_AFTER="$(cast call "$USDC" "balanceOf(address)(uint256)" "$POOL" --rpc-url "$CHAIN_RPC_URL")"
# 55% of 100e6 = 55e6
python - <<PY
pb=int("$POOL_BEFORE"); pa=int("$POOL_AFTER"); delta=pa-pb
assert delta==55_000_000, delta
print("fee_45_55_ok", delta)
PY
ok "fee Active Steward 45/55"

# No steward JP → 100% pool
FEE2=80000000
cast send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" "$FEE2" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
POOL_B2="$(cast call "$USDC" "balanceOf(address)(uint256)" "$POOL" --rpc-url "$CHAIN_RPC_URL")"
cast send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" "$FEE2" "0x4a50" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
POOL_A2="$(cast call "$USDC" "balanceOf(address)(uint256)" "$POOL" --rpc-url "$CHAIN_RPC_URL")"
python - <<PY
assert int("$POOL_A2")-int("$POOL_B2")==80_000_000
print("fee_100_pool_ok")
PY
ok "fee no Steward 100% pool"

# Sale USDC → NEW pool
NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)"
WAIT=$(( BATCH1_START - NOW + 2 ))
if (( WAIT > 0 && WAIT < 600 )); then sleep "$WAIT"; fi
cast send "$USDC" "approve(address,uint256)" "$MARKET" 1000000 \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
POOL_B3="$(cast call "$USDC" "balanceOf(address)(uint256)" "$POOL" --rpc-url "$CHAIN_RPC_URL")"
cast send "$MARKET" "buy(uint256,uint256)" 1 1000000 \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
POOL_A3="$(cast call "$USDC" "balanceOf(address)(uint256)" "$POOL" --rpc-url "$CHAIN_RPC_URL")"
python - <<PY
assert int("$POOL_A3")-int("$POOL_B3")==1_000_000
print("sale_to_new_pool_ok")
PY
ok "sale USDC → NEW ProjectPool"

# P4 spend ≤30% to deployer (ops stand-in)
# Fund pool already has USDC; cap = balance*30%
POOL_BAL="$(cast call "$USDC" "balanceOf(address)(uint256)" "$POOL" --rpc-url "$CHAIN_RPC_URL")"
SPEND="$(python -c "print(int(int('$POOL_BAL')*0.1))")" # 10% < 30%
DATA_SPEND="$(cast calldata "spendP4Reserve(address,address,uint256)" "$USDC" "$DEPLOYER" "$SPEND")"
SALT_SP="$(cast keccak "dl-p4-spend-1")"
ID_SP="$(cast call "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" \
  "$POOL" 0 "$DATA_SPEND" "$SALT_SP" --rpc-url "$CHAIN_RPC_URL")"
cast send "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" \
  "$POOL" 0 "$DATA_SPEND" "$SALT_SP" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
sleep "$((TIMELOCK_DELAY + 3))"
cast send "$TIMELOCK" "execute(bytes32)" "$ID_SP" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
ok "P4 spend under 30% via Timelock"

# Guardian pause
cast send "$MARKET" "pause()" --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
PAUSED="$(cast call "$MARKET" "paused()(bool)" --rpc-url "$CHAIN_RPC_URL")"
[[ "$PAUSED" == "true" ]] || fail "pause failed"
DATA_UN="$(cast calldata "unpause()")"
SALT_UN="$(cast keccak "dl-unpause-1")"
ID_UN="$(cast call "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" \
  "$MARKET" 0 "$DATA_UN" "$SALT_UN" --rpc-url "$CHAIN_RPC_URL")"
cast send "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" \
  "$MARKET" 0 "$DATA_UN" "$SALT_UN" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
sleep "$((TIMELOCK_DELAY + 3))"
cast send "$TIMELOCK" "execute(bytes32)" "$ID_UN" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
ok "Guardian pause + Timelock unpause"

# Dynamic stake min = supply * 400 / 10000
SUPPLY="$(cast call "$TTG" "totalSupply()(uint256)" --rpc-url "$CHAIN_RPC_URL")"
MIN_CN="$(cast call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e" --rpc-url "$CHAIN_RPC_URL")"
python - <<PY
s=int("$SUPPLY"); m=int("$MIN_CN"); assert m==s*400//10000, (m,s*400//10000)
print("stake_live_supply_ok", m)
PY
# Merchant disabled
set +e
OUT="$(cast send "$STAKE_POOL" "stakeAsMerchant(uint256)" 1 \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy 2>&1)"
set -e
echo "$OUT" | grep -qiE "revert|RoleDisabled|execution reverted" || fail "merchant stake should revert"
ok "RoleStake live supply + Merchant DISABLED"

# platformFeeBps == 500
PFB="$(cast call "$FEE_ROUTER" "platformFeeBps()(uint256)" --rpc-url "$CHAIN_RPC_URL")"
[[ "$(cast_u "$PFB")" == "500" ]] || fail "platformFeeBps != 500"
ok "platformFeeBps=500"

# Unauthorized EOA cannot setFeeRouterCaller / spend pool
set +e
OUT1="$(cast send "$FEE_ROUTER" "setFeeRouterCaller(address,bool)" "$DEPLOYER" true \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy 2>&1)"
OUT2="$(cast send "$POOL" "spendP4Reserve(address,address,uint256)" "$USDC" "$DEPLOYER" 1 \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy 2>&1)"
set -e
echo "$OUT1" | grep -qiE "revert|OnlyOwner|execution reverted" || fail "EOA setFeeRouterCaller should revert"
echo "$OUT2" | grep -qiE "revert|OnlySpender|execution reverted" || fail "EOA spendP4Reserve should revert"
ok "UUPS/authz deny: EOA cannot mutate FeeRouter/Pool"

# Close sale windows then Timelock governance burn (1e18 TTG)
ok "wait batch windows close for governance burn"
END5=$(( BATCH1_START + 5 * 90 + 5 ))
while true; do
  NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)"
  (( NOW >= END5 )) && break
  sleep 15
done
for BID in 1 2 3 4 5; do
  cast send "$MARKET" "closeBatchReturn(uint256)" "$BID" \
    --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null || true
done
OPEN="$(cast call "$MARKET" "hasOpenOrArmedUnclosedBatch()(bool)" --rpc-url "$CHAIN_RPC_URL")"
[[ "$OPEN" == "false" ]] || fail "batches still open after close"
SUPPLY_BEFORE="$(cast call "$TTG" "totalSupply()(uint256)" --rpc-url "$CHAIN_RPC_URL")"
BURN_AMT=1000000000000000000 # 1 TTG wei
DATA_BURN="$(cast calldata "executeGovernanceBurn(uint256)" "$BURN_AMT")"
SALT_B="$(cast keccak "dl-gov-burn-1")"
ID_B="$(cast call "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" \
  "$VAULT" 0 "$DATA_BURN" "$SALT_B" --rpc-url "$CHAIN_RPC_URL")"
cast send "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" \
  "$VAULT" 0 "$DATA_BURN" "$SALT_B" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
sleep "$((TIMELOCK_DELAY + 3))"
cast send "$TIMELOCK" "execute(bytes32)" "$ID_B" \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
SUPPLY_AFTER="$(cast call "$TTG" "totalSupply()(uint256)" --rpc-url "$CHAIN_RPC_URL")"
python - <<PY
assert int("$SUPPLY_BEFORE")-int("$SUPPLY_AFTER")==10**18
print("governance_burn_ok")
PY
MIN_AFTER="$(cast call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e" --rpc-url "$CHAIN_RPC_URL")"
python - <<PY
assert int("$MIN_AFTER") < int("$MIN_CN")
print("stake_tracks_burn_ok", int("$MIN_AFTER"))
PY
ok "Governance burn + RoleStake tracks supply"

# Stamp PASS STOP
python - <<PY
import json, time, hashlib
from pathlib import Path
ev = Path(r"""$EVIDENCE""")
audit = Path(r"""$AUDIT_EV""")
addrs = {}
for line in (ev / "addresses.env").read_text(encoding="utf-8").splitlines():
    if "=" in line:
        k,v=line.split("=",1); addrs[k]=v.strip()
payload = {
  "stamp": "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP",
  "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
  "phase": "2_sepolia",
  "chain_id": $SEPOLIA_CHAIN_ID,
  "baseline": "TT-TTG-V9-OWNER-DESIGN-LOCK + V9_DESIGN_LOCK_LOCAL_PASS",
  "inherits_r2_final_audit_pass": False,
  "tt_production_go": "UNCHANGED",
  "mainnet_broadcast": "FORBIDDEN",
  "addresses": addrs,
  "checks": {
    "fee_45_55": True,
    "fee_100_no_steward": True,
    "sale_usdc_new_pool": True,
    "p4_spend_under_30pct": True,
    "guardian_pause": True,
    "role_stake_live_supply": True,
    "merchant_disabled": True,
    "platform_fee_bps_500": True,
    "governance_burn": True,
    "stake_tracks_burn": True,
    "authz_eoa_denied": True,
    "ef_sr_fee_router_cutover": True,
    "zero_active_legacy_safe_p4cap": True,
  },
  "next": "freeze V9_AUDIT_CANDIDATE_DESIGN_LOCK then STOP before 3x AI audits / Mainnet",
}
(ev / "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json").write_text(json.dumps(payload, indent=2)+"\n", encoding="utf-8")
print("wrote", ev / "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json")
PY

ok "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP · Mainnet FORBIDDEN · R2_FINAL PASS not inherited"
