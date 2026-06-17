#!/usr/bin/env bash
# ① 本地 · 链路验证期编排闸（全量质量门 + UI 防回归 + 治理矩阵 + /me contract）
# SSOT: frontend/evidence/GO_local_marketing_front_closure/PHASE1-LINKAGE-GATES.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ "${CI_LOCAL_SKIP_PHASE1_BACKEND_TRIPLE:-}" != "1" ]]; then
  bash "$ROOT/scripts/gates/ci-local-delivery-minimum.sh"
fi

bash "$ROOT/scripts/gates/check-governance-doc-linkage.sh"
bash "$ROOT/scripts/gates/five-main-routes-ui-antiregression-gate.sh"
bash "$ROOT/scripts/gates/governance-matrix-local-gate.sh"
bash "$ROOT/scripts/gates/me-routes-local-gate.sh"

if [[ "${CI_LOCAL_PHASE1_FRONTEND_LINT_TSC:-}" == "1" ]]; then
  echo "==> CI_LOCAL_PHASE1_FRONTEND_LINT_TSC=1 lint + tsc"
  cd "$ROOT/frontend"
  npm run lint
  npx tsc --noEmit
fi

echo ""
echo "TT_PHASE1_LINKAGE_QUALITY_GATES_SUMMARY: OK phase=local-1"
