#!/usr/bin/env bash
# C-S1 · Admin Content CRUD + publish queue smoke（① 本地 · 须 API+PG 已起）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-admin-content-p0-local (C-S1) =="
echo "API=$API FE=$FE"

for path in \
  "/api/v1/admin/content/countries" \
  "/api/v1/admin/content/cities" \
  "/api/v1/admin/content/pois" \
  "/api/v1/admin/content/pricing-templates" \
  "/api/v1/admin/content/intercity-routes" \
  "/api/v1/admin/content/hotel-tiers" \
  "/api/v1/admin/content/transport-region-rules" \
  "/api/v1/admin/content/media-assets" \
  "/api/v1/admin/content/publish-queue"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$API$path" || echo 000)"
  if [[ "$code" != "401" && "$code" != "403" ]]; then
    echo "FAIL unauth $path -> HTTP $code (want 401/403)"
    exit 1
  fi
  echo "OK   unauth $path -> HTTP $code"
done

for fe_path in \
  "/admin/content/countries" \
  "/admin/content/cities" \
  "/admin/content/pois" \
  "/admin/content/pricing" \
  "/admin/content/intercity-routes" \
  "/admin/content/poi-images" \
  "/admin/content/hotel-tiers" \
  "/admin/content/transport-region-rules" \
  "/admin/content/media-assets" \
  "/admin/content/landing-ambient" \
  "/admin/content/publish-queue"; do
  fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE$fe_path" || echo 000)"
  case "$fe_code" in
    200|307|308) echo "OK   fe $fe_path: HTTP $fe_code" ;;
    *) echo "FAIL fe $fe_path -> HTTP $fe_code"; exit 1 ;;
  esac
done

echo "smoke-admin-content-p0-local: exit 0"
