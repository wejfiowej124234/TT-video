#!/usr/bin/env bash
# SSOT 三角：**07** **版本三元组** **→** **治理文档联动** **→** **04** **路由** **机读** **。
# 用法（仓库根）：**`bash scripts/check-ssot-triangle-gate.sh`** **[** **`--json`** **]**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JSON=false
for a in "$@"; do
  if [[ "$a" == "--json" ]]; then JSON=true
  else echo "check-ssot-triangle-gate: unknown option: $a" >&2; exit 1
  fi
done

bash scripts/check-07-version-triple.sh
bash scripts/check-governance-doc-linkage.sh
bash scripts/run-check-04-routes.sh

if $JSON; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "check-ssot-triangle-gate: jq required for --json" >&2
    exit 1
  fi
  jq -n --arg schema "traveltrust.ssot_triangle_gate.v1" --arg verdict GO \
    '{schema_version:$schema, verdict:$verdict, steps:["07_version_triple","governance_doc_linkage","run_check_04_routes"]}'
else
  echo "check-ssot-triangle-gate: ok" >&2
fi
