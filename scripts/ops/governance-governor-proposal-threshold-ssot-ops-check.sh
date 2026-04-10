#!/usr/bin/env bash
# Admin 探针：**`GET /api/v1/admin/observability/overview`** → **`overview.governor_proposal_threshold_ssot_ops_check`**
# （**TT-B110-SEQ8-GOVERNANCE-GOVERNOR-PROPOSAL-THRESHOLD-CHAIN-SSOT-001**）；与 **`internal/indexer-reconcile`** 正交（本脚本**不**用 **internal** 密钥）。
#
# 契约：**`docs/spec/04-后端与API.md`** Admin 表、**`ops/RUNBOOK.md`** §2.55 旁注。
#
# 环境变量：
#   API_BASE_URL         默认 http://127.0.0.1:8080
#   ADMIN_BEARER_TOKEN   与浏览器 Admin 会话 **Bearer** 同源（**勿**入库）
#
# 退出码：
#   0  **`overall`==`ok`** 且 **`exit_code_hint`==0**
#   1  缺 **jq** / 缺 **`ADMIN_BEARER_TOKEN`**
#   2  HTTP 非 200
#   3  响应缺少 **`overview.governor_proposal_threshold_ssot_ops_check`**
#   4  门禁失败（**`overall`****≠****`ok`** 或 **`exit_code_hint`****≠****`0`**）
#
# Windows：**`.\scripts\governance-governor-proposal-threshold-ssot-ops-check.ps1`**（委托本脚本；须 **Git Bash** + **jq**）

set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

if ! command -v jq >/dev/null 2>&1; then
  echo "governance-governor-proposal-threshold-ssot-ops-check.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "governance-governor-proposal-threshold-ssot-ops-check.sh: ADMIN_BEARER_TOKEN is required" >&2
  exit 1
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

code="$(
  curl -sS -o "$tmp" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/admin/observability/overview"
)"

if [[ "$code" != "200" ]]; then
  echo "governance-governor-proposal-threshold-ssot-ops-check.sh: HTTP ${code} (expected 200)" >&2
  head -c 800 "$tmp" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e '.overview.governor_proposal_threshold_ssot_ops_check != null' "$tmp" >/dev/null 2>&1; then
  echo "governance-governor-proposal-threshold-ssot-ops-check.sh: missing overview.governor_proposal_threshold_ssot_ops_check" >&2
  exit 3
fi

overall="$(jq -r '.overview.governor_proposal_threshold_ssot_ops_check.overall // empty' "$tmp")"
hint="$(jq -r '.overview.governor_proposal_threshold_ssot_ops_check.exit_code_hint // empty' "$tmp")"

if [[ "$overall" != "ok" ]] || [[ "$hint" != "0" ]]; then
  echo "governance-governor-proposal-threshold-ssot-ops-check.sh: gate fail overall=${overall} exit_code_hint=${hint}" >&2
  jq '.overview.governor_proposal_threshold_ssot_ops_check' "$tmp" >&2
  exit 4
fi

echo "governance-governor-proposal-threshold-ssot-ops-check.sh: ok (governor_proposal_threshold_ssot_ops_check)"
exit 0
