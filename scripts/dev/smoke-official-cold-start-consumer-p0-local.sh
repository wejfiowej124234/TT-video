#!/usr/bin/env bash
# E2E-A-01 · Cold Start Campaign consumer smoke（① 本地 · 须 API+PG 已起）
set -euo pipefail
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-official-cold-start-consumer-p0-local (E2E-A-01) =="
echo "API=$API FE=$FE"

for surface in home_hero market_feed community_feed; do
  body="$(curl -fsS "$API/api/v1/official/cold-start/surfaces/$surface" || echo FAIL)"
  echo "$body" | grep -q '"status"' || { echo "FAIL GET surface $surface shape"; exit 1; }
  echo "$body" | grep -q '"surface"' || { echo "FAIL GET surface $surface missing surface"; exit 1; }
  echo "OK   GET /api/v1/official/cold-start/surfaces/$surface"
done

for fe_path in "/" "/market" "/community"; do
  fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE$fe_path" 2>/dev/null || echo 000)"
  fe_code="${fe_code//[$'\r\n ']/}"
  case "$fe_code" in
    200|307|308) echo "OK   fe $fe_path: HTTP $fe_code" ;;
    000|000000) echo "WARN fe $fe_path unreachable (dev server optional for API gate)" ;;
    *) echo "FAIL fe $fe_path -> HTTP $fe_code"; exit 1 ;;
  esac
done

echo "smoke-official-cold-start-consumer-p0-local: exit 0"
