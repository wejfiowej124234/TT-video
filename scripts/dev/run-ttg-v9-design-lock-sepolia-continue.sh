#!/usr/bin/env bash
# Resume Design Lock Sepolia drills from evidence/GO_ttg_v9_design_lock_sepolia/addresses.env
# After PASS: python scripts/dev/freeze-ttg-v9-audit-candidate-design-lock.py
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REHEARSAL_ENV="${TTG_V9_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_design_lock_sepolia"
SEPOLIA_CHAIN_ID=11155111
export CAST_TIMEOUT="${CAST_TIMEOUT:-300}"

fail() { echo "TTG_V9_DL_SEPOLIA_CONT: STOP $*" >&2; exit 2; }
ok() { echo "TTG_V9_DL_SEPOLIA_CONT: OK $*"; }
cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }

load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"; line="${line#"${line%%[![:space:]]*}"}"; line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"; val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    [[ -z "$val" ]] && continue
    export "$key=$val"
  done < "$f"
}

load_env_file "$ENV_FILE"
load_env_file "$REHEARSAL_ENV"
[[ -f "$EVIDENCE/addresses.env" ]] || fail "missing addresses.env"
# shellcheck disable=SC1090
source "$EVIDENCE/addresses.env"

RPC_CANDIDATES=(
  "https://sepolia.gateway.tenderly.co"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "${CHAIN_RPC_URL:-}"
)
pick_rpc() {
  local _rpc _cid
  for _rpc in "${RPC_CANDIDATES[@]}"; do
    [[ -n "$_rpc" ]] || continue
    _cid="$(cast chain-id --rpc-url "$_rpc" 2>/dev/null || true)"
    [[ "$_cid" == "$SEPOLIA_CHAIN_ID" ]] || continue
    echo "$_rpc"; return 0
  done
  return 1
}
CHAIN_RPC_URL="$(pick_rpc)" || fail "no Sepolia RPC"
export CHAIN_RPC_URL
ok "rpc=$CHAIN_RPC_URL"

send() {
  local n=0
  while (( n < 8 )); do
    if cast send "$@" --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --timeout "$CAST_TIMEOUT"; then
      return 0
    fi
    n=$((n + 1))
    CHAIN_RPC_URL="$(pick_rpc)" || true
    ok "send retry $n"
    sleep 8
  done
  return 1
}

call() {
  local n=0 out=""
  while (( n < 8 )); do
    if out="$(cast call "$@" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null)"; then
      echo "$out"; return 0
    fi
    n=$((n + 1))
    CHAIN_RPC_URL="$(pick_rpc)" || true
    sleep 5
  done
  return 1
}

op_done() {
  local id="$1"
  local raw
  raw="$(call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$id")" || return 1
  echo "$raw" | awk 'NR==2{print $1}' | grep -qi true
}

exec_if_needed() {
  local id="$1" label="$2"
  if op_done "$id"; then
    ok "already executed $label"
    return 0
  fi
  send "$TIMELOCK" "execute(bytes32)" "$id" >/dev/null
  ok "executed $label"
}

# --- resume bootstrap ops ---
NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)"
READY_SEED="$(call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_SEED" | awk 'NR==1{print $1}')"
if [[ -n "${READY_SEED:-}" && "$NOW" -lt "$READY_SEED" ]]; then
  sleep $(( READY_SEED - NOW + 3 ))
fi
exec_if_needed "$ID_BIND" "bind"
exec_if_needed "$ID_SEED" "seed"
exec_if_needed "$ID_CALLER" "feeCaller"

ADMIN="$(cast_u "$(call "$TIMELOCK" "admin()(address)")")"
[[ "${ADMIN,,}" != "${LEGACY_SAFE,,}" ]] || fail "Timelock admin is LEGACY Safe"
USDC_TREAS="$(cast_u "$(call "$MARKET" "usdcTreasury()(address)")")"
[[ "${USDC_TREAS,,}" == "${POOL,,}" ]] || fail "market usdcTreasury != NEW pool"
[[ "${USDC_TREAS,,}" != "${LEGACY_P4CAP,,}" ]] || fail "legacy P4Cap still ACTIVE"
ok "ZERO ACTIVE Safe/P4Cap"

# EF + SR cutover (skip if already recorded)
if [[ -z "${ESCROW_FACTORY:-}" || -z "${SETTLEMENT_ROUTER:-}" ]]; then
  (
    cd "$ROOT/contracts"
    forge create src/EscrowFactoryV2.sol:EscrowFactoryV2 \
      --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --broadcast \
      --constructor-args "$DEPLOYER" 2>&1 | tee "$EVIDENCE/ef.create.log"
    forge create src/SettlementRouter.sol:SettlementRouter \
      --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --broadcast \
      --constructor-args "$DEPLOYER" "$FEE_ROUTER" 2>&1 | tee "$EVIDENCE/sr.create.log"
  )
  EF="$(grep -E 'Deployed to:' "$EVIDENCE/ef.create.log" | awk '{print $NF}' | tail -1)"
  SR="$(grep -E 'Deployed to:' "$EVIDENCE/sr.create.log" | awk '{print $NF}' | tail -1)"
  [[ "$EF" == 0x* && "$SR" == 0x* ]] || fail "EF/SR deploy failed"
  echo "ESCROW_FACTORY=$EF" >> "$EVIDENCE/addresses.env"
  echo "SETTLEMENT_ROUTER=$SR" >> "$EVIDENCE/addresses.env"
  ESCROW_FACTORY=$EF; SETTLEMENT_ROUTER=$SR
fi
SR_FR="$(cast_u "$(call "$SETTLEMENT_ROUTER" "feeRouter()(address)")")"
[[ "${SR_FR,,}" == "${FEE_ROUTER,,}" ]] || fail "SR.feeRouter mismatch"
ok "EF/SR cutover EF=$ESCROW_FACTORY SR=$SETTLEMENT_ROUTER"

schedule_exec() {
  local target="$1" data="$2" salt="$3" label="$4"
  local id
  id="$(cast_u "$(call "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$target" 0 "$data" "$salt")")"
  if ! op_done "$id"; then
    # may already be scheduled
    if ! call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$id" | awk 'NR==1{exit ($1+0)>0?0:1}'; then
      send "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$target" 0 "$data" "$salt" >/dev/null
    fi
    sleep $(( TIMELOCK_DELAY + 5 ))
    send "$TIMELOCK" "execute(bytes32)" "$id" >/dev/null
  fi
  ok "$label"
}

# Steward payout CN
DATA_PAY="$(cast calldata "setStewardPayout(bytes2,address)" "0x434e" "$DEPLOYER")"
schedule_exec "$FEE_ROUTER" "$DATA_PAY" "$(cast keccak "dl-pay-cn-1")" "steward payout CN"

FEE_AMT=100000000
send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" "$FEE_AMT" >/dev/null
POOL_BEFORE="$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")"
send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" "$FEE_AMT" "0x434e" >/dev/null
POOL_AFTER="$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")"
python - <<PY
assert int("$POOL_AFTER")-int("$POOL_BEFORE")==55_000_000
print("fee_45_55_ok")
PY
ok "fee 45/55"

FEE2=80000000
send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" "$FEE2" >/dev/null
POOL_B2="$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")"
send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" "$FEE2" "0x4a50" >/dev/null
POOL_A2="$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")"
python - <<PY
assert int("$POOL_A2")-int("$POOL_B2")==80_000_000
print("fee_100_ok")
PY
ok "fee 100% pool"

NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)"
WAIT=$(( BATCH1_START - NOW + 2 ))
if (( WAIT > 0 && WAIT < 600 )); then sleep "$WAIT"; fi
send "$USDC" "approve(address,uint256)" "$MARKET" 1000000 >/dev/null
POOL_B3="$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")"
send "$MARKET" "buy(uint256,uint256)" 1 1000000 >/dev/null
POOL_A3="$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")"
python - <<PY
assert int("$POOL_A3")-int("$POOL_B3")==1_000_000
print("sale_ok")
PY
ok "sale → NEW pool"

POOL_BAL="$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")"
SPEND="$(python -c "print(int(int('$POOL_BAL')*0.1))")"
DATA_SPEND="$(cast calldata "spendP4Reserve(address,address,uint256)" "$USDC" "$DEPLOYER" "$SPEND")"
schedule_exec "$POOL" "$DATA_SPEND" "$(cast keccak "dl-p4-spend-1")" "P4 spend ≤30%"

send "$MARKET" "pause()" >/dev/null
PAUSED="$(cast_u "$(call "$MARKET" "paused()(bool)")")"
[[ "$PAUSED" == "true" ]] || fail "pause failed"
DATA_UN="$(cast calldata "unpause()")"
schedule_exec "$MARKET" "$DATA_UN" "$(cast keccak "dl-unpause-1")" "Timelock unpause"

SUPPLY="$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")"
MIN_CN="$(cast_u "$(call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e")")"
python - <<PY
s=int("$SUPPLY"); m=int("$MIN_CN"); assert m==s*400//10000, (m,s)
print("stake_ok", m)
PY
set +e
OUT="$(send "$STAKE_POOL" "stakeAsMerchant(uint256)" 1 2>&1)"
set -e
echo "$OUT" | grep -qiE "revert|RoleDisabled|execution reverted" || fail "merchant should revert"
ok "RoleStake + Merchant DISABLED"

PFB="$(cast_u "$(call "$FEE_ROUTER" "platformFeeBps()(uint256)")")"
[[ "$PFB" == "500" ]] || fail "fee bps != 500"

set +e
OUT1="$(send "$FEE_ROUTER" "setFeeRouterCaller(address,bool)" "$DEPLOYER" true 2>&1)"
OUT2="$(send "$POOL" "spendP4Reserve(address,address,uint256)" "$USDC" "$DEPLOYER" 1 2>&1)"
set -e
echo "$OUT1" | grep -qiE "revert|OnlyOwner|execution reverted" || fail "EOA feeRouter mutate"
echo "$OUT2" | grep -qiE "revert|OnlySpender|execution reverted" || fail "EOA pool spend"
ok "authz deny"

ok "wait batch windows for burn"
END5=$(( BATCH1_START + 5 * 90 + 5 ))
while true; do
  NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp || true)"
  [[ -n "$NOW" ]] || { sleep 10; continue; }
  (( NOW >= END5 )) && break
  sleep 20
done
for BID in 1 2 3 4 5; do
  send "$MARKET" "closeBatchReturn(uint256)" "$BID" >/dev/null || true
done
OPEN="$(cast_u "$(call "$MARKET" "hasOpenOrArmedUnclosedBatch()(bool)")")"
[[ "$OPEN" == "false" ]] || fail "batches still open"
SUPPLY_BEFORE="$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")"
BURN_AMT=1000000000000000000
DATA_BURN="$(cast calldata "executeGovernanceBurn(uint256)" "$BURN_AMT")"
schedule_exec "$VAULT" "$DATA_BURN" "$(cast keccak "dl-gov-burn-1")" "governance burn"
SUPPLY_AFTER="$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")"
python - <<PY
assert int("$SUPPLY_BEFORE")-int("$SUPPLY_AFTER")==10**18
print("burn_ok")
PY
MIN_AFTER="$(cast_u "$(call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e")")"
python - <<PY
assert int("$MIN_AFTER") < int("$MIN_CN")
print("stake_tracks_burn", int("$MIN_AFTER"))
PY
ok "burn + stake tracks"

python - <<PY
import json, time
from pathlib import Path
ev = Path(r"""$EVIDENCE""")
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
  "next": "freeze V9_AUDIT_CANDIDATE_DESIGN_LOCK then STOP",
}
(ev / "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json").write_text(json.dumps(payload, indent=2)+"\n", encoding="utf-8")
print("wrote", ev / "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json")
PY

python "$ROOT/scripts/dev/freeze-ttg-v9-audit-candidate-design-lock.py"
ok "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP + V9_AUDIT_CANDIDATE_DESIGN_LOCK FROZEN · STOP"
