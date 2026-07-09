#!/usr/bin/env bash
# Ensure R003 / prod UAT login account exists (SEED_TEST_ACCOUNTS=0 · idempotent register)
#
#   PROD_API_BASE=https://tt-api-prod.fly.dev \
#     bash scripts/dev/bootstrap-prod-r003-account.sh
set -euo pipefail

API="${PROD_API_BASE:-https://tt-api-prod.fly.dev}"
EMAIL="${R003_PROD_A_EMAIL:-r003.prod.interim2@traveltrust.test}"
PASSWORD="${R003_PROD_A_PASSWORD:-R003ProdPass9!}"
API="${API%/}"

key="$(printf '%s' "r003-prod-${EMAIL}" | sha256sum 2>/dev/null | awk '{print $1}' || python -c "import hashlib,sys; print(hashlib.sha256(sys.argv[1].encode()).hexdigest())" "r003-prod-${EMAIL}")"

reg="$(curl -sS -X POST "${API}/auth/register" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${key}" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"role\":\"traveler\"}" 2>/dev/null || echo '{}')"

login="$(curl -sS -X POST "${API}/auth/login" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${key}-login" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" 2>/dev/null || echo '{}')"

token="$(echo "$login" | python -c "import json,sys; print((json.load(sys.stdin).get('token') or '').strip())" 2>/dev/null || true)"
if [[ -n "$token" ]]; then
  echo "bootstrap-prod-r003-account: OK login ${EMAIL}"
  exit 0
fi
echo "bootstrap-prod-r003-account: WARN register/login did not yield token — reg=${reg:0:120}" >&2
exit 0
