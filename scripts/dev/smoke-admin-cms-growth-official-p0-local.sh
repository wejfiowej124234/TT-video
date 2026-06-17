#!/usr/bin/env bash
# Admin CMS · Growth · Official OPS + manual QA walkthrough FE routes (① 本地 · 须 API+Next 已起)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-admin-cms-growth-official-p0-local =="
echo "API=$API FE=$FE"

for path in \
  "/api/v1/admin/content/countries" \
  "/api/v1/admin/content/publish-queue" \
  "/api/v1/admin/content/revisions/detail" \
  "/api/v1/admin/content/catalog/geo-validation" \
  "/api/v1/admin/growth/referral-codes" \
  "/api/v1/admin/growth/reward-ledger" \
  "/api/v1/admin/growth/analytics/overview" \
  "/api/v1/admin/growth/early-bird/stages" \
  "/api/v1/admin/growth/airdrop-campaigns" \
  "/api/v1/admin/growth/anti-fraud/rules" \
  "/api/v1/admin/growth/anti-fraud/scan-runs" \
  "/api/v1/admin/official/accounts" \
  "/api/v1/admin/official/guides" \
  "/api/v1/admin/official/itinerary-templates" \
  "/api/v1/admin/official/cold-start/campaigns" \
  "/api/v1/admin/country-market/launches"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$API$path" || echo 000)"
  if [[ "$code" != "401" && "$code" != "403" ]]; then
    echo "FAIL unauth $path -> HTTP $code (want 401/403)"
    exit 1
  fi
  echo "OK   unauth $path -> HTTP $code"
done

for fe_path in \
  "/admin/operator-guide" \
  "/admin/content" \
  "/admin/content/countries" \
  "/admin/content/publish-queue" \
  "/admin/content/geo-validation" \
  "/admin/content/country-market" \
  "/admin/growth" \
  "/admin/growth/referral-codes" \
  "/admin/growth/analytics" \
  "/admin/growth/early-bird" \
  "/admin/growth/anti-fraud" \
  "/admin/official" \
  "/admin/official/accounts" \
  "/admin/official/guides" \
  "/admin/official/itinerary-templates" \
  "/admin/official/cold-start" \
  "/admin/community/reports"; do
  fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE$fe_path" || echo 000)"
  case "$fe_code" in
    200|307|308) echo "OK   fe $fe_path: HTTP $fe_code" ;;
    *) echo "FAIL fe $fe_path -> HTTP $fe_code"; exit 1 ;;
  esac
done

echo "smoke-admin-cms-growth-official-p0-local: exit 0"
