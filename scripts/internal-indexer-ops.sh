#!/usr/bin/env bash
# 对内网/本机 API 调用 internal 索引与对账接口（须 **非** 公网暴露）。
# 契约与 curl 示例：ops/RUNBOOK.md §2.55、docs/spec/04-后端与API.md §3.4。
# tick：若链上 **last_block** 的 hash 与索引器内存不一致，API 返回 **503** **`reorg_suspected`**（本轮不写库）。
#
# 用法：
#   API_BASE_URL=http://127.0.0.1:8080 ./scripts/internal-indexer-ops.sh tick
#   API_BASE_URL=... INTERNAL_API_SECRET=... ./scripts/internal-indexer-ops.sh status
#   API_BASE_URL=... INTERNAL_API_SECRET=... ./scripts/internal-indexer-ops.sh reconcile --persist --rpc 3 --backfill-chain-id
#   CHAIN_ID=137 … reconcile --chain-scope-dry-run
#   TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK=1 on API + CHAIN_ID=137 … reconcile --chain-scope-rollback-execute CONFIRM_DELETE_ORDERS_CHAIN_137
#   CHAIN_ID=137 … reconcile --event-log-scope-dry-run
#   TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK=1 … reconcile --event-log-scope-rollback-execute CONFIRM_DELETE_EVENT_LOG_CHAIN_137
#   CHAIN_ID=137 … reconcile --correction-executor-scope-dry-run
#   TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK=1 … reconcile --correction-executor-scope-rollback-execute CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_137
#   TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1 … reconcile --memory-sync-from-db
#   … reconcile --include-chain-tip   # POST body include_chain_tip:true → chain_observation（110-RECONCILE-CHAIN-TIP）
#   … reconcile --include-event-log-escrow-coverage   # POST body include_event_log_escrow_coverage:true → event_log_escrow_coverage（110-EVENT-LOG-ESCROW-COVERAGE）
#   bash scripts/internal-indexer-ops.sh evidence   # 写入 evidence/GO_*（见 write-indexer-evidence.sh；须本机可跑 snapshot）
#   bash scripts/internal-indexer-ops.sh evidence --skip-internal-reconcile   # 同设 SNAPSHOT_INTERNAL_SKIP_RECONCILE=1（见 indexer-public-snapshot.sh）
#   bash scripts/internal-indexer-ops.sh evidence --with-indexer-tick   # 慎用：同设 SNAPSHOT_INTERNAL_INDEXER_TICK=1
#   bash scripts/internal-indexer-ops.sh evidence-bundle [--skip-internal-reconcile] [--with-indexer-tick]   # 同上 + manifest + zip
# Windows：.\scripts\internal-indexer-ops.ps1 evidence|evidence-bundle（**write-indexer-evidence.ps1**）；其它子命令委托 **bash** 本脚本
#   INTERNAL_API_SECRET=... ./scripts/internal-indexer-ops.sh probe   # 见 scripts/indexer-reconcile-probe.sh（live 对账探针）
#   REWIND_FROM_BLOCK=… INTERNAL_API_SECRET=... ./scripts/internal-indexer-ops.sh recover rewind  # POST indexer-reorg-rewind（110 Partial）
#   INTERNAL_API_SECRET=... ./scripts/internal-indexer-ops.sh recover status|hint|replay|reconcile|all  # 见 indexer-reorg-recovery.sh
#
# 环境变量：
#   API_BASE_URL      默认 http://127.0.0.1:8080
#   INTERNAL_API_SECRET  若与 API 配置一致，自动加 X-Internal-Api-Secret

set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

declare -a CURL_EXTRA=()
if [[ -n "${INTERNAL_API_SECRET:-}" ]]; then
  CURL_EXTRA+=(-H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}")
fi

usage() {
  echo "Usage: $0 tick|replay|reconcile|status|probe|recover|evidence|evidence-bundle [--persist] [--rpc N] [--backfill-chain-id] [--chain-scope-dry-run] [--chain-scope-rollback-execute <TOKEN>] [--event-log-scope-dry-run] [--event-log-scope-rollback-execute <TOKEN>] [--correction-executor-scope-dry-run] [--correction-executor-scope-rollback-execute <TOKEN>] [--memory-sync-from-db] [--include-chain-tip] [--include-event-log-escrow-coverage]" >&2
  echo "  tick      POST .../internal/indexer-tick body {}" >&2
  echo "  replay    POST .../internal/indexer-replay body {}" >&2
  echo "  reconcile POST .../internal/indexer-reconcile (optional --persist, --rpc 1..10, --backfill-chain-id, --chain-scope-*, --event-log-scope-*, --correction-executor-scope-*, --memory-sync-from-db, --include-chain-tip, --include-event-log-escrow-coverage)" >&2
  echo "  status    GET  .../internal/indexer-status (optional --live-reconcile → ?live_reconcile=1 即时只读对账)" >&2
  echo "  recover   scripts/indexer-reorg-recovery.sh <status|hint|replay|reconcile|rewind|all> (110 reorg；rewind 须 REWIND_FROM_BLOCK)" >&2
  echo "  evidence  run scripts/write-indexer-evidence.sh → evidence/GO_YYYYMMDD/*.json" >&2
  echo "           optional --skip-internal-reconcile | --with-indexer-tick (same as SNAPSHOT_* env on indexer-public-snapshot)" >&2
  echo "  evidence-bundle  write-indexer-evidence + indexer_public_snapshot_manifest.json + .zip (same optional flags)" >&2
  exit 1
}

post_internal() {
  local path="$1"
  local json="$2"
  curl -sS -X POST "${BASE}${path}" \
    -H "Content-Type: application/json" \
    -d "${json}" \
    "${CURL_EXTRA[@]}"
}

get_internal() {
  local path="$1"
  curl -sS "${CURL_EXTRA[@]}" "${BASE}${path}"
}

cmd="${1:-}"
[[ -n "$cmd" ]] || usage
shift || true

case "$cmd" in
  recover)
    bash "${SCRIPT_DIR}/indexer-reorg-recovery.sh" "$@"
    exit $?
    ;;
  probe)
    bash "${SCRIPT_DIR}/indexer-reconcile-probe.sh"
    exit $?
    ;;
  evidence)
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --skip-internal-reconcile)
          export SNAPSHOT_INTERNAL_SKIP_RECONCILE=1
          shift
          ;;
        --with-indexer-tick)
          export SNAPSHOT_INTERNAL_INDEXER_TICK=1
          shift
          ;;
        *)
          echo "evidence: unknown option: $1" >&2
          exit 1
          ;;
      esac
    done
    bash "${SCRIPT_DIR}/write-indexer-evidence.sh"
    exit 0
    ;;
  evidence-bundle)
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --skip-internal-reconcile)
          export SNAPSHOT_INTERNAL_SKIP_RECONCILE=1
          shift
          ;;
        --with-indexer-tick)
          export SNAPSHOT_INTERNAL_INDEXER_TICK=1
          shift
          ;;
        *)
          echo "evidence-bundle: unknown option: $1" >&2
          exit 1
          ;;
      esac
    done
    INDEXER_EVIDENCE_BUNDLE_ZIP=1 bash "${SCRIPT_DIR}/write-indexer-evidence.sh"
    exit 0
    ;;
  tick)
    out="$(post_internal "/api/v1/internal/indexer-tick" "{}")"
    ;;
  replay)
    out="$(post_internal "/api/v1/internal/indexer-replay" "{}")"
    ;;
  status)
    live_q=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --live-reconcile)
          live_q="?live_reconcile=1"
          shift
          ;;
        *)
          echo "status: unknown option: $1" >&2
          usage
          ;;
      esac
    done
    out="$(get_internal "/api/v1/internal/indexer-status${live_q}")"
    ;;
  reconcile)
    persist=false
    rpc=""
    bf=false
    cs_dry=false
    cs_exec=""
    el_dry=false
    el_exec=""
    ce_dry=false
    ce_exec=""
    mem_sync=false
    chain_tip=false
    el_cov=false
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --persist)
          persist=true
          shift
          ;;
        --rpc)
          [[ $# -ge 2 ]] || { echo "reconcile: --rpc needs a value (1..10)" >&2; exit 1; }
          rpc="$2"
          shift 2
          ;;
        --backfill-chain-id)
          bf=true
          shift
          ;;
        --chain-scope-dry-run)
          cs_dry=true
          shift
          ;;
        --chain-scope-rollback-execute)
          [[ $# -ge 2 ]] || { echo "reconcile: --chain-scope-rollback-execute needs confirm token (e.g. CONFIRM_DELETE_ORDERS_CHAIN_137)" >&2; exit 1; }
          cs_exec="$2"
          shift 2
          ;;
        --event-log-scope-dry-run)
          el_dry=true
          shift
          ;;
        --event-log-scope-rollback-execute)
          [[ $# -ge 2 ]] || { echo "reconcile: --event-log-scope-rollback-execute needs confirm token (e.g. CONFIRM_DELETE_EVENT_LOG_CHAIN_137)" >&2; exit 1; }
          el_exec="$2"
          shift 2
          ;;
        --correction-executor-scope-dry-run)
          ce_dry=true
          shift
          ;;
        --correction-executor-scope-rollback-execute)
          [[ $# -ge 2 ]] || { echo "reconcile: --correction-executor-scope-rollback-execute needs confirm token (e.g. CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_137)" >&2; exit 1; }
          ce_exec="$2"
          shift 2
          ;;
        --memory-sync-from-db)
          mem_sync=true
          shift
          ;;
        --include-chain-tip)
          chain_tip=true
          shift
          ;;
        --include-event-log-escrow-coverage)
          el_cov=true
          shift
          ;;
        *)
          usage
          ;;
      esac
    done
    body_parts=""
    [[ "$persist" == true ]] && body_parts="${body_parts}\"persist\":true,"
    [[ -n "$rpc" ]] && body_parts="${body_parts}\"rpc_escrow_samples\":${rpc},"
    [[ "$bf" == true ]] && body_parts="${body_parts}\"backfill_orders_chain_id\":true,"
    [[ "$cs_dry" == true ]] && body_parts="${body_parts}\"orders_chain_scope_rollback_dry_run\":true,"
    [[ -n "$cs_exec" ]] && body_parts="${body_parts}\"orders_chain_scope_rollback_execute\":true,\"orders_chain_scope_rollback_confirm\":\"${cs_exec}\","
    [[ "$el_dry" == true ]] && body_parts="${body_parts}\"event_log_chain_scope_rollback_dry_run\":true,"
    [[ -n "$el_exec" ]] && body_parts="${body_parts}\"event_log_chain_scope_rollback_execute\":true,\"event_log_chain_scope_rollback_confirm\":\"${el_exec}\","
    [[ "$ce_dry" == true ]] && body_parts="${body_parts}\"correction_executor_chain_scope_rollback_dry_run\":true,"
    [[ -n "$ce_exec" ]] && body_parts="${body_parts}\"correction_executor_chain_scope_rollback_execute\":true,\"correction_executor_chain_scope_rollback_confirm\":\"${ce_exec}\","
    [[ "$mem_sync" == true ]] && body_parts="${body_parts}\"sync_indexer_memory_from_db_checkpoint\":true,"
    [[ "$chain_tip" == true ]] && body_parts="${body_parts}\"include_chain_tip\":true,"
    [[ "$el_cov" == true ]] && body_parts="${body_parts}\"include_event_log_escrow_coverage\":true,"
    if [[ -n "$body_parts" ]]; then
      body="{${body_parts%,}}"
    else
      body="{}"
    fi
    out="$(post_internal "/api/v1/internal/indexer-reconcile" "$body")"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    ;;
esac

if command -v jq >/dev/null 2>&1; then
  echo "$out" | jq .
else
  echo "$out"
fi
