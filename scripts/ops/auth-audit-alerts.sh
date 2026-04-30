#!/usr/bin/env bash
set -euo pipefail

# 认证审计告警快检：
# - 401 会话失效激增
# - 密码重置请求峰值
# - 同 IP 忘记密码高频
#
# 依赖：DATABASE_URL + psql

WINDOW_MINUTES="${AUTH_AUDIT_ALERT_WINDOW_MINUTES:-15}"
MAX_401_INVALIDATED="${AUTH_AUDIT_ALERT_MAX_401_INVALIDATED:-50}"
MAX_RESET_REQUESTED="${AUTH_AUDIT_ALERT_MAX_RESET_REQUESTED:-40}"
MAX_FORGOT_BY_IP="${AUTH_AUDIT_ALERT_MAX_FORGOT_BY_IP:-12}"
WEBHOOK_URL="${AUTH_AUDIT_ALERT_WEBHOOK_URL:-}"
WEBHOOK_TIMEOUT_SECS="${AUTH_AUDIT_ALERT_WEBHOOK_TIMEOUT_SECS:-5}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 2
fi

q_count() {
  local event_type="$1"
  psql "${DATABASE_URL}" -Atc "
    SELECT COUNT(*)
    FROM auth_audit_events
    WHERE event_type = '${event_type}'
      AND created_at >= now() - interval '${WINDOW_MINUTES} minutes';
  "
}

count_401="$(q_count "auth_session_invalidated_401")"
count_reset_req="$(q_count "password_reset_requested")"
max_forgot_ip="$(
  psql "${DATABASE_URL}" -Atc "
    SELECT COALESCE(MAX(c), 0)
    FROM (
      SELECT client_ip, COUNT(*) AS c
      FROM auth_audit_events
      WHERE event_type = 'password_reset_requested'
        AND created_at >= now() - interval '${WINDOW_MINUTES} minutes'
        AND client_ip IS NOT NULL
      GROUP BY client_ip
    ) t;
  "
)"

echo "window_minutes=${WINDOW_MINUTES}"
echo "auth_session_invalidated_401=${count_401} (threshold=${MAX_401_INVALIDATED})"
echo "password_reset_requested=${count_reset_req} (threshold=${MAX_RESET_REQUESTED})"
echo "max_password_reset_requested_per_ip=${max_forgot_ip} (threshold=${MAX_FORGOT_BY_IP})"

failed=0
(( count_401 > MAX_401_INVALIDATED )) && { echo "ALERT: 401 invalidated session spike"; failed=1; }
(( count_reset_req > MAX_RESET_REQUESTED )) && { echo "ALERT: password reset request spike"; failed=1; }
(( max_forgot_ip > MAX_FORGOT_BY_IP )) && { echo "ALERT: high forgot/reset frequency from single IP"; failed=1; }

if [[ "${failed}" -eq 1 && -n "${WEBHOOK_URL}" ]]; then
  payload="$(
    printf '{"source":"auth-audit-alerts","window_minutes":%s,"counts":{"auth_session_invalidated_401":%s,"password_reset_requested":%s,"max_password_reset_requested_per_ip":%s},"thresholds":{"auth_session_invalidated_401":%s,"password_reset_requested":%s,"max_password_reset_requested_per_ip":%s}}' \
      "${WINDOW_MINUTES}" \
      "${count_401}" \
      "${count_reset_req}" \
      "${max_forgot_ip}" \
      "${MAX_401_INVALIDATED}" \
      "${MAX_RESET_REQUESTED}" \
      "${MAX_FORGOT_BY_IP}"
  )"
  if ! curl -fsS -m "${WEBHOOK_TIMEOUT_SECS}" \
      -H "Content-Type: application/json" \
      -X POST \
      --data "${payload}" \
      "${WEBHOOK_URL}" >/dev/null; then
    echo "WARN: failed to post auth audit alert webhook"
  fi
fi

exit "${failed}"
