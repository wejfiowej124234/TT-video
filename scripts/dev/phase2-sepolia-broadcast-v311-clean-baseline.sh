#!/usr/bin/env bash
# Phase ② · Sepolia · V3.1.1 Clean Baseline（CLEAN_SEPOLIA_REDEPLOY）
#
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#   bash scripts/dev/phase2-sepolia-broadcast-v311-clean-baseline.sh
#   bash scripts/dev/apply-v311-sepolia-clean-cutover.sh
#
# HARD: PM usdcTreasury = GovernanceTreasuryP4Cap (forge script); refuse sink=Safe.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVID_ROOT="$ROOT/evidence/GO_phase2_v311_sepolia_clean_baseline"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$EVID_ROOT/${TS}"
SEPOLIA_CHAIN_ID=11155111

fail() { echo "phase2-sepolia-broadcast-v311: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-broadcast-v311: OK $*"; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

if ! is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 (Owner ② Sepolia authorize)"
fi

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"

load_env() {
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$ENV_FILE"
}

load_env

export USDC_TOKEN_ADDRESS="${USDC_TOKEN_ADDRESS:-${FUND_STACK_TOKEN_ADDRESS:-}}"
[[ -n "${USDC_TOKEN_ADDRESS:-}" ]] || fail "USDC_TOKEN_ADDRESS or FUND_STACK_TOKEN_ADDRESS required"
export V311_DEPLOY_NEW_TTG="${V311_DEPLOY_NEW_TTG:-${GOV_FREEZE_V2_DEPLOY_NEW_TTG:-1}}"
export LEGACY_GOVERNANCE_TOKEN_ADDRESS="${LEGACY_GOVERNANCE_TOKEN_ADDRESS:-${GOVERNANCE_TOKEN_ADDRESS:-}}"
[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL required"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY required"
[[ -n "${TIMELOCK_ADMIN_ADDRESS:-}" ]] || fail "TIMELOCK_ADMIN_ADDRESS required (Safe)"

# Refuse Safe-as-sink (root cause of T-05)
if [[ -n "${TREASURY_USDC_SINK_ADDRESS:-}" ]]; then
  SINK_LC="$(echo "$TREASURY_USDC_SINK_ADDRESS" | tr '[:upper:]' '[:lower:]')"
  ADMIN_LC="$(echo "$TIMELOCK_ADMIN_ADDRESS" | tr '[:upper:]' '[:lower:]')"
  if [[ "$SINK_LC" == "$ADMIN_LC" ]]; then
    fail "TREASURY_USDC_SINK_ADDRESS must NOT equal TIMELOCK_ADMIN/Safe — unset it; forge forces P4Cap"
  fi
  echo "phase2-sepolia-broadcast-v311: NOTE unset TREASURY_USDC_SINK_ADDRESS for deploy (sink forced to new P4Cap)"
  unset TREASURY_USDC_SINK_ADDRESS
fi

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "chain_id=$CHAIN_ID (need Sepolia $SEPOLIA_CHAIN_ID)"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 0)"
MIN_WEI=$((300000000000000000))
if [[ "$BAL_WEI" =~ ^[0-9]+$ ]] && (( BAL_WEI < MIN_WEI )); then
  fail "deployer balance ${BAL_WEI} wei < 0.30 ETH"
fi

mkdir -p "$EVID"
LOG="$EVID/forge-broadcast-${TS}.log"

ADMIN_CODE="$(cast code "$TIMELOCK_ADMIN_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x")"
[[ "$TIMELOCK_ADMIN_ADDRESS" == "$DEPLOYER" ]] && fail "TIMELOCK_ADMIN_ADDRESS must not equal deployer"
[[ "$ADMIN_CODE" != "0x" ]] || fail "TIMELOCK_ADMIN_ADDRESS has no code (expect Safe)"
[[ -n "${TIMELOCK_SAFE_OWNER_KEYS:-}" && "$TIMELOCK_SAFE_OWNER_KEYS" != *"..."* ]] \
  || fail "TIMELOCK_SAFE_OWNER_KEYS required for Safe allow path"

ok "pregate · CLEAN_SEPOLIA_REDEPLOY · sink=P4Cap forced"
bash "$ROOT/scripts/gates/check-g24-p-prerequisites-05-09-gov-freeze-sepolia.sh"
bash "$ROOT/scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh"

echo "phase2-sepolia-broadcast-v311: dry-run..."
(
  cd "$ROOT/contracts"
  forge script script/DeployV311SepoliaCleanBaseline.s.sol:DeployV311SepoliaCleanBaseline \
    --rpc-url "$CHAIN_RPC_URL" -vv 2>&1 | tee "$EVID/dry-run-${TS}.log"
)

echo "phase2-sepolia-broadcast-v311: broadcasting..."
(
  cd "$ROOT/contracts"
  forge script script/DeployV311SepoliaCleanBaseline.s.sol:DeployV311SepoliaCleanBaseline \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    -vv >>"$LOG" 2>&1
)
grep -q "ONCHAIN EXECUTION COMPLETE & SUCCESSFUL" "$LOG" || fail "broadcast did not complete — see $LOG"

grep_from_log() {
  local key="$1"
  grep -o "${key} 0x[a-fA-F0-9]\{40\}" "$LOG" 2>/dev/null | awk '{print $2}' | tail -1 || true
}

V311_TIMELOCK="$(grep_from_log V311_TIMELOCK)"
V311_GOVERNOR="$(grep_from_log V311_GOVERNOR_PROXY)"
V311_TREASURY="$(grep_from_log V311_TREASURY_P4_PROXY)"
V311_PRIMARY="$(grep_from_log V311_PRIMARY_MARKET_PROXY)"
V311_SEAT="$(grep_from_log V311_SEAT_REGISTRY_PROXY)"
V311_STAKE="$(grep_from_log V311_STAKE_POOL_PROXY)"
V311_TTG="$(grep_from_log V311_TTG_DEPLOYED)"
[[ -z "$V311_TTG" ]] && V311_TTG="$(grep_from_log V311_GOVERNANCE_TOKEN)"
V311_SINK="$(grep_from_log V311_USDC_SINK_P4CAP)"

[[ -n "$V311_TIMELOCK" ]] || fail "parse V311_TIMELOCK"
[[ -n "$V311_GOVERNOR" ]] || fail "parse V311_GOVERNOR"
[[ -n "$V311_TREASURY" ]] || fail "parse V311_TREASURY_P4"
[[ -n "$V311_PRIMARY" ]] || fail "parse V311_PRIMARY_MARKET"
[[ -n "$V311_STAKE" ]] || fail "parse V311_STAKE_POOL"
[[ -n "$V311_TTG" ]] || fail "parse V311_GOVERNANCE_TOKEN"
[[ -n "$V311_SINK" ]] || V311_SINK="$V311_TREASURY"

# On-chain verify: sink == P4Cap · caps
SINK_LIVE="$(cast call "$V311_PRIMARY" "usdcTreasury()(address)" --rpc-url "$CHAIN_RPC_URL" | tr '[:upper:]' '[:lower:]')"
P4_LC="$(echo "$V311_TREASURY" | tr '[:upper:]' '[:lower:]')"
[[ "$SINK_LIVE" == "$P4_LC" ]] || fail "usdcTreasury=$SINK_LIVE != P4Cap=$P4_LC"
CAP0="$(cast call "$V311_PRIMARY" "roundCapTtg(uint256)(uint256)" 0 --rpc-url "$CHAIN_RPC_URL")"
CAP1="$(cast call "$V311_PRIMARY" "roundCapTtg(uint256)(uint256)" 1 --rpc-url "$CHAIN_RPC_URL")"
CAP2="$(cast call "$V311_PRIMARY" "roundCapTtg(uint256)(uint256)" 2 --rpc-url "$CHAIN_RPC_URL")"
ok "sink=P4Cap · caps raw cap0=$CAP0 cap1=$CAP1 cap2=$CAP2"

ENV_APPEND="$EVID/phase2-env-append-${TS}.env"
cat >"$ENV_APPEND" <<EOF
# V311-SEPOLIA-CLEAN-BASELINE · Sepolia ${TS}
V311_SEPOLIA_CLEAN_BASELINE_ACTIVE=1
V311_SEPOLIA_CLEAN_BASELINE_STAMP=${TS}
V311_DEPLOY_NEW_TTG=${V311_DEPLOY_NEW_TTG}
V311_TIMELOCK_ADDRESS=${V311_TIMELOCK}
V311_GOVERNOR_ADDRESS=${V311_GOVERNOR}
V311_TREASURY_P4_CAP_ADDRESS=${V311_TREASURY}
V311_PRIMARY_MARKET_ADDRESS=${V311_PRIMARY}
V311_SEAT_REGISTRY_ADDRESS=${V311_SEAT}
V311_STAKE_POOL_PROXY_ADDRESS=${V311_STAKE}
GOVERNANCE_TOKEN_ADDRESS=${V311_TTG}
TREASURY_USDC_SINK_ADDRESS=${V311_TREASURY}
TIMELOCK_ADDRESS=${V311_TIMELOCK}
GOVERNOR_ADDRESS=${V311_GOVERNOR}
PRIMARY_MARKET_ADDRESS=${V311_PRIMARY}
LEGACY_GOVERNANCE_TOKEN_ADDRESS=${LEGACY_GOVERNANCE_TOKEN_ADDRESS:-}
EOF

echo "$TS" >"$EVID_ROOT/latest-stamp.txt"
cat >"$EVID/PHASE2-V311-SEPOLIA-CLEAN-BASELINE.md" <<EOF
# Phase ② · V3.1.1 Clean Sepolia Baseline

**Stamp:** ${TS}  
**Chain:** Sepolia (${SEPOLIA_CHAIN_ID})  
**Path:** CLEAN_SEPOLIA_REDEPLOY  
**Sink:** ${V311_TREASURY} (== P4Cap)  
**Gaps still OPEN until cutover + Full Alignment:** T-04 · T-05 · DEP-01 · R-01  

| Role | Address |
|------|---------|
| Timelock | ${V311_TIMELOCK} |
| Governor | ${V311_GOVERNOR} |
| P4Cap | ${V311_TREASURY} |
| Primary Market | ${V311_PRIMARY} |
| Seat Registry | ${V311_SEAT} |
| Stake Pool | ${V311_STAKE} |
| TTG | ${V311_TTG} |
EOF

ok "broadcast complete · evidence $EVID"
echo "NEXT: bash scripts/dev/apply-v311-sepolia-clean-cutover.sh"
echo "THEN: BE/FE/IX Re-Alignment · do NOT close gaps until Full Alignment PASS"
