#!/usr/bin/env bash
# C-S6 · Catalog Consumer staging opt-in smoke（本地模拟 staging ENABLED=1）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-catalog-consumer-opt-in-staging-p0-local (C-S6) =="
echo "API=$API FE=$FE"
echo "NOTE: FE must be started with NEXT_PUBLIC_CATALOG_API_ENABLED=1 for consumer opt-in"

code="$(curl -s -o /dev/null -w '%{http_code}' "${API}/health" || echo 000)"
if [[ "$code" != "200" ]]; then
  echo "FAIL API health HTTP ${code}"
  exit 1
fi
echo "OK   API health ${code}"

catalog_pois_ro_code() {
  curl -sS -G -o /dev/null -w '%{http_code}' \
    --data-urlencode "country_iso=CN" \
    --data-urlencode "city=北京" \
    --data-urlencode "type=attraction" \
    "${API}/api/v1/catalog/pois" 2>/dev/null || echo 000
}

for path in \
  "/api/v1/catalog/countries" \
  "/api/v1/catalog/cities?country_iso=CN" \
  "/api/v1/catalog/pricing?country_iso=CN" \
  "/api/v1/catalog/media?asset_kind=landing_ambient" \
  "/api/v1/catalog/hotel-tiers"; do
  ro_code="$(curl -sS -o /dev/null -w '%{http_code}' "$API$path" 2>/dev/null || echo 000)"
  if [[ "$ro_code" != "200" ]]; then
    echo "FAIL catalog RO $path -> HTTP $ro_code"
    exit 1
  fi
  echo "OK   catalog RO $path -> HTTP $ro_code"
done

pois_code="$(catalog_pois_ro_code)"
if [[ "$pois_code" != "200" ]]; then
  echo "FAIL catalog RO /api/v1/catalog/pois (country_iso=CN city=北京 type=attraction) -> HTTP $pois_code"
  exit 1
fi
echo "OK   catalog RO /api/v1/catalog/pois (urlencoded city) -> HTTP $pois_code"

for fe_path in "/" "/market" "/admin/content/catalog-dashboard"; do
  fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE$fe_path" || echo 000)"
  case "$fe_code" in
    200|307|308) echo "OK   fe $fe_path: HTTP $fe_code" ;;
    *) echo "FAIL fe $fe_path -> HTTP $fe_code"; exit 1 ;;
  esac
done

echo "smoke-catalog-consumer-opt-in-staging-p0-local: exit 0"
