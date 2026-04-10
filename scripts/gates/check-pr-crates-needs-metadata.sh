#!/usr/bin/env bash
# B-145 / TT-B145-SSOT-GATE-PR-CHECK-CRATES-NEEDS-METADATA-001
# B-146 / TT-B146-SSOT-GATE-BASE-RESOLUTION-STRICTNESS-PLAN-001（BASE/HEAD 解析语义 · 母表 B-146）
# B-147 / TT-B147-SSOT-GATE-CONTRACTS-SCOPE-001（contracts/** 纳入同一门禁 · 路径豁免见下「contracts 豁免」）
#
# 单人开发「元数据门禁」（勿称 PR gate）：BASE..HEAD 若含 crates/**，或含须登记的 contracts/**（见下豁免），须同批 docs/任务母表.md 或 docs/AI任务卡索引.md。
# 与 B-145 同轨：同一对文档、同一 CRATES_METADATA_GATE_FAIL / CRATES_METADATA_GATE_REQUIRE_REFS 语义（变量名保留兼容）。
#
# contracts 豁免（仅路径判定；纯注释行级豁免不做 — 归 CR / 人工）：
#   - contracts/test/**、contracts/script/**、contracts/lib/**、contracts/cache/**、contracts/out/**
#   - contracts/foundry.toml、contracts/foundry.lock、contracts/remappings.txt
#   - contracts 下任意 **/*.md
#   - contracts/run-*.sh（仓库内 Foundry 辅助壳脚本）
#   - 路径以 .generated 结尾（如 abi 生成物）
#
# Exit 约定（分轨）：
#   0 — 未触发检查 / 检查通过 / 违规但未启用 fail（默认）
#   1 — CRATES_METADATA_GATE_FAIL=1 且 diff 触发门禁但未同批改母表或索引
#   2 — CRATES_METADATA_GATE_REQUIRE_REFS=1 且 git rev-parse BASE 或 HEAD 失败（「门禁未执行」≠ 通过）
#
# 默认：exit 0；在 GITHUB_ACTIONS 内且违规时额外 ::warning::。
# 严格（违规 fail）：CRATES_METADATA_GATE_FAIL=1 → 元数据违规时 exit 1（与 exit 2 分轨）。
# 严格（引用 fail）：CRATES_METADATA_GATE_REQUIRE_REFS=1 → BASE/HEAD 不可解析时 exit 2；unset 时保持 B-145 兼容（WARN + exit 0）。
#
# 用法:
#   bash scripts/check-pr-crates-needs-metadata.sh [BASE] [HEAD]
#   BASE/HEAD 为 commit SHA 或 ref；本地默认 BASE=main HEAD=HEAD。
# CI（pull_request）:
#   bash scripts/check-pr-crates-needs-metadata.sh "${{ github.event.pull_request.base.sha }}" "${{ github.event.pull_request.head.sha }}"
#
# Windows: 可用 Git Bash 直接调用本脚本。
set -euo pipefail

BASE="${1:-main}"
HEAD="${2:-HEAD}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

MOTHER="docs/任务母表.md"
INDEX="docs/AI任务卡索引.md"

if ! git rev-parse "$BASE" >/dev/null 2>&1; then
  echo "WARN: git base '$BASE' not found (shallow clone or wrong ref?). Skip crates/metadata gate." >&2
  if [[ "${CRATES_METADATA_GATE_REQUIRE_REFS:-}" == "1" ]]; then
    exit 2
  fi
  exit 0
fi
if ! git rev-parse "$HEAD" >/dev/null 2>&1; then
  echo "WARN: git head '$HEAD' not found. Skip crates/metadata gate." >&2
  if [[ "${CRATES_METADATA_GATE_REQUIRE_REFS:-}" == "1" ]]; then
    exit 2
  fi
  exit 0
fi

changed="$(git diff --name-only "$BASE" "$HEAD" 2>/dev/null || true)"
if [[ -z "${changed// }" ]]; then
  echo "OK: no files changed in diff $BASE..$HEAD — skip crates/metadata gate."
  exit 0
fi

crates_hit=0
if printf '%s\n' "$changed" | grep -q '^crates/'; then
  crates_hit=1
fi

contracts_gate_hit=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ "$f" == contracts/* ]] || continue
  if [[ "$f" =~ ^contracts/(test|script|lib|cache|out)/ ]]; then
    continue
  fi
  if [[ "$f" == contracts/foundry.toml || "$f" == contracts/foundry.lock || "$f" == contracts/remappings.txt ]]; then
    continue
  fi
  if [[ "$f" =~ ^contracts/.*\.md$ ]]; then
    continue
  fi
  if [[ "$f" == contracts/run-*.sh ]]; then
    continue
  fi
  if [[ "$f" =~ \.generated$ ]]; then
    continue
  fi
  contracts_gate_hit=1
  break
done <<< "$(printf '%s\n' "$changed")"

if [[ "$crates_hit" -eq 0 && "$contracts_gate_hit" -eq 0 ]]; then
  echo "OK: no crates/** or gated contracts/** changes vs $BASE..$HEAD."
  exit 0
fi

meta_hit=0
if printf '%s\n' "$changed" | grep -Fxq "$MOTHER" || printf '%s\n' "$changed" | grep -Fxq "$INDEX"; then
  meta_hit=1
fi

if [[ "$meta_hit" -eq 1 ]]; then
  echo "OK: metadata gate path(s) changed and ($MOTHER or $INDEX) updated vs $BASE..$HEAD."
  exit 0
fi

REASONS=()
[[ "$crates_hit" -eq 1 ]] && REASONS+=("crates/**")
[[ "$contracts_gate_hit" -eq 1 ]] && REASONS+=("contracts/**（B-147 非豁免路径）")
MSG="Diff 含 ${REASONS[*]} 但未同批修改 $MOTHER 或 $INDEX。请先落母表 B-xxx / 更新 TT（见 04 零、SSOT Gate · B-145 / B-147）。"
echo "$MSG" >&2

if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  echo "::warning title=SSOT crates+contracts/metadata::$MSG"
fi

if [[ "${CRATES_METADATA_GATE_FAIL:-}" == "1" ]]; then
  exit 1
fi

exit 0
