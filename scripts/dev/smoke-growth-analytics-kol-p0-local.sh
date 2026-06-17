#!/usr/bin/env bash
# G-S7 · Growth analytics & KOL read-only smoke（① 本地 · 须 API+FE 已起）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-growth-analytics-kol-p0-local (G-S7) =="
echo "API=$API FE=$FE"

bash "$ROOT/scripts/dev/smoke-growth-airdrop-snapshot-p0-local.sh"

for path in \
  "/api/v1/admin/growth/analytics/overview" \
  "/api/v1/admin/growth/analytics/funnel" \
  "/api/v1/admin/growth/analytics/top-referrers" \
  "/api/v1/admin/growth/kol-center"
do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$API$path" || echo 000)"
  if [[ "$code" != "401" && "$code" != "403" ]]; then
    echo "FAIL GET $path unauth -> HTTP $code (want 401/403)"
    exit 1
  fi
  echo "OK   GET $path unauth -> HTTP $code"
done

for fe_path in "/admin/growth/analytics" "/admin/growth/kol-center"; do
  fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE$fe_path" || echo 000)"
  case "$fe_code" in
    200|307|308) echo "OK   fe $fe_path: HTTP $fe_code" ;;
    *) echo "FAIL fe $fe_path -> HTTP $fe_code"; exit 1 ;;
  esac
done

echo "smoke-growth-analytics-kol-p0-local: exit 0"
