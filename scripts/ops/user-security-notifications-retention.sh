#!/usr/bin/env bash
set -euo pipefail

# 用户安全通知保留清理：
# - 统计 retention 窗口外历史行数
# - dry-run 仅输出
# - execute 执行删除

RETENTION_DAYS="${USER_SECURITY_NOTIFICATION_RETENTION_DAYS:-180}"
DRY_RUN="${USER_SECURITY_NOTIFICATION_RETENTION_DRY_RUN:-1}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 2
fi

if ! [[ "${RETENTION_DAYS}" =~ ^[0-9]+$ ]] || [[ "${RETENTION_DAYS}" -lt 1 ]]; then
  echo "USER_SECURITY_NOTIFICATION_RETENTION_DAYS must be a positive integer"
  exit 2
fi

old_count="$(
  psql "${DATABASE_URL}" -Atc "
    SELECT COUNT(*)
    FROM user_security_notifications
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
      DELETE FROM user_security_notifications
      WHERE created_at < now() - interval '${RETENTION_DAYS} days'
      RETURNING 1
    )
    SELECT COUNT(*) FROM deleted;
  "
)"

echo "mode=execute"
echo "deleted_rows=${deleted_count}"

