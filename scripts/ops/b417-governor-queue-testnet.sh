#!/usr/bin/env bash
# B-417 · **`TravelTrustGovernor.queue(uint256 proposalId)`** **（** **Succeeded=4** **→** **Queued=5** **）** **。**
#
# 环境：**`B417_RECORD_DIR`** **、** **`CHAIN_RPC_URL`** **/** **`B417_RPC_URL`** **、** **`GOVERNOR_ADDRESS`** **、** **`B417_PROPOSAL_ID`** **、** **`B417_PRIVATE_KEY`** **（** **与** **`b417-governor-execute-testnet.sh`** **一致** **）** **。**
#
# 落盘：**`${B417_RECORD_DIR}/b417-chain-step-queue.json`**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

RPC="${B417_RPC_URL:-${CHAIN_RPC_URL:-${RPC_URL:-}}}"
GOV="${B417_GOVERNOR_ADDRESS:-${GOVERNOR_ADDRESS:-}}"
PID="${B417_PROPOSAL_ID:-}"
PK="${B417_PRIVATE_KEY:-${B417_GOV_EXEC_PK:-${B417_GOV_EXECUTOR_PK:-}}}"
SIDE="${B417_RECORD_DIR:?}/b417-chain-step-queue.json"

if ! command -v cast >/dev/null 2>&1; then
  echo "b417-governor-queue-testnet.sh: cast is required" >&2
  exit 12
fi
if [[ -z "$RPC" || -z "$GOV" || -z "$PID" || -z "$PK" ]]; then
  echo "b417-governor-queue-testnet.sh: need RPC, GOVERNOR_ADDRESS, B417_PROPOSAL_ID, B417_PRIVATE_KEY" >&2
  exit 1
fi

ST="$(cast call "$GOV" "state(uint256)(uint8)" "$PID" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ' || true)"
if [[ "$ST" != "4" ]]; then
  echo "b417-governor-queue-testnet.sh: proposal state=${ST} (need 4=Succeeded before queue)" >&2
  exit 12
fi

mkdir -p "${B417_RECORD_DIR}"

echo "b417-governor-queue-testnet.sh: sending queue(${PID})" >&2
OUT=""
OUT="$(cast send "$GOV" "queue(uint256)" "$PID" --private-key "$PK" --rpc-url "$RPC" --timeout 600 2>&1)" || {
  printf '%s\n' "$OUT" >&2
  echo "b417-governor-queue-testnet.sh: cast send queue failed" >&2
  exit 12
}
printf '%s\n' "$OUT" >&2
HASH="$(printf '%s' "$OUT" | grep -oE '0x[a-fA-F]{64}' | head -1 || true)"
jq -n --arg step "queue" --arg status "submitted" --arg tx_hash "${HASH:-}" '{step: $step, status: $status, tx_hash: $tx_hash}' >"$SIDE"
echo "b417-governor-queue-testnet.sh: wrote ${SIDE}" >&2
