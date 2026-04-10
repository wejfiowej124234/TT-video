#!/usr/bin/env bash
# 07 文档版本三线一致：文首 **Version:** = 00-文档索引版本表中「07-开发流程与顺序」行 = §六 6.5 变更表首条数据行。
# 与 docs/spec/07-开发流程与顺序.md §六 6.1 #4、6.2 同读；CI：governance-doc-linkage-gate.yml 同批执行。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

SPEC07="docs/spec/07-开发流程与顺序.md"
SPEC00="docs/spec/00-文档索引.md"
test -f "$SPEC07" || fail "missing $SPEC07"
test -f "$SPEC00" || fail "missing $SPEC00"

v_header="$(grep -m1 '^\*\*Version:\*\*' "$SPEC07" | sed -nE 's/.*\*\*Version:\*\*[[:space:]]+([0-9]+\.[0-9]+\.[0-9]+).*/\1/p')"
v_00="$(grep -m1 '^| 07-开发流程与顺序 |' "$SPEC00" | sed -nE 's/^\| 07-开发流程与顺序 \| ([0-9]+\.[0-9]+\.[0-9]+) \|.*/\1/p')"
v_65="$(awk -F'|' '
  /^### 6\.5 变更记录$/ { f=1; next }
  f && /^\|------\|/ { next }
  f && $2 ~ /^[[:space:]]*[0-9]+\.[0-9]+\.[0-9]+[[:space:]]*$/ {
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2)
    print $2
    exit
  }
' "$SPEC07")"

[[ -n "$v_header" ]] || fail "could not parse **Version:** from $SPEC07"
[[ -n "$v_00" ]] || fail "could not parse 07 row in $SPEC00 version table"
[[ -n "$v_65" ]] || fail "could not parse first data row under ### 6.5 in $SPEC07"

if [[ "$v_header" != "$v_00" ]] || [[ "$v_header" != "$v_65" ]]; then
  echo "FAIL: 07 version triple mismatch:" >&2
  echo "  header **Version:**     $v_header" >&2
  echo "  00 index 07 row:       $v_00" >&2
  echo "  §6.5 changelog top:    $v_65" >&2
  echo "  Fix: set all three to the same x.y.z (see 07 §六 6.2)." >&2
  exit 1
fi

echo "OK: 07 version triple aligned ($v_header)."
