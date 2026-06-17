#!/usr/bin/env bash
# G-S5 · Admin fraud & reward ops smoke（① 本地 · 须 API+FE 已起）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-growth-fraud-reward-ops-p0-local (G-S5) =="
echo "API=$API FE=$FE"

bash "$ROOT/scripts/dev/smoke-growth-user-referral-center-p0-local.sh"

for path in \
  "/api/v1/admin/growth/anti-fraud/rules" \
  "/api/v1/admin/growth/anti-fraud/signals" \
  "/api/v1/admin/growth/anti-fraud/users"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$API$path" || echo 000)"
  if [[ "$code" != "401" && "$code" != "403" ]]; then
    echo "FAIL GET $path unauth -> HTTP $code (want 401/403)"
    exit 1
  fi
  echo "OK   GET $path unauth -> HTTP $code"
done

fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE/admin/growth/anti-fraud" || echo 000)"
case "$fe_code" in
  200|307|308) echo "OK   fe /admin/growth/anti-fraud: HTTP $fe_code" ;;
  *) echo "FAIL fe /admin/growth/anti-fraud -> HTTP $fe_code"; exit 1 ;;
esac

echo "smoke-growth-fraud-reward-ops-p0-local: exit 0"
