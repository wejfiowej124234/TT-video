#!/usr/bin/env bash
# 08-3 evidence_pointer 精确性门禁（W-DRIFT-CI / SSOT 执行性）
# 用法：在仓库根目录执行 scripts/check-08-evidence-pointer.sh
# 规则：
# - docs/spec/08-3-参数与门禁表.md 的 26 key 表中 evidence_pointer 不得为空/"—"。
# - evidence_pointer 不得出现裸写："见 Runbook" / "见文档"。
# - 若 evidence_pointer 提及 "Runbook"，必须精确到 Runbook §N 或 "表"（例如："Runbook §1 表"）。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FILE="docs/spec/08-3-参数与门禁表.md"

if [ ! -f "$FILE" ]; then
  echo "FAIL: missing $FILE"
  exit 1
fi

# 只检查「建议优先入 SSOT 的 26 个 key」那张主表。
# 该表位于标题之后，且表头固定为：| param_key | description | ... | evidence_pointer |
# 这里用 awk 读取该表的 data 行（以 | 开头且至少包含 10 列）。
awk -v file="$FILE" '
  function trim(s) { gsub(/^[ \t]+|[ \t]+$/, "", s); return s }
  BEGIN { in_table=0; failures=0 }
  {
    line=$0
    if (line ~ /^## 建议优先入 SSOT 的 26 个 key/) { in_table=1; next }
    if (in_table && line ~ /^\|[[:space:]]*param_key[[:space:]]*\|/ ) { next }
    if (in_table && line ~ /^\|[-|[:space:]]+\|$/ ) { next }

    if (in_table) {
      if (line ~ /^## /) { in_table=0 }
    }

    if (!in_table) { next }

    if (line !~ /^\|/) { next }

    # Split on |; awk will produce empty fields at ends.
    n = split(line, f, "|")
    # Expect: leading empty, then 10 columns, then trailing empty => n >= 12
    if (n < 12) { next }

    param_key = trim(f[2])
    evidence = trim(f[11])

    if (param_key == "" || param_key == "param_key") { next }

    if (evidence == "" || evidence == "—") {
      printf("FAIL: %s evidence_pointer is empty (row: %s)\n", file, param_key) > "/dev/stderr"
      failures++
      next
    }

    if (evidence ~ /见[[:space:]]*Runbook/ || evidence ~ /见[[:space:]]*文档/) {
      printf("FAIL: %s evidence_pointer is vague (row: %s): %s\n", file, param_key, evidence) > "/dev/stderr"
      failures++
      next
    }

    if (evidence ~ /Runbook/ && evidence !~ /§[0-9]/ && evidence !~ /表/) {
      printf("FAIL: %s evidence_pointer mentions Runbook but not §N/表 (row: %s): %s\n", file, param_key, evidence) > "/dev/stderr"
      failures++
      next
    }
  }
  END {
    if (failures > 0) {
      printf("FAIL: evidence_pointer gate failed (%d issue(s))\n", failures) > "/dev/stderr"
      exit 1
    }
    print "OK: 08-3 evidence_pointer gate passed"
  }
' "$FILE"
