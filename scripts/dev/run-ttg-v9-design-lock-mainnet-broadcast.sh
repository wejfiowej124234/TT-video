#!/usr/bin/env bash
# TTG_V9_DESIGN_LOCK_MAINNET_BROADCAST — DL_R1 Exact Match Mainnet deploy
# Auth: Owner Mainnet Broadcast Authorization + TRAVELTRUST_MAINNET_BROADCAST_OK=1
# Pin: evidence/GO_ttg_v9_audit/V9_MAINNET_DL_R1_BROADCAST_ARTIFACT_PIN.json
# Env: scripts/dev/.env.mainnet-phase3-deploy.local
# FORBID: TT_PRODUCTION_GO · www pin · public sale open · FeeIngress · R2/Remint/Safe ACTIVE
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${TTG_V9_MAINNET_ENV:-$ROOT/scripts/dev/.env.mainnet-phase3-deploy.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_mainnet_dl_r1"
AUDIT_EV="$ROOT/evidence/GO_ttg_v9_audit"
DEPLOY_LOG="$EVIDENCE/deploy.forge.log"
MAINNET_CHAIN_ID=1
SCRIPT="src/ttg-v9/TtgV9DesignLockMainnet.s.sol:TtgV9DesignLockMainnet"
PIN="$AUDIT_EV/V9_MAINNET_DL_R1_BROADCAST_ARTIFACT_PIN.json"
AUTH="$AUDIT_EV/V9_OWNER_MAINNET_BROADCAST_AUTHORIZATION_RECORDED.json"
NORM_MARKETING="0xe1e732EfBf9B010a9204054467256d3d93f3CdD4"
NORM_TEAM="0x010365F0835323826569D61D0E13E6F8d25F6828"
NORM_TREASURY="0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736"
MAINNET_USDC="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
KEEP_SR="0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372"
KEEP_EF="0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6"
LEGACY_SAFE="0x96491aa894658ff7946506318c49F3c76b8f40e7"
LEGACY_P4CAP="0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF"
LEGACY_KEEP_TL="0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7"
TOTAL_25T="25000000000000000000000000000000"

fail() { echo "TTG_V9_DESIGN_LOCK_MAINNET: STOP $*" >&2; exit 2; }
ok() { echo "TTG_V9_DESIGN_LOCK_MAINNET: OK $*"; }

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
    val="${val%\"}"
    val="${val#\"}"
    val="${val%\'}"
    val="${val#\'}"
    [[ -z "$val" ]] && continue
    export "$key=$val"
  done < "$f"
}

mkdir -p "$EVIDENCE" "$AUDIT_EV"
[[ -f "$AUTH" ]] || fail "missing Owner auth stamp $AUTH"
[[ -f "$PIN" ]] || fail "missing artifact pin $PIN"
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
load_env_file "$ENV_FILE"

if ! is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_MAINNET_BROADCAST_OK=1"
fi
if is_truthy "${TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK:-}"; then
  fail "refusing Sepolia rehearsal flag on Mainnet"
fi

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY unset"

ok "pre-broadcast Exact Match gate"
python "$ROOT/scripts/dev/run-ttg-v9-mainnet-pre-broadcast-final-gate.py" || fail "pre-broadcast gate FAIL"

RPC_CANDIDATES=(
  "${CHAIN_RPC_URL}"
  "https://ethereum.publicnode.com"
  "https://ethereum-rpc.publicnode.com"
)
pick_mainnet_rpc() {
  local _rpc _cid
  for _rpc in "${RPC_CANDIDATES[@]}"; do
    [[ -n "$_rpc" ]] || continue
    _cid="$(cast chain-id --rpc-url "$_rpc" 2>/dev/null || true)"
    [[ "$_cid" == "$MAINNET_CHAIN_ID" ]] || continue
    echo "$_rpc"
    return 0
  done
  return 1
}
CHAIN_RPC_URL="$(pick_mainnet_rpc)" || fail "no working Mainnet RPC"
export CHAIN_RPC_URL
ok "rpc ready chain_id=1"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
[[ "${DEPLOYER,,}" == "${NORM_MARKETING,,}" ]] || fail "deployer $DEPLOYER != Norm Marketing"
CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL")"
[[ "$CHAIN_ID" == "$MAINNET_CHAIN_ID" ]] || fail "chain_id=$CHAIN_ID not Mainnet"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL")"
MIN_WEI="150000000000000000"
if [[ "$(python -c "print(int('${BAL_WEI}') < int('${MIN_WEI}'))")" == "True" ]]; then
  fail "deployer Mainnet ETH below 0.15 (have ${BAL_WEI} wei)"
fi
ok "deployer=$DEPLOYER funded"
[[ -z "${FEE_INGRESS:-}" ]] || fail "FEE_INGRESS env set — forbidden"

ok "broadcast Design Lock Mainnet"
DEPLOY_OK=0
for _try in 1 2 3; do
  if (
    cd "$ROOT/contracts"
    FOUNDRY_PROFILE=ttg_v9_broadcast forge script "$SCRIPT" \
      --rpc-url "$CHAIN_RPC_URL" \
      --private-key "$PRIVATE_KEY" \
      --sender "$DEPLOYER" \
      --chain-id "$MAINNET_CHAIN_ID" \
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
  CHAIN_RPC_URL="$(pick_mainnet_rpc)" || true
  [[ -n "${CHAIN_RPC_URL:-}" ]] || fail "lost Mainnet RPC"
  ok "deploy retry $_try"
  sleep 15
done
[[ "$DEPLOY_OK" == "1" ]] || fail "forge broadcast failed — see $DEPLOY_LOG"

parse_log() { grep -E "^[[:space:]]*$1[[:space:]]" "$DEPLOY_LOG" | awk '{print $NF}' | tail -1; }
USDC="$(parse_log usdc)"
TTG="$(parse_log ttg)"
VAULT="$(parse_log vault)"
MARKET="$(parse_log market)"
GOVERNOR="$(parse_log governor)"
TIMELOCK="$(parse_log timelock)"
POOL="$(parse_log projectPool)"
FEE_ROUTER="$(parse_log feeRouter)"
STAKE_POOL="$(parse_log stakePool)"
ID_BIND="$(parse_log idBind)"
ID_SEED="$(parse_log idSeed)"
ID_CALLER_SR="$(parse_log idCallerSr)"
ID_CALLER_EF="$(parse_log idCallerEf)"
DELAY_LOG="$(parse_log timelockDelay | awk '{print $1}' | tr -d '\r')"
FEE_INGRESS_LOG="$(parse_log feeIngress)"

[[ "$USDC" == "$MAINNET_USDC" ]] || fail "USDC pin mismatch $USDC"
[[ -n "$TTG" && -n "$TIMELOCK" && -n "$POOL" && -n "$FEE_ROUTER" ]] || fail "address parse incomplete"
[[ "${FEE_INGRESS_LOG,,}" == "0x0000000000000000000000000000000000000000" ]] || fail "FeeIngress must be zero"

{
  echo "USDC=$USDC"
  echo "TTG=$TTG"
  echo "VAULT=$VAULT"
  echo "MARKET=$MARKET"
  echo "GOVERNOR=$GOVERNOR"
  echo "TIMELOCK=$TIMELOCK"
  echo "POOL=$POOL"
  echo "FEE_ROUTER=$FEE_ROUTER"
  echo "STAKE_POOL=$STAKE_POOL"
  echo "ID_BIND=$ID_BIND"
  echo "ID_SEED=$ID_SEED"
  echo "ID_CALLER_SR=$ID_CALLER_SR"
  echo "ID_CALLER_EF=$ID_CALLER_EF"
  echo "TIMELOCK_DELAY=$DELAY_LOG"
  echo "DEPLOYER=$DEPLOYER"
  echo "KEEP_SETTLEMENT_ROUTER=$KEEP_SR"
  echo "KEEP_ESCROW_FACTORY=$KEEP_EF"
  echo "LEGACY_SAFE=$LEGACY_SAFE"
  echo "LEGACY_P4CAP=$LEGACY_P4CAP"
  echo "LEGACY_KEEP_TIMELOCK=$LEGACY_KEEP_TL"
  echo "FEE_INGRESS=0x0000000000000000000000000000000000000000"
} > "$EVIDENCE/addresses.env"
ok "addresses written"

export ROOT EVIDENCE AUDIT_EV CHAIN_RPC_URL PIN
export NORM_MARKETING NORM_TEAM NORM_TREASURY LEGACY_SAFE LEGACY_P4CAP KEEP_SR TOTAL_25T
python "$ROOT/scripts/dev/verify-ttg-v9-mainnet-dl-r1-phase1.py" || fail "phase1 verify FAIL"

ok "Phase1 deploy+schedule verified"
ok "NOT stamping V9_MAINNET_DEPLOYMENT_VERIFIED_STOP (48h execute + KEEP SR.setFeeRouter pending)"
ok "TT_PRODUCTION_GO unchanged / not authorized"
echo "TTG_V9_DESIGN_LOCK_MAINNET: STOP_AT_PHASE1_SCHEDULED"
