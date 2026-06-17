#!/usr/bin/env bash
# ① 本地 · GD/P06 公众 catalog 杭州向导：POST seed-trust-gate-e2e + Bearer 探针
# STRICT_SESSION_GATE=1：GET /guides/:id 与 /availability 须登录会话（列表 GET /guides 仍公开）
set -euo pipefail

API_PORT="${PORT:-${API_PORT:-8080}}"
API_BASE="${API_BASE:-http://127.0.0.1:${API_PORT}}"
HANGZHOU_ID="f0e0b101-0001-4001-8001-000000000001"
HANGZHOU_EMAIL="tg_guide_main@trustgate-e2e.local"
TOURIST_EMAIL="${TOURIST_EMAIL:-tourist@test.com}"
TOURIST_PASSWORD="${TOURIST_PASSWORD:-Test123!}"

seed_code="$(curl -sS -o /tmp/tt-seed-trust-gate.json -w '%{http_code}' \
  -X POST "${API_BASE}/auth/seed-trust-gate-e2e" \
  -H "Content-Type: application/json" \
  -d '{}' \
  --connect-timeout 10 --max-time 45 || echo "000")"
if [[ "$seed_code" != "200" ]]; then
  echo "bootstrap-gd-p06: FAIL POST /auth/seed-trust-gate-e2e HTTP ${seed_code}" >&2
  head -c 400 /tmp/tt-seed-trust-gate.json 2>/dev/null >&2 || true
  exit 1
fi

login_code="$(curl -sS -o /tmp/tt-tourist-login.json -w '%{http_code}' \
  -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TOURIST_EMAIL}\",\"password\":\"${TOURIST_PASSWORD}\"}" \
  --connect-timeout 10 --max-time 30 || echo "000")"
if [[ "$login_code" != "200" ]]; then
  echo "bootstrap-gd-p06: FAIL POST /auth/login HTTP ${login_code}" >&2
  exit 1
fi
TOKEN="$(python -c "import json; print(json.load(open('/tmp/tt-tourist-login.json')).get('token','').strip())" 2>/dev/null || true)"
if [[ -z "$TOKEN" ]]; then
  TOKEN="$(sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' /tmp/tt-tourist-login.json | head -1)"
fi
if [[ -z "$TOKEN" ]]; then
  echo "bootstrap-gd-p06: FAIL login missing token (STRICT_SESSION_GATE)" >&2
  exit 1
fi
AUTH="Authorization: Bearer ${TOKEN}"

detail_code="$(curl -sS -o /tmp/tt-guide-detail.json -w '%{http_code}' \
  "${API_BASE}/api/v1/guides/${HANGZHOU_ID}" \
  -H "$AUTH" \
  --connect-timeout 10 --max-time 30 || echo "000")"
if [[ "$detail_code" != "200" ]]; then
  echo "bootstrap-gd-p06: FAIL GET /api/v1/guides/${HANGZHOU_ID} HTTP ${detail_code} (need Bearer)" >&2
  head -c 400 /tmp/tt-guide-detail.json 2>/dev/null >&2 || true
  exit 1
fi
if ! grep -q "$HANGZHOU_ID" /tmp/tt-guide-detail.json 2>/dev/null; then
  echo "bootstrap-gd-p06: FAIL guide detail body missing id ${HANGZHOU_ID}" >&2
  exit 1
fi

avail_auth_code="$(curl -sS -o /dev/null -w '%{http_code}' \
  "${API_BASE}/api/v1/guides/${HANGZHOU_ID}/availability" \
  -H "$AUTH" \
  --connect-timeout 10 --max-time 20 || echo "000")"
if [[ "$avail_auth_code" != "200" ]]; then
  echo "bootstrap-gd-p06: FAIL GET availability with Bearer expected 200, got ${avail_auth_code}" >&2
  exit 1
fi

avail_unauth_code="$(curl -sS -o /dev/null -w '%{http_code}' \
  "${API_BASE}/api/v1/guides/${HANGZHOU_ID}/availability" \
  --connect-timeout 10 --max-time 20 || echo "000")"
if [[ "$avail_unauth_code" != "401" ]]; then
  echo "bootstrap-gd-p06: FAIL GET availability without Bearer expected 401, got ${avail_unauth_code}" >&2
  exit 1
fi

echo "bootstrap-gd-p06: OK seed-trust-gate-e2e guide=${HANGZHOU_ID} email=${HANGZHOU_EMAIL}"
echo "TT_BOOTSTRAP_GD_P06_PUBLIC_CATALOG: OK"
