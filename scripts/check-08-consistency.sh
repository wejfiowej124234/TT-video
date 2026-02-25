#!/usr/bin/env bash
# 08-3 与 08-4 一致性校验（W-PDP-SSOT-CONSISTENCY）
# 用法：在仓库根目录执行 ./scripts/check-08-consistency.sh [base_ref]
# 若未传 base_ref 则与 HEAD 比较（单次提交）；CI 中可传 main 或 $BASE_REF。
# 规则：若 docs/spec/08-3 的「关键 key 与 08-4 章节映射」表中任一 key 被改动，则 docs/spec/08-4 中「文档版本（CI 校验用）」行必须在本 diff 中有变更，否则 exit 1。

set -e
BASE="${1:-HEAD^}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 无父提交时（如首次提交）跳过检查
if [ "$BASE" = "HEAD^" ] && ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "OK: 无父提交，跳过 08-3/08-4 一致性检查"
  exit 0
fi

SSOT_DOC="docs/spec/08-3-参数与门禁表.md"

# 从 08-3「关键 key 与 08-4 章节映射」表自动提取 param_key，避免脚本 KEYS 与文档双维护漂移。
extract_mapping_keys_regex() {
  if [ ! -f "$SSOT_DOC" ]; then
    echo ""
    return 0
  fi

  # 取映射表段落内 markdown 表的第一列 param_key。
  # - 支持单元格内用 '、' / ',' / '，' 连接多个 key（如 pauseCooldown、pauseAllowlist）
  # - 忽略表头/分隔线/括号行
  local keys
  keys="$(
    awk '
      BEGIN { in_section=0 }
      /##[[:space:]]+关键 key 与 08-4 章节映射/ { in_section=1; next }
      in_section && /^##[[:space:]]/ { exit }
      in_section && /^\|/ {
        if ($0 ~ /\|[[:space:]]*param_key[[:space:]]*\|/) next
        if ($0 ~ /^\|[-[:space:]]+\|/) next
        line=$0
        sub(/^\|/, "", line)
        split(line, cells, "[|]")
        k=cells[1]
        gsub(/\*\*/, "", k)
        gsub(/`/, "", k)
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", k)
        if (k == "" || k ~ /^\(/) next
        # Only keep identifier-like keys (avoid explanatory rows / non-ASCII content).
        if (k !~ /^[A-Za-z][A-Za-z0-9_]*$/) next
        print k
      }
    ' "$SSOT_DOC" \
      | tr '、，,' '\n' \
      | sed -e 's/[[:space:]]//g' \
      | sed -e '/^$/d' \
      | LC_ALL=C sort -u
  )"

  if [ -z "$keys" ]; then
    echo ""
    return 0
  fi

  # join with |
  echo "$keys" | paste -sd'|' -
}

KEYS_REGEX="$(extract_mapping_keys_regex)"
if [ -z "$KEYS_REGEX" ]; then
  echo "WARN: 无法从 ${SSOT_DOC} 提取映射 key 列表，跳过 key 触及判断（将仅在 08-4 版本行自身变更时通过）。"
fi

# 08-4 版本行标识（兼容全角/半角括号与空格，避免格式微调导致误判）
VERSION_MARKER="文档版本"

# 精确匹配 08-3/08-4 文件名，避免 pathspec 匹配不到实际文件
diff_08_3="$(git diff "$BASE" -- "docs/spec/08-3-参数与门禁表.md" 2>/dev/null || true)"
diff_08_4="$(git diff "$BASE" -- "docs/spec/08-4-对外口径包.md" 2>/dev/null || true)"

# 若未改 08-3，直接通过
if [ -z "$diff_08_3" ]; then
  echo "OK: docs/spec/08-3 无变更，跳过 08-4 版本号检查"
  exit 0
fi

# 检查 08-3 的 diff 是否触及映射 key（在 26 key 表或映射表段落中出现的 key）
if [ -n "$KEYS_REGEX" ] && ! echo "$diff_08_3" | grep -qE "$KEYS_REGEX"; then
  echo "OK: docs/spec/08-3 有变更但未触及映射表中的 param_key"
  exit 0
fi

if [ -z "$KEYS_REGEX" ]; then
  echo "FAIL: docs/spec/08-3 有变更，但无法提取映射 key 列表以做一致性判定；请确认 ${SSOT_DOC} 中映射表标题与表格格式未被破坏。"
  exit 1
fi

# 触及映射 key：08-4 的「文档版本（CI 校验用）」行必须在本 PR 中有变更
if [ -z "$diff_08_4" ]; then
  echo "FAIL: 本次变更触及 08-3 映射表中的 key，但 docs/spec/08-4 无变更。请在 08-4 文末更新「文档版本（CI 校验用）」行，或在本 PR 中同步修改 08-4 对应章节。"
  exit 1
fi
# 08-4 变更中须包含版本行（含「文档版本」及 CI 校验用标识，兼容全角/半角括号）
if ! echo "$diff_08_4" | grep -q "$VERSION_MARKER"; then
  echo "FAIL: 本次变更触及 08-3 映射表中的 key，但 docs/spec/08-4 的变更中未包含「文档版本（CI 校验用）」行。请更新 08-4 文末该行（如 vYYYYMMDD）。"
  exit 1
fi
if ! echo "$diff_08_4" | grep -qE "CI.?校验用|v[0-9]"; then
  echo "FAIL: 08-4 变更中须包含文档版本（CI 校验用）行且含版本号（如 vYYYYMMDD）。"
  exit 1
fi

echo "OK: 08-3 映射 key 有变更且 08-4 版本行已同步"
exit 0
