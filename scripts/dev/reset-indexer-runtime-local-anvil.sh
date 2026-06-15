#!/usr/bin/env bash
# ① 本地 Anvil：丢弃 Sepolia/异链残留的 indexer runtime（data/indexer_state.json.runtime）
#
# 用法（仓库根 · API 须已停或即将重启）：
#   bash scripts/dev/reset-indexer-runtime-local-anvil.sh
#
# 硬闸：根 .env CHAIN_ID 须为 31337（不触碰 ② soak / staging）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
RUNTIME="${INDEXER_RUNTIME_PATH:-$ROOT/data/indexer_state.json.runtime}"

get_chain_id() {
  local v=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^[[:space:]]*CHAIN_ID= ]]; then
      v="$(echo "$line" | sed 's/^[[:space:]]*CHAIN_ID=//' | tr -d '\r' | sed 's/^"\(.*\)"$/\1/')"
    fi
  done <"$ENV_FILE"
  echo -n "$v"
}

CHAIN_ID="$(get_chain_id)"
[[ "$CHAIN_ID" == "31337" ]] || {
  echo "reset-indexer-runtime-local-anvil: SKIP — CHAIN_ID=$CHAIN_ID (only 31337 ① Anvil)" >&2
  exit 0
}

if [[ -f "$RUNTIME" ]]; then
  rm -f "$RUNTIME"
  echo "reset-indexer-runtime-local-anvil: removed $RUNTIME"
else
  echo "reset-indexer-runtime-local-anvil: no runtime file ($RUNTIME)"
fi

echo "TT_INDEXER_RUNTIME_RESET_ANVIL: OK (restart API to mount fresh runtime)"
