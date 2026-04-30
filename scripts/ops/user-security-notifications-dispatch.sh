#!/usr/bin/env bash
set -euo pipefail

# 用户安全通知派发占位器：
# - 读取 pending 行（批量）
# - 当前实现支持标记 sent / failed（无外部网关）
# - 便于先打通“事件落库 -> 派发状态流转”闭环

BATCH_SIZE="${USER_SECURITY_NOTIFICATION_DISPATCH_BATCH_SIZE:-50}"
DRY_RUN="${USER_SECURITY_NOTIFICATION_DISPATCH_DRY_RUN:-1}"
FORCE_FAIL="${USER_SECURITY_NOTIFICATION_DISPATCH_FORCE_FAIL:-0}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 2
fi

if ! [[ "${BATCH_SIZE}" =~ ^[0-9]+$ ]] || [[ "${BATCH_SIZE}" -lt 1 ]]; then
  echo "USER_SECURITY_NOTIFICATION_DISPATCH_BATCH_SIZE must be a positive integer"
  exit 2
fi

pending_count="$(
  psql "${DATABASE_URL}" -Atc "
    SELECT COUNT(*)
    FROM user_security_notifications
    WHERE delivery_status = 'pending';
  "
)"

echo "pending_total=${pending_count}"
echo "batch_size=${BATCH_SIZE}"
echo "force_fail=${FORCE_FAIL}"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "mode=dry_run"
  psql "${DATABASE_URL}" -Atc "
    SELECT id::text || '|' || user_id::text || '|' || event_type || '|' || template_key || '|' || created_at::text
    FROM user_security_notifications
    WHERE delivery_status = 'pending'
    ORDER BY created_at ASC
    LIMIT ${BATCH_SIZE};
  "
  exit 0
fi

if [[ "${FORCE_FAIL}" == "1" ]]; then
  failed_count="$(
    psql "${DATABASE_URL}" -Atc "
      WITH picked AS (
        SELECT id
        FROM user_security_notifications
        WHERE delivery_status = 'pending'
        ORDER BY created_at ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      ),
      updated AS (
        UPDATE user_security_notifications u
        SET delivery_status = 'failed',
            attempts = attempts + 1,
            last_error = 'forced_failure_for_drill',
            sent_at = NULL
        FROM picked
        WHERE u.id = picked.id
        RETURNING 1
      )
      SELECT COUNT(*) FROM updated;
    "
  )"
  echo "mode=execute"
  echo "failed_rows=${failed_count}"
  exit 0
fi

sent_count="$(
  psql "${DATABASE_URL}" -Atc "
    WITH picked AS (
      SELECT id
      FROM user_security_notifications
      WHERE delivery_status = 'pending'
      ORDER BY created_at ASC
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    ),
    updated AS (
      UPDATE user_security_notifications u
      SET delivery_status = 'sent',
          attempts = attempts + 1,
          last_error = NULL,
          sent_at = now()
      FROM picked
      WHERE u.id = picked.id
      RETURNING 1
    )
    SELECT COUNT(*) FROM updated;
  "
)"

echo "mode=execute"
echo "sent_rows=${sent_count}"

