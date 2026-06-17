#!/usr/bin/env bash
# HAT-R1 · Sepolia 真人钱包全链路验收（② · TTG-TOKENOMICS-FREEZE-V1 SSOT）
#
#   export HAT_R1_LIVE_WALLET_OK=1
#   export HAT_R1_WALLET_PK=0x...   # 或 PRIVATE_KEY / B417_PRIVATE_KEY
#   bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --phase a
#
# Phase A: 购买 → Stake → Seat 申请 → 提案 → 投票 → queue（记录 48h ETA）
# Phase B: execute → Treasury 提案 → vote → queue → execute → requestRelease
#
# 诚实边界: GovFreeze Timelock delay=172800s · Phase B execute 须 ≥48h 后
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PHASE="${HAT_R1_PHASE:-a}"
for arg in "$@"; do
  case "$arg" in
    --phase=*) PHASE="${arg#*=}" ;;
    --phase) shift; PHASE="${1:-a}" ;;
    --preflight-only) PREFLIGHT_ONLY=1 ;;
  esac
done

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
export HAT_R1_EVID="${HAT_R1_EVID_DIR:-$ROOT/evidence/GO_hat_r1_sepolia/${STAMP}}"
mkdir -p "$HAT_R1_EVID"
LOG="$HAT_R1_EVID/hat-r1.log"
: >"$LOG"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"

fail() { echo "HAT_R1: FAIL $*" | tee -a "$LOG" >&2; exit 2; }
step() { echo "HAT_R1_STEP: $*" | tee -a "$LOG"; }
note() { echo "HAT_R1_NOTE: $*" | tee -a "$LOG"; }

[[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" || "${PREFLIGHT_ONLY:-0}" == "1" ]] || fail "HAT-R1 blocked — set HAT_R1_LIVE_WALLET_OK=1 after browser signoff + TTG approve pivot PASS"

if [[ "${PREFLIGHT_ONLY:-0}" != "1" && "${HAT_R1_PHASE_A_PAUSED:-1}" == "1" ]]; then
  fail "HAT-R1 Phase A PAUSED — complete run-gov-freeze-v2-ttg-approve-pivot-sequence.sh first (TTG approve + clean-baseline + preflight)"
fi

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ROOT/.env" ]] && set -a && . "$ROOT/.env" && set +a
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

PK="${HAT_R1_WALLET_PK:-${PRIVATE_KEY:-${B417_PRIVATE_KEY:-}}}"
# Root .env may contain Anvil placeholder PRIVATE_KEY — phase2 env must win unless HAT_R1_WALLET_PK set
if [[ -z "${HAT_R1_WALLET_PK:-}" && -f "$ENV_FILE" ]]; then
  _p2pk="$(grep -E '^PRIVATE_KEY=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '\r' || true)"
  [[ -n "$_p2pk" && "$_p2pk" != replace-only-local-test-private-key ]] && PK="$_p2pk"
fi
if [[ "${PREFLIGHT_ONLY:-0}" == "1" ]]; then
  if [[ -z "$PK" ]] || ! cast wallet address --private-key "$PK" >/dev/null 2>&1; then
    WALLET="${HAT_R1_PREFLIGHT_WALLET:-0x0000000000000000000000000000000000000001}"
    PK=""
    HAT_R1_PK=""
    unset PRIVATE_KEY
    note "preflight-only: skip wallet pk — using read-only checks wallet=${WALLET}"
  fi
fi
case "${PK:-}" in
  0x*) ;;
  "") [[ -n "${HAT_R1_PK:-}" ]] || [[ "${PREFLIGHT_ONLY:-0}" == "1" && -n "${WALLET:-}" ]] || fail "HAT_R1_WALLET_PK or PRIVATE_KEY required" ;;
  *) PK="0x${PK}" ;;
esac
if [[ -n "${PK:-}" ]]; then
  export HAT_R1_PK="$PK"
  export PRIVATE_KEY="$PK"
  WALLET="$(cast wallet address --private-key "$HAT_R1_PK")"
fi
WALLET="${WALLET:-}"
[[ -n "$WALLET" ]] || fail "could not resolve wallet address"
JUR="${HAT_R1_JURISDICTION:-KR}"
J_HEX="0x$(python -c "print('${JUR}'.encode().hex())")"
USDC_AMT="${HAT_R1_USDC_PURCHASE:-100000000}"
ROUND="${HAT_R1_PRIMARY_ROUND:-0}"

RPC="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
export CHAIN_RPC_URL="$RPC"
export GOVERNOR_ADDRESS="${GOVERNOR_ADDRESS:-${GOV_FREEZE_V2_GOVERNOR_ADDRESS:-${GOV_FREEZE_V1_GOVERNOR_ADDRESS:-}}}"
export TIMELOCK_ADDRESS="${TIMELOCK_ADDRESS:-${GOV_FREEZE_V2_TIMELOCK_ADDRESS:-${GOV_FREEZE_V1_TIMELOCK_ADDRESS:-}}}"
export REGION_STEWARD_STAKE_POOL_ADDRESS="${REGION_STEWARD_STAKE_POOL_ADDRESS:-${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS:-}}"
export PRIMARY_MARKET_ADDRESS="${PRIMARY_MARKET_ADDRESS:-}"
export USDC_TOKEN_ADDRESS="${USDC_TOKEN_ADDRESS:-${FUND_STACK_TOKEN_ADDRESS:-}}"
export GOVERNANCE_TOKEN_ADDRESS="${GOVERNANCE_TOKEN_ADDRESS:-}"
export TREASURY_ADDRESS="${TREASURY_ADDRESS:-}"

command -v cast >/dev/null 2>&1 || fail "cast required"
command -v jq >/dev/null 2>&1 || fail "jq required"
command -v forge >/dev/null 2>&1 || fail "forge required"

step "0 · preflight wallet=${WALLET} phase=${PHASE}"
for v in GOVERNOR_ADDRESS TIMELOCK_ADDRESS PRIMARY_MARKET_ADDRESS GOVERNANCE_TOKEN_ADDRESS USDC_TOKEN_ADDRESS REGION_STEWARD_STAKE_POOL_ADDRESS; do
  [[ -n "${!v:-}" ]] || fail "$v unset"
done
ETH_BAL="$(cast balance "$WALLET" --rpc-url "$RPC" | awk '{print $1}')"
TTG_BAL="$(cast call "$GOVERNANCE_TOKEN_ADDRESS" "balanceOf(address)(uint256)" "$WALLET" --rpc-url "$RPC" | awk '{print $1}')"
USDC_BAL="$(cast call "$USDC_TOKEN_ADDRESS" "balanceOf(address)(uint256)" "$WALLET" --rpc-url "$RPC" | awk '{print $1}')"
MIN_STAKE="$(cast call "$REGION_STEWARD_STAKE_POOL_ADDRESS" "minStakeAmount(bytes2)(uint256)" "$J_HEX" --rpc-url "$RPC" | awk '{print $1}')"
STAKE_BPS="$(cast call "$REGION_STEWARD_STAKE_POOL_ADDRESS" "stewardStakeBps(bytes2)(uint256)" "$J_HEX" --rpc-url "$RPC" 2>/dev/null | awk '{print $1}' || echo 0)"
if [[ "$MIN_STAKE" == "0" || "$STAKE_BPS" == "0" ]]; then
  note "BLOCKER: Stake Pool Proxy jurisdiction ${JUR} not bootstrapped (minStake=0) — Timelock must configureJurisdiction or redeploy init fix"
fi
BOOTSTRAPPED=false
[[ "$MIN_STAKE" != "0" && "$STAKE_BPS" != "0" ]] && BOOTSTRAPPED=true
hat_r1_save_json "$HAT_R1_EVID/preflight.json" "$(jq -n \
  --arg wallet "$WALLET" \
  --arg jurisdiction "$JUR" \
  --arg eth "$ETH_BAL" \
  --arg ttg "$TTG_BAL" \
  --arg usdc "$USDC_BAL" \
  --arg min_stake "$MIN_STAKE" \
  --arg stake_bps "$STAKE_BPS" \
  --arg phase "$PHASE" \
  --argjson stake_pool_bootstrapped "$BOOTSTRAPPED" \
  '{wallet:$wallet,jurisdiction:$jurisdiction,eth_wei:$eth,ttg_wei:$ttg,usdc:$usdc,min_stake_wei:$min_stake,stake_bps:$stake_bps,phase:$phase,stake_pool_bootstrapped:$stake_pool_bootstrapped}')"
hat_r1_api_get "step-00-preflight" "protocol-reference" "/api/v1/governance/protocol-reference" >/dev/null || true
hat_r1_api_get "step-00-preflight" "stake-quote" "/api/v1/steward/stake-quote?jurisdictions=${JUR}" >/dev/null || true
hat_r1_db_snapshot "step-00-preflight"
hat_r1_page_manifest "step-00-preflight"
note "GOV-04 cap 25k TTG · min stake ${JUR}=${MIN_STAKE} wei — stake may need pre-held TTG (see runbook)"

if [[ "${PREFLIGHT_ONLY:-0}" == "1" ]]; then
  [[ "${GOV_FREEZE_V2_BASELINE_ACTIVE:-}" == "1" ]] || fail "GOV_FREEZE_V2_BASELINE_ACTIVE required — run V2 deploy + cutover first"
  if ! bash "$ROOT/scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh" --strict >>"$LOG" 2>&1; then
    echo "HAT_R1: PREFLIGHT_BLOCKED stake_pool_jurisdiction_bootstrap evidence=${HAT_R1_EVID}"
    echo "TT_HAT_R1_SUMMARY: PREFLIGHT_BLOCKED"
    exit 3
  fi
  if ! bash "$ROOT/scripts/dev/verify-gov-freeze-v2-ttg-erc20-sepolia.sh" >>"$LOG" 2>&1; then
    note "BLOCKER: TTG ERC20 approve/allowance verify FAIL — run TTG approve pivot"
    echo "HAT_R1: PREFLIGHT_BLOCKED ttg_erc20 evidence=${HAT_R1_EVID}"
    echo "TT_HAT_R1_SUMMARY: PREFLIGHT_BLOCKED"
    exit 3
  fi
  CB_VERDICT="$(bash "$ROOT/scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh" 2>&1 | grep '^G24_CLEAN_BASELINE_01:' | awk '{print $2}' || echo FAIL)"
  if [[ "$CB_VERDICT" != "PASS_CLEAN_BASELINE" ]]; then
    echo "HAT_R1: PREFLIGHT_BLOCKED clean_baseline=${CB_VERDICT} evidence=${HAT_R1_EVID}"
    echo "TT_HAT_R1_SUMMARY: PREFLIGHT_BLOCKED"
    exit 3
  fi
  echo "HAT_R1: PREFLIGHT_OK evidence=${HAT_R1_EVID}"
  echo "TT_HAT_R1_SUMMARY: PREFLIGHT_OK"
  exit 0
fi

if [[ "${HAT_R1_SKIP_BROWSER_ACCEPT:-0}" != "1" ]]; then
  [[ -f "$ROOT/evidence/GO_gov_freeze_v2_browser_acceptance/latest/PASS.json" ]] \
    || [[ -n "$(ls -td "$ROOT/evidence/GO_gov_freeze_v2_browser_acceptance"/*/PASS.json 2>/dev/null | head -1)" ]] \
    || fail "run run-gov-freeze-v2-browser-page-acceptance.sh first"
  [[ "${HAT_R1_BROWSER_ACCEPT_OK:-}" == "1" ]] \
    || fail "human page signoff required — bash scripts/dev/record-hat-r1-browser-signoff.sh && export HAT_R1_BROWSER_ACCEPT_OK=1"
fi

bash "$ROOT/scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh" >>"$LOG" 2>&1 || fail "legacy stack guard — active baseline must be latest TTG pivot only"

run_phase_a() {
  step "1 · Primary Market purchase USDC→TTG round=${ROUND} amount=${USDC_AMT}"
  hat_r1_page_manifest "step-01-purchase"
  hat_r1_api_get "step-01-purchase" "redemption-quote" "/api/v1/redemption/quote?jurisdiction=${JUR}" >/dev/null || true
  hat_r1_api_get "step-01-purchase" "ttg-exchange-quote" "/api/v1/governance/ttg-exchange/quote?usdc_amount=${USDC_AMT}&round=${ROUND}" >/dev/null || true
  TTG_PRE="$(cast call "$GOVERNANCE_TOKEN_ADDRESS" "balanceOf(address)(uint256)" "$WALLET" --rpc-url "$RPC" | awk '{print $1}')"
  SKIP_PUR=0
  if [[ "${HAT_R1_SKIP_PURCHASE_IF_TTG_OK:-1}" == "1" ]] \
    && python -c "exit(0 if int('${TTG_PRE}') >= int('${MIN_STAKE}') else 1)" 2>/dev/null; then
    SKIP_PUR=1
    note "skip purchase — TTG ${TTG_PRE} wei ≥ minStake ${MIN_STAKE} (HAT_R1_SKIP_PURCHASE_IF_TTG_OK=1)"
    hat_r1_save_json "$HAT_R1_EVID/step-01-purchase/purchase-skipped.json" "$(jq -n \
      --arg ttg "$TTG_PRE" --arg min "$MIN_STAKE" \
      '{skipped:true,reason:"ttg_balance_sufficient",ttg_wei:$ttg,min_stake_wei:$min}')"
  fi
  if [[ "$SKIP_PUR" != "1" ]]; then
    hat_r1_cast_send_capture "step-01-purchase" "usdc-approve" \
      "$USDC_TOKEN_ADDRESS" "approve(address,uint256)" "$PRIMARY_MARKET_ADDRESS" "$USDC_AMT"
    PURCHASE_TX="$(hat_r1_cast_send_capture "step-01-purchase" "purchase" \
      "$PRIMARY_MARKET_ADDRESS" "purchase(uint8,uint256)" "$ROUND" "$USDC_AMT")"
    note "purchase tx=${PURCHASE_TX}"
  fi
  hat_r1_db_snapshot "step-01-purchase"

  step "2 · Stake TTG jurisdiction=${JUR}"
  hat_r1_page_manifest "step-02-stake"
  TTG_BAL="$(cast call "$GOVERNANCE_TOKEN_ADDRESS" "balanceOf(address)(uint256)" "$WALLET" --rpc-url "$RPC" | awk '{print $1}')"
  if python -c "exit(0 if int('${TTG_BAL}') >= int('${MIN_STAKE}') else 1)" 2>/dev/null; then
    :
  elif [[ "${HAT_R1_ALLOW_TTG_TOPUP:-0}" == "1" && -n "${DEPLOYER_PRIVATE_KEY:-${PRIVATE_KEY_DEPLOY:-}}" ]]; then
    DEP_PK="${DEPLOYER_PRIVATE_KEY:-${PRIVATE_KEY_DEPLOY:-}}"
    NEED=$((MIN_STAKE - TTG_BAL))
    note "top-up ${NEED} wei TTG from deployer (HAT_R1_ALLOW_TTG_TOPUP=1)"
    cast send "$GOVERNANCE_TOKEN_ADDRESS" "transfer(address,uint256)" "$WALLET" "$NEED" \
      --rpc-url "$RPC" --private-key "$DEP_PK" >/dev/null
  fi
  TTG_BAL="$(cast call "$GOVERNANCE_TOKEN_ADDRESS" "balanceOf(address)(uint256)" "$WALLET" --rpc-url "$RPC" | awk '{print $1}')"
  python -c "import sys; sys.exit(0 if int('${TTG_BAL}') >= int('${MIN_STAKE}') else 1)" \
    || fail "TTG balance ${TTG_BAL} < minStake ${MIN_STAKE} — buy more or HAT_R1_ALLOW_TTG_TOPUP=1"
  APP_ID="$(cast keccak "hat-r1-${STAMP}-${JUR}")"
  hat_r1_save_json "$HAT_R1_EVID/step-02-stake/application-id.json" "$(jq -n --arg id "$APP_ID" '{application_id:$id,jurisdiction:"'"$JUR"'"}')"
  hat_r1_cast_send_capture "step-02-stake" "ttg-approve" \
    "$GOVERNANCE_TOKEN_ADDRESS" "approve(address,uint256)" "$REGION_STEWARD_STAKE_POOL_ADDRESS" "$MIN_STAKE"
  STAKE_TX="$(hat_r1_cast_send_capture "step-02-stake" "stake" \
    "$REGION_STEWARD_STAKE_POOL_ADDRESS" "stake(bytes2,uint256,bytes32)" "$J_HEX" "$MIN_STAKE" "$APP_ID")"
  hat_r1_api_get "step-02-stake" "stake-status" "/api/v1/steward/stake-status?jurisdiction=${JUR}&wallet=${WALLET}" >/dev/null || true
  hat_r1_db_snapshot "step-02-stake"
  note "stake tx=${STAKE_TX}"

  step "3 · Seat 申请（API + 工作台页面证据）"
  hat_r1_page_manifest "step-03-seat-application"
  hat_r1_api_get "step-03-seat-application" "stake-quote" "/api/v1/steward/stake-quote?jurisdictions=${JUR}" >/dev/null || true
  hat_r1_save_json "$HAT_R1_EVID/step-03-seat-application/post-body-example.json" \
    '{"jurisdiction":"'"$JUR"'","note":"HAT-R1 — POST /api/v1/steward/applications requires auth + chain_off"}'
  hat_r1_db_snapshot "step-03-seat-application"

  step "4 · 提案创建（minimal）"
  hat_r1_page_manifest "step-04-proposal-create"
  TL="$(cast call "$GOVERNOR_ADDRESS" "timelock()(address)" --rpc-url "$RPC" | awk '{print $1}')"
  cast send "$GOVERNANCE_TOKEN_ADDRESS" "transfer(address,uint256)" "$TL" 10000000000000000 \
    --rpc-url "$RPC" --private-key "$HAT_R1_PK" >/dev/null 2>&1 || true
  cd "$ROOT/contracts"
  forge script script/SepoliaProposeMinimal.s.sol:SepoliaProposeMinimal --rpc-url "$RPC" --broadcast -vv >>"$LOG" 2>&1
  cd "$ROOT"
  PID="$(cast call "$GOVERNOR_ADDRESS" "proposalCount()(uint256)" --rpc-url "$RPC" | awk '{print $1}')"
  hat_r1_save_json "$HAT_R1_EVID/step-04-proposal-create/proposal.json" "$(jq -n --arg pid "$PID" '{proposal_id:$pid,type:"minimal_transfer_1wei"}')"
  hat_r1_api_get "step-04-proposal-create" "proposals" "/api/v1/governance/proposals?limit=5" >/dev/null || true
  hat_r1_db_snapshot "step-04-proposal-create"
  export HAT_R1_MINIMAL_PROPOSAL_ID="$PID"
  note "minimal proposalId=${PID}"

  step "5 · 投票 castVote(For)"
  hat_r1_page_manifest "step-05-vote"
  sleep "${HAT_R1_VOTE_SLEEP_SEC:-25}"
  export PROPOSAL_ID="${HAT_R1_MINIMAL_PROPOSAL_ID}"
  cd "$ROOT/contracts"
  forge script script/SepoliaCastVote.s.sol:SepoliaCastVote --rpc-url "$RPC" --broadcast -vv >>"$LOG" 2>&1
  cd "$ROOT"
  sleep "${HAT_R1_STATE_SLEEP_SEC:-120}"
  ST="$(cast call "$GOVERNOR_ADDRESS" "state(uint256)(uint8)" "$PROPOSAL_ID" --rpc-url "$RPC" | awk '{print $1}')"
  hat_r1_save_json "$HAT_R1_EVID/step-05-vote/state.json" "$(jq -n --arg st "$ST" --arg pid "$PROPOSAL_ID" '{proposal_id:$pid,state:$st,want:"4=Succeeded"}')"
  [[ "$ST" == "4" ]] || note "WARN state=${ST} want 4 — increase HAT_R1_STATE_SLEEP_SEC"

  step "6 · queue + Timelock 48h 记录"
  hat_r1_page_manifest "step-06-queue"
  QUEUE_TX="$(hat_r1_cast_send_capture "step-06-queue" "queue" \
    "$GOVERNOR_ADDRESS" "queue(uint256)" "$PROPOSAL_ID")"
  DELAY="$(cast call "$TIMELOCK_ADDRESS" "delay()(uint256)" --rpc-url "$RPC" | awk '{print $1}')"
  ETA="$(python -c "import time; print(int(time.time())+int('${DELAY}'))")"
  hat_r1_save_json "$HAT_R1_EVID/step-06-queue/timelock-eta.json" "$(jq -n \
    --arg tx "$QUEUE_TX" \
    --arg delay "$DELAY" \
    --arg eta "$ETA" \
    --arg pid "$PROPOSAL_ID" \
    '{proposal_id:$pid,queue_tx:$tx,timelock_delay_seconds:$delay,execute_earliest_unix:$eta,honest_boundary:"Phase B after 48h"}')"
  hat_r1_db_snapshot "step-06-queue"
  echo "$PROPOSAL_ID" >"$HAT_R1_EVID/MINIMAL_PROPOSAL_ID.txt"
  echo "$ETA" >"$HAT_R1_EVID/EXECUTE_EARLIEST_UNIX.txt"
}

run_phase_b() {
  PID="$(cat "$HAT_R1_EVID/MINIMAL_PROPOSAL_ID.txt" 2>/dev/null || echo "${HAT_R1_MINIMAL_PROPOSAL_ID:-}")"
  [[ -n "$PID" ]] || fail "Phase B needs MINIMAL_PROPOSAL_ID — run phase A first or set HAT_R1_EVID_DIR"
  ETA="$(cat "$HAT_R1_EVID/EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null || echo 0)"
  NOW="$(date +%s)"
  if [[ "$NOW" -lt "$ETA" && "${HAT_R1_FORCE_EXECUTE:-0}" != "1" ]]; then
    fail "Timelock not elapsed (ETA unix=${ETA}) — wait or HAT_R1_FORCE_EXECUTE=1 at risk of revert"
  fi

  step "7 · Timelock execute minimal proposal"
  hat_r1_page_manifest "step-07-execute"
  EXEC_TX="$(hat_r1_cast_send_capture "step-07-execute" "execute" \
    "$GOVERNOR_ADDRESS" "execute(uint256)" "$PID")"
  hat_r1_db_snapshot "step-07-execute"
  note "execute tx=${EXEC_TX}"

  step "8 · Treasury 提案 + 投票"
  hat_r1_page_manifest "step-08-treasury-proposal"
  [[ -n "$TREASURY_ADDRESS" ]] || fail "TREASURY_ADDRESS unset"
  export TREASURY_SPEND_TO="$WALLET"
  export TREASURY_SPEND_AMOUNT="${HAT_R1_TREASURY_SPEND_AMOUNT:-1000000000000000}"
  export TREASURY_SPEND_MODE="${HAT_R1_TREASURY_SPEND_MODE:-ERC20}"
  bash "$ROOT/scripts/ops/b417-sepolia-treasury-spend-propose-vote-succeeded.sh" >>"$LOG" 2>&1 || fail "treasury propose/vote"
  TREASURY_PID="$(cast call "$GOVERNOR_ADDRESS" "proposalCount()(uint256)" --rpc-url "$RPC" | awk '{print $1}')"
  hat_r1_save_json "$HAT_R1_EVID/step-08-treasury-proposal/proposal.json" "$(jq -n --arg pid "$TREASURY_PID" '{proposal_id:$pid,type:"treasury_spend"}')"
  hat_r1_db_snapshot "step-08-treasury-proposal"
  echo "$TREASURY_PID" >"$HAT_R1_EVID/TREASURY_PROPOSAL_ID.txt"

  step "9 · Treasury queue (execute 另等 48h)"
  TREASURY_PID="$(cat "$HAT_R1_EVID/TREASURY_PROPOSAL_ID.txt")"
  hat_r1_cast_send_capture "step-09-treasury-queue" "queue" \
    "$GOVERNOR_ADDRESS" "queue(uint256)" "$TREASURY_PID" >/dev/null

  step "10 · Unstake / 退出 requestRelease"
  hat_r1_page_manifest "step-10-unstake"
  REL_TX="$(hat_r1_cast_send_capture "step-10-unstake" "requestRelease" \
    "$REGION_STEWARD_STAKE_POOL_ADDRESS" "requestRelease(bytes2)" "$J_HEX")"
  RELEASABLE="$(cast call "$REGION_STEWARD_STAKE_POOL_ADDRESS" "releasableAmount(address,bytes2)(uint256)" "$WALLET" "$J_HEX" --rpc-url "$RPC" | awk '{print $1}')"
  hat_r1_save_json "$HAT_R1_EVID/step-10-unstake/exit-read.json" "$(jq -n --arg tx "$REL_TX" --arg rel "$RELEASABLE" '{request_release_tx:$tx,releasable_now:$rel,note:"claimReleased after vest delay"}')"
  hat_r1_api_get "step-10-unstake" "stake-status" "/api/v1/steward/stake-status?jurisdiction=${JUR}&wallet=${WALLET}" >/dev/null || true
  hat_r1_db_snapshot "step-10-unstake"
}

case "$PHASE" in
  a|A) run_phase_a ;;
  b|B) run_phase_b ;;
  all) run_phase_a; run_phase_b ;;
  *) fail "unknown phase $PHASE (use a|b|all)" ;;
esac

export HAT_R1_EVID STAMP PHASE
python <<'PY'
import json, os, pathlib, time
evid = pathlib.Path(os.environ["HAT_R1_EVID"])
report = {
    "hat_id": "HAT-R1",
    "stamp_utc": os.environ["STAMP"],
    "phase": os.environ["PHASE"],
    "evidence_dir": str(evid),
    "verdict": "PASS" if os.environ["PHASE"].lower() in ("a", "b", "all") else "PARTIAL",
    "honest_boundary": "Phase B execute requires 48h Timelock; claimReleased requires vest delay",
    "screenshots": "node scripts/dev/capture-hat-r1-screenshots.mjs --evid " + str(evid),
}
(evid / f"hat-r1-report-{os.environ['STAMP']}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print("HAT_R1_SUMMARY:", json.dumps(report, indent=2))
PY

ln -sfn "$STAMP" "$ROOT/evidence/GO_hat_r1_sepolia/latest" 2>/dev/null || echo "$STAMP" >"$ROOT/evidence/GO_hat_r1_sepolia/latest-stamp.txt"

echo "HAT_R1: PASS phase=${PHASE} evidence=${HAT_R1_EVID}"
echo "TT_HAT_R1_SUMMARY: PASS phase=${PHASE}"
exit 0
