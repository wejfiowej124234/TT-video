#!/usr/bin/env bash
# ① ADM-U01 · DB 控制台角色驱动 Shell（非 ② staging GO）
# 须 API :8080 · FE :3012 · DATABASE_URL · TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT/frontend"

export ADM_U01_DB_ROLE_PREP=1
export ADM_U01_PLAYWRIGHT_FE_BASE="${ADM_U01_PLAYWRIGHT_FE_BASE:-http://127.0.0.1:3012}"
export PLAYWRIGHT_API_BASE_URL="${PLAYWRIGHT_API_BASE_URL:-http://127.0.0.1:8080}"
export ADM_U01_DB_ROLE_EVIDENCE_DIR="${ADM_U01_DB_ROLE_EVIDENCE_DIR:-$REPO_ROOT/evidence/GO_local_admin_workspace_closure/adm-u01-db-role-local-prep}"

npx playwright test e2e/admin-adm-u01-db-role-shell-local.spec.ts --project=chromium

echo "TT_ADMIN_ADM_U01_DB_ROLE_LOCAL_PREP: OK (evidence: $ADM_U01_DB_ROLE_EVIDENCE_DIR/playwright-db-role-shell-matrix.json)"
