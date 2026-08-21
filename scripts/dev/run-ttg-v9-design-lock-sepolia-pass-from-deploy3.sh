#!/usr/bin/env bash
# Tight Design Lock Sepolia PASS from deploy3.forge.log — sale first, then remaining checks.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
set -a
# shellcheck disable=SC1091
source "$ROOT/scripts/dev/.env.phase2-chain-deploy.local"
# shellcheck disable=SC1091
source "$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local"
set +a

EV="$ROOT/evidence/GO_ttg_v9_design_lock_sepolia"
LOG="$EV/deploy3.forge.log"
[[ -f "$LOG" ]] || { echo "missing $LOG"; exit 2; }

parse() { grep -E "^[[:space:]]*$1[[:space:]]" "$LOG" | awk '{print $NF}' | tail -1; }
USDC=$(parse usdc)
TTG=$(parse ttg)
VAULT=$(parse vault)
MARKET=$(parse market)
GOVERNOR=$(parse governor)
TIMELOCK=$(parse timelock)
POOL=$(parse projectPool)
FEE_ROUTER=$(parse feeRouter)
FEE_INGRESS=$(parse feeIngress)
STAKE_POOL=$(parse stakePool)
BATCH1_START=$(parse batch1Start | awk '{print $1}')
TIMELOCK_DELAY=$(parse timelockDelay | awk '{print $1}')
ID_BIND=$(parse idBind)
ID_SEED=$(parse idSeed)
ID_CALLER=$(parse idCaller)
DEPLOYER=$(cast wallet address --private-key "$PRIVATE_KEY")
LEGACY_SAFE=0x96491aa894658ff7946506318c49F3c76b8f40e7
LEGACY_P4CAP=0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF

cat >"$EV/addresses.env" <<EOF
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

ok() { echo "OK $*"; }
fail() { echo "STOP $*" >&2; exit 2; }
cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }
CAST_TIMEOUT=300
WINDOW=900

RPC_CANDIDATES=(
  "https://sepolia.gateway.tenderly.co"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "${CHAIN_RPC_URL:-}"
)
pick() {
  local r c
  for r in "${RPC_CANDIDATES[@]}"; do
    [[ -n "$r" ]] || continue
    c=$(cast chain-id --rpc-url "$r" 2>/dev/null || true)
    [[ "$c" == "11155111" ]] && { echo "$r"; return 0; }
  done
  return 1
}
CHAIN_RPC_URL=$(pick) || fail rpc
export CHAIN_RPC_URL

send() {
  local n=0 gp
  while ((n < 10)); do
    gp=$(cast gas-price --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 2000000000)
    if cast send "$@" --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --timeout "$CAST_TIMEOUT" --gas-price $((gp * 3)); then
      return 0
    fi
    n=$((n + 1))
    CHAIN_RPC_URL=$(pick) || true
    sleep 6
  done
  return 1
}
call() {
  local n=0 out
  while ((n < 10)); do
    if out=$(cast call "$@" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null); then
      echo "$out"
      return 0
    fi
    n=$((n + 1))
    CHAIN_RPC_URL=$(pick) || true
    sleep 4
  done
  return 1
}
op_done() {
  local raw
  raw=$(call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$1") || return 1
  echo "$raw" | awk 'NR==2{print $1}' | grep -qi true
}
schedule_exec() {
  local target="$1" data="$2" salt="$3" label="$4" id
  id=$(cast_u "$(call "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$target" 0 "$data" "$salt")")
  if ! op_done "$id"; then
    if ! call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$id" | awk 'NR==1{exit ($1+0)>0?0:1}'; then
      send "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$target" 0 "$data" "$salt" >/dev/null
    fi
    sleep $((TIMELOCK_DELAY + 5))
    send "$TIMELOCK" "execute(bytes32)" "$id" >/dev/null
  fi
  ok "$label"
}

NOW=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)
READY=$(call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_SEED" | awk 'NR==1{print $1}')
if [[ -n "$READY" && "$NOW" -lt "$READY" ]]; then
  sleep $((READY - NOW + 3))
fi
for ID in "$ID_BIND" "$ID_SEED" "$ID_CALLER"; do
  op_done "$ID" || send "$TIMELOCK" "execute(bytes32)" "$ID" >/dev/null
done
ok "bootstrap"

TREAS=$(cast_u "$(call "$MARKET" "usdcTreasury()(address)")")
[[ "${TREAS,,}" == "${POOL,,}" ]] || fail "treasury!=pool"
[[ "${TREAS,,}" != "${LEGACY_P4CAP,,}" ]] || fail "legacy p4cap"
ADMIN=$(cast_u "$(call "$TIMELOCK" "admin()(address)")")
[[ "${ADMIN,,}" != "${LEGACY_SAFE,,}" ]] || fail "legacy safe admin"
ok "ZERO ACTIVE Safe/P4Cap"

# SALE FIRST
NOW=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)
WAIT=$((BATCH1_START - NOW + 2))
echo "sale wait=$WAIT batch1=$BATCH1_START now=$NOW"
if ((WAIT > 0)); then sleep "$WAIT"; fi
NOW=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)
CUR=$(cast_u "$(call "$MARKET" "currentBatchId(uint256)(uint256)" "$NOW")")
[[ "$CUR" != "0" ]] || fail "no open batch cur=$CUR"
send "$USDC" "approve(address,uint256)" "$MARKET" 1000000 >/dev/null
PB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
send "$MARKET" "buy(uint256,uint256)" "$CUR" 1000000 >/dev/null
PA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
python -c "assert int('$PA')-int('$PB')==1000000"
ok "sale→NEW pool batch=$CUR"

# EF/SR
gp=$(cast gas-price --rpc-url "$CHAIN_RPC_URL")
(
  cd "$ROOT/contracts"
  forge create src/EscrowFactoryV2.sol:EscrowFactoryV2 \
    --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --broadcast \
    --gas-price $((gp * 3)) --constructor-args "$DEPLOYER" 2>&1 | tee "$EV/ef3.create.log" | tail -4
  forge create src/SettlementRouter.sol:SettlementRouter \
    --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --broadcast \
    --gas-price $((gp * 3)) --constructor-args "$DEPLOYER" "$FEE_ROUTER" 2>&1 | tee "$EV/sr3.create.log" | tail -4
)
EF=$(grep 'Deployed to:' "$EV/ef3.create.log" | awk '{print $NF}' | tail -1)
SR=$(grep 'Deployed to:' "$EV/sr3.create.log" | awk '{print $NF}' | tail -1)
[[ "$EF" == 0x* && "$SR" == 0x* ]] || fail "EF/SR"
[[ "$(cast_u "$(call "$SR" "feeRouter()(address)")")" == "$FEE_ROUTER" ]] || fail "SR feeRouter"
{
  echo "ESCROW_FACTORY=$EF"
  echo "SETTLEMENT_ROUTER=$SR"
} >>"$EV/addresses.env"
ok "EF/SR cutover"

schedule_exec "$FEE_ROUTER" "$(cast calldata "setStewardPayout(bytes2,address)" "0x434e" "$DEPLOYER")" "$(cast keccak "dl3-pay-cn")" "steward CN"
send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" 100000000 >/dev/null
PB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" 100000000 "0x434e" >/dev/null
PA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
python -c "assert int('$PA')-int('$PB')==55000000"
ok "fee 45/55"

send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" 80000000 >/dev/null
PB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" 80000000 "0x4a50" >/dev/null
PA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
python -c "assert int('$PA')-int('$PB')==80000000"
ok "fee 100% pool"

PBAL=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
SPEND=$(python -c "print(int(int('$PBAL')*0.1))")
schedule_exec "$POOL" "$(cast calldata "spendP4Reserve(address,address,uint256)" "$USDC" "$DEPLOYER" "$SPEND")" "$(cast keccak "dl3-p4")" "P4 under 30%"

send "$MARKET" "pause()" >/dev/null
[[ "$(cast_u "$(call "$MARKET" "paused()(bool)")")" == "true" ]] || fail pause
schedule_exec "$MARKET" "$(cast calldata "unpause()")" "$(cast keccak "dl3-unp")" "unpause"

SUPPLY=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
MIN_CN=$(cast_u "$(call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e")")
python -c "assert int('$MIN_CN')==int('$SUPPLY')*400//10000"
set +e
OUT=$(send "$STAKE_POOL" "stakeAsMerchant(uint256)" 1 2>&1)
set -e
echo "$OUT" | grep -qiE "revert|RoleDisabled|execution reverted" || fail merchant
[[ "$(cast_u "$(call "$FEE_ROUTER" "platformFeeBps()(uint256)")")" == "500" ]] || fail bps
set +e
OUT1=$(send "$FEE_ROUTER" "setFeeRouterCaller(address,bool)" "$DEPLOYER" true 2>&1)
OUT2=$(send "$POOL" "spendP4Reserve(address,address,uint256)" "$USDC" "$DEPLOYER" 1 2>&1)
set -e
echo "$OUT1" | grep -qiE "revert|OnlyOwner|execution reverted" || fail eoa1
echo "$OUT2" | grep -qiE "revert|OnlySpender|execution reverted" || fail eoa2
ok "stake+authz+500bps"

END5=$((BATCH1_START + 5 * WINDOW + 5))
ok "wait burn until $END5"
while true; do
  NOW=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp || true)
  [[ -n "$NOW" ]] || { sleep 10; continue; }
  ((NOW >= END5)) && break
  sleep 30
done
for BID in 1 2 3 4 5; do
  send "$MARKET" "closeBatchReturn(uint256)" "$BID" >/dev/null || true
done
[[ "$(cast_u "$(call "$MARKET" "hasOpenOrArmedUnclosedBatch()(bool)")")" == "false" ]] || fail open
SB=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
schedule_exec "$VAULT" "$(cast calldata "executeGovernanceBurn(uint256)" 1000000000000000000)" "$(cast keccak "dl3-burn")" "gov burn"
SA=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
python -c "assert int('$SB')-int('$SA')==10**18"
MA=$(cast_u "$(call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e")")
python -c "assert int('$MA')<int('$MIN_CN')"
ok "burn+stake track"

python3 <<'PY'
import json, time
from pathlib import Path
ev = Path("evidence/GO_ttg_v9_design_lock_sepolia")
addrs = {}
for line in (ev / "addresses.env").read_text(encoding="utf-8").splitlines():
    if "=" in line:
        k, v = line.split("=", 1)
        addrs[k] = v.strip()
payload = {
    "stamp": "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP",
    "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "phase": "2_sepolia",
    "chain_id": 11155111,
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
    "next": "freeze V9_AUDIT_CANDIDATE_DESIGN_LOCK then STOP",
}
(ev / "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print("wrote", ev / "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json")
PY

python3 "$ROOT/scripts/dev/freeze-ttg-v9-audit-candidate-design-lock.py"
ok "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP + V9_AUDIT_CANDIDATE_DESIGN_LOCK FROZEN"
ok "STOP · Mainnet FORBIDDEN · R2_FINAL not inherited · TT_PRODUCTION_GO unchanged"
