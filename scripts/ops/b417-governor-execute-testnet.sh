#!/usr/bin/env bash
# B-417 · **真实链** **execute**：**TravelTrustGovernor.execute(uint256 proposalId)**（Queued **且** **Timelock** **delay** **已** **届满** **）**
#
# **前置**：**`queue`** **已** **上链** **且** **同** **`B417_RECORD_DIR`** **下** **已有** **`b417-chain-step-queue.json`** **（** **可选** **校验** **）** **；** **提案** **`state == Queued`** **。**
#
# **等待**：默认 **`sleep(Timelock.delay()) + 2`** **秒** **（** **自** **本** **机** **时钟** **；** **与** **链上** **ETA** **近似** **）** **；** **可** **覆盖** **`B417_POST_QUEUE_SLEEP_SEC`** **。**
#
# **落盘**：**`$B417_RECORD_DIR/b417-chain-step-execute.json`**
#
# **环境** **（** **必填** **）**：
#   B417_RECORD_DIR
#   CHAIN_RPC_URL **或** B417_RPC_URL **或** RPC_URL
#   GOVERNOR_ADDRESS **或** B417_GOVERNOR_ADDRESS
#   B417_PROPOSAL_ID
#   B417_PRIVATE_KEY **或** B417_GOV_EXEC_PK
#
set -euo pipefail

RPC="${B417_RPC_URL:-${CHAIN_RPC_URL:-${RPC_URL:-}}}"
GOV="${B417_GOVERNOR_ADDRESS:-${GOVERNOR_ADDRESS:-}}"
PID="${B417_PROPOSAL_ID:-}"
PK="${B417_PRIVATE_KEY:-${B417_GOV_EXEC_PK:-${B417_GOV_EXECUTOR_PK:-}}}"
SIDE="${B417_RECORD_DIR:?}/b417-chain-step-execute.json"

if ! command -v cast >/dev/null 2>&1; then
  echo "b417-governor-execute-testnet.sh: cast (foundry) is required" >&2
  exit 12
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "b417-governor-execute-testnet.sh: jq is required" >&2
  exit 12
fi

if [[ -z "$RPC" || -z "$GOV" || -z "$PID" || -z "$PK" ]]; then
  echo "b417-governor-execute-testnet.sh: need RPC; GOVERNOR_ADDRESS; B417_PROPOSAL_ID; B417_PRIVATE_KEY|B417_GOV_EXEC_PK" >&2
  exit 1
fi

extract_tx_hash_from_cast_send_output() {
  local blob="$1"
  local h
  h="$(printf '%s' "$blob" | grep -E '^[[:space:]]*transactionHash[[:space:]]+' | head -1 | awk '{print $2}' | tr -d '\r\n')"
  if [[ -z "$h" ]]; then
    h="$(printf '%s' "$blob" | grep -oE '0x[a-fA-F]{64}' | head -1)"
  fi
  printf '%s' "$h"
}

mkdir -p "${B417_RECORD_DIR}"

ST_RAW="$(cast call "$GOV" "state(uint256)(uint8)" "$PID" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ' || true)"
# Queued = 5
if [[ "$ST_RAW" != "5" ]]; then
  echo "b417-governor-execute-testnet.sh: proposal ${PID} state=${ST_RAW} (need 5=Queued before execute)" >&2
  exit 12
fi

TL_RAW="$(cast call "$GOV" "timelock()(address)" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n' || true)"
TL="$(printf '%s' "$TL_RAW" | awk '{print $NF}')"
if [[ -z "$TL" || "$TL" == "0x0000000000000000000000000000000000000000" ]]; then
  echo "b417-governor-execute-testnet.sh: could not read timelock() from governor" >&2
  exit 12
fi

SLEEP_SEC="${B417_POST_QUEUE_SLEEP_SEC:-}"
if [[ -z "$SLEEP_SEC" ]]; then
  DELAY_HEX="$(cast call "$TL" "delay()(uint256)" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ' || true)"
  if [[ -n "$DELAY_HEX" ]]; then
    SLEEP_SEC="$(cast to-dec "$DELAY_HEX" 2>/dev/null || echo "")"
  fi
  if [[ -z "$SLEEP_SEC" ]]; then
    SLEEP_SEC="120"
    echo "b417-governor-execute-testnet.sh: warning: could not read delay(); sleeping ${SLEEP_SEC}s default" >&2
  fi
  SLEEP_SEC=$((SLEEP_SEC + 2))
fi

echo "b417-governor-execute-testnet.sh: waiting ${SLEEP_SEC}s for Timelock delay (timelock=${TL})" >&2
sleep "$SLEEP_SEC"

echo "b417-governor-execute-testnet.sh: sending execute(${PID})" >&2
OUT=""
OUT="$(cast send "$GOV" "execute(uint256)" "$PID" --private-key "$PK" --rpc-url "$RPC" --timeout 600 2>&1)" || {
  printf '%s\n' "$OUT" >&2
  echo "b417-governor-execute-testnet.sh: cast send execute failed (still too early? increase B417_POST_QUEUE_SLEEP_SEC)" >&2
  exit 12
}
printf '%s\n' "$OUT" >&2
HASH="$(extract_tx_hash_from_cast_send_output "$OUT")"
if [[ -z "$HASH" ]]; then
  echo "b417-governor-execute-testnet.sh: could not parse transactionHash" >&2
  exit 12
fi

REC="$(cast receipt "$HASH" --rpc-url "$RPC" --json)"
BN_HEX="$(printf '%s' "$REC" | jq -r .blockNumber)"
BLK="$(cast block "$BN_HEX" --rpc-url "$RPC" --json)"
TS_HEX="$(printf '%s' "$BLK" | jq -r .timestamp)"
pick_py() {
  if [[ -n "${PYTHON:-}" ]]; then echo "${PYTHON}"; return; fi
  if command -v py >/dev/null 2>&1 && py -3 -c "pass" >/dev/null 2>&1; then echo "py -3"; return; fi
  command -v python3 >/dev/null 2>&1 && python3 -c "pass" >/dev/null 2>&1 && echo python3 && return
  command -v python >/dev/null 2>&1 && python -c "pass" >/dev/null 2>&1 && echo python && return
  echo "b417-governor-execute-testnet.sh: python required for hex decode" >&2
  exit 12
}
PY="$(pick_py)"
if [[ "$PY" == "py -3" ]]; then
  BN_DEC="$(py -3 -c "print(int(\"${BN_HEX}\", 16))")"
  TS_DEC="$(py -3 -c "print(int(\"${TS_HEX}\", 16))")"
else
  BN_DEC="$("$PY" -c "print(int(\"${BN_HEX}\", 16))")"
  TS_DEC="$("$PY" -c "print(int(\"${TS_HEX}\", 16))")"
fi

jq -n --arg step "execute" --arg status "success" --arg tx_hash "$HASH" --argjson block_number "${BN_DEC:-0}" --argjson timestamp "${TS_DEC:-0}" '{step: $step, status: $status, tx_hash: $tx_hash, block_number: $block_number, timestamp: $timestamp}' >"$SIDE"

echo "b417-governor-execute-testnet.sh: wrote ${SIDE}" >&2
exit 0
