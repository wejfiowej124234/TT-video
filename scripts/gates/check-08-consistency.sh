#!/usr/bin/env bash
# 08-3 与 08-4 一致性：
# 1) 每次运行均做轻量校验：两文件存在，且 08-4 含「文档版本（CI 校验用）」行（防误删）。
# 2) 若 BASE..HEAD 间改动了 docs/spec/08-3*.md，则 08-4 的「文档版本（CI 校验用）」行须相对 BASE 有变化，否则失败（W-PDP-SSOT-CONSISTENCY）。
# 用法: ./scripts/check-08-consistency.sh [BASE_REF]，默认 BASE_REF=main。
# W-GATE 机读辅助：ops/RUNBOOK.md §12.7；缺口 P1-C 互证同 check-governance-doc-linkage.sh 头注（TT-07-63B-P1C-EVIDENCE-INTEGRATION-001）。
# Windows：.\scripts\check-08-consistency.ps1 [BASE_REF]（委托本脚本）
set -euo pipefail
BASE="${1:-main}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

F3="docs/spec/08-3-参数与门禁表.md"
F4="docs/spec/08-4-对外口径包.md"

if [[ ! -f "$F3" ]]; then
  echo "ERROR: missing $F3" >&2
  exit 1
fi
if [[ ! -f "$F4" ]]; then
  echo "ERROR: missing $F4" >&2
  exit 1
fi
if ! grep -q '文档版本（CI 校验用）' "$F4"; then
  echo "ERROR: $F4 must contain a line with 文档版本（CI 校验用） (CI / human SSOT)." >&2
  exit 1
fi

# 仅当 08-3 有变更时才校验 08-4 版本须 bump
if ! git diff --name-only "$BASE" HEAD 2>/dev/null | grep -q 'docs/spec/08-3'; then
  echo "OK: 08-4 has CI version line; no 08-3 changes vs $BASE — skip version-bump rule."
  exit 0
fi

get_version_line_from_content() {
  grep -m1 '文档版本（CI 校验用）' "$1" 2>/dev/null || true
}

V_BASE=$(git show "$BASE:$F4" 2>/dev/null | grep -m1 '文档版本（CI 校验用）' || true)
V_HEAD=$(get_version_line_from_content "$F4")

# 08-3 已变更：若 08-4 版本行未变则失败（无法与 base 比时仅警告，避免误杀浅 clone）
if [[ -z "$V_BASE" ]]; then
  echo "WARN: could not read $F4 at $BASE (shallow clone?). Skipping version-bump diff check." >&2
  exit 0
fi

if [[ "$V_BASE" = "$V_HEAD" ]]; then
  echo "ERROR: docs/spec/08-3* was changed but docs/spec/08-4 文档版本（CI 校验用） is unchanged. Update the version line in 08-4 and retry."
  exit 1
fi

echo "OK: 08-3 changed and 08-4 CI version line updated vs $BASE."
exit 0
