#!/usr/bin/env bash
# Cert #8 · HAT-R1 step-08/09 treasury propose+vote+queue (+ execute when 2nd Timelock elapsed)
#
#   export HAT_R1_LIVE_WALLET_OK=1
#   export HAT_R1_PHASE_B_PAUSED=0
#   bash scripts/dev/run-cert8-hat-r1-treasury-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_EVID="$(hat_r1_resolve_evid_dir "$ROOT")"
export HAT_R1_EVID="$HAT_EVID"

[[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
  echo "cert8-treasury-evidence: FAIL set HAT_R1_LIVE_WALLET_OK=1" >&2
  exit 2
}
[[ "${HAT_R1_PHASE_B_PAUSED:-1}" == "0" ]] || {
  echo "cert8-treasury-evidence: FAIL HAT_R1_PHASE_B_PAUSED must be 0" >&2
  exit 2
}
[[ -f "$HAT_EVID/step-07-execute/tx-execute.json" ]] || {
  echo "cert8-treasury-evidence: FAIL Cert #7 execute evidence required" >&2
  exit 2
}

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
fail() { echo "cert8-treasury-evidence: FAIL $*" >&2; exit 2; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ROOT/.env" ]] && set -a && . "$ROOT/.env" && set +a
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

PK="${HAT_R1_WALLET_PK:-${PRIVATE_KEY:-${B417_PRIVATE_KEY:-}}}"
[[ -n "$PK" ]] || fail "wallet PK required"
case "$PK" in 0x*) ;; *) PK="0x${PK}" ;; esac
export HAT_R1_PK="$PK"
export PRIVATE_KEY="$PK"
WALLET="$(cast wallet address --private-key "$PK")"
RPC="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
export CHAIN_RPC_URL="$RPC"
export GOVERNOR_ADDRESS="${GOVERNOR_ADDRESS:-${GOV_FREEZE_V2_GOVERNOR_ADDRESS:-}}"
[[ -n "$GOVERNOR_ADDRESS" ]] || fail "GOVERNOR_ADDRESS unset"
[[ -n "$TREASURY_ADDRESS" ]] || fail "TREASURY_ADDRESS unset"

command -v cast >/dev/null 2>&1 || fail "cast required"
command -v jq >/dev/null 2>&1 || fail "jq required"

echo "CERT8_HAT_R1_TREASURY: START wallet=${WALLET} evid=${HAT_EVID}"

if [[ ! -f "$HAT_EVID/step-08-treasury-proposal/proposal.json" ]]; then
  hat_r1_page_manifest "step-08-treasury-proposal"
  export TREASURY_SPEND_TO="$WALLET"
  export TREASURY_SPEND_AMOUNT="${HAT_R1_TREASURY_SPEND_AMOUNT:-1000000000000000}"
  export TREASURY_SPEND_MODE="${HAT_R1_TREASURY_SPEND_MODE:-ERC20}"
  bash "$ROOT/scripts/ops/b417-sepolia-treasury-spend-propose-vote-succeeded.sh" \
    || fail "treasury propose/vote"
  TREASURY_PID="$(cast call "$GOVERNOR_ADDRESS" "proposalCount()(uint256)" --rpc-url "$RPC" | awk '{print $1}')"
  hat_r1_save_json "$HAT_EVID/step-08-treasury-proposal/proposal.json" \
    "$(jq -n --arg pid "$TREASURY_PID" '{proposal_id:$pid,type:"treasury_spend"}')"
  hat_r1_db_snapshot "step-08-treasury-proposal"
  echo "$TREASURY_PID" >"$HAT_EVID/TREASURY_PROPOSAL_ID.txt"
fi

TREASURY_PID="$(cat "$HAT_EVID/TREASURY_PROPOSAL_ID.txt" | tr -d '\r\n')"
ST="$(cast call "$GOVERNOR_ADDRESS" "state(uint256)(uint8)" "$TREASURY_PID" --rpc-url "$RPC" | awk '{print $1}')"
[[ "$ST" == "4" ]] || fail "treasury proposal state=${ST} want 4 Succeeded"

if [[ ! -f "$HAT_EVID/step-09-treasury-queue/tx-queue.json" ]]; then
  hat_r1_page_manifest "step-09-treasury-queue"
  hat_r1_cast_send_capture "step-09-treasury-queue" "queue" \
    "$GOVERNOR_ADDRESS" "queue(uint256)" "$TREASURY_PID" >/dev/null
  DELAY="$(cast call "${TIMELOCK_ADDRESS}" "delay()(uint256)" --rpc-url "$RPC" | awk '{print $1}')"
  T_ETA="$(python -c "import time; print(int(time.time())+int('${DELAY}'))")"
  hat_r1_save_json "$HAT_EVID/step-09-treasury-queue/timelock-eta.json" "$(jq -n \
    --arg pid "$TREASURY_PID" \
    --arg delay "$DELAY" \
    --arg eta "$T_ETA" \
    '{proposal_id:$pid,timelock_delay_seconds:$delay,treasury_execute_earliest_unix:$eta}')"
  echo "$T_ETA" >"$HAT_EVID/TREASURY_EXECUTE_EARLIEST_UNIX.txt"
  hat_r1_db_snapshot "step-09-treasury-queue"
fi

T_ETA="$(cat "$HAT_EVID/TREASURY_EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo 0)"
NOW="$(date +%s)"
if [[ "${HAT_R1_TREASURY_QUEUE_ONLY:-0}" != "1" && "$NOW" -ge "$T_ETA" && ! -f "$HAT_EVID/step-10-treasury-execute/tx-execute.json" ]]; then
  if [[ "${HAT_R1_ALLOW_SPEND_EXECUTE:-0}" != "1" ]]; then
    echo "CERT8_HAT_R1_TREASURY: spend execute BLOCKED (set HAT_R1_ALLOW_SPEND_EXECUTE=1 for Wave 2 only)"
  else
  hat_r1_page_manifest "step-10-treasury-execute"
  EXEC_TX="$(hat_r1_cast_send_capture "step-10-treasury-execute" "execute" \
    "$GOVERNOR_ADDRESS" "execute(uint256)" "$TREASURY_PID")"
  ST2="$(cast call "$GOVERNOR_ADDRESS" "state(uint256)(uint8)" "$TREASURY_PID" --rpc-url "$RPC" | awk '{print $1}')"
  hat_r1_save_json "$HAT_EVID/step-10-treasury-execute/post-execute-state.json" "$(jq -n \
    --arg pid "$TREASURY_PID" --arg st "$ST2" --arg tx "$EXEC_TX" \
    '{proposal_id:$pid,state:$st,want:"5=Executed",execute_tx:$tx}')"
  hat_r1_db_snapshot "step-10-treasury-execute"
  echo "CERT8_HAT_R1_TREASURY: execute tx=${EXEC_TX} state=${ST2}"
  fi
fi

if [[ "${HAT_R1_TREASURY_QUEUE_ONLY:-0}" == "1" ]]; then
  echo "CERT8_HAT_R1_TREASURY: QUEUE_ONLY mode — skip spend execute (Wave 1)"
fi

echo "CERT8_HAT_R1_TREASURY: OK treasury_pid=${TREASURY_PID} treasury_execute_eta=${T_ETA}"
echo "TT_CERT8_TREASURY_EVIDENCE: PASS"
