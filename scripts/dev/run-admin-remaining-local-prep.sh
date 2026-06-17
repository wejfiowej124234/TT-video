#!/usr/bin/env bash
# ① Admin「剩余项」本地预备批（非 Phase ② staging GO）
#
# 顺序：L5 绿集 → RBAC 矩阵烟测 → ADM-U02 本地烟测 → ADM-U01 Shell 预览 Playwright
#
# 须：API :8080 · FE :3012 · DATABASE_URL · migrate
#   bash scripts/dev/run-admin-remaining-local-prep.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

echo "=== 1/5 admin L5 green ==="
bash "$REPO_ROOT/scripts/dev/run-admin-l5-green.sh"

echo "=== 2/5 smoke-admin-rbac-matrix-local ==="
bash "$REPO_ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh"

echo "=== 3/5 run-admin-adm-u02-local-prep (smoke) ==="
bash "$REPO_ROOT/scripts/dev/run-admin-adm-u02-local-prep.sh"

echo "=== 4/5 ADM-U01 local shell preview Playwright ==="
bash "$REPO_ROOT/scripts/dev/run-admin-adm-u01-local-prep.sh" --skip-l5 --skip-rbac

echo "=== 5/5 phase2 closure skeleton (NOT_MET) ==="
bash "$REPO_ROOT/scripts/dev/run-admin-phase2-prep-skeleton-local.sh"

if [[ "${ADM_U01_DB_ROLE_PREP:-0}" == "1" ]]; then
  echo "=== optional: ADM-U01 DB role shell (ADM_U01_DB_ROLE_PREP=1) ==="
  bash "$REPO_ROOT/scripts/dev/run-admin-adm-u01-db-role-local-prep.sh"
fi

echo "run-admin-remaining-local-prep: exit 0"
