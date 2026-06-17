#!/usr/bin/env bash
# G-S4 · User Referral Center smoke（① 本地 · 须 API+FE 已起）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-growth-user-referral-center-p0-local (G-S4) =="
echo "API=$API FE=$FE"

bash "$ROOT/scripts/dev/smoke-growth-early-bird-p0-local.sh"

code_me="$(curl -s -o /dev/null -w '%{http_code}' "$API/api/v1/me/referrals" || echo 000)"
if [[ "$code_me" != "401" ]]; then
  echo "FAIL GET /api/v1/me/referrals unauth -> HTTP $code_me (want 401)"
  exit 1
fi
echo "OK   GET /api/v1/me/referrals unauth -> HTTP $code_me"

fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE/me/referrals" || echo 000)"
case "$fe_code" in
  200|307|308) echo "OK   fe /me/referrals: HTTP $fe_code" ;;
  *) echo "FAIL fe /me/referrals -> HTTP $fe_code"; exit 1 ;;
esac

echo "smoke-growth-user-referral-center-p0-local: exit 0"
