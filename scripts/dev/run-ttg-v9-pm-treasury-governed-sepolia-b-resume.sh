#!/usr/bin/env bash
# Resume Part B only — fresh PM already deployed; continue bind→seed→buy→upgrade→cutover.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_pm_treasury_governed_sepolia"
SEPOLIA_CHAIN_ID=11155111

TL_FRESH=0x7aaEAC6D890EFe85ddA37Cf366ceA585592F91E4
PM_F=0xb8A191e84C16CB6E4e1Fc634D1bAc85a338989BC
POOL_F=0xc49C28E9883405087Cb734a48206a5eE7A370Ff0
FEE_F=0xF3fC481BEE172E8Ad90c65CC25F8e7A906A1DAfb
VAULT_F=0x6f7Bd113ABc736EcB4FD8e81C82F809cf43E8DB3
USDC_F=0x50D593b4eA94FBF3E2aa0B0C5887CeD7EdA35814
TTG_F=0x23a888fCe200eDbF8a2D6ae78428B87fc0bA4240
LEGACY_SINK=0x000000000000000000000000000000000000bEEF
DL_R1_MARKET=0x5010f46F2dE4500B3f9d6E164093B7a30EaA707a
DL_R1_TIMELOCK=0x631593e987fd59705Ad168D569D720419B138704
DL_R1_POOL_LEGACY=0x705c8423c66237DF002D609bFBAa0452c54904e0
DL_R1_FEE=0xe52D396b35619A85305742A81594d27e8095a02b
POOL_V2_FROZEN=0xF59E120F846f07Fc011c9d592CF613e27BFa1F50
NEW_IMPL=0xB488DD86DE59e9D0fF33C153566cF2de776CCfEA

fail() { echo "PM_TREASURY_SEPOLIA: STOP $*" >&2; exit 2; }
ok() { echo "PM_TREASURY_SEPOLIA: OK $*"; }
cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }
to_b32_u() { python -c "print('0x'+format(int('$1'),'064x'))"; }
is_truthy() { case "${1:-}" in 1|true|TRUE|yes|YES|on|ON) return 0 ;; *) return 1 ;; esac; }

load_env_file() {
  local f="$1"; [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"; line="${line#"${line%%[![:space:]]*}"}"; line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"; val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    [[ -z "$val" ]] && continue
    export "$key=$val"
  done < "$f"
}

RPC_CANDIDATES=(
  "https://sepolia.gateway.tenderly.co"
  "https://ethereum-sepolia-rpc.publicnode.com"
)
pick_rpc() {
  local _rpc _cid
  for _rpc in "${RPC_CANDIDATES[@]}"; do
    _cid="$(cast chain-id --rpc-url "$_rpc" 2>/dev/null || true)"
    [[ "$_cid" == "$SEPOLIA_CHAIN_ID" ]] || continue
    echo "$_rpc"; return 0
  done
  return 1
}

tl_schedule_exec() {
  local target="$1" data="$2" salt="$3" label="$4"
  local id attempt=1
  id="$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" \
    "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$target" 0 "$data" "$salt" | awk '{print $1}')"
  # skip if already executed
  local ready done
  ready="$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$id" 2>/dev/null | head -1 | awk '{print $1}' || true)"
  if [[ -n "$ready" && "$ready" != "0" ]]; then
    done_flag="$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$id" | sed -n '2p' | awk '{print $1}')"
    if [[ "$done_flag" == "true" ]]; then
      ok "skip already executed $label"
      return 0
    fi
    # wait remaining
    sleep "$((DELAY_SEC + 5))"
    cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
      "$TIMELOCK" "execute(bytes32)" "$id" >/dev/null
    ok "executed $label (resume)"
    return 0
  fi
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$target" 0 "$data" "$salt" >/dev/null
  ok "scheduled $label id=$id"
  sleep "$((DELAY_SEC + 5))"
  while [[ $attempt -le 5 ]]; do
    if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
      "$TIMELOCK" "execute(bytes32)" "$id" >/dev/null 2>"$EVIDENCE/last_exec.err"; then
      ok "executed $label"
      return 0
    fi
    CHAIN_RPC_URL="$(pick_rpc)" || true
    sleep 4
    attempt=$((attempt + 1))
  done
  cat "$EVIDENCE/last_exec.err" >&2 || true
  fail "execute $label"
}

forge_create() {
  local artifact="$1"; shift
  ( cd "$ROOT/contracts" && FOUNDRY_PROFILE=ttg_v9_broadcast forge create \
    --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --json \
    "$artifact" "$@" ) | python -c 'import sys,json; print(json.load(sys.stdin)["deployedTo"])'
}

snap_pm() {
  local pm="$1" out="$2"
  {
    echo "version=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "version()(string)")"
    echo "usdcTreasury=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "usdcTreasury()(address)")"
    echo "timelock=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "timelock()(address)")"
    echo "guardian=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "guardian()(address)")"
    echo "paused=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "paused()(bool)")"
    echo "seededBatchCount=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "seededBatchCount()(uint256)")")"
    echo "usdc=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "usdc()(address)")"
    echo "ttg=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "ttg()(address)")"
    echo "vault=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "vault()(address)")"
    echo "vaultInventory=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$VAULT_F" "inventory()(uint256)")")"
    local i
    for i in 1 2 3 4 5; do
      echo "batch$i=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" "$i" | tr '\n' ' ')"
    done
  } >"$out"
}

assert_snap_eq() {
  diff <(grep -v '^version=' "$1") <(grep -v '^version=' "$2") >/dev/null \
    || fail "PM drift $1 vs $2"
}

[[ -f "$ROOT/.env" ]] && load_env_file "$ROOT/.env"
load_env_file "${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
load_env_file "${TTG_V8_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v8-sepolia-rehearsal.local}"
load_env_file "${TTG_V9_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local}"
is_truthy "${TRAVELTRUST_TTG_V9_PM_TREASURY_SEPOLIA_OK:-}" || fail "auth flag"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY"
[[ "$PRIVATE_KEY" != 0x* ]] && export PRIVATE_KEY="0x${PRIVATE_KEY}"

mkdir -p "$EVIDENCE"
CHAIN_RPC_URL="$(pick_rpc)" || fail "rpc"
DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
TIMELOCK="$TL_FRESH"
DELAY_SEC="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" "delay()(uint256)")")"
ok "B-resume deployer=$DEPLOYER delay=$DELAY_SEC"

# ensure allowlist
for t in "$VAULT_F" "$PM_F" "$FEE_F" "$POOL_F"; do
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TIMELOCK" "setAllowedExecutionTarget(address,bool)" "$t" true >/dev/null || true
done

# bind if needed
MKT="$(cast call --rpc-url "$CHAIN_RPC_URL" "$VAULT_F" "market()(address)" 2>/dev/null || echo 0x0)"
if [[ "$(echo "$MKT" | tr '[:upper:]' '[:lower:]')" != "$(echo "$PM_F" | tr '[:upper:]' '[:lower:]')" ]]; then
  tl_schedule_exec "$VAULT_F" "$(cast calldata "bindMarket(address)" "$PM_F")" "$(to_b32_u 601)" "bindMarket"
fi

INV="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$VAULT_F" "inventory()(uint256)")")"
if [[ "$INV" == "0" ]]; then
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TTG_F" "mint(address,uint256)" "$VAULT_F" 12500000000000000000000000000000 >/dev/null
fi
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$USDC_F" "mint(address,uint256)" "$DEPLOYER" 1000000000 >/dev/null || true

SEEDED="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM_F" "seededBatchCount()(uint256)")")"
if [[ "$SEEDED" == "0" ]]; then
  NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" --field timestamp)"
  FIRST=$((NOW + 45))
  WINDOW=180
  tl_schedule_exec "$PM_F" "$(cast calldata "seedBatchesRehearsal(uint64,uint64)" "$FIRST" "$WINDOW")" "$(to_b32_u 602)" "seedBatchesRehearsal"
else
  FIRST="$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM_F" "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" 1 | head -1 | awk '{print $1}')"
fi

cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$USDC_F" "approve(address,uint256)" "$PM_F" 1000000000 >/dev/null

NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" --field timestamp)"
FIRST="$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM_F" "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" 1 | head -1 | awk '{print $1}')"
SLEEP_OPEN=$((FIRST - NOW + 10))
[[ "$SLEEP_OPEN" -gt 0 ]] && { ok "wait batch1 open ${SLEEP_OPEN}s"; sleep "$SLEEP_OPEN"; }

# pre-upgrade buy if sold==0
SOLD="$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM_F" "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" 1 | sed -n '5p' | awk '{print $1}')"
if [[ "$SOLD" == "0" ]]; then
  LEGACY_BEFORE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$LEGACY_SINK")")"
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$PM_F" "buy(uint256,uint256)" 1 1000000 >/dev/null
  LEGACY_MID="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$LEGACY_SINK")")"
  [[ "$((LEGACY_MID - LEGACY_BEFORE))" == "1000000" ]] || fail "pre-upgrade buy missed legacy"
  ok "B: pre-upgrade 1 USDC → legacy"
fi

VER="$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM_F" "version()(string)")"
if ! echo "$VER" | grep -q treasury_governed; then
  snap_pm "$PM_F" "$EVIDENCE/fresh_pm_pre_upgrade.snap"
  NEW_IMPL_F="$(forge_create src/ttg-v9/TtgBatchPrimaryMarket.sol:TtgBatchPrimaryMarket)"
  tl_schedule_exec "$PM_F" "$(cast calldata "upgradeToAndCall(address,bytes)" "$NEW_IMPL_F" 0x)" "$(to_b32_u 603)" "fresh_pm_uups"
  snap_pm "$PM_F" "$EVIDENCE/fresh_pm_post_upgrade.snap"
  assert_snap_eq "$EVIDENCE/fresh_pm_pre_upgrade.snap" "$EVIDENCE/fresh_pm_post_upgrade.snap"
  ok "B: fresh 0-drift upgrade"
else
  NEW_IMPL_F="$(cast storage --rpc-url "$CHAIN_RPC_URL" "$PM_F" 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)"
  NEW_IMPL_F="0x${NEW_IMPL_F: -40}"
  ok "B: already upgraded impl=$NEW_IMPL_F"
fi

CUR_T="$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM_F" "usdcTreasury()(address)")"
if [[ "$(echo "$CUR_T" | tr '[:upper:]' '[:lower:]')" != "$(echo "$POOL_F" | tr '[:upper:]' '[:lower:]')" ]]; then
  tl_schedule_exec "$PM_F" "$(cast calldata "setUsdcTreasury(address)" "$POOL_F")" "$(to_b32_u 604)" "setUsdcTreasury_fresh_v2"
fi
CUR_P="$(cast call --rpc-url "$CHAIN_RPC_URL" "$FEE_F" "projectPool()(address)")"
if [[ "$(echo "$CUR_P" | tr '[:upper:]' '[:lower:]')" != "$(echo "$POOL_F" | tr '[:upper:]' '[:lower:]')" ]]; then
  tl_schedule_exec "$FEE_F" "$(cast calldata "setProjectPool(address)" "$POOL_F")" "$(to_b32_u 605)" "fee_setProjectPool_fresh"
fi

LEGACY_PRE2="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$LEGACY_SINK")")"
V2_PRE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$POOL_F")")"
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$PM_F" "buy(uint256,uint256)" 1 1000000 >/dev/null
LEGACY_POST="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$LEGACY_SINK")")"
V2_POST="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$POOL_F")")"
[[ "$LEGACY_POST" == "$LEGACY_PRE2" ]] || fail "legacy received post-cutover funds"
[[ "$((V2_POST - V2_PRE))" == "1000000" ]] || fail "V2 did not receive full 1 USDC got=$((V2_POST - V2_PRE))"
ok "B: post-cutover buy → PoolV2 only"

cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$USDC_F" "mint(address,uint256)" "$FEE_F" 10000000 >/dev/null
CALLER="$(cast call --rpc-url "$CHAIN_RPC_URL" "$FEE_F" "feeRouterCaller(address)(bool)" "$DEPLOYER" | awk '{print $1}')"
if [[ "$CALLER" != "true" ]]; then
  tl_schedule_exec "$FEE_F" "$(cast calldata "setFeeRouterCaller(address,bool)" "$DEPLOYER" true)" "$(to_b32_u 606)" "setFeeRouterCaller"
fi
V2_FEE_PRE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$POOL_F")")"
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$FEE_F" "routePlatformFee(address,uint256,bytes2)" "$USDC_F" 10000000 0x4a50 >/dev/null
V2_FEE_POST="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$POOL_F")")"
[[ "$((V2_FEE_POST - V2_FEE_PRE))" == "10000000" ]] || fail "fee route not 100% to V2"
ok "B: FeeRouter → PoolV2"

cat >"$EVIDENCE/deploy.addresses.env" <<EOF
DL_R1_MARKET=$DL_R1_MARKET
DL_R1_TIMELOCK=$DL_R1_TIMELOCK
DL_R1_POOL_LEGACY=$DL_R1_POOL_LEGACY
DL_R1_FEE=$DL_R1_FEE
POOL_V2_FROZEN=$POOL_V2_FROZEN
DL_R1_PM_NEW_IMPL=$NEW_IMPL
TL_FRESH=$TL_FRESH
USDC_F=$USDC_F
TTG_F=$TTG_F
VAULT_F=$VAULT_F
PM_F=$PM_F
POOL_F=$POOL_F
FEE_F=$FEE_F
PM_F_NEW_IMPL=$NEW_IMPL_F
DEPLOYER=$DEPLOYER
EOF

ok "SEPOLIA REHEARSAL MATRIX PASS"
echo "PM_TREASURY_SEPOLIA: DONE"
