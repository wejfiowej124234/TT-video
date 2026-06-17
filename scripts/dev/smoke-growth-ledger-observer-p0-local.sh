#!/usr/bin/env bash
# G-S2 · Growth Ledger & Observer smoke（① 本地 · 须 API+PG 已起）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-growth-ledger-observer-p0-local (G-S2) =="
echo "API=$API FE=$FE"

# G-S1 regression
bash "$ROOT/scripts/dev/smoke-growth-referral-p0-local.sh"

code_admin="$(curl -s -o /dev/null -w '%{http_code}' "$API/api/v1/admin/growth/reward-ledger" || echo 000)"
if [[ "$code_admin" != "401" && "$code_admin" != "403" ]]; then
  echo "FAIL admin reward-ledger unauth -> HTTP $code_admin (want 401/403)"
  exit 1
fi
echo "OK   GET /api/v1/admin/growth/reward-ledger unauth -> HTTP $code_admin"

code_internal="$(curl -s -o /dev/null -w '%{http_code}' "$API/api/v1/internal/growth/reconcile" || echo 000)"
if [[ "$code_internal" != "401" && "$code_internal" != "403" ]]; then
  echo "FAIL internal growth reconcile unauth -> HTTP $code_internal (want 401/403)"
  exit 1
fi
echo "OK   GET /api/v1/internal/growth/reconcile unauth -> HTTP $code_internal"

for path in "/admin/growth/reward-ledger" "/admin/growth/referral-codes"; do
  fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE$path" || echo 000)"
  case "$fe_code" in
    200|307|308) echo "OK   fe $path: HTTP $fe_code" ;;
    *) echo "FAIL fe $path -> HTTP $fe_code"; exit 1 ;;
  esac
done

echo "smoke-growth-ledger-observer-p0-local: exit 0"
