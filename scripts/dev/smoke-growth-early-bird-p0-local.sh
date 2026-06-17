#!/usr/bin/env bash
# G-S3 · Early Bird & Multiplier smoke（① 本地 · 须 API+FE 已起）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-growth-early-bird-p0-local (G-S3) =="
echo "API=$API FE=$FE"

bash "$ROOT/scripts/dev/smoke-growth-ledger-observer-p0-local.sh"

code_admin="$(curl -s -o /dev/null -w '%{http_code}' "$API/api/v1/admin/growth/early-bird/stages" || echo 000)"
if [[ "$code_admin" != "401" && "$code_admin" != "403" ]]; then
  echo "FAIL admin early-bird stages unauth -> HTTP $code_admin (want 401/403)"
  exit 1
fi
echo "OK   GET /api/v1/admin/growth/early-bird/stages unauth -> HTTP $code_admin"

fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE/admin/growth/early-bird" || echo 000)"
case "$fe_code" in
  200|307|308) echo "OK   fe /admin/growth/early-bird: HTTP $fe_code" ;;
  *) echo "FAIL fe /admin/growth/early-bird -> HTTP $fe_code"; exit 1 ;;
esac

echo "smoke-growth-early-bird-p0-local: exit 0"
