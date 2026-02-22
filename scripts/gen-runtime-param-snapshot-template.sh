#!/usr/bin/env bash
# 运行时参数快照模板生成（P0：防运行时外改必须可执行）
#
# 从 docs/08-3-参数与门禁表.md 的「关键 key 与 08-4 章节映射」表自动提取 param_key，
# 生成 JSON object 模板（key 全列、value 置为 null 占位）。
#
# 用法：
#   ./scripts/gen-runtime-param-snapshot-template.sh
#   ./scripts/gen-runtime-param-snapshot-template.sh --out data/runtime_params.json
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SSOT_DOC="${SSOT_DOC_PATH:-docs/08-3-参数与门禁表.md}"
OUT="${OUT:-data/runtime_params.template.json}"

if [ "${1:-}" = "--out" ]; then
  OUT="${2:-}"
  if [ -z "$OUT" ]; then
    echo "FAIL: --out requires a path"
    exit 1
  fi
fi

if [ ! -f "$SSOT_DOC" ]; then
  echo "FAIL: missing SSOT doc: ${SSOT_DOC}"
  exit 1
fi

extract_keys() {
  awk '
    BEGIN { in_section=0 }
    /##[[:space:]]+关键 key 与 08-4 章节映射/ { in_section=1; next }
    in_section && /^##[[:space:]]/ { exit }
    in_section && /^\|/ {
      if ($0 ~ /\|[[:space:]]*param_key[[:space:]]*\|/) next
      if ($0 ~ /^\|[-[:space:]]+\|/) next
      line=$0
      sub(/^\|/, "", line)
      split(line, cells, "|")
      k=cells[1]
      gsub(/\*\*/, "", k)
      gsub(/`/, "", k)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", k)
      if (k == "" || k ~ /^\(/ || k ~ /^（/) next
      print k
    }
  ' "$SSOT_DOC" \
    | tr '、，,' '\n' \
    | sed -e 's/[[:space:]]//g' \
    | sed -e '/^$/d' \
    | LC_ALL=C sort -u
}

keys="$(extract_keys)"
if [ -z "$keys" ]; then
  echo "FAIL: no keys extracted from mapping table; check heading/table format in ${SSOT_DOC}"
  exit 1
fi

if [ -n "$(dirname "$OUT")" ]; then
  mkdir -p "$(dirname "$OUT")"
fi

{
  echo "{"
  first=1
  while IFS= read -r k; do
    if [ -z "$k" ]; then
      continue
    fi
    if [ $first -eq 0 ]; then
      echo ","
    fi
    first=0
    # keys are expected to be simple identifiers; still emit JSON string safely.
    printf '  "%s": null' "$k"
  done <<< "$keys"
  echo ""
  echo "}"
} > "$OUT"

echo "OK: wrote template ${OUT} (keys=$(echo "$keys" | wc -l | tr -d ' '))"
