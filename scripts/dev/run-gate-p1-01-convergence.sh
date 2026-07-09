#!/usr/bin/env bash
# ① GATE-P1-01 收敛单入口：全链健康 → site10 25 spec → 关账 ledger（仅全量 exit 0 后）
#
# 用法（仓库根）：
#   bash scripts/dev/run-gate-p1-01-convergence.sh
#   bash scripts/dev/run-gate-p1-01-convergence.sh --baseline-only  # 已有 25/25 · 不重复 gate
#
# 阶段：① 本地 only — 非 ② staging GO / ③ production
# 末行：TT_GATE_P1_01_CONVERGENCE: OK | FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() {
  echo "TT_GATE_P1_01_CONVERGENCE: FAIL $*" >&2
  exit 1
}

BASELINE_ONLY=0
[[ "${1:-}" == "--baseline-only" ]] && BASELINE_ONLY=1

if [[ "$BASELINE_ONLY" == "1" ]]; then
  LOG="$ROOT/frontend/evidence/GO_local_phase1/site10-p1-slices-recheck.latest.log"
  grep -q "summary pass=25 fail=0" "$LOG" 2>/dev/null || fail "missing 25/25 baseline in $LOG"
  echo "== GATE-P1-01: baseline-only (skip site10 recheck) =="
else
  # 链健康检查内嵌于 run-site10-p1-slices-recheck（栈 warm 后）；避免与 reclaim 竞态重复预检
  export SITE10_FORCE_REPLACE_LOCK="${SITE10_FORCE_REPLACE_LOCK:-1}"
  echo "== GATE-P1-01: site10 p1 slices sequential recheck (25 specs · health embedded) =="
  bash "$ROOT/scripts/dev/run-site10-p1-slices-recheck-sequential.sh" || fail "site10 recheck"
fi

echo "== GATE-P1-01: close ledger item (phase1 only · --skip-phase2) =="
bash "$ROOT/scripts/dev/close-complexity-convergence-item.sh" \
  --id GATE-P1-01 --skip-phase2 --gate-passed \
  || fail "ledger close"

echo "== GATE-P1-01: validate complexity-convergence ledger sync =="
bash "$ROOT/scripts/dev/validate-complexity-convergence-ledger-sync.sh" \
  || fail "ledger sync"

echo "TT_GATE_P1_01_CONVERGENCE: OK"
echo "NEXT: bash scripts/ops/p2fc-build-freeze-candidate-from-p1-baseline.sh"
