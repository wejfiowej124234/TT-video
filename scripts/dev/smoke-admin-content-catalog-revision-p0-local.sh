#!/usr/bin/env bash
# C-S4 · Catalog Revision & Import Operations smoke（① 本地 · 须 API+PG 已起）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-admin-content-catalog-revision-p0-local (C-S4) =="
echo "API=$API FE=$FE"

for path in \
  "/api/v1/admin/content/revisions/detail" \
  "/api/v1/admin/content/revisions/compare" \
  "/api/v1/admin/content/revisions/rollback-history" \
  "/api/v1/admin/content/import/history" \
  "/api/v1/admin/content/catalog/parity" \
  "/api/v1/admin/content/catalog/observability"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$API$path" || echo 000)"
  if [[ "$code" != "401" && "$code" != "403" ]]; then
    echo "FAIL unauth $path -> HTTP $code (want 401/403)"
    exit 1
  fi
  echo "OK   unauth $path -> HTTP $code"
done

for fe_path in \
  "/admin/content/revisions" \
  "/admin/content/revisions/compare" \
  "/admin/content/import-operations" \
  "/admin/content/catalog-dashboard"; do
  fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE$fe_path" || echo 000)"
  case "$fe_code" in
    200|307|308) echo "OK   fe $fe_path: HTTP $fe_code" ;;
    *) echo "FAIL fe $fe_path -> HTTP $fe_code"; exit 1 ;;
  esac
done

echo "smoke-admin-content-catalog-revision-p0-local: exit 0"
