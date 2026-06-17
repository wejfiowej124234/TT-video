#!/usr/bin/env bash
# ② Sepolia · CP NetProfit Treasury cutover (C) + DE accrue→split drill (B)
#
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#   bash scripts/dev/phase2-sepolia-cp-netprofit-cutover-and-drill.sh
#   bash scripts/dev/phase2-sepolia-cp-netprofit-cutover-and-drill.sh --cutover-only
#   bash scripts/dev/phase2-sepolia-cp-netprofit-cutover-and-drill.sh --drill-only
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
SEPOLIA_CHAIN_ID=11155111
TS="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/cutover-drill/${TS}"
mkdir -p "$EVID"

RUN_CUTOVER=1
RUN_DRILL=1
for arg in "$@"; do
  case "$arg" in
    --cutover-only) RUN_DRILL=0 ;;
    --drill-only) RUN_CUTOVER=0 ;;
  esac
done

fail() { echo "CP_CUTOVER_DRILL: FAIL $*" | tee -a "$EVID/run.log" >&2; exit 2; }
step() { echo "CP_CUTOVER_DRILL: $*" | tee -a "$EVID/run.log"; }

is_truthy() {
  case "${1:-}" in 1|true|TRUE|yes|YES|on|ON) return 0 ;; *) return 1 ;; esac
}
is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}" || fail "set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1"

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

export CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK="${CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK:-${LEGACY_PRE_GOVFREEZE_V2_TIMELOCK_ADDRESS:-0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f}}"
export GOV_FREEZE_V2_TIMELOCK_ADDRESS="${GOV_FREEZE_V2_TIMELOCK_ADDRESS:-${TIMELOCK_ADDRESS:-}}"
export CP_RUN_CUTOVER="$RUN_CUTOVER"
export CP_RUN_DRILL="$RUN_DRILL"
export CP_DRILL_FUNDING_SOURCE="${CP_DRILL_FUNDING_SOURCE:-$(cast wallet address --private-key "$PRIVATE_KEY")}"
export CHAIN_RPC_URL="${CHAIN_RPC_URL:-https://sepolia.drpc.org}"

[[ -n "${COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS:-}" ]] || fail "COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS unset"
[[ -n "${TIMELOCK_ADMIN_ADDRESS:-}" ]] || fail "TIMELOCK_ADMIN_ADDRESS unset"
[[ -n "${TIMELOCK_SAFE_OWNER_KEYS:-}" ]] || fail "TIMELOCK_SAFE_OWNER_KEYS unset"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "chain_id=$CHAIN_ID"

step "0 · pre-state snapshot"
python "$ROOT/scripts/dev/lib/cp-revenue-cutover-drill-snapshot.py" --out "$EVID/pre-state.json"

OWNER="$(cast call "$COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS" "owner()(address)" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"
[[ "${OWNER,,}" == "${CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK,,}" ]] || fail "ledger owner=$OWNER expected $CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK"

TL_DELAY="$(cast call "$CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK" "delay()(uint256)" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"

step "1 · schedule cutover+drill via Safe → legacy Timelock"
(
  cd "$ROOT/contracts"
  forge script script/CpNetProfitSepoliaCutoverAndDrill.s.sol:CpNetProfitSepoliaCutoverAndDrill \
    --rpc-url "$CHAIN_RPC_URL" --broadcast --slow -vv 2>&1 | tee "$EVID/forge-schedule-${TS}.log"
)

step "2 · wait timelock delay=${TL_DELAY}s + execute queued ops"
WAIT=$((TL_DELAY + 15))
step "   sleeping ${WAIT}s"
sleep "$WAIT"

python "$ROOT/scripts/dev/lib/cp-revenue-parse-drill-epoch-from-broadcast.py" "$EVID/drill-epoch-params.json" >>"$EVID/run.log" 2>&1 || true

bash "$ROOT/scripts/dev/lib/cp-revenue-execute-timelock-batch.sh" \
  --timelock "$CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK" \
  --ledger "$COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS" \
  --evid "$EVID" \
  --run-cutover "$RUN_CUTOVER" \
  --run-drill "$RUN_DRILL" 2>&1 | tee -a "$EVID/execute-${TS}.log"

step "3 · post-state + four-layer fund flow evidence"
python "$ROOT/scripts/dev/lib/cp-revenue-cutover-drill-snapshot.py" --out "$EVID/post-state.json" --epoch 1
python "$ROOT/scripts/dev/lib/cp-revenue-cutover-drill-snapshot.py" --verify --pre "$EVID/pre-state.json" --post "$EVID/post-state.json" --out "$EVID/fund-flow-verdict.json"

echo "$TS" >"$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/cutover-drill/latest-stamp.txt"
step "DONE evidence=$EVID"
cat "$EVID/fund-flow-verdict.json" | tee -a "$EVID/run.log"
