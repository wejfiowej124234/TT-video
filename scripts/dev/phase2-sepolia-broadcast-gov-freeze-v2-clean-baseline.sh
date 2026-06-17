#!/usr/bin/env bash
# Phase ② · Sepolia · GovFreeze V2 Clean Baseline 全新部署
#
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#   bash scripts/dev/phase2-sepolia-broadcast-gov-freeze-v2-clean-baseline.sh
#   bash scripts/dev/apply-gov-freeze-v2-sepolia-cutover.sh
#   bash scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVID_ROOT="$ROOT/evidence/GO_phase2_gov_freeze_v2_clean_baseline"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$EVID_ROOT/${TS}"
SEPOLIA_CHAIN_ID=11155111

fail() { echo "phase2-sepolia-broadcast-gov-freeze-v2: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-broadcast-gov-freeze-v2: OK $*"; }

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
[[ -n "${GOVERNANCE_TOKEN_ADDRESS:-}" ]] || fail "GOVERNANCE_TOKEN_ADDRESS required"
export GOV_FREEZE_V2_DEPLOY_NEW_TTG="${GOV_FREEZE_V2_DEPLOY_NEW_TTG:-1}"
export LEGACY_GOVERNANCE_TOKEN_ADDRESS="${LEGACY_GOVERNANCE_TOKEN_ADDRESS:-$GOVERNANCE_TOKEN_ADDRESS}"
[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL required"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY required"
[[ -n "${TIMELOCK_ADMIN_ADDRESS:-}" ]] || fail "TIMELOCK_ADMIN_ADDRESS required"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "chain_id=$CHAIN_ID (need Sepolia $SEPOLIA_CHAIN_ID)"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 0)"
MIN_WEI=$((300000000000000000))
if [[ "$BAL_WEI" =~ ^[0-9]+$ ]] && (( BAL_WEI < MIN_WEI )); then
  fail "deployer balance ${BAL_WEI} wei < 0.30 ETH (V2 full stack)"
fi

mkdir -p "$EVID"
LOG="$EVID/forge-broadcast-${TS}.log"

ADMIN_CODE="$(cast code "$TIMELOCK_ADMIN_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x")"
[[ "$TIMELOCK_ADMIN_ADDRESS" == "$DEPLOYER" ]] && fail "R-02: TIMELOCK_ADMIN_ADDRESS must not equal deployer"
[[ "$ADMIN_CODE" != "0x" ]] || fail "TIMELOCK_ADMIN_ADDRESS has no code"
[[ -n "${TIMELOCK_SAFE_OWNER_KEYS:-}" && "$TIMELOCK_SAFE_OWNER_KEYS" != *"..."* ]] \
  || fail "TIMELOCK_SAFE_OWNER_KEYS required for Safe Phase B"

echo "phase2-sepolia-broadcast-gov-freeze-v2: G24-P-05～09 pregate..."
bash "$ROOT/scripts/gates/check-g24-p-prerequisites-05-09-gov-freeze-sepolia.sh"
bash "$ROOT/scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh"

echo "phase2-sepolia-broadcast-gov-freeze-v2: dry-run..."
(
  cd "$ROOT/contracts"
  forge script script/DeployGovFreezeV2CleanBaseline.s.sol:DeployGovFreezeV2CleanBaseline \
    --rpc-url "$CHAIN_RPC_URL" -vv 2>&1 | tee "$EVID/dry-run-${TS}.log"
)

echo "phase2-sepolia-broadcast-gov-freeze-v2: broadcasting..."
(
  cd "$ROOT/contracts"
  forge script script/DeployGovFreezeV2CleanBaseline.s.sol:DeployGovFreezeV2CleanBaseline \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    -vv >>"$LOG" 2>&1
)
grep -q "ONCHAIN EXECUTION COMPLETE & SUCCESSFUL" "$LOG" || fail "broadcast did not complete — see $LOG"

grep_from_log() {
  local key="$1"
  grep -o "${key} 0x[a-fA-F0-9]\{40\}" "$LOG" 2>/dev/null | awk '{print $2}' | tail -1 || true
}

GOV_FREEZE_V2_TIMELOCK="$(grep_from_log GOV_FREEZE_V2_TIMELOCK)"
GOV_FREEZE_V2_GOVERNOR="$(grep_from_log GOV_FREEZE_V2_GOVERNOR_PROXY)"
GOV_FREEZE_V2_TREASURY="$(grep_from_log GOV_FREEZE_V2_TREASURY_P4_PROXY)"
GOV_FREEZE_V2_PRIMARY="$(grep_from_log GOV_FREEZE_V2_PRIMARY_MARKET_PROXY)"
GOV_FREEZE_V2_SEAT="$(grep_from_log GOV_FREEZE_V2_SEAT_REGISTRY_PROXY)"
GOV_FREEZE_V2_STAKE="$(grep_from_log GOV_FREEZE_V2_STAKE_POOL_PROXY)"
GOV_FREEZE_V2_TTG="$(grep_from_log GOV_FREEZE_V2_TTG_DEPLOYED)"
[[ -z "$GOV_FREEZE_V2_TTG" ]] && GOV_FREEZE_V2_TTG="$(grep_from_log GOV_FREEZE_V2_GOVERNANCE_TOKEN)"

[[ -n "$GOV_FREEZE_V2_TIMELOCK" ]] || fail "parse GOV_FREEZE_V2_TIMELOCK from log"
[[ -n "$GOV_FREEZE_V2_GOVERNOR" ]] || fail "parse GOV_FREEZE_V2_GOVERNOR from log"
[[ -n "$GOV_FREEZE_V2_STAKE" ]] || fail "parse GOV_FREEZE_V2_STAKE_POOL from log"
[[ -n "$GOV_FREEZE_V2_TTG" ]] && GOVERNANCE_TOKEN_ADDRESS="$GOV_FREEZE_V2_TTG"

# PM TTG inventory funded in deploy script when GOV_FREEZE_V2_DEPLOY_NEW_TTG=1
if [[ "${GOV_FREEZE_V2_DEPLOY_NEW_TTG:-0}" != "1" && -n "$GOV_FREEZE_V2_PRIMARY" ]]; then
  TTG_FUND="${GOV_FREEZE_V2_PRIMARY_MARKET_TTG_FUND:-2000000000000000000000000}"
  cast send "$GOVERNANCE_TOKEN_ADDRESS" \
    "transfer(address,uint256)" "$GOV_FREEZE_V2_PRIMARY" "$TTG_FUND" \
    --rpc-url "$CHAIN_RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    >>"$EVID/post-deploy-${TS}.log" 2>&1 || true
fi

export GOV_FREEZE_V2_TIMELOCK_ADDRESS="$GOV_FREEZE_V2_TIMELOCK"
export GOV_FREEZE_V2_GOVERNOR_ADDRESS="$GOV_FREEZE_V2_GOVERNOR"
export GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS="$GOV_FREEZE_V2_TREASURY"
export GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS="$GOV_FREEZE_V2_PRIMARY"
export GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS="$GOV_FREEZE_V2_SEAT"
export GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS="$GOV_FREEZE_V2_STAKE"
export GOV_FREEZE_V2_EVID_DIR="$EVID"

bash "$ROOT/scripts/dev/verify-gov-freeze-v2-sepolia-onchain.sh" || fail "verify-gov-freeze-v2"
bash "$ROOT/scripts/dev/verify-gov-freeze-v2-ttg-erc20-sepolia.sh" || fail "verify-gov-freeze-v2-ttg-erc20"

ENV_APPEND="$EVID/phase2-env-append-${TS}.env"
cat >"$ENV_APPEND" <<EOF
# GOV-FREEZE-V2-CLEAN-BASELINE · Sepolia ${TS}
GOV_FREEZE_V2_BASELINE_ACTIVE=1
GOV_FREEZE_V2_BASELINE_STAMP=${TS}
GOV_FREEZE_V2_DEPLOY_NEW_TTG=${GOV_FREEZE_V2_DEPLOY_NEW_TTG:-1}
GOV_FREEZE_V2_TIMELOCK_ADDRESS=${GOV_FREEZE_V2_TIMELOCK}
GOV_FREEZE_V2_GOVERNOR_ADDRESS=${GOV_FREEZE_V2_GOVERNOR}
GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS=${GOV_FREEZE_V2_TREASURY}
GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS=${GOV_FREEZE_V2_PRIMARY}
GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS=${GOV_FREEZE_V2_SEAT}
GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS=${GOV_FREEZE_V2_STAKE}
GOVERNANCE_TOKEN_ADDRESS=${GOVERNANCE_TOKEN_ADDRESS}
LEGACY_GOVERNANCE_TOKEN_ADDRESS=${LEGACY_GOVERNANCE_TOKEN_ADDRESS:-}
EOF

cat >"$EVID/PHASE2-GOV-FREEZE-V2-CLEAN-BASELINE.md" <<EOF
# Phase ② · GovFreeze V2 Clean Baseline · Sepolia

**Stamp:** ${TS}  
**Chain:** Sepolia (${SEPOLIA_CHAIN_ID})  
**Audit:** G24-CLEAN-BASELINE-01  
**Verify:** GOV_FREEZE_V2_SEPOLIA_ONCHAIN_VERIFY: PASS

| 组件 | 地址 |
|------|------|
| Timelock | ${GOV_FREEZE_V2_TIMELOCK} |
| Governor | ${GOV_FREEZE_V2_GOVERNOR} |
| Treasury P4 | ${GOV_FREEZE_V2_TREASURY} |
| Primary Market | ${GOV_FREEZE_V2_PRIMARY} |
| Seat Registry | ${GOV_FREEZE_V2_SEAT} |
| Stake Pool Proxy | ${GOV_FREEZE_V2_STAKE} |

**Stake Pool:** 10/10 jurisdictions bootstrapped at deploy · no Timelock patch  
**Allowed targets:** Governor · PM · TreasuryP4 · Seat · StakePool + TTG

**诚实边界:** ② Sepolia · ≠ ③ Production GO
EOF

ln -sfn "$TS" "$EVID_ROOT/latest" 2>/dev/null || echo "$TS" >"$EVID_ROOT/latest-stamp.txt"

ok "evidence → $EVID"
echo "TT_PHASE2_GOV_FREEZE_V2_CLEAN_BASELINE: OK stamp=${TS}"
echo "TT_GOV_FREEZE_V2_SEPOLIA_ADDRESSES: timelock=${GOV_FREEZE_V2_TIMELOCK} governor=${GOV_FREEZE_V2_GOVERNOR} stake_pool=${GOV_FREEZE_V2_STAKE}"
echo "Next: bash scripts/dev/apply-gov-freeze-v2-sepolia-cutover.sh"
