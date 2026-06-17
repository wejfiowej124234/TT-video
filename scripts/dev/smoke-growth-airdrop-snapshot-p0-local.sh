#!/usr/bin/env bash
# G-S6 · Airdrop snapshot smoke（① 本地 · 须 API+FE 已起）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-growth-airdrop-snapshot-p0-local (G-S6) =="
echo "API=$API FE=$FE"

bash "$ROOT/scripts/dev/smoke-growth-fraud-reward-ops-p0-local.sh"

code="$(curl -s -o /dev/null -w '%{http_code}' "$API/api/v1/admin/growth/airdrop-campaigns" || echo 000)"
if [[ "$code" != "401" && "$code" != "403" ]]; then
  echo "FAIL GET /api/v1/admin/growth/airdrop-campaigns unauth -> HTTP $code (want 401/403)"
  exit 1
fi
echo "OK   GET /api/v1/admin/growth/airdrop-campaigns unauth -> HTTP $code"

fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE/admin/growth/airdrop-campaigns" || echo 000)"
case "$fe_code" in
  200|307|308) echo "OK   fe /admin/growth/airdrop-campaigns: HTTP $fe_code" ;;
  *) echo "FAIL fe /admin/growth/airdrop-campaigns -> HTTP $fe_code"; exit 1 ;;
esac

echo "smoke-growth-airdrop-snapshot-p0-local: exit 0"
