#!/usr/bin/env bash
# 合并 **公开** `/health` + `/meta` 为一条 JSON（运维留痕、本地验收）。
# 可选 **ADMIN_BEARER_TOKEN**（登录 session，**勿**写入仓库）：
#   **GET /api/v1/admin/indexer/health** → **`admin_indexer_health`**
#   **GET /api/v1/admin/observability/overview** → **`admin_observability_overview`**
# 可选 **INTERNAL_API_SECRET**（与 API 配置一致，**勿**写入仓库）：
#   **GET /api/v1/internal/indexer-status** → **`internal_indexer_status`**（checkpoint、lag；**`meta.build`** 与 **`GET /meta.build`** 同源 **120/140**；有 DB 时可含 **`last_stored_orders_projection_reconcile`**）
#   **POST /api/v1/internal/indexer-reconcile** body **`{"persist":false}`**（**不**写 reconciliation_reports）→ **`internal_indexer_reconcile`**
#   可选 **`SNAPSHOT_INTERNAL_RECONCILE_RPC`**：设为 **1～10** 时在 reconcile body 中增加 **`rpc_escrow_samples`**（须 RPC+factory；见 04 / 110）。
#   可选 **`SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_CHAIN_TIP=1`**：reconcile body 增加 **`include_chain_tip:true`**（**`chain_observation`** / **`110-RECONCILE-CHAIN-TIP`**；与 **`internal-indexer-ops.sh reconcile --include-chain-tip`** 同语义）。
#   可选 **`SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_EVENT_LOG_ESCROW_COVERAGE=1`**：reconcile body 增加 **`include_event_log_escrow_coverage:true`**（**`event_log_escrow_coverage`** / **`110-EVENT-LOG-ESCROW-COVERAGE`**；与 **`internal-indexer-ops.sh reconcile --include-event-log-escrow-coverage`** 同语义；**DB 已索引**范围）。
#   可选 **`SNAPSHOT_INTERNAL_STATUS_LIVE_RECONCILE=1`**：**GET …/internal/indexer-status?live_reconcile=1**（即时只读 **`orders`↔`orders_projection`**；须 DB+链配置；见 04 / 110）。
#   可选 **`SNAPSHOT_INTERNAL_INDEXER_TICK=1`**：**POST …/internal/indexer-tick** → **`internal_indexer_tick`**（**会推进** checkpoint / 写库；用于 evidence 捕获 **`logs_fetch_skipped`**/**`meta.build`** 等；**默认不调用**）。
#   可选 **`SNAPSHOT_INTERNAL_SKIP_RECONCILE=1`**：在已设 **`INTERNAL_API_SECRET`** 时**仍**拉 **`GET …/internal/indexer-status`**（及可选 **tick**），但**不** **`POST …/internal/indexer-reconcile`**（**`internal_indexer_reconcile`** 为机读 **`snapshot_skipped`**；减轻 RPC/DB；**`SNAPSHOT_INTERNAL_RECONCILE_*`** body 选项此时**不生效**）。合并 JSON 中 **`snapshot_options.snapshot_internal_reconcile_rpc`** / **`…_include_chain_tip`** / **`…_include_event_log_escrow_coverage`** 在此模式下强制 **`null`**（避免 evidence 误读）。
#   （须 **内网** 可达 **/api/v1/internal/***；若 API 未配置密钥可不设此项则跳过。）
#
# 用法：
#   API_BASE_URL=http://127.0.0.1:8080 ./scripts/indexer-public-snapshot.sh
#   INTERNAL_API_SECRET='…' SNAPSHOT_INTERNAL_RECONCILE_RPC=3 API_BASE_URL=… ./scripts/indexer-public-snapshot.sh
#   INTERNAL_API_SECRET='…' SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_CHAIN_TIP=1 API_BASE_URL=… ./scripts/indexer-public-snapshot.sh
#   INTERNAL_API_SECRET='…' SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_EVENT_LOG_ESCROW_COVERAGE=1 API_BASE_URL=… ./scripts/indexer-public-snapshot.sh
#   INTERNAL_API_SECRET='…' SNAPSHOT_INTERNAL_INDEXER_TICK=1 API_BASE_URL=… ./scripts/indexer-public-snapshot.sh   # 慎用：真实 tick
#   INTERNAL_API_SECRET='…' SNAPSHOT_INTERNAL_SKIP_RECONCILE=1 API_BASE_URL=… ./scripts/indexer-public-snapshot.sh
#
# Windows：.\scripts\indexer-public-snapshot.ps1（委托本脚本；须 **Git Bash** + **jq**）
#
# 依赖：curl、jq
#
# 合并 JSON 顶域 **`snapshot_provenance`**：**`script`**（固定 **`indexer-public-snapshot.sh`**）、**`script_semver`**（本常量）、**`host_git_commit`**（**`git rev-parse HEAD`**；仓库外为 **`null`**）、**`host_git_branch`**（**`git rev-parse --abbrev-ref HEAD`**；仓库外为 **`null`**）、**`host_repo_dirty`**（**`true`**/**`false`**；非 Git 工作区为 **`null`**）。**形状或语义变时须 bump `script_semver`** 并与 **07 §六 6.4**/**110 §3.1.2**/**`indexer-reconcile-gate`** 同批。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST_GIT_COMMIT=""
HOST_GIT_BRANCH=""
HOST_REPO_DIRTY_JSON="null"
if repo_root=$(git -C "$SCRIPT_DIR/.." rev-parse --show-toplevel 2>/dev/null); then
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

# Bump when merged JSON shape / semantics change (keep in sync with docs + CI anchor count).
INDEXER_PUBLIC_SNAPSHOT_SCRIPT_SEMVER="1.3.0"

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

command -v jq >/dev/null 2>&1 || {
  echo "indexer-public-snapshot.sh: jq is required" >&2
  exit 1
}

# 若设置则须为 1～10（与 API **indexer-reconcile** 一致）。
validate_snapshot_rpc_env() {
  local rpc="${SNAPSHOT_INTERNAL_RECONCILE_RPC:-}"
  [[ -z "$rpc" ]] && return 0
  case "$rpc" in
    1|2|3|4|5|6|7|8|9|10) return 0 ;;
  esac
  echo "indexer-public-snapshot.sh: SNAPSHOT_INTERNAL_RECONCILE_RPC must be 1-10 or unset (got: ${rpc})" >&2
  exit 1
}

validate_snapshot_rpc_env

# JSON number or literal null for top-level snapshot_options
snapshot_rpc_json='null'
if [[ -n "${SNAPSHOT_INTERNAL_RECONCILE_RPC:-}" ]]; then
  snapshot_rpc_json=$(jq -n --argjson r "${SNAPSHOT_INTERNAL_RECONCILE_RPC}" '$r')
fi

# Body for POST internal indexer-reconcile
internal_reconcile_post_body() {
  local base
  if [[ -z "${SNAPSHOT_INTERNAL_RECONCILE_RPC:-}" ]]; then
    base=$(jq -n '{persist: false}')
  else
    base=$(jq -n --argjson r "${SNAPSHOT_INTERNAL_RECONCILE_RPC}" '{persist: false, rpc_escrow_samples: $r}')
  fi
  if [[ "${SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_CHAIN_TIP:-}" == "1" ]]; then
    base=$(echo "$base" | jq '. + {include_chain_tip: true}')
  fi
  if [[ "${SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_EVENT_LOG_ESCROW_COVERAGE:-}" == "1" ]]; then
    base=$(echo "$base" | jq '. + {include_event_log_escrow_coverage: true}')
  fi
  echo "$base"
}

# Wrap HTTP body: compact JSON, or curl_failed / non_json_body (single line for --argjson).
json_wrap_response() {
  local raw="${1:-}"
  if [[ -z "$raw" ]]; then
    jq -n '{ "curl_failed": true }'
  elif echo "$raw" | jq -e . >/dev/null 2>&1; then
    echo "$raw" | jq -c .
  else
    jq -n --arg raw "$raw" '{ "non_json_body": $raw }'
  fi
}

# GET JSON from admin API; stdout = compact JSON or error wrapper (single line).
fetch_admin_json() {
  local url_path="$1"
  local rid_suffix="$2"
  local admin_raw
  admin_raw=$(
    curl -sS -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
      -H "x-request-id: indexer-snapshot-${rid_suffix}-$(date +%s)-$$" \
      "${BASE}${url_path}" || true
  )
  json_wrap_response "$admin_raw"
}

# GET JSON from internal API (须 **X-Internal-Api-Secret**).
fetch_internal_json() {
  local url_path="$1"
  local rid_suffix="$2"
  local raw
  raw=$(
    curl -sS \
      -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
      -H "x-request-id: indexer-snapshot-${rid_suffix}-$(date +%s)-$$" \
      "${BASE}${url_path}" || true
  )
  json_wrap_response "$raw"
}

health=$(curl -sSf "$BASE/health")
meta=$(curl -sSf "$BASE/meta")

admin_json='null'
obs_json='null'
if [[ -n "${ADMIN_BEARER_TOKEN:-}" ]]; then
  admin_json=$(fetch_admin_json "/api/v1/admin/indexer/health" "health")
  obs_json=$(fetch_admin_json "/api/v1/admin/observability/overview" "obs")
fi

internal_status_json='null'
internal_reconcile_json='null'
snapshot_status_live_json='null'
if [[ "${SNAPSHOT_INTERNAL_STATUS_LIVE_RECONCILE:-}" == "1" ]]; then
  snapshot_status_live_json='"1"'
else
  snapshot_status_live_json='null'
fi
snapshot_include_chain_tip_json='null'
if [[ "${SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_CHAIN_TIP:-}" == "1" ]]; then
  snapshot_include_chain_tip_json='"1"'
fi
snapshot_include_event_log_escrow_coverage_json='null'
if [[ "${SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_EVENT_LOG_ESCROW_COVERAGE:-}" == "1" ]]; then
  snapshot_include_event_log_escrow_coverage_json='"1"'
fi
snapshot_internal_indexer_tick_json='null'
if [[ "${SNAPSHOT_INTERNAL_INDEXER_TICK:-}" == "1" ]]; then
  snapshot_internal_indexer_tick_json='"1"'
fi
snapshot_internal_skip_reconcile_json='null'
if [[ -n "${INTERNAL_API_SECRET:-}" && "${SNAPSHOT_INTERNAL_SKIP_RECONCILE:-}" == "1" ]]; then
  snapshot_internal_skip_reconcile_json='"1"'
fi
internal_tick_json='null'
if [[ -n "${INTERNAL_API_SECRET:-}" ]]; then
  istatus_path="/api/v1/internal/indexer-status"
  if [[ "${SNAPSHOT_INTERNAL_STATUS_LIVE_RECONCILE:-}" == "1" ]]; then
    istatus_path="/api/v1/internal/indexer-status?live_reconcile=1"
  fi
  internal_status_json=$(fetch_internal_json "$istatus_path" "istatus")
  if [[ "${SNAPSHOT_INTERNAL_SKIP_RECONCILE:-}" == "1" ]]; then
    internal_reconcile_json=$(jq -n '{snapshot_skipped: true, reason: "SNAPSHOT_INTERNAL_SKIP_RECONCILE=1"}')
  else
    reconcile_body=$(internal_reconcile_post_body)
    internal_raw=$(
      curl -sS -X POST \
        -H "Content-Type: application/json" \
        -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
        -H "x-request-id: indexer-snapshot-reconcile-$(date +%s)-$$" \
        -d "$reconcile_body" \
        "${BASE}/api/v1/internal/indexer-reconcile" || true
    )
    internal_reconcile_json=$(json_wrap_response "$internal_raw")
  fi
  if [[ "${SNAPSHOT_INTERNAL_INDEXER_TICK:-}" == "1" ]]; then
    tick_raw=$(
      curl -sS -X POST \
        -H "Content-Type: application/json" \
        -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
        -H "x-request-id: indexer-snapshot-tick-$(date +%s)-$$" \
        -d '{}' \
        "${BASE}/api/v1/internal/indexer-tick" || true
    )
    internal_tick_json=$(json_wrap_response "$tick_raw")
  fi
fi

# Reconcile POST 已跳过时，不得在 snapshot_options 中保留会误导审计的 reconcile 请求侧标志。
if [[ -n "${INTERNAL_API_SECRET:-}" && "${SNAPSHOT_INTERNAL_SKIP_RECONCILE:-}" == "1" ]]; then
  snapshot_rpc_json='null'
  snapshot_include_chain_tip_json='null'
  snapshot_include_event_log_escrow_coverage_json='null'
fi

jq -n \
  --argjson health "$health" \
  --argjson meta "$meta" \
  --argjson admin_indexer_health "$admin_json" \
  --argjson admin_observability_overview "$obs_json" \
  --argjson internal_indexer_status "$internal_status_json" \
  --argjson internal_indexer_reconcile "$internal_reconcile_json" \
  --argjson internal_indexer_tick "$internal_tick_json" \
  --argjson snapshot_internal_reconcile_rpc "$snapshot_rpc_json" \
  --argjson snapshot_internal_status_live_reconcile "$snapshot_status_live_json" \
  --argjson snapshot_internal_reconcile_include_chain_tip "$snapshot_include_chain_tip_json" \
  --argjson snapshot_internal_reconcile_include_event_log_escrow_coverage "$snapshot_include_event_log_escrow_coverage_json" \
  --argjson snapshot_internal_indexer_tick "$snapshot_internal_indexer_tick_json" \
  --argjson snapshot_internal_skip_reconcile "$snapshot_internal_skip_reconcile_json" \
  --arg base "$BASE" \
  --arg snap_semver "$INDEXER_PUBLIC_SNAPSHOT_SCRIPT_SEMVER" \
  --arg host_commit "$HOST_GIT_COMMIT" \
  --arg host_branch "$HOST_GIT_BRANCH" \
  --argjson host_repo_dirty "$HOST_REPO_DIRTY_JSON" \
  '{
    api_base_url: $base,
    fetched_at: (now | todate),
    snapshot_provenance: {
      script: "indexer-public-snapshot.sh",
      script_semver: $snap_semver,
      host_git_commit: (if ($host_commit | length) > 0 then $host_commit else null end),
      host_git_branch: (if ($host_branch | length) > 0 then $host_branch else null end),
      host_repo_dirty: $host_repo_dirty
    },
    snapshot_options: {
      snapshot_internal_reconcile_rpc: $snapshot_internal_reconcile_rpc,
      snapshot_internal_status_live_reconcile: $snapshot_internal_status_live_reconcile,
      snapshot_internal_reconcile_include_chain_tip: $snapshot_internal_reconcile_include_chain_tip,
      snapshot_internal_reconcile_include_event_log_escrow_coverage: $snapshot_internal_reconcile_include_event_log_escrow_coverage,
      snapshot_internal_indexer_tick: $snapshot_internal_indexer_tick,
      snapshot_internal_skip_reconcile: $snapshot_internal_skip_reconcile
    },
    health: $health,
    meta: $meta,
    admin_indexer_health: $admin_indexer_health,
    admin_observability_overview: $admin_observability_overview,
    internal_indexer_status: $internal_indexer_status,
    internal_indexer_reconcile: $internal_indexer_reconcile,
    internal_indexer_tick: $internal_indexer_tick
  }'
