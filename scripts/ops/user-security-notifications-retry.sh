#!/usr/bin/env bash
set -euo pipefail

# 用户安全通知失败重试：
# - 将 failed 且 attempts < max 的行重新置为 pending
# - dry-run 模式仅预览

BATCH_SIZE="${USER_SECURITY_NOTIFICATION_RETRY_BATCH_SIZE:-50}"
MAX_ATTEMPTS="${USER_SECURITY_NOTIFICATION_RETRY_MAX_ATTEMPTS:-5}"
DRY_RUN="${USER_SECURITY_NOTIFICATION_RETRY_DRY_RUN:-1}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 2
fi

if ! [[ "${BATCH_SIZE}" =~ ^[0-9]+$ ]] || [[ "${BATCH_SIZE}" -lt 1 ]]; then
  echo "USER_SECURITY_NOTIFICATION_RETRY_BATCH_SIZE must be a positive integer"
  exit 2
fi

if ! [[ "${MAX_ATTEMPTS}" =~ ^[0-9]+$ ]] || [[ "${MAX_ATTEMPTS}" -lt 1 ]]; then
  echo "USER_SECURITY_NOTIFICATION_RETRY_MAX_ATTEMPTS must be a positive integer"
  exit 2
fi

retryable_count="$(
  psql "${DATABASE_URL}" -Atc "
    SELECT COUNT(*)
    FROM user_security_notifications
    WHERE delivery_status = 'failed'
      AND attempts < ${MAX_ATTEMPTS};
  "
)"

echo "retryable_total=${retryable_count}"
echo "batch_size=${BATCH_SIZE}"
echo "max_attempts=${MAX_ATTEMPTS}"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "mode=dry_run"
  psql "${DATABASE_URL}" -Atc "
    SELECT id::text || '|' || user_id::text || '|' || event_type || '|' || attempts::text || '|' || COALESCE(last_error,'')
    FROM user_security_notifications
    WHERE delivery_status = 'failed'
      AND attempts < ${MAX_ATTEMPTS}
    ORDER BY created_at ASC
    LIMIT ${BATCH_SIZE};
  "
  exit 0
fi

requeued_count="$(
  psql "${DATABASE_URL}" -Atc "
    WITH picked AS (
      SELECT id
      FROM user_security_notifications
      WHERE delivery_status = 'failed'
        AND attempts < ${MAX_ATTEMPTS}
      ORDER BY created_at ASC
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    ),
    updated AS (
      UPDATE user_security_notifications u
      SET delivery_status = 'pending',
          last_error = NULL
      FROM picked
      WHERE u.id = picked.id
      RETURNING 1
    )
    SELECT COUNT(*) FROM updated;
  "
)"

echo "mode=execute"
echo "requeued_rows=${requeued_count}"

