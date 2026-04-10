#!/usr/bin/env bash
# 内网探针：GET …/internal/indexer-status?live_reconcile=1，校验 DB 即时对账是否干净。
# 用途：cron / K8s exec / 值班手工；须 **INTERNAL_API_SECRET**（与 API 一致）及内网可达 **/api/v1/internal/***。
# 契约：ops/RUNBOOK.md §2.55、docs/spec/04 §3.4、110、**Epic D-09**（**`--ops-artifact`** → **`traveltrust.ops_artifact.v1`** / **`artifact_type:probe`**）。
#
# **B-120 / gate 同锚**：**`gate_workflow_checks_total_expected`** 须与 **`.github/workflows/indexer-reconcile-gate.yml`** **`checks_total`** 一致（当前 **113**，含 **TT-B110-SEQ5**/**SEQ6**/**SEQ8**/**SEQ9**/**SEQ10**/**SEQ11** 机读锚）；**`gate_workflow_rule_id`** = **`indexer-reconcile-gate`**。
#
# 环境变量：
#   API_BASE_URL           默认 http://127.0.0.1:8080
#   INTERNAL_API_SECRET    与 API 一致时自动加 X-Internal-Api-Secret
#   CHAIN_ID               可选；写入 artifact **`api_context.chain_id`**（整数）
#
# 退出码：
#   0  对账干净（projection_reconcile_clean == true）
#   1  用法错误 / 缺少 jq
#   2  HTTP 非 200
#   3  响应缺少 live_orders_projection_reconcile
#   4  live 块 ok==false（无 DB、无链配置、SQL 失败等）
#   5  ok==true 但对账不干净（issues_total > 0）
#
# Windows：.\scripts\indexer-reconcile-probe.ps1（委托本脚本；须 **Git Bash** + **jq**）

set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Sync with .github/workflows/indexer-reconcile-gate.yml `checks_total` (B-120 / 110 §3.1.2 互证)
INDEXER_RECONCILE_GATE_CHECKS_TOTAL=113
INDEXER_RECONCILE_GATE_RULE_ID="indexer-reconcile-gate"
INDEXER_RECONCILE_GATE_JOB="indexer-reconcile"
INDEXER_RECONCILE_PROBE_SCRIPT_SEMVER="1.1.0"

OPS_ARTIFACT=false
for a in "$@"; do
  if [[ "$a" == "--ops-artifact" ]]; then
    OPS_ARTIFACT=true
  else
    echo "indexer-reconcile-probe.sh: unknown option: $a" >&2
    exit 1
  fi
done

if ! command -v jq >/dev/null 2>&1; then
  echo "indexer-reconcile-probe.sh: jq is required" >&2
  exit 1
fi

declare -a CURL_EXTRA=()
if [[ -n "${INTERNAL_API_SECRET:-}" ]]; then
  CURL_EXTRA+=(-H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}")
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

code="$(
  curl -sS -o "$tmp" -w "%{http_code}" \
    "${CURL_EXTRA[@]}" \
    "${BASE}/api/v1/internal/indexer-status?live_reconcile=1"
)"

if echo "$tmp" | jq -e . >/dev/null 2>&1; then
  payload_json="$(jq -c . "$tmp")"
else
  # shellcheck disable=SC2002
  body_snip="$(head -c 8000 "$tmp" || true)"
  payload_json="$(jq -n --arg b "$body_snip" --argjson c "$code" '{non_json_body: $b, http_code: $c}')"
fi

ec=0
if [[ "$code" != "200" ]]; then
  ec=2
  echo "indexer-reconcile-probe.sh: HTTP ${code} (expected 200)" >&2
  head -c 400 "$tmp" >&2 || true
  echo >&2
elif ! jq -e '.live_orders_projection_reconcile != null' "$tmp" >/dev/null 2>&1; then
  ec=3
  echo "indexer-reconcile-probe.sh: missing .live_orders_projection_reconcile (need ?live_reconcile=1)" >&2
elif ! jq -e '.live_orders_projection_reconcile.ok == true' "$tmp" >/dev/null 2>&1; then
  ec=4
  err="$(jq -r '.live_orders_projection_reconcile.error // "unknown"' "$tmp")"
  msg="$(jq -r '.live_orders_projection_reconcile.message // ""' "$tmp")"
  echo "indexer-reconcile-probe.sh: live reconcile failed: ${err} ${msg}" >&2
elif ! jq -e '.live_orders_projection_reconcile.projection_reconcile_clean == true' "$tmp" >/dev/null 2>&1; then
  ec=5
  issues="$(jq -r '.live_orders_projection_reconcile.issues_total // "?"' "$tmp")"
  echo "indexer-reconcile-probe.sh: projection not clean (issues_total=${issues})" >&2
  jq '.live_orders_projection_reconcile' "$tmp" >&2
else
  ec=0
  if [[ "$OPS_ARTIFACT" != true ]]; then
    echo "indexer-reconcile-probe.sh: ok (projection_reconcile_clean)"
    jq '.live_orders_projection_reconcile | {chain_id, issues_total, projection_reconcile_clean}' "$tmp"
  fi
fi

if [[ "$OPS_ARTIFACT" == true ]]; then
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
  # shellcheck disable=SC2016
  jq -n \
    --argjson p "$payload_json" \
    --argjson ec "$ec" \
    --arg base "$BASE" \
    --arg ver "1.0.0" \
    --arg av "v1" \
    --arg sem "$INDEXER_RECONCILE_PROBE_SCRIPT_SEMVER" \
    --arg hcommit "$HOST_GIT_COMMIT" \
    --arg hbranch "$HOST_GIT_BRANCH" \
    --argjson hdirty "$HOST_REPO_DIRTY_JSON" \
    --argjson chain_id "$chain_json" \
    --argjson gate_total "$INDEXER_RECONCILE_GATE_CHECKS_TOTAL" \
    --arg gate_rule "$INDEXER_RECONCILE_GATE_RULE_ID" \
    --arg gate_job "$INDEXER_RECONCILE_GATE_JOB" \
    '$p as $p
      | $ec as $ec
      | ($p.live_orders_projection_reconcile // null) as $live
      | (if $live != null then ($live.issues_total // 0) else null end) as $it
      | (if $ec == 0 then true else false end) as $cl
      | {
          artifact_schema_id: "traveltrust.ops_artifact.v1",
          artifact_schema_version: $ver,
          artifact_version: $av,
          artifact_type: "probe",
          probe_exit_code: $ec,
          issues_total: $it,
          clean: $cl,
          gate_workflow_checks_total_expected: $gate_total,
          gate_workflow_rule_id: $gate_rule,
          gate_workflow_job: $gate_job,
          captured_at: (now | todate),
          epic_task_id: "Epic-D-D09",
          provenance: {
            script: "indexer-reconcile-probe.sh",
            script_semver: $sem,
            host_git_commit: (if ($hcommit | length) > 0 then $hcommit else null end),
            host_git_branch: (if ($hbranch | length) > 0 then $hbranch else null end),
            host_repo_dirty: $hdirty
          },
          api_context: {
            api_base_url_redacted: $base,
            chain_id: $chain_id,
            internal_invoked: true,
            live_reconcile_query: true
          },
          payload: {
            indexer_status: $p,
            probe_exit_code: $ec,
            issues_total: $it,
            projection_reconcile_clean: (if $live == null then null else $live.projection_reconcile_clean end),
            gate_workflow_checks_total_expected: $gate_total,
            gate_workflow_rule_id: $gate_rule,
            gate_workflow_job: $gate_job
          }
        }'
fi

exit "$ec"
