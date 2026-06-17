#!/usr/bin/env bash
# ① GET /api/v1/me/publish-summary · multi-demo · W1-A3
#
# 用法：
#   API_BASE=http://127.0.0.1:8080 bash scripts/dev/smoke-publish-hub-api-probe-local.sh
#
# STRICT_API=1  → 404 即 FAIL（start-api-with-seed / 刚 rebuild 后）
# STRICT_API=0  → 404 仅 WARN skip（旧 API 进程）
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
EMAIL="${SMOKE_PUBLISH_HUB_EMAIL:-multi-demo@test.com}"
PASSWORD="${SMOKE_PASSWORD:-Test123!}"
STRICT_API="${STRICT_API:-0}"

fail() { echo "publish-hub-api-probe: FAIL $*" >&2; exit 1; }
ok() { echo "publish-hub-api-probe: OK $*"; }
warn() { echo "publish-hub-api-probe: WARN $*" >&2; }

if ! curl -sf "${API_BASE}/health" >/dev/null 2>&1; then
  if [[ "$STRICT_API" == "1" ]]; then
    fail "API /health not reachable at ${API_BASE}"
  fi
  warn "API /health skip"
  exit 0
fi

curl -sS -X POST "${API_BASE}/auth/seed-test-accounts" -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1 || true

LOGIN_RESP="$(curl -sS -w '\n%{http_code}' -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")"
LOGIN_CODE="${LOGIN_RESP##*$'\n'}"
LOGIN_BODY="${LOGIN_RESP%$'\n'*}"
[[ "$LOGIN_CODE" == "200" ]] || fail "login ${EMAIL} HTTP ${LOGIN_CODE}"

TOKEN="$(node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.token||'');" "$LOGIN_BODY")"
[[ -n "$TOKEN" ]] || fail "login ${EMAIL} missing token"

SUMMARY_RESP="$(curl -sS -w '\n%{http_code}' -X GET "${API_BASE}/api/v1/me/publish-summary" \
  -H "Authorization: Bearer ${TOKEN}")"
SUMMARY_CODE="${SUMMARY_RESP##*$'\n'}"
SUMMARY_BODY="${SUMMARY_RESP%$'\n'*}"

if [[ "$SUMMARY_CODE" == "404" ]]; then
  if [[ "$STRICT_API" == "1" ]]; then
    fail "GET /api/v1/me/publish-summary HTTP 404 — rebuild API (cargo build -p traveltrust-api) and restart ${API_BASE}"
  fi
  warn "GET /api/v1/me/publish-summary HTTP 404 (rebuild traveltrust-api for W1-A3)"
  exit 0
fi

[[ "$SUMMARY_CODE" == "200" ]] || fail "GET /api/v1/me/publish-summary HTTP ${SUMMARY_CODE} body=${SUMMARY_BODY:0:200}"

node -e "
  const o=JSON.parse(process.argv[1]);
  if (o.status!=='ok') { console.error('status not ok'); process.exit(2); }
  if (!o.counts || typeof o.counts!=='object') { console.error('missing counts'); process.exit(3); }
  const impl=o.meta&&o.meta.implementation_status;
  if (impl!=='me_publish_summary_api_v1') { console.error('bad implementation_status', impl); process.exit(4); }
" "$SUMMARY_BODY" || fail "publish-summary schema/meta (me_publish_summary_api_v1)"

ok "GET /api/v1/me/publish-summary multi-demo (W1-A3)"
echo "TT_PUBLISH_HUB_API_PROBE: OK"
