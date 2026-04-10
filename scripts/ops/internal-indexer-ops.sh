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
#   bash scripts/internal-indexer-ops.sh evidence-bundle [--skip-internal-reconcile] [--with-indexer-tick]   # 同上 + manifest.json + manifest.sha256 + epic_d_go_bundle_closure.json（Epic D-10）+ zip
# Windows：.\scripts\internal-indexer-ops.ps1 evidence|evidence-bundle（**write-indexer-evidence.ps1**）；其它子命令委托 **bash** 本脚本
#   INTERNAL_API_SECRET=... ./scripts/internal-indexer-ops.sh status --ops-artifact   # Epic D-03：**`traveltrust.ops_artifact.v1`** baseline（**无** `?live_reconcile`、**无** POST、**无**落库）
#   INTERNAL_API_SECRET=... ./scripts/internal-indexer-ops.sh status --live-reconcile --ops-artifact   # Epic D-04：同上 + **`live_orders_projection_reconcile`**（**GET** 即时只读对账；**非** **`POST …/indexer-reconcile`**，**persist** 不存在）
#   INTERNAL_API_SECRET=... ./scripts/internal-indexer-ops.sh reconcile --ops-artifact   # Epic D-05：**`POST …/indexer-reconcile`** **`{}`**（**无** **`persist`**）→ **`artifact_type:reconcile`**、根级 **`dry_run:false`**
#   … reconcile --chain-scope-dry-run --ops-artifact   # Epic D-06：**`orders_chain_scope_rollback_dry_run`** 只读计数 → **`artifact_type:dry_run_chain`**、根级 **`dry_run:true`**（**禁** **`--persist`** / **execute** 类 flag）
#   … reconcile --event-log-scope-dry-run --ops-artifact   # Epic D-07：**`event_log_chain_scope_rollback_dry_run`** 只读计数 → **`artifact_type:dry_run_event_log`**、根级 **`dry_run:true`**（**禁** **`--persist`** / **execute**；**`reason_code`** 仅当块缺失 / 错误体）
#   … reconcile --correction-executor-scope-dry-run --ops-artifact   # Epic D-08：**`correction_executor_chain_scope_rollback_dry_run`** 只读计数 → **`artifact_type:dry_run_correction_executor`**、根级 **`dry_run:true`**
#   INTERNAL_API_SECRET=... ./scripts/internal-indexer-ops.sh probe   # 见 scripts/indexer-reconcile-probe.sh（live 对账探针）
#   … probe --ops-artifact   # Epic D-09：**`traveltrust.ops_artifact.v1`** **`artifact_type:probe`**（**`gate_workflow_checks_total_expected`** 与 **indexer-reconcile-gate** **checks_total** 同锚）
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
  echo "Usage: $0 tick|replay|reconcile|status|probe|recover|evidence|evidence-bundle [--persist] [--rpc N] [--backfill-chain-id] [--chain-scope-dry-run|…] [--ops-artifact where documented]" >&2
  echo "  probe [--ops-artifact]  → indexer-reconcile-probe.sh（--ops-artifact → Epic D-09 traveltrust.ops_artifact.v1 probe）" >&2
  echo "  tick      POST .../internal/indexer-tick body {}" >&2
  echo "  replay    POST .../internal/indexer-replay body {}" >&2
  echo "  reconcile POST .../internal/indexer-reconcile (optional --persist, --rpc 1..10, …; --ops-artifact → D-05, or + --chain-scope-dry-run → D-06, or + --event-log-scope-dry-run → D-07, or + --correction-executor-scope-dry-run → D-08; never with --persist or rollback-execute)" >&2
  echo "  status    GET  .../internal/indexer-status (--ops-artifact → traveltrust.ops_artifact.v1; + --live-reconcile → Epic D-04 / ?live_reconcile=1)" >&2
  echo "  recover   scripts/indexer-reorg-recovery.sh <status|hint|replay|reconcile|rewind|all> (110 reorg；rewind 须 REWIND_FROM_BLOCK)" >&2
  echo "  evidence  run scripts/write-indexer-evidence.sh → evidence/GO_YYYYMMDD/*.json" >&2
  echo "           optional --skip-internal-reconcile | --with-indexer-tick (same as SNAPSHOT_* env on indexer-public-snapshot)" >&2
  echo "  evidence-bundle  write-indexer-evidence + manifest.json + manifest.sha256 + epic_d_go_bundle_closure (D-10) + .zip (same optional flags)" >&2
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

STATUS_OPS_ARTIFACT=false
STATUS_LIVE_RECONCILE=false
RECONCILE_OPS_ARTIFACT=false

case "$cmd" in
  recover)
    bash "${SCRIPT_DIR}/indexer-reorg-recovery.sh" "$@"
    exit $?
    ;;
  probe)
    bash "${SCRIPT_DIR}/indexer-reconcile-probe.sh" "$@"
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
          STATUS_LIVE_RECONCILE=true
          shift
          ;;
        --ops-artifact)
          STATUS_OPS_ARTIFACT=true
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
        --ops-artifact)
          RECONCILE_OPS_ARTIFACT=true
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

OPS_ARTIFACT_SCHEMA_VERSION="1.0.0"
OPS_ARTIFACT_VERSION_LABEL="v1"
INTERNAL_INDEXER_OPS_SCRIPT_SEMVER="1.6.0"

if [[ "$cmd" == "reconcile" && "$RECONCILE_OPS_ARTIFACT" == true ]]; then
  command -v jq >/dev/null 2>&1 || {
    echo "internal-indexer-ops.sh: reconcile --ops-artifact requires jq" >&2
    exit 1
  }
  [[ -n "${INTERNAL_API_SECRET:-}" ]] || {
    echo "internal-indexer-ops.sh: reconcile --ops-artifact requires INTERNAL_API_SECRET" >&2
    exit 1
  }
  dry_mix=0
  [[ "${cs_dry:-false}" == true ]] && dry_mix=$((dry_mix + 1))
  [[ "${el_dry:-false}" == true ]] && dry_mix=$((dry_mix + 1))
  [[ "${ce_dry:-false}" == true ]] && dry_mix=$((dry_mix + 1))
  if [[ "$dry_mix" -gt 1 ]]; then
    echo "internal-indexer-ops.sh: reconcile --ops-artifact: at most one of --chain-scope-dry-run / --event-log-scope-dry-run / --correction-executor-scope-dry-run" >&2
    exit 1
  fi
  if [[ -n "${cs_exec:-}" || -n "${el_exec:-}" || -n "${ce_exec:-}" ]]; then
    echo "internal-indexer-ops.sh: reconcile --ops-artifact cannot be used with rollback-execute flags (read-only artifacts only)" >&2
    exit 1
  fi
  if [[ "${persist:-false}" == "true" ]]; then
    echo "internal-indexer-ops.sh: reconcile --ops-artifact forbids --persist (Epic D-05～D-08 read-only)" >&2
    exit 1
  fi
  HOST_GIT_COMMIT=""
  HOST_GIT_BRANCH=""
  HOST_REPO_DIRTY_JSON="null"
  if repo_root=$(git -C "$SCRIPT_DIR/../.." rev-parse --show-toplevel 2>/dev/null); then
    if commit=$(git -C "$repo_root" rev-parse HEAD 2>/dev/null); then
      HOST_GIT_COMMIT="$commit"
      if br=$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null); then
        HOST_GIT_BRANCH="$br"
      fi
      if git -C "$repo_root" diff --quiet && git -C "$repo_root" diff --cached --quiet 2>/dev/null; then
        HOST_REPO_DIRTY_JSON="false"
      else
        HOST_REPO_DIRTY_JSON="true"
      fi
    fi
  fi
  chain_json='null'
  if [[ -n "${CHAIN_ID:-}" ]] && [[ "${CHAIN_ID}" =~ ^[0-9]+$ ]]; then
    chain_json="${CHAIN_ID}"
  fi
  if echo "$out" | jq -e . >/dev/null 2>&1; then
    payload_json=$(echo "$out" | jq -c .)
  else
    payload_json=$(jq -n --arg r "$out" '{non_json_body: $r}')
  fi
  if [[ "${el_dry:-false}" == true ]]; then
    # shellcheck disable=SC2016
    jq -n \
      --argjson p "$payload_json" \
      --arg base "$BASE" \
      --arg ver "$OPS_ARTIFACT_SCHEMA_VERSION" \
      --arg av "$OPS_ARTIFACT_VERSION_LABEL" \
      --arg sem "$INTERNAL_INDEXER_OPS_SCRIPT_SEMVER" \
      --arg hcommit "$HOST_GIT_COMMIT" \
      --arg hbranch "$HOST_GIT_BRANCH" \
      --argjson hdirty "$HOST_REPO_DIRTY_JSON" \
      --argjson chain_id "$chain_json" \
      '$p as $p
        | ($p.event_log_chain_scope_rollback_dry_run) as $dr
        | (
            if $dr != null then
              (($dr.event_log_rows // 0) + ($dr.checkpoints_sharded_rows // 0)
                + ($dr.fee_router_routed_events_rows // 0) + ($dr.region_vault_forwarded_events_rows // 0)) as $sum
              | {it: $sum, cl: ($sum == 0), rc: null}
            else
              (if ($p.error // null) != null then ($p.error | tostring) else
                (if ($p.status // "") == "ok" then "event_log_chain_scope_rollback_dry_run_absent"
                 else "indexer_reconcile_response_without_event_log_dry_run" end)
               end) as $rc
              | {it: 0, cl: false, rc: $rc}
            end
          ) as $m
        | $m.it as $it
        | $m.cl as $cl
        | $m.rc as $rc
        | {
            artifact_schema_id: "traveltrust.ops_artifact.v1",
            artifact_schema_version: $ver,
            artifact_version: $av,
            artifact_type: "dry_run_event_log",
            dry_run: true,
            reason_code: $rc,
            captured_at: (now | todate),
            epic_task_id: "Epic-D-D07",
            provenance: {
              script: "internal-indexer-ops.sh",
              script_semver: $sem,
              host_git_commit: (if ($hcommit | length) > 0 then $hcommit else null end),
              host_git_branch: (if ($hbranch | length) > 0 then $hbranch else null end),
              host_repo_dirty: $hdirty
            },
            api_context: {
              api_base_url_redacted: $base,
              chain_id: $chain_id,
              internal_invoked: true,
              persist_requested: false,
              event_log_chain_scope_rollback_execute_requested: false
            },
            ops_summary: {
              dry_run: true,
              domain: "event_log",
              issues_total: $it,
              clean: $cl
            },
            dry_run_event_log_surface: {
              issues_total: $it,
              event_log_chain_scope_rollback_dry_run_present: ($dr != null),
              anchor: ($dr.anchor // null),
              event_log_rows: ($dr.event_log_rows // null),
              checkpoints_sharded_rows: ($dr.checkpoints_sharded_rows // null),
              fee_router_routed_events_rows: ($dr.fee_router_routed_events_rows // null),
              region_vault_forwarded_events_rows: ($dr.region_vault_forwarded_events_rows // null)
            },
            payload: $p
          }'
  elif [[ "${ce_dry:-false}" == true ]]; then
    # shellcheck disable=SC2016
    jq -n \
      --argjson p "$payload_json" \
      --arg base "$BASE" \
      --arg ver "$OPS_ARTIFACT_SCHEMA_VERSION" \
      --arg av "$OPS_ARTIFACT_VERSION_LABEL" \
      --arg sem "$INTERNAL_INDEXER_OPS_SCRIPT_SEMVER" \
      --arg hcommit "$HOST_GIT_COMMIT" \
      --arg hbranch "$HOST_GIT_BRANCH" \
      --argjson hdirty "$HOST_REPO_DIRTY_JSON" \
      --argjson chain_id "$chain_json" \
      '$p as $p
        | ($p.correction_executor_chain_scope_rollback_dry_run) as $dr
        | (
            if $dr != null then
              (($dr.correction_log_rows // 0) + ($dr.executor_executions_rows // 0)) as $sum
              | {it: $sum, cl: ($sum == 0), rc: null}
            else
              (if ($p.error // null) != null then ($p.error | tostring) else
                (if ($p.status // "") == "ok" then "correction_executor_chain_scope_rollback_dry_run_absent"
                 else "indexer_reconcile_response_without_correction_executor_dry_run" end)
               end) as $rc
              | {it: 0, cl: false, rc: $rc}
            end
          ) as $m
        | $m.it as $it
        | $m.cl as $cl
        | $m.rc as $rc
        | {
            artifact_schema_id: "traveltrust.ops_artifact.v1",
            artifact_schema_version: $ver,
            artifact_version: $av,
            artifact_type: "dry_run_correction_executor",
            dry_run: true,
            reason_code: $rc,
            captured_at: (now | todate),
            epic_task_id: "Epic-D-D08",
            provenance: {
              script: "internal-indexer-ops.sh",
              script_semver: $sem,
              host_git_commit: (if ($hcommit | length) > 0 then $hcommit else null end),
              host_git_branch: (if ($hbranch | length) > 0 then $hbranch else null end),
              host_repo_dirty: $hdirty
            },
            api_context: {
              api_base_url_redacted: $base,
              chain_id: $chain_id,
              internal_invoked: true,
              persist_requested: false,
              correction_executor_chain_scope_rollback_execute_requested: false
            },
            ops_summary: {
              dry_run: true,
              domain: "correction_executor",
              issues_total: $it,
              clean: $cl
            },
            dry_run_correction_executor_surface: {
              issues_total: $it,
              correction_executor_chain_scope_rollback_dry_run_present: ($dr != null),
              anchor: ($dr.anchor // null),
              correction_log_rows: ($dr.correction_log_rows // null),
              executor_executions_rows: ($dr.executor_executions_rows // null)
            },
            payload: $p
          }'
  elif [[ "${cs_dry:-false}" == true ]]; then
    # shellcheck disable=SC2016
    jq -n \
      --argjson p "$payload_json" \
      --arg base "$BASE" \
      --arg ver "$OPS_ARTIFACT_SCHEMA_VERSION" \
      --arg av "$OPS_ARTIFACT_VERSION_LABEL" \
      --arg sem "$INTERNAL_INDEXER_OPS_SCRIPT_SEMVER" \
      --arg hcommit "$HOST_GIT_COMMIT" \
      --arg hbranch "$HOST_GIT_BRANCH" \
      --argjson hdirty "$HOST_REPO_DIRTY_JSON" \
      --argjson chain_id "$chain_json" \
      '$p as $p
        | ($p.orders_chain_scope_rollback_dry_run) as $dr
        | (if $dr == null then {it: 1, cl: false} else {it: ($dr.orders_chain_id_null_with_escrow_address // 0), cl: (($dr.orders_chain_id_null_with_escrow_address // 0) == 0)} end) as $m
        | $m.it as $it
        | $m.cl as $cl
        | {
            artifact_schema_id: "traveltrust.ops_artifact.v1",
            artifact_schema_version: $ver,
            artifact_version: $av,
            artifact_type: "dry_run_chain",
            dry_run: true,
            captured_at: (now | todate),
            epic_task_id: "Epic-D-D06",
            provenance: {
              script: "internal-indexer-ops.sh",
              script_semver: $sem,
              host_git_commit: (if ($hcommit | length) > 0 then $hcommit else null end),
              host_git_branch: (if ($hbranch | length) > 0 then $hbranch else null end),
              host_repo_dirty: $hdirty
            },
            api_context: {
              api_base_url_redacted: $base,
              chain_id: $chain_id,
              internal_invoked: true,
              persist_requested: false,
              orders_chain_scope_rollback_execute_requested: false
            },
            ops_summary: {
              dry_run: true,
              domain: "chain",
              issues_total: $it,
              clean: $cl
            },
            dry_run_chain_surface: {
              issues_total: $it,
              orders_chain_scope_rollback_dry_run_present: ($dr != null),
              anchor: ($dr.anchor // null),
              orders_chain_id_null_with_escrow_address: ($dr.orders_chain_id_null_with_escrow_address // null)
            },
            payload: $p
          }'
  else
    # shellcheck disable=SC2016
    jq -n \
      --argjson p "$payload_json" \
      --arg base "$BASE" \
      --arg ver "$OPS_ARTIFACT_SCHEMA_VERSION" \
      --arg av "$OPS_ARTIFACT_VERSION_LABEL" \
      --arg sem "$INTERNAL_INDEXER_OPS_SCRIPT_SEMVER" \
      --arg hcommit "$HOST_GIT_COMMIT" \
      --arg hbranch "$HOST_GIT_BRANCH" \
      --argjson hdirty "$HOST_REPO_DIRTY_JSON" \
      --argjson chain_id "$chain_json" \
      '$p as $p
        | ($p.issues_total // null) as $it
        | ($p.projection_reconcile_clean // null) as $prc
        | ($p.reconcile_compound_pass // null) as $rcp
        | ($p.orders_projection_reconcile_gate.pass // null) as $opgp
        | ($p.indexer_reconcile_compound_gate.pass // null) as $icgp
        | {
            artifact_schema_id: "traveltrust.ops_artifact.v1",
            artifact_schema_version: $ver,
            artifact_version: $av,
            artifact_type: "reconcile",
            dry_run: false,
            captured_at: (now | todate),
            epic_task_id: "Epic-D-D05",
            provenance: {
              script: "internal-indexer-ops.sh",
              script_semver: $sem,
              host_git_commit: (if ($hcommit | length) > 0 then $hcommit else null end),
              host_git_branch: (if ($hbranch | length) > 0 then $hbranch else null end),
              host_repo_dirty: $hdirty
            },
            api_context: {
              api_base_url_redacted: $base,
              chain_id: $chain_id,
              internal_invoked: true,
              persist_requested: false
            },
            ops_summary: {
              dry_run: false,
              domain: "orders",
              issues_total: ($it // 0),
              clean: ($prc // false)
            },
            reconcile_surface: {
              issues_total: $it,
              projection_reconcile_clean: $prc,
              reconcile_compound_pass: $rcp,
              orders_projection_reconcile_gate_pass: $opgp,
              indexer_reconcile_compound_gate_pass: $icgp
            },
            payload: $p
          }'
  fi
elif [[ "$cmd" == "status" && "$STATUS_OPS_ARTIFACT" == true ]]; then
  command -v jq >/dev/null 2>&1 || {
    echo "internal-indexer-ops.sh: status --ops-artifact requires jq" >&2
    exit 1
  }
  [[ -n "${INTERNAL_API_SECRET:-}" ]] || {
    echo "internal-indexer-ops.sh: status --ops-artifact requires INTERNAL_API_SECRET" >&2
    exit 1
  }
  HOST_GIT_COMMIT=""
  HOST_GIT_BRANCH=""
  HOST_REPO_DIRTY_JSON="null"
  if repo_root=$(git -C "$SCRIPT_DIR/../.." rev-parse --show-toplevel 2>/dev/null); then
    if commit=$(git -C "$repo_root" rev-parse HEAD 2>/dev/null); then
      HOST_GIT_COMMIT="$commit"
      if br=$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null); then
        HOST_GIT_BRANCH="$br"
      fi
      if git -C "$repo_root" diff --quiet && git -C "$repo_root" diff --cached --quiet 2>/dev/null; then
        HOST_REPO_DIRTY_JSON="false"
      else
        HOST_REPO_DIRTY_JSON="true"
      fi
    fi
  fi
  chain_json='null'
  if [[ -n "${CHAIN_ID:-}" ]] && [[ "${CHAIN_ID}" =~ ^[0-9]+$ ]]; then
    chain_json="${CHAIN_ID}"
  fi
  if echo "$out" | jq -e . >/dev/null 2>&1; then
    payload_json=$(echo "$out" | jq -c .)
  else
    payload_json=$(jq -n --arg r "$out" '{non_json_body: $r}')
  fi
  live_json='false'
  if [[ "$STATUS_LIVE_RECONCILE" == true ]]; then
    live_json='true'
  fi
  # shellcheck disable=SC2016
  jq -n \
    --argjson p "$payload_json" \
    --arg base "$BASE" \
    --arg ver "$OPS_ARTIFACT_SCHEMA_VERSION" \
    --arg av "$OPS_ARTIFACT_VERSION_LABEL" \
    --arg sem "$INTERNAL_INDEXER_OPS_SCRIPT_SEMVER" \
    --arg hcommit "$HOST_GIT_COMMIT" \
    --arg hbranch "$HOST_GIT_BRANCH" \
    --argjson hdirty "$HOST_REPO_DIRTY_JSON" \
    --argjson chain_id "$chain_json" \
    --argjson live_mode "$live_json" \
    '$p as $p
      | ($p.state.checkpoint // null) as $ckpt
      | ($p.state.checkpoint.block_number // null) as $cb
      | ($p.state.checkpoint.log_index // null) as $cl
      | ($p.state.lag_blocks // null) as $lag
      | ($p.state.lag_max_blocks // null) as $lagmax
      | ($p.indexer.last_block // null) as $lb
      | ($p.indexer.last_block_hash // null) as $lbh
      | ($p.status // null) as $pst
      | (if $live_mode then "Epic-D-D04" else "Epic-D-D03" end) as $epic
      | (if $live_mode then
          (($p.live_orders_projection_reconcile // null)
            | {
                projection_reconcile_clean: (.projection_reconcile_clean // null),
                issues_total: (.issues_total // null),
                ok: (.ok // null),
                error: (.error // null)
              })
        else null end) as $lrsurf
      | {
          artifact_schema_id: "traveltrust.ops_artifact.v1",
          artifact_schema_version: $ver,
          artifact_version: $av,
          artifact_type: "indexer_status",
          captured_at: (now | todate),
          epic_task_id: $epic,
          status: $pst,
          checkpoint: $ckpt,
          lag: {lag_blocks: $lag, lag_max_blocks: $lagmax},
          provenance: {
            script: "internal-indexer-ops.sh",
            script_semver: $sem,
            host_git_commit: (if ($hcommit | length) > 0 then $hcommit else null end),
            host_git_branch: (if ($hbranch | length) > 0 then $hbranch else null end),
            host_repo_dirty: $hdirty
          },
          api_context: {
            api_base_url_redacted: $base,
            chain_id: $chain_id,
            internal_invoked: true,
            live_reconcile_query: $live_mode
          },
          indexer_surface: {
            checkpoint_block_number: $cb,
            checkpoint_log_index: $cl,
            lag_blocks: $lag,
            lag_max_blocks: $lagmax,
            last_block: $lb,
            last_block_hash: $lbh
          },
          live_reconcile_surface: $lrsurf,
          payload: $p
        }'
elif command -v jq >/dev/null 2>&1; then
  echo "$out" | jq .
else
  echo "$out"
fi
