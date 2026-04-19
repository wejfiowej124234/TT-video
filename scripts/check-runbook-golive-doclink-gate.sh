#!/usr/bin/env bash
# B-421 · Runbook / Go-Live **六向** **文件** **存在** **+** **轻量** **锚** **grep** **。**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JSON=false
for a in "$@"; do
  if [[ "$a" == "--json" ]]; then JSON=true
  else echo "check-runbook-golive-doclink-gate: unknown option: $a" >&2; exit 1
  fi
done

need_file() {
  local p="$1"
  if [[ ! -f "${ROOT}/${p}" ]]; then
    echo "check-runbook-golive-doclink-gate: missing required file: ${p}" >&2
    exit 2
  fi
}

need_file "ops/RUNBOOK.md"
need_file "docs/go-live-checklist.md"
need_file "docs/spec/00-文档索引.md"
need_file "docs/spec/缺口与待补-官方总表.md"
need_file "docs/spec/15-多维度文档与技术检查报告.md"
need_file "docs/runbook/TT-B421-GO-RUNBOOK-GOLIVE-DOCLINK-001.md"

if ! grep -q "B-421-RUNBOOK-GOLIVE-DOCLINK-GATE" "${ROOT}/ops/RUNBOOK.md"; then
  echo "check-runbook-golive-doclink-gate: ops/RUNBOOK.md missing B-421 anchor" >&2
  exit 3
fi
if ! grep -q "TT-B421-GO-RUNBOOK-GOLIVE-DOCLINK-001" "${ROOT}/ops/RUNBOOK.md"; then
  echo "check-runbook-golive-doclink-gate: ops/RUNBOOK.md missing TT-B421 pointer" >&2
  exit 3
fi

if $JSON; then
  command -v jq >/dev/null 2>&1 || { echo "check-runbook-golive-doclink-gate: jq required for --json" >&2; exit 1; }
  jq -n --arg schema "traveltrust.runbook_golive_doclink_gate.v1" --arg verdict GO \
    '{schema_version:$schema, verdict:$verdict, note:"six_paths_ok"}'
else
  echo "check-runbook-golive-doclink-gate: ok" >&2
fi
