#!/usr/bin/env bash
# 与 93-matrix-enterprise-p1-batch.spec.ts 同源 API 复现（须已有 Bearer；勿提交 token）。
set -euo pipefail
API_BASE="${PLAYWRIGHT_API_BASE_URL:-http://127.0.0.1:8080}"

echo "== POST /auth/seed-test-accounts (noop ok) =="
curl -sS -X POST "${API_BASE}/auth/seed-test-accounts" -H "Content-Type: application/json" -d '{}' | head -c 400
echo

echo "== POST /auth/login tourist =="
LOGIN_JSON="$(curl -sS -X POST "${API_BASE}/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"tourist@test.com","password":"Test123!"}')"
echo "$LOGIN_JSON" | head -c 500
echo
TOKEN="$(node -e "const j=JSON.parse(process.argv[1]); process.stdout.write(j.token||'') " "$LOGIN_JSON")"
if [[ -z "$TOKEN" ]]; then echo "no token"; exit 1; fi

echo "== GET /api/v1/me (nickname SSOT) =="
curl -sS "${API_BASE}/api/v1/me" -H "Authorization: Bearer ${TOKEN}" | head -c 800
echo

echo "== GET /api/v1/discover/orders country=日本 city=东京 =="
curl -sS -G "${API_BASE}/api/v1/discover/orders" \
  --data-urlencode "country=日本" \
  --data-urlencode "city=东京" \
  --data-urlencode "limit=20" \
  -H "Authorization: Bearer ${TOKEN}" | head -c 1200
echo

echo "== GET /api/v1/community/conversations =="
curl -sS "${API_BASE}/api/v1/community/conversations" -H "Authorization: Bearer ${TOKEN}" | head -c 1200
echo
