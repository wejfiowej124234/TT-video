#!/usr/bin/env bash
# reorg / checkpoint 异常时**人工**恢复辅助（**110 §3.4 Partial**；须内网 + 可选 **`INTERNAL_API_SECRET`**）。
# **`GET …/internal/indexer-status`** 响应含 **`reorg_recovery`**（锚点 **`110-REORG-RECOVERY-HINT`**）；本脚本封装常见 **curl**。
#
# 用法（项目根）：
#   API_BASE_URL=http://127.0.0.1:8080 ./scripts/indexer-reorg-recovery.sh status
#   INTERNAL_API_SECRET=… ./scripts/indexer-reorg-recovery.sh hint    # 仅打印 .reorg_recovery
#   INTERNAL_API_SECRET=… ./scripts/indexer-reorg-recovery.sh replay
#   INTERNAL_API_SECRET=… ./scripts/indexer-reorg-recovery.sh reconcile
#   REWIND_FROM_BLOCK=<reorg_suspected.block_number> INTERNAL_API_SECRET=… ./scripts/indexer-reorg-recovery.sh rewind
#   REWIND_FROM_BLOCK=… FORCE_REWIND=1 INTERNAL_API_SECRET=… ./scripts/indexer-reorg-recovery.sh rewind   # 跳过链上 hash 不一致校验
#   INTERNAL_API_SECRET=… ./scripts/indexer-reorg-recovery.sh all      # replay → reconcile → status
#
# Windows：.\scripts\indexer-reorg-recovery.ps1 status|hint|replay|reconcile|all（委托本脚本）
#
# 依赖：**curl**、**jq**。

set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

declare -a CURL_EXTRA=()
if [[ -n "${INTERNAL_API_SECRET:-}" ]]; then
  CURL_EXTRA+=(-H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}")
fi

command -v jq >/dev/null 2>&1 || {
  echo "indexer-reorg-recovery.sh: jq is required" >&2
  exit 1
}

usage() {
  echo "Usage: $0 status|hint|replay|reconcile|rewind|all" >&2
  echo "  status    GET  .../internal/indexer-status" >&2
  echo "  hint      jq .reorg_recovery from status (same GET)" >&2
  echo "  replay    POST .../internal/indexer-replay body {}" >&2
  echo "  reconcile POST .../internal/indexer-reconcile body {\"persist\":false}" >&2
  echo "  rewind    POST .../internal/indexer-reorg-rewind (needs REWIND_FROM_BLOCK=; optional FORCE_REWIND=1)" >&2
  echo "  all       replay then reconcile then status" >&2
  exit 1
}

get_status() {
  curl -sS "${CURL_EXTRA[@]}" \
    -H "x-request-id: indexer-reorg-recovery-status-$(date +%s)-$$" \
    "${BASE}/api/v1/internal/indexer-status" || true
}

post_replay() {
  curl -sS -X POST "${BASE}/api/v1/internal/indexer-replay" \
    -H "Content-Type: application/json" \
    -d '{}' \
    "${CURL_EXTRA[@]}" \
    -H "x-request-id: indexer-reorg-recovery-replay-$(date +%s)-$$" || true
}

post_reconcile() {
  curl -sS -X POST "${BASE}/api/v1/internal/indexer-reconcile" \
    -H "Content-Type: application/json" \
    -d '{"persist":false}' \
    "${CURL_EXTRA[@]}" \
    -H "x-request-id: indexer-reorg-recovery-reconcile-$(date +%s)-$$" || true
}

post_rewind() {
  : "${REWIND_FROM_BLOCK:?set REWIND_FROM_BLOCK to indexer reorg_suspected.block_number (or use FORCE_REWIND=1 for admin rewind)}"
  local body
  if [[ "${FORCE_REWIND:-0}" == "1" ]]; then
    body=$(jq -n --argjson b "$REWIND_FROM_BLOCK" '{rewind_from_block: $b, force: true}')
  else
    body=$(jq -n --argjson b "$REWIND_FROM_BLOCK" '{rewind_from_block: $b, force: false}')
  fi
  curl -sS -X POST "${BASE}/api/v1/internal/indexer-reorg-rewind" \
    -H "Content-Type: application/json" \
    -d "$body" \
    "${CURL_EXTRA[@]}" \
    -H "x-request-id: indexer-reorg-recovery-rewind-$(date +%s)-$$" || true
}

cmd="${1:-}"
[[ -n "$cmd" ]] || usage

case "$cmd" in
  status)
    get_status | jq .
    ;;
  hint)
    get_status | jq '.reorg_recovery // .'
    ;;
  replay)
    post_replay | jq .
    ;;
  reconcile)
    post_reconcile | jq .
    ;;
  rewind)
    post_rewind | jq .
    ;;
  all)
    echo "## POST indexer-replay" >&2
    post_replay | jq .
    echo "## POST indexer-reconcile (persist:false)" >&2
    post_reconcile | jq .
    echo "## GET indexer-status" >&2
    get_status | jq .
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    ;;
esac
