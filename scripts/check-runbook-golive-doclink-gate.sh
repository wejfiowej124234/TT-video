#!/usr/bin/env bash
# B-421 · Runbook / Go-Live 文档互指：**六向** **锚** **文件** **存在性** **+** **轻量** **grep** **（** **不** **替代** **全文** **相对** **链** **审计** **）** **。**
#
# 用法（仓库根）：**`bash scripts/check-runbook-golive-doclink-gate.sh`** **[** **`--json`** **]**
#
# **`--json`**：**`traveltrust.runbook_golive_doclink_gate.v1`** **（** **最小** **字段** **）** **。**
#
# 互证：**[`docs/runbook/TT-B421-GO-RUNBOOK-GOLIVE-DOCLINK-001.md`](../docs/runbook/TT-B421-GO-RUNBOOK-GOLIVE-DOCLINK-001.md)**。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

emit_json() {
  local verdict="$1"
  local note="$2"
  if ! command -v jq >/dev/null 2>&1; then
    echo "check-runbook-golive-doclink-gate: jq required for --json" >&2
    exit 1
  fi
  jq -n \
    --arg schema "traveltrust.runbook_golive_doclink_gate.v1" \
    --arg verdict "$verdict" \
    --arg note "$note" \
    '{schema_version: $schema, verdict: $verdict, note: $note}'
}

JSON=false
for a in "$@"; do
  if [[ "$a" == "--json" ]]; then
    JSON=true
  else
    echo "check-runbook-golive-doclink-gate: unknown option: $a" >&2
    exit 1
  fi
done

need_file() {
  local p="$1"
  if [[ ! -f "${ROOT}/${p}" ]]; then
    echo "check-runbook-golive-doclink-gate: missing required file: ${p}" >&2
    if $JSON; then emit_json NO_GO "missing ${p}"; fi
    exit 2
  fi
}

need_file "ops/RUNBOOK.md"
need_file "docs/go-live-checklist.md"
need_file "docs/spec/00-文档索引.md"
need_file "docs/spec/缺口与待补-官方总表.md"
need_file "docs/spec/15-多维度文档与技术检查报告.md"
need_file "docs/runbook/TT-B421-GO-RUNBOOK-GOLIVE-DOCLINK-001.md"

# 轻量互指：Go-Live 与 00 索引互相可见路径片段（避免纯占位）
if ! grep -q "00-文档索引" "${ROOT}/docs/go-live-checklist.md"; then
  echo "check-runbook-golive-doclink-gate: go-live-checklist.md should reference 00-文档索引" >&2
  if $JSON; then emit_json NO_GO "go_live_missing_00_pointer"; fi
  exit 3
fi
if ! grep -q "go-live-checklist" "${ROOT}/docs/spec/00-文档索引.md"; then
  echo "check-runbook-golive-doclink-gate: 00-文档索引.md should reference go-live-checklist" >&2
  if $JSON; then emit_json NO_GO "index_missing_golive_pointer"; fi
  exit 3
fi

if $JSON; then
  emit_json GO "anchor_files_and_min_crossrefs_ok"
else
  echo "check-runbook-golive-doclink-gate: ok" >&2
fi
