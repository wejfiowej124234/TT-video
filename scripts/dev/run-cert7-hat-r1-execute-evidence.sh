#!/usr/bin/env bash
# Cert #7 · HAT-R1 step-07 execute only (② · no FORCE_EXECUTE · no ETA bypass)
#
#   export HAT_R1_LIVE_WALLET_OK=1
#   export HAT_R1_PHASE_B_PAUSED=0
#   export HAT_R1_WALLET_PK=0x...   # or phase2 env PRIVATE_KEY
#   bash scripts/dev/run-cert7-hat-r1-execute-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_EVID="$(hat_r1_resolve_evid_dir "$ROOT")"
export HAT_R1_EVID="$HAT_EVID"

[[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
  echo "cert7-execute-evidence: FAIL set HAT_R1_LIVE_WALLET_OK=1" >&2
  exit 2
}
[[ "${HAT_R1_PHASE_B_PAUSED:-1}" == "0" ]] || {
  echo "cert7-execute-evidence: FAIL HAT_R1_PHASE_B_PAUSED must be 0 (Cert #6 unpause)" >&2
  exit 2
}
[[ "${HAT_R1_FORCE_EXECUTE:-0}" == "0" ]] || {
  echo "cert7-execute-evidence: FAIL HAT_R1_FORCE_EXECUTE forbidden for Cert #7" >&2
  exit 2
}
[[ -f "$HAT_EVID/EXECUTE_EARLIEST_UNIX.txt" ]] || {
  echo "cert7-execute-evidence: FAIL missing EXECUTE_EARLIEST_UNIX.txt" >&2
  exit 2
}

ETA="$(cat "$HAT_EVID/EXECUTE_EARLIEST_UNIX.txt" | tr -d '\r\n')"
NOW="$(date +%s)"
if [[ "$NOW" -lt "$ETA" ]]; then
  REMAIN=$((ETA - NOW))
  echo "cert7-execute-evidence: BLOCKED Timelock not elapsed remaining=${REMAIN}s ETA=${ETA}" >&2
  echo "TT_CERT7_EXECUTE_EVIDENCE: WAIT_TIMelock" >&2
  exit 4
fi

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"

fail() { echo "cert7-execute-evidence: FAIL $*" >&2; exit 2; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ROOT/.env" ]] && set -a && . "$ROOT/.env" && set +a
[[ -f "$ENV_FILE" ]] || { echo "cert7-execute-evidence: missing $ENV_FILE" >&2; exit 2; }
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

PK="${HAT_R1_WALLET_PK:-${PRIVATE_KEY:-${B417_PRIVATE_KEY:-}}}"
if [[ -z "${HAT_R1_WALLET_PK:-}" && -f "$ENV_FILE" ]]; then
  _p2pk="$(grep -E '^PRIVATE_KEY=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '\r' || true)"
  [[ -n "$_p2pk" && "$_p2pk" != replace-only-local-test-private-key ]] && PK="$_p2pk"
fi
[[ -n "$PK" ]] || { echo "cert7-execute-evidence: wallet PK required" >&2; exit 2; }
case "$PK" in 0x*) ;; *) PK="0x${PK}" ;; esac
export HAT_R1_PK="$PK"
export PRIVATE_KEY="$PK"

RPC="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
export CHAIN_RPC_URL="$RPC"
export GOVERNOR_ADDRESS="${GOVERNOR_ADDRESS:-${GOV_FREEZE_V2_GOVERNOR_ADDRESS:-}}"
GOVERNOR_ADDRESS="$(echo "$GOVERNOR_ADDRESS" | tr -d '\r\n')"
export GOVERNOR_ADDRESS
[[ -n "$GOVERNOR_ADDRESS" ]] || { echo "cert7-execute-evidence: GOVERNOR_ADDRESS unset" >&2; exit 2; }

PID="$(cat "$HAT_EVID/MINIMAL_PROPOSAL_ID.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$PID" ]] || fail "missing MINIMAL_PROPOSAL_ID.txt"

command -v cast >/dev/null 2>&1 || fail "cast required"
command -v jq >/dev/null 2>&1 || fail "jq required"

echo "CERT7_HAT_R1_EXECUTE: START proposal=${PID} ETA=${ETA} evid=${HAT_EVID}"

hat_r1_page_manifest "step-07-execute"
EXEC_TX="$(hat_r1_cast_send_capture "step-07-execute" "execute" \
  "$GOVERNOR_ADDRESS" "execute(uint256)" "$PID")"
hat_r1_db_snapshot "step-07-execute"

ST="$(cast call "$GOVERNOR_ADDRESS" "state(uint256)(uint8)" "$PID" --rpc-url "$RPC" | awk '{print $1}')"
hat_r1_save_json "$HAT_EVID/step-07-execute/post-execute-state.json" "$(jq -n \
  --arg pid "$PID" \
  --arg st "$ST" \
  --arg tx "$EXEC_TX" \
  --arg eta "$ETA" \
  --arg now "$NOW" \
  '{proposal_id:$pid,state:$st,want:"6=Executed",execute_tx:$tx,execute_earliest_unix:$eta,executed_at_unix:$now,no_force_execute:true}')"

[[ "$ST" == "6" ]] || {
  echo "cert7-execute-evidence: WARN post-execute state=${ST} want 6 (Executed)" >&2
}

echo "CERT7_HAT_R1_EXECUTE: OK tx=${EXEC_TX} state=${ST}"
echo "TT_CERT7_EXECUTE_EVIDENCE: PASS"
