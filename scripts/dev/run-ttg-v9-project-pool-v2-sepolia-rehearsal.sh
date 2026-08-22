#!/usr/bin/env bash
# V9_PROJECT_POOL_V2_SEPOLIA_REHEARSAL_AND_SECURITY
#
# ② Sepolia-only · chain_id 11155111 · TtgV9ProjectPoolV2 UUPS + FeeRouter → V2
# Owner auth: TRAVELTRUST_TTG_V9_PROJECT_POOL_V2_SEPOLIA_OK=1
# KEEP: Mainnet Phase1 addresses · TTG/Governor/Timelock Mainnet · Guide Bond pause
# FORBID: Mainnet broadcast · TT_PRODUCTION_GO flip · mutate 25T/five-batch/45-55/90d period
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REHEARSAL_ENV="${TTG_V9_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local}"
V8_REHEARSAL_ENV="${TTG_V8_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v8-sepolia-rehearsal.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_project_pool_v2_sepolia"
DEPLOY_LOG="$EVIDENCE/deploy.forge.log"
SEPOLIA_CHAIN_ID=11155111
SCRIPT="src/ttg-v9/TtgV9ProjectPoolV2SepoliaRehearsal.s.sol:TtgV9ProjectPoolV2SepoliaRehearsal"

fail() { echo "TTG_V9_POOL_V2_SEPOLIA: STOP $*" >&2; exit 2; }
ok() { echo "TTG_V9_POOL_V2_SEPOLIA: OK $*"; }

cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }

# Solidity bytes32(uint256(n)) — NOT cast --to-bytes32 (left-packs decimal string).
to_b32_u() { python -c "print('0x'+format(int('$1'),'064x'))"; }

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

tl_schedule_exec() {
  local target="$1" data="$2" salt="$3" label="$4"
  local id
  id="$(cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --json \
    "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$target" 0 "$data" "$salt" \
    | python -c 'import sys,json; print(json.load(sys.stdin).get("logs",[{}])[0].get("topics",["",""])[1] if False else "")' 2>/dev/null || true)"
  # Prefer eth_call hashOperation for stable id
  id="$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" \
    "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$target" 0 "$data" "$salt")"
  id="$(echo "$id" | awk '{print $1}')"
  ok "scheduled $label id=$id"
  sleep "$((DELAY_SEC + 5))"
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TIMELOCK" "execute(bytes32)" "$id" >/dev/null
  ok "executed $label"
}

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
# Optional root .env first (defaults); phase2 / rehearsal override — do not let root wipe funded Sepolia key.
[[ -f "$ROOT/.env" ]] && load_env_file "$ROOT/.env"
load_env_file "$ENV_FILE"
load_env_file "$V8_REHEARSAL_ENV"
load_env_file "$REHEARSAL_ENV"

if ! is_truthy "${TRAVELTRUST_TTG_V9_PROJECT_POOL_V2_SEPOLIA_OK:-}"; then
  fail "set TRAVELTRUST_TTG_V9_PROJECT_POOL_V2_SEPOLIA_OK=1"
fi
if is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}"; then
  fail "refusing: TRAVELTRUST_MAINNET_BROADCAST_OK is set"
fi

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
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
CHAIN_RPC_URL="$(pick_sepolia_rpc)" || fail "no healthy Sepolia RPC"
ok "rpc=$(python -c "from urllib.parse import urlparse; print(urlparse('$CHAIN_RPC_URL').netloc)")"

[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "PRIVATE_KEY unset"
if [[ "$PRIVATE_KEY" != 0x* && "$PRIVATE_KEY" != 0X* ]]; then
  export PRIVATE_KEY="0x${PRIVATE_KEY}"
fi

mkdir -p "$EVIDENCE"
export TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS="${TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS:-90}"
DELAY_SEC="$TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS"

ok "local Forge ProjectPoolV2"
( cd "$ROOT/contracts" && FOUNDRY_PROFILE=ttg_v9 forge test --match-contract TtgV9ProjectPoolV2 --summary ) \
  || fail "local forge failed"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "chain_id=$CHAIN_ID not Sepolia"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
BAL="$(cast_u "$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL")")"
python -c "import sys; sys.exit(0 if int('$BAL')>=5*10**16 else 1)" || fail "deployer ETH < 0.05"

ok "broadcast deploy"
if [[ "${V9_POOL_V2_SEPOLIA_RESUME:-0}" == "1" && -f "$EVIDENCE/deploy.addresses.env" ]]; then
  # shellcheck disable=SC1090
  source "$EVIDENCE/deploy.addresses.env"
  ok "RESUME timelock=$TIMELOCK pool=$POOL fee=$FEE usdc=$USDC"
else
(
  cd "$ROOT/contracts"
  FOUNDRY_PROFILE=ttg_v9_broadcast forge script "$SCRIPT" \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --private-key "$PRIVATE_KEY" \
    -vv \
    2>&1 | tee "$DEPLOY_LOG"
) || fail "forge broadcast failed"

# Parse addresses from log
parse_log() {
  local key="$1"
  rg -N "^[[:space:]]*$key[[:space:]]+" "$DEPLOY_LOG" | tail -1 | awk '{print $NF}' | tr -d '\r'
}
TIMELOCK="$(parse_log TIMELOCK)"
USDC="$(parse_log USDC)"
POOL="$(parse_log POOL_V2_PROXY)"
IMPL="$(parse_log POOL_V2_IMPL)"
FEE="$(parse_log FEE_ROUTER)"
CALLER_ID_FROM_LOG="$(rg -N -A1 "SCHEDULE_SET_CALLER_ID" "$DEPLOY_LOG" | tail -1 | awk '{print $1}' | tr -d '\r')"
[[ -n "$TIMELOCK" && -n "$POOL" && -n "$USDC" && -n "$FEE" ]] || fail "parse deploy addresses failed"
cat > "$EVIDENCE/deploy.addresses.env" <<EOF
TIMELOCK=$TIMELOCK
USDC=$USDC
POOL=$POOL
IMPL=$IMPL
FEE=$FEE
CALLER_ID_FROM_LOG=$CALLER_ID_FROM_LOG
DEPLOYER=$DEPLOYER
EOF
fi

ok "addresses timelock=$TIMELOCK pool=$POOL fee=$FEE usdc=$USDC"

# Wait / execute setFeeRouterCaller
NEED_CALLER_EXEC=1
if cast call --rpc-url "$CHAIN_RPC_URL" "$FEE" "feeRouterCaller(address)(bool)" "$DEPLOYER" 2>/dev/null | grep -qi true; then
  NEED_CALLER_EXEC=0
  ok "FeeRouter caller already authorized"
fi
if [[ "$NEED_CALLER_EXEC" == "1" ]]; then
  ok "wait delay=${DELAY_SEC}s for initial Timelock ops"
  sleep "$((DELAY_SEC + 8))"
  CALLER_ID="${CALLER_ID_FROM_LOG:-}"
  if [[ -z "$CALLER_ID" || "$CALLER_ID" != 0x* ]]; then
    CALLER_DATA="$(cast calldata "setFeeRouterCaller(address,bool)" "$DEPLOYER" true)"
    CALLER_ID="$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" \
      "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$FEE" 0 "$CALLER_DATA" "$(to_b32_u 101)")"
    CALLER_ID="$(echo "$CALLER_ID" | awk '{print $1}')"
  fi
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TIMELOCK" "execute(bytes32)" "$CALLER_ID" >/dev/null || fail "execute setFeeRouterCaller"
  ok "FeeRouter caller authorized"
fi

# Route fee → V2 (100% project, no steward)
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$FEE" "routePlatformFee(address,uint256,bytes2)" "$USDC" 100000000000 0x5553 \
  >/dev/null || fail "routePlatformFee"
POOL_BAL="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC" "balanceOf(address)(uint256)" "$POOL")")"
python -c "import sys; sys.exit(0 if int('$POOL_BAL') >= 600_000 * 10**6 else 1)" \
  || fail "pool USDC after PM+fee sink expected >= 600k, got $POOL_BAL"
ok "fund flow FeeRouter+PM-stand-in → V2 bal=$POOL_BAL"

# Default cap
CAP="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "capBps()(uint256)")")"
[[ "$CAP" == "3000" ]] || fail "default capBps=$CAP want 3000"
OWNER="$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "owner()(address)" | tr '[:upper:]' '[:lower:]')"
[[ "$OWNER" == "$(echo "$TIMELOCK" | tr '[:upper:]' '[:lower:]')" ]] || fail "owner!=timelock"

# EOA deny setCap / spend
if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$POOL" "setCapBps(uint256)" 5000 >/dev/null 2>&1; then
  fail "EOA setCapBps should revert (deployer is not pool owner)"
fi
ok "EOA setCapBps rejected"

# Cap ladder via Timelock: 3000→500→5000→10000→0
declare -a CAPS=(500 5000 10000 0)
declare -a SALTS=(201 202 203 204)
for i in "${!CAPS[@]}"; do
  newdata="$(cast calldata "setCapBps(uint256)" "${CAPS[$i]}")"
  salt="$(to_b32_u "${SALTS[$i]}")"
  tl_schedule_exec "$POOL" "$newdata" "$salt" "setCapBps=${CAPS[$i]}"
  got="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "capBps()(uint256)")")"
  [[ "$got" == "${CAPS[$i]}" ]] || fail "capBps got=$got want=${CAPS[$i]}"
done
# restore usable cap 3000 for spend drills
newdata="$(cast calldata "setCapBps(uint256)" 3000)"
tl_schedule_exec "$POOL" "$newdata" "$(to_b32_u 205)" "setCapBps=3000"

# Spend 20% then lower cap to 5% → further spend reject; period/spent preserved
STARTED0="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "p4PeriodStartedAt()(uint256)")")"
SPEND="$(python -c "print(int('$POOL_BAL')*2000//10000)")"
spend_data="$(cast calldata "spendP4Reserve(address,address,uint256)" "$USDC" "$DEPLOYER" "$SPEND")"
tl_schedule_exec "$POOL" "$spend_data" "$(to_b32_u 301)" "spend20pct"
SPENT="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "p4SpentInPeriod()(uint256)")")"
[[ "$SPENT" == "$SPEND" ]] || fail "spent mismatch $SPENT vs $SPEND"

newdata="$(cast calldata "setCapBps(uint256)" 500)"
tl_schedule_exec "$POOL" "$newdata" "$(to_b32_u 302)" "setCapBps=500_after_spend"
STARTED1="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "p4PeriodStartedAt()(uint256)")")"
SPENT1="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "p4SpentInPeriod()(uint256)")")"
[[ "$STARTED1" == "$STARTED0" ]] || fail "period reset on setCap"
[[ "$SPENT1" == "$SPENT" ]] || fail "spent cleared on setCap"

# further spend should fail inside Timelock execute
bad_spend="$(cast calldata "spendP4Reserve(address,address,uint256)" "$USDC" "$DEPLOYER" 1)"
bad_id="$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" \
  "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$POOL" 0 "$bad_spend" "$(to_b32_u 303)")"
bad_id="$(echo "$bad_id" | awk '{print $1}')"
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$POOL" 0 "$bad_spend" "$(to_b32_u 303)" >/dev/null
sleep "$((DELAY_SEC + 5))"
if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$TIMELOCK" "execute(bytes32)" "$bad_id" >/dev/null 2>&1; then
  fail "spend after over-cap should fail"
fi
ok "over-cap spend rejected; period/spent preserved"

# UUPS upgrade only via Timelock
NEW_IMPL="$(cd "$ROOT/contracts" && FOUNDRY_PROFILE=ttg_v9_broadcast forge create \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --json \
  src/ttg-v9/TtgV9ProjectPoolV2.sol:TtgV9ProjectPoolV2 \
  | python -c 'import sys,json; print(json.load(sys.stdin)["deployedTo"])')"
ok "new impl $NEW_IMPL"
# EOA upgrade deny
if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$POOL" "upgradeToAndCall(address,bytes)" "$NEW_IMPL" 0x >/dev/null 2>&1; then
  fail "EOA upgrade should revert"
fi
up_data="$(cast calldata "upgradeToAndCall(address,bytes)" "$NEW_IMPL" 0x)"
tl_schedule_exec "$POOL" "$up_data" "$(to_b32_u 401)" "uups_upgrade"
VER="$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "version()(string)")"
ok "post-upgrade version=$VER cap=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "capBps()(uint256)")")"

# USDC-only: try spend wrong token (mint junk)
JUNK="$(cd "$ROOT/contracts" && FOUNDRY_PROFILE=ttg_v9_broadcast forge create \
  --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --json \
  src/ttg-v9/mocks/MockV9Erc20.sol:MockV9Erc20 \
  --constructor-args "Junk" "JUNK" 18 \
  | python -c 'import sys,json; print(json.load(sys.stdin)["deployedTo"])')"
# restore cap for attempt
newdata="$(cast calldata "setCapBps(uint256)" 3000)"
tl_schedule_exec "$POOL" "$newdata" "$(to_b32_u 402)" "setCapBps=3000_restore"
junk_spend="$(cast calldata "spendP4Reserve(address,address,uint256)" "$JUNK" "$DEPLOYER" 1)"
junk_id="$(cast call --rpc-url "$CHAIN_RPC_URL" "$TIMELOCK" \
  "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$POOL" 0 "$junk_spend" "$(to_b32_u 403)")"
junk_id="$(echo "$junk_id" | awk '{print $1}')"
cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$POOL" 0 "$junk_spend" "$(to_b32_u 403)" >/dev/null
sleep "$((DELAY_SEC + 5))"
if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$TIMELOCK" "execute(bytes32)" "$junk_id" >/dev/null 2>&1; then
  fail "non-USDC spend should fail"
fi
ok "USDC-only enforced"

python - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
doc={
  "stamp": "V9_PROJECT_POOL_V2_SEPOLIA_REHEARSAL_PASS",
  "wave": "V9_PROJECT_POOL_V2_SEPOLIA_REHEARSAL_AND_SECURITY",
  "recorded_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "chain_id": 11155111,
  "addresses": {
    "deployer": "$DEPLOYER",
    "timelock": "$TIMELOCK",
    "usdc_mock": "$USDC",
    "pool_v2_proxy": "$POOL",
    "pool_v2_impl_initial": "$IMPL",
    "pool_v2_impl_upgraded": "$NEW_IMPL",
    "fee_router": "$FEE",
  },
  "checks": {
    "default_cap_bps": 3000,
    "cap_ladder": [500, 5000, 10000, 0, 3000],
    "eoa_setCap_rejected": True,
    "eoa_upgrade_rejected": True,
    "period_not_reset_on_setCap": True,
    "spent_not_cleared_on_setCap": True,
    "over_cap_spend_rejected": True,
    "fee_router_to_v2": True,
    "pm_standin_usdc_to_v2": True,
    "usdc_only": True,
    "uups_timelock_upgrade": True,
  },
  "mainnet_phase1_frozen": True,
  "mainnet_broadcast": False,
  "tt_production_go": "NO_GO",
  "legacy_mainnet_pool": "0x7B21b421981A3B61cc08c8E22D4fd690E457Df37",
}
Path("$EVIDENCE").mkdir(parents=True, exist_ok=True)
Path("$EVIDENCE/V9_PROJECT_POOL_V2_SEPOLIA_REHEARSAL_PASS.json").write_text(json.dumps(doc, indent=2)+"\n", encoding="utf-8")
print("WROTE rehearsal PASS")
PY

ok "Sepolia rehearsal PASS → next: security audit stamp"
