#!/usr/bin/env bash
# ADM-U01 · Phase ② · 六角色 RBAC staging 矩阵（独立 Staging；非 ① localhost GO）
#
# 全绿（② 槽 PASS，非 ③ Production GO）：
#   export STAGING_API_BASE=https://api.staging.example
#   export STAGING_DATABASE_URL=postgresql://...   # 或预置六 token
#   export ADM_U01_STRICT=1
#   bash scripts/gates/smoke-admin-rbac-staging-matrix.sh
#
# 未配置时：默认 SKIP（exit 0）；ADM_U01_STRICT=1 时 FAIL。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export ADM_U01_STRICT="${ADM_U01_STRICT:-}"

if [[ -z "${STAGING_API_BASE:-}" && -z "${TRAVELTRUST_STAGING_API_BASE:-}" ]]; then
  if [[ "${ADM_U01_STRICT}" == "1" ]]; then
    echo "smoke-admin-rbac-staging-matrix: FAIL (ADM_U01_STRICT=1 requires STAGING_API_BASE)" >&2
    echo "TT_ADMIN_RBAC_STAGING_MATRIX: FAIL"
    exit 1
  fi
  echo "smoke-admin-rbac-staging-matrix: SKIP (set STAGING_API_BASE + tokens or STAGING_DATABASE_URL)"
  echo "TT_ADMIN_RBAC_STAGING_MATRIX: SKIP"
  exit 0
fi

PY="${PYTHON:-}"
if [[ -z "$PY" ]]; then
  if command -v python >/dev/null 2>&1; then PY=python
  elif command -v python3 >/dev/null 2>&1; then PY=python3
  else echo "smoke-admin-rbac-staging-matrix: FAIL (python not found)" >&2; exit 1
  fi
fi
"$PY" "$ROOT/scripts/gates/run-admin-rbac-staging-matrix.py"
exit $?
