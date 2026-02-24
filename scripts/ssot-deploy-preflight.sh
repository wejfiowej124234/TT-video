#!/usr/bin/env bash
# 部署/升级前置：强制 SSOT 校验 + 产出 evidence 证据文件（P0）
#
# 目标：把 08-5 里“二选一至少一条必须为是”的决策硬落地到一个统一脚本入口。
# - 强制调用 scripts/check-ssot-deploy.sh（STRICT_SSOT/CHECK_SSOT=1）
# - 将 SSOT_VERSION + SSOT_SHA256 + git sha + 时间戳写入 evidence JSON
#
# 用法：
#   EVIDENCE_DIR=evidence/GO_YYYYMMDD ./scripts/ssot-deploy-preflight.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

EVIDENCE_DIR="${EVIDENCE_DIR:-evidence/GO_placeholder}"
mkdir -p "$EVIDENCE_DIR"

ts_utc="$(date -u +%Y%m%dT%H%M%SZ)"
out_json="$EVIDENCE_DIR/ssot_deploy_preflight_${ts_utc}.json"

export STRICT_SSOT=1
export CHECK_SSOT=1

./scripts/check-ssot-deploy.sh

ssot_doc="docs/08-3-参数与门禁表.md"
computed_sha=""
if command -v sha256sum >/dev/null 2>&1; then
  computed_sha="$(sha256sum "$ssot_doc" | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  computed_sha="$(shasum -a 256 "$ssot_doc" | awk '{print $1}')"
fi

git_sha="$(git rev-parse HEAD 2>/dev/null || echo unknown)"

api_base_url="${API_BASE_URL:-${NEXT_PUBLIC_API_BASE_URL:-}}"
meta_raw=""
meta_fetch_error=""
if [ -n "$api_base_url" ] && command -v curl >/dev/null 2>&1; then
  # Best-effort: 在发布/升级证据里附带 /meta 输出（05 §7.6）。
  # 注意：preflight 可能在后端尚未起服务时运行，因此默认不 fail；如需强制可设 REQUIRE_META_EVIDENCE=1。
  if meta_raw_tmp="$(curl -fsS "${api_base_url%/}/meta" 2>/dev/null)"; then
    meta_raw="$meta_raw_tmp"
  else
    meta_fetch_error="curl_failed"
  fi
fi

if [ "${REQUIRE_META_EVIDENCE:-0}" = "1" ] && [ -z "$meta_raw" ]; then
  echo "ERR: REQUIRE_META_EVIDENCE=1 but failed to fetch ${api_base_url%/}/meta"
  exit 2
fi

json_escape_string() {
  # Escapes a string for JSON and prints it including quotes.
  # Avoid jq/python dependency to keep preflight lightweight.
  local s="$1"
  s="${s//$'\r'/}"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  printf '"%s"' "$s"
}

meta_json="null"
if [ -n "$meta_raw" ]; then
  meta_json="$(json_escape_string "$meta_raw")"
fi

cat >"$out_json" <<JSON
{
  "ts_utc": "${ts_utc}",
  "git_sha": "${git_sha}",
  "api": {
    "base_url": "${api_base_url}",
    "meta_raw": ${meta_json},
    "meta_fetch_error": "${meta_fetch_error}"
  },
  "ssot": {
    "version": "${SSOT_VERSION:-unset}",
    "sha256_env": "${SSOT_SHA256:-unset}",
    "sha256_computed": "${computed_sha:-unavailable}",
    "doc_path": "${ssot_doc}"
  },
  "rule": "deploy/upgrade preflight MUST enforce SSOT_VERSION + SSOT_SHA256; mismatch blocks",
  "actor": "${SSOT_AUDIT_ACTOR:-unset}",
  "approver": "${SSOT_AUDIT_APPROVER:-unset}",
  "workitem_id": "${SSOT_AUDIT_WORKITEM_ID:-unset}",
  "reason": "${SSOT_AUDIT_REASON:-unset}"
}
JSON

echo "OK: wrote evidence ${out_json}"
