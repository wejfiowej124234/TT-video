#!/usr/bin/env bash
set -euo pipefail

# 认证审计保留清理：
# - 统计 retention 窗口外历史行数
# - dry-run 模式仅输出不删除
# - execute 模式执行删除并返回删除行数
#
# 依赖：DATABASE_URL + psql

RETENTION_DAYS="${AUTH_AUDIT_RETENTION_DAYS:-90}"
DRY_RUN="${AUTH_AUDIT_RETENTION_DRY_RUN:-1}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 2
fi

if ! [[ "${RETENTION_DAYS}" =~ ^[0-9]+$ ]] || [[ "${RETENTION_DAYS}" -lt 1 ]]; then
  echo "AUTH_AUDIT_RETENTION_DAYS must be a positive integer"
  exit 2
fi

old_count="$(
  psql "${DATABASE_URL}" -Atc "
    SELECT COUNT(*)
    FROM auth_audit_events
    WHERE created_at < now() - interval '${RETENTION_DAYS} days';
  "
)"

echo "retention_days=${RETENTION_DAYS}"
echo "old_rows=${old_count}"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "mode=dry_run"
  exit 0
fi

deleted_count="$(
  psql "${DATABASE_URL}" -Atc "
    WITH deleted AS (
      DELETE FROM auth_audit_events
      WHERE created_at < now() - interval '${RETENTION_DAYS} days'
      RETURNING 1
    )
    SELECT COUNT(*) FROM deleted;
  "
)"

echo "mode=execute"
echo "deleted_rows=${deleted_count}"

