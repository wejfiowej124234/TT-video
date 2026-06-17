#!/usr/bin/env bash
# ① Admin 剩余项 · 本地预备批（非 ② staging GO）
#   - L5 绿集
#   - RBAC 六角色 API 矩阵烟测
#   - ADM-U01 Shell 预览 × 矩阵 Playwright（sessionStorage）
#
# 用法（仓库根，API :8080 + FE :3012 + DATABASE_URL）：
#   bash scripts/dev/run-admin-adm-u01-local-prep.sh
#   bash scripts/dev/run-admin-adm-u01-local-prep.sh --skip-l5 --skip-rbac
set -euo pipefail

SKIP_L5=0
SKIP_RBAC=0
for arg in "$@"; do
  case "$arg" in
    --skip-l5) SKIP_L5=1 ;;
    --skip-rbac) SKIP_RBAC=1 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

if [[ "$SKIP_L5" -eq 0 ]]; then
  echo "=== 1/3 admin L5 green ==="
  bash "$REPO_ROOT/scripts/dev/run-admin-l5-green.sh"
else
  echo "=== skip L5 (--skip-l5) ==="
fi

if [[ "$SKIP_RBAC" -eq 0 ]]; then
  echo "=== 2/3 smoke-admin-rbac-matrix-local ==="
  bash "$REPO_ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh"
else
  echo "=== skip RBAC smoke (--skip-rbac) ==="
fi

echo "=== 3/3 ADM-U01 local shell preview (Playwright) ==="
export ADM_U01_LOCAL_PREP=1
export ADM_U01_PLAYWRIGHT_FE_BASE="${ADM_U01_PLAYWRIGHT_FE_BASE:-http://127.0.0.1:3012}"
export PLAYWRIGHT_API_BASE_URL="${PLAYWRIGHT_API_BASE_URL:-http://127.0.0.1:8080}"
export ADM_U01_LOCAL_EVIDENCE_DIR="${ADM_U01_LOCAL_EVIDENCE_DIR:-$REPO_ROOT/frontend/evidence/GO_local_admin_workspace_closure/adm-u01-local-prep}"
mkdir -p "$ADM_U01_LOCAL_EVIDENCE_DIR"

(cd "$REPO_ROOT/frontend" && npx playwright test e2e/admin-adm-u01-shell-local-prep.spec.ts --project=chromium)

echo "TT_ADMIN_ADM_U01_LOCAL_PREP: OK"
echo "evidence=$ADM_U01_LOCAL_EVIDENCE_DIR/playwright-shell-preview-matrix.json"
