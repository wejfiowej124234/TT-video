#!/usr/bin/env bash
# Resume after DL_R1 PM UUPS upgrade (RPC flake mid-snap). Continues A ACL/cutover + B fresh Reality.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REHEARSAL_ENV="${TTG_V9_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local}"
V8_REHEARSAL_ENV="${TTG_V8_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v8-sepolia-rehearsal.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_pm_treasury_governed_sepolia"
SEPOLIA_CHAIN_ID=11155111

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
lc() { echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d '\r'; }
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
  "https://ethereum-sepolia-rpc.publicnode.com"
  "https://sepolia.gateway.tenderly.co"
)
pick_rpc() {
  local _rpc _cid
  for _rpc in "${RPC_CANDIDATES[@]}" "${CHAIN_RPC_URL:-}"; do
    [[ -z "$_rpc" ]] && continue
    _cid="$(cast chain-id --rpc-url "$_rpc" 2>/dev/null || true)"
    [[ "$_cid" == "$SEPOLIA_CHAIN_ID" ]] || continue
    echo "$_rpc"; return 0
  done
  return 1
}

tl_schedule_exec() {
  local target="$1" data="$2" salt="$3" label="$4" tl="${5:-$TIMELOCK}" delay="${6:-$DELAY_SEC}"
  local id attempt=1
  id="$(cast call --rpc-url "$CHAIN_RPC_URL" "$tl" \
    "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$target" 0 "$data" "$salt" | awk '{print $1}')"
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$tl" "schedule(address,uint256,bytes,bytes32)" "$target" 0 "$data" "$salt" >/dev/null
  ok "scheduled $label id=$id"
  sleep "$((delay + 5))"
  while [[ $attempt -le 4 ]]; do
    if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
      "$tl" "execute(bytes32)" "$id" >/dev/null 2>"$EVIDENCE/last_exec.err"; then
      ok "executed $label"
      return 0
    fi
    CHAIN_RPC_URL="$(pick_rpc)" || true
    sleep 3
    attempt=$((attempt + 1))
  done
  cat "$EVIDENCE/last_exec.err" >&2 || true
  fail "execute failed $label"
}

forge_create() {
  local artifact="$1"; shift
  local attempt=1 out
  while [[ $attempt -le 4 ]]; do
    if out="$(cd "$ROOT/contracts" && FOUNDRY_PROFILE=ttg_v9_broadcast forge create \
      --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --json \
      "$artifact" "$@" 2>"$EVIDENCE/last_create.err")"; then
      echo "$out" | python -c 'import sys,json; print(json.load(sys.stdin)["deployedTo"])'
      return 0
    fi
    CHAIN_RPC_URL="$(pick_rpc)" || true
    sleep 3
    attempt=$((attempt + 1))
  done
  cat "$EVIDENCE/last_create.err" >&2 || true
  fail "forge create $artifact"
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
    local vault_addr
    vault_addr="$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "vault()(address)" | awk '{print $1}')"
    echo "vaultInventory=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$vault_addr" "inventory()(uint256)")")"
    local i
    for i in 1 2 3 4 5; do
      echo "batch$i=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" "$i" | tr '\n' ' ')"
    done
  } >"$out"
}

assert_snap_eq() {
  diff <(grep -v '^version=' "$1") <(grep -v '^version=' "$2") >/dev/null \
    || fail "PM storage/state drift ($1 vs $2)"
}

[[ -f "$ROOT/.env" ]] && load_env_file "$ROOT/.env"
load_env_file "$ENV_FILE"
load_env_file "$V8_REHEARSAL_ENV"
load_env_file "$REHEARSAL_ENV"
is_truthy "${TRAVELTRUST_TTG_V9_PM_TREASURY_SEPOLIA_OK:-}" || fail "set TRAVELTRUST_TTG_V9_PM_TREASURY_SEPOLIA_OK=1"
is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}" && fail "refusing MAINNET flag"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY unset"
[[ "$PRIVATE_KEY" != 0x* && "$PRIVATE_KEY" != 0X* ]] && export PRIVATE_KEY="0x${PRIVATE_KEY}"

mkdir -p "$EVIDENCE"
CHAIN_RPC_URL="$(pick_rpc)" || fail "no Sepolia RPC"
DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
ok "resume deployer=$DEPLOYER rpc=$(python -c "from urllib.parse import urlparse; print(urlparse('$CHAIN_RPC_URL').netloc)")"

# Confirm upgrade already done
VER="$(cast call --rpc-url "$CHAIN_RPC_URL" "$DL_R1_MARKET" "version()(string)")"
echo "$VER" | grep -q treasury_governed || fail "DL_R1 not upgraded yet: $VER"
assert_snap_eq "$EVIDENCE/dl_r1_pm_pre_upgrade.snap" "$EVIDENCE/dl_r1_pm_post_upgrade.snap"
ok "A: confirmed 0-drift upgrade $VER"

TIMELOCK="$DL_R1_TIMELOCK"
DELAY_SEC="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" "delay()(uint256)")")"

# Allow targets (idempotent)
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$TIMELOCK" "setAllowedExecutionTarget(address,bool)" "$DL_R1_MARKET" true >/dev/null || true
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$TIMELOCK" "setAllowedExecutionTarget(address,bool)" "$DL_R1_FEE" true >/dev/null || true

if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$DL_R1_MARKET" "setUsdcTreasury(address)" "$POOL_V2_FROZEN" >/dev/null 2>&1; then
  fail "EOA setUsdcTreasury should revert"
fi
ok "EOA setUsdcTreasury rejected"

CUR_T="$(cast call --rpc-url "$CHAIN_RPC_URL" "$DL_R1_MARKET" "usdcTreasury()(address)")"
if [[ "$(lc "$CUR_T")" != "$(lc "$POOL_V2_FROZEN")" ]]; then
  set_data="$(cast calldata "setUsdcTreasury(address)" "$POOL_V2_FROZEN")"
  tl_schedule_exec "$DL_R1_MARKET" "$set_data" "$(to_b32_u 503)" "setUsdcTreasury_poolV2"
fi
GOT_T="$(cast call --rpc-url "$CHAIN_RPC_URL" "$DL_R1_MARKET" "usdcTreasury()(address)")"
[[ "$(lc "$GOT_T")" == "$(lc "$POOL_V2_FROZEN")" ]] || fail "treasury not V2"

CUR_P="$(cast call --rpc-url "$CHAIN_RPC_URL" "$DL_R1_FEE" "projectPool()(address)")"
if [[ "$(lc "$CUR_P")" != "$(lc "$POOL_V2_FROZEN")" ]]; then
  fee_data="$(cast calldata "setProjectPool(address)" "$POOL_V2_FROZEN")"
  tl_schedule_exec "$DL_R1_FEE" "$fee_data" "$(to_b32_u 504)" "fee_setProjectPool_V2"
fi
GOT_P="$(cast call --rpc-url "$CHAIN_RPC_URL" "$DL_R1_FEE" "projectPool()(address)")"
[[ "$(lc "$GOT_P")" == "$(lc "$POOL_V2_FROZEN")" ]] || fail "fee projectPool not V2"
ok "A: DL_R1 treasury+fee → frozen PoolV2 COMPLETE"

# ─── B fresh ───────────────────────────────────────────────────────────────
ok "B: fresh PreTreasury → upgrade → buy → PoolV2"
DELAY_FRESH="${TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS:-90}"
LEGACY_SINK=0x000000000000000000000000000000000000bEEF

TL_FRESH="$(forge_create src/ttg-v9/TtgV9SoloTimelock.sol:TtgV9SoloTimelock \
  --constructor-args "$DEPLOYER" "$DELAY_FRESH")"
ok "tl_fresh=$TL_FRESH"

USDC_F="$(forge_create src/ttg-v9/mocks/MockV9Erc20.sol:MockV9Erc20 --constructor-args "USD Coin" "USDC" 6)"
TTG_F="$(forge_create src/ttg-v9/mocks/MockV9Erc20.sol:MockV9Erc20 --constructor-args "TravelTrust Governance" "TTG" 18)"

VAULT_IMPL="$(forge_create src/ttg-v9/TtgPublicSaleVault.sol:TtgPublicSaleVault)"
VAULT_INIT="$(cast calldata "initialize(address,address)" "$TTG_F" "$TL_FRESH")"
VAULT_F="$(forge_create src/ttg-v9/TtgV9ERC1967Proxy.sol:TtgV9ERC1967Proxy --constructor-args "$VAULT_IMPL" "$VAULT_INIT")"

PRE_IMPL_F="$(forge_create src/ttg-v9/legacy/TtgBatchPrimaryMarketPreTreasury.sol:TtgBatchPrimaryMarketPreTreasury)"
PM_INIT="$(cast calldata "initialize(address,address,address,address,address,address)" \
  "$USDC_F" "$TTG_F" "$LEGACY_SINK" "$VAULT_F" "$TL_FRESH" "$DEPLOYER")"
PM_F="$(forge_create src/ttg-v9/TtgV9ERC1967Proxy.sol:TtgV9ERC1967Proxy --constructor-args "$PRE_IMPL_F" "$PM_INIT")"

POOL_IMPL="$(forge_create src/ttg-v9/TtgV9ProjectPoolV2.sol:TtgV9ProjectPoolV2)"
POOL_INIT="$(cast calldata "initialize(address,address,address,uint256)" "$TL_FRESH" "$TL_FRESH" "$USDC_F" 3000)"
POOL_F="$(forge_create src/ttg-v9/TtgV9ERC1967Proxy.sol:TtgV9ERC1967Proxy --constructor-args "$POOL_IMPL" "$POOL_INIT")"
FEE_F="$(forge_create src/ttg-v9/TtgV9CountryFeeRouter.sol:TtgV9CountryFeeRouter --constructor-args "$TL_FRESH" "$LEGACY_SINK")"
ok "pm_fresh=$PM_F pool_v2=$POOL_F fee=$FEE_F"

TIMELOCK="$TL_FRESH"
DELAY_SEC="$DELAY_FRESH"
for t in "$VAULT_F" "$PM_F" "$FEE_F" "$POOL_F"; do
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TIMELOCK" "setAllowedExecutionTarget(address,bool)" "$t" true >/dev/null
done

bind_data="$(cast calldata "bindMarket(address)" "$PM_F")"
tl_schedule_exec "$VAULT_F" "$bind_data" "$(to_b32_u 601)" "bindMarket"

cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$TTG_F" "mint(address,uint256)" "$VAULT_F" 12500000000000000000000000000000 >/dev/null
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$USDC_F" "mint(address,uint256)" "$DEPLOYER" 1000000000 >/dev/null

NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" --field timestamp)"
FIRST=$((NOW + 40))
WINDOW=180
seed_data="$(cast calldata "seedBatchesRehearsal(uint64,uint64)" "$FIRST" "$WINDOW")"
tl_schedule_exec "$PM_F" "$seed_data" "$(to_b32_u 602)" "seedBatchesRehearsal"

cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$USDC_F" "approve(address,uint256)" "$PM_F" 1000000000 >/dev/null
SLEEP_OPEN=$((FIRST - $(cast block --rpc-url "$CHAIN_RPC_URL" --field timestamp) + 8))
[[ "$SLEEP_OPEN" -gt 0 ]] && sleep "$SLEEP_OPEN"

LEGACY_BEFORE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$LEGACY_SINK")")"
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$PM_F" "buy(uint256,uint256)" 1 1000000 >/dev/null
LEGACY_MID="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$LEGACY_SINK")")"
[[ "$((LEGACY_MID - LEGACY_BEFORE))" == "1000000" ]] || fail "pre-upgrade buy missed legacy"
ok "B: pre-upgrade 1 USDC → legacy"

snap_pm "$PM_F" "$EVIDENCE/fresh_pm_pre_upgrade.snap"
NEW_IMPL_F="$(forge_create src/ttg-v9/TtgBatchPrimaryMarket.sol:TtgBatchPrimaryMarket)"
up_data="$(cast calldata "upgradeToAndCall(address,bytes)" "$NEW_IMPL_F" 0x)"
tl_schedule_exec "$PM_F" "$up_data" "$(to_b32_u 603)" "fresh_pm_uups"
snap_pm "$PM_F" "$EVIDENCE/fresh_pm_post_upgrade.snap"
assert_snap_eq "$EVIDENCE/fresh_pm_pre_upgrade.snap" "$EVIDENCE/fresh_pm_post_upgrade.snap"
ok "B: fresh 0-drift upgrade"

set_data="$(cast calldata "setUsdcTreasury(address)" "$POOL_F")"
tl_schedule_exec "$PM_F" "$set_data" "$(to_b32_u 604)" "setUsdcTreasury_fresh_v2"
fee_data="$(cast calldata "setProjectPool(address)" "$POOL_F")"
tl_schedule_exec "$FEE_F" "$fee_data" "$(to_b32_u 605)" "fee_setProjectPool_fresh"

LEGACY_PRE2="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$LEGACY_SINK")")"
V2_PRE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$POOL_F")")"
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$PM_F" "buy(uint256,uint256)" 1 1000000 >/dev/null
LEGACY_POST="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$LEGACY_SINK")")"
V2_POST="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC_F" "balanceOf(address)(uint256)" "$POOL_F")")"
[[ "$LEGACY_POST" == "$LEGACY_PRE2" ]] || fail "legacy received post-cutover funds"
[[ "$((V2_POST - V2_PRE))" == "1000000" ]] || fail "V2 did not receive full 1 USDC"
ok "B: post-cutover buy → PoolV2 only"

cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$USDC_F" "mint(address,uint256)" "$FEE_F" 10000000 >/dev/null
caller_data="$(cast calldata "setFeeRouterCaller(address,bool)" "$DEPLOYER" true)"
tl_schedule_exec "$FEE_F" "$caller_data" "$(to_b32_u 606)" "setFeeRouterCaller"
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
