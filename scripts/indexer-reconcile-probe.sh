#!/usr/bin/env bash
# 内网探针：GET …/internal/indexer-status?live_reconcile=1，校验 DB 即时对账是否干净。
# 用途：cron / K8s exec / 值班手工；须 **INTERNAL_API_SECRET**（与 API 一致）及内网可达 **/api/v1/internal/***。
# 契约：ops/RUNBOOK.md §2.55、docs/spec/04 §3.4、110。
#
# 环境变量：
#   API_BASE_URL           默认 http://127.0.0.1:8080
#   INTERNAL_API_SECRET    与 API 一致时自动加 X-Internal-Api-Secret
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

if [[ "$code" != "200" ]]; then
  echo "indexer-reconcile-probe.sh: HTTP ${code} (expected 200)" >&2
  head -c 400 "$tmp" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e '.live_orders_projection_reconcile != null' "$tmp" >/dev/null 2>&1; then
  echo "indexer-reconcile-probe.sh: missing .live_orders_projection_reconcile (need ?live_reconcile=1)" >&2
  exit 3
fi

if ! jq -e '.live_orders_projection_reconcile.ok == true' "$tmp" >/dev/null 2>&1; then
  err="$(jq -r '.live_orders_projection_reconcile.error // "unknown"' "$tmp")"
  msg="$(jq -r '.live_orders_projection_reconcile.message // ""' "$tmp")"
  echo "indexer-reconcile-probe.sh: live reconcile failed: ${err} ${msg}" >&2
  exit 4
fi

if ! jq -e '.live_orders_projection_reconcile.projection_reconcile_clean == true' "$tmp" >/dev/null 2>&1; then
  issues="$(jq -r '.live_orders_projection_reconcile.issues_total // "?"' "$tmp")"
  echo "indexer-reconcile-probe.sh: projection not clean (issues_total=${issues})" >&2
  jq '.live_orders_projection_reconcile' "$tmp" >&2
  exit 5
fi

echo "indexer-reconcile-probe.sh: ok (projection_reconcile_clean)"
jq '.live_orders_projection_reconcile | {chain_id, issues_total, projection_reconcile_clean}' "$tmp"
exit 0
