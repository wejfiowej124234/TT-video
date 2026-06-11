#!/usr/bin/env bash
# TT-LOCAL-CI-DELIVERY-GATE-001 · 最小交付三连（不依赖 GitHub-hosted）
# 与 scripts/README.md「提交前自检三连」一致；在仓库根执行。
# 三连后：若 docs/AI任务卡索引.md 相对 HEAD（工作区/暂存）或 main..HEAD 有变，自动
#   bash scripts/check-ai-task-card-index-overview.sh（见 maybe-run-ai-task-card-index-overview-on-diff.sh；
#   跳过：SKIP_AI_TASK_CARD_INDEX_OVERVIEW=1 或 CI_LOCAL_SKIP_AI_TASK_CARD_INDEX=1）。
# TT-9628 拆线 / 路径真源（Markdown 锚）：
#   docs/runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-tt9627-gates-index
#   docs/runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-report-json-path-convention
# 可选：API 已监听时
#   TT9627_SEGMENT1_API_SMOKE=1 → scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh
#   TT9627_SEGMENT2_API_SMOKE=1 → scripts/gates/vertical-slice-tt9627-segment2-hub-public-smoke.sh
#   TT9627_SEGMENT3_R002_VALIDATE=1 → scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh
#       （须 REPORT_JSON=…/report.json；可选 R002_FAIL_ON_NO_GO=1 等）
#   TT9627_SEGMENT4_SPEC_PRESENCE=1 → scripts/gates/vertical-slice-tt9627-segment4-spec-presence.sh
#   TT9627_SEGMENT5_SPEC_PRESENCE=1 → scripts/gates/vertical-slice-tt9627-segment5-spec-presence.sh
#   TT9627_SEGMENT6_SPEC_PRESENCE=1 → scripts/gates/vertical-slice-tt9627-segment6-spec-presence.sh
#   TT9627_SEGMENT456_SPEC_PRESENCE=1 → scripts/gates/vertical-slice-tt9627-segments-456-spec-presence.sh
#       （已含 4+5+6；若同设 SEGMENT4/5/6，三连后仅跑本编排，个体块跳过并 stderr 提示）
# （BASE / NEXT_PUBLIC_API_BASE_URL）。
set -euo pipefail
_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$_root"
echo "==> cargo test -p traveltrust-api (--test-threads=1 · env-guarded onboarding matrix)"
cargo test -p traveltrust-api -- --test-threads=1
echo "==> run-check-04-routes"
bash scripts/run-check-04-routes.sh
echo "==> check-pr-crates-needs-metadata (main..HEAD)"
bash scripts/check-pr-crates-needs-metadata.sh main HEAD
bash scripts/gates/maybe-run-ai-task-card-index-overview-on-diff.sh
if [[ "${TT9627_SEGMENT1_API_SMOKE:-}" == "1" ]]; then
  echo "==> TT9627_SEGMENT1_API_SMOKE=1 vertical-slice-tt9627-segment1-api-smoke (requires API on BASE)"
  bash scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh
fi
if [[ "${TT9627_SEGMENT2_API_SMOKE:-}" == "1" ]]; then
  echo "==> TT9627_SEGMENT2_API_SMOKE=1 vertical-slice-tt9627-segment2-hub-public-smoke (requires API on BASE)"
  bash scripts/gates/vertical-slice-tt9627-segment2-hub-public-smoke.sh
fi
if [[ "${TT9627_SEGMENT3_R002_VALIDATE:-}" == "1" ]]; then
  if [[ -z "${REPORT_JSON:-}" ]]; then
    echo "error: TT9627_SEGMENT3_R002_VALIDATE=1 requires REPORT_JSON=path/to/report.json" >&2
    exit 1
  fi
  echo "==> TT9627_SEGMENT3_R002_VALIDATE=1 vertical-slice-tt9627-segment3-r002-validate REPORT_JSON=$REPORT_JSON"
  bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh "$REPORT_JSON"
fi
_tt9627_seg456="${TT9627_SEGMENT456_SPEC_PRESENCE:-}"
if [[ "${_tt9627_seg456}" == "1" && ("${TT9627_SEGMENT4_SPEC_PRESENCE:-}" == "1" || "${TT9627_SEGMENT5_SPEC_PRESENCE:-}" == "1" || "${TT9627_SEGMENT6_SPEC_PRESENCE:-}" == "1") ]]; then
  echo "note: TT9627_SEGMENT456_SPEC_PRESENCE=1 — skipping TT9627_SEGMENT4/5/6 individual steps (456 orchestrator runs 4+5+6 once)" >&2
fi
if [[ "${_tt9627_seg456}" != "1" ]]; then
  if [[ "${TT9627_SEGMENT4_SPEC_PRESENCE:-}" == "1" ]]; then
    echo "==> TT9627_SEGMENT4_SPEC_PRESENCE=1 vertical-slice-tt9627-segment4-spec-presence"
    bash scripts/gates/vertical-slice-tt9627-segment4-spec-presence.sh
  fi
  if [[ "${TT9627_SEGMENT5_SPEC_PRESENCE:-}" == "1" ]]; then
    echo "==> TT9627_SEGMENT5_SPEC_PRESENCE=1 vertical-slice-tt9627-segment5-spec-presence"
    bash scripts/gates/vertical-slice-tt9627-segment5-spec-presence.sh
  fi
  if [[ "${TT9627_SEGMENT6_SPEC_PRESENCE:-}" == "1" ]]; then
    echo "==> TT9627_SEGMENT6_SPEC_PRESENCE=1 vertical-slice-tt9627-segment6-spec-presence"
    bash scripts/gates/vertical-slice-tt9627-segment6-spec-presence.sh
  fi
fi
if [[ "${_tt9627_seg456}" == "1" ]]; then
  echo "==> TT9627_SEGMENT456_SPEC_PRESENCE=1 vertical-slice-tt9627-segments-456-spec-presence (4+5+6)"
  bash scripts/gates/vertical-slice-tt9627-segments-456-spec-presence.sh
fi
echo "OK: ci-local-delivery-minimum"
