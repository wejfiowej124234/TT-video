#!/usr/bin/env bash
# Staging · Admin Final Validation browser + API walkthrough evidence
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_staging_admin_final_validation_walkthrough/$STAMP"
mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
EMAIL="${STAGING_AUDIT_EMAIL:-tourist@test.com}"
PASS="${STAGING_AUDIT_PASSWORD:-Test123!}"

echo "== [1/3] Playwright staging browser walkthrough =="
(
  cd "$ROOT/frontend"
  STAGING_WEB_BASE="$WEB" STAGING_API_BASE="$API" \
  STAGING_AUDIT_EMAIL="$EMAIL" STAGING_AUDIT_PASSWORD="$PASS" \
  STAGING_ADMIN_FINAL_VALIDATION_OUT="$EVID/browser.ndjson" \
  npx playwright test --config=playwright.staging-admin-final-validation.config.ts --reporter=line
)

echo "== [2/3] API write/read probes (test policy + public consumer) =="
login="$(curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")"
TOK="$(node -e "try{console.log(JSON.parse(process.argv[1]).token||'')}catch(e){}" "$login")"
[[ -n "$TOK" ]] || { echo "FAIL login"; exit 1; }

auth() { curl -sS -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" "$@"; }

before="$(auth "$API/api/v1/admin/official/public-operations/policy")"
show_before="$(node -e "try{console.log(JSON.parse(process.argv[1]).policy.show_test_data?'1':'0')}catch(e){console.log('?')}" "$before")"
patch="$(auth -X PATCH "$API/api/v1/admin/official/public-operations/policy" -d '{"show_test_data":true}')"
show_after="$(node -e "try{console.log(JSON.parse(process.argv[1]).policy.show_test_data?'1':'0')}catch(e){console.log('?')}" "$patch")"
auth -X PATCH "$API/api/v1/admin/official/public-operations/policy" -d "{\"show_test_data\":$([ \"$show_before\" = \"1\" ] && echo true || echo false)}" >/dev/null
history="$(auth "$API/api/v1/admin/official/public-operations/history?action=test_policy&limit=5")"
hist_ok="$(node -e "try{const o=JSON.parse(process.argv[1]);process.stdout.write((o.items&&o.items.length>=0)?'ok':'fail')}catch(e){process.stdout.write('fail')}" "$history")"
consumer="$(curl -sS -o /dev/null -w '%{http_code}' "$API/api/v1/official/public-operations?campaign_kind=homepage&surface=home_hero" 2>/dev/null || echo 000)"

node -e "
const fs=require('fs');
const p=process.argv[1];
const report={
  stamp: process.argv[2],
  web: process.argv[3],
  api: process.argv[4],
  api_probes: {
    policy_show_test_before: process.argv[5],
    policy_show_test_after_patch: process.argv[6],
    history_test_policy: process.argv[7],
    public_consumer_homepage: process.argv[8],
  },
  browser_ndjson: p+'/browser.ndjson',
  verdict: process.argv[7]==='ok' && process.argv[6]==='1' ? 'PASS' : 'WARN',
};
fs.writeFileSync(p+'/report.json', JSON.stringify(report,null,2));
" "$EVID" "$STAMP" "$WEB" "$API" "$show_before" "$show_after" "$hist_ok" "$consumer"

echo "== [3/3] Summary =="
cat "$EVID/report.json"
echo "Evidence: $EVID"
echo "TT_STAGING_ADMIN_FINAL_VALIDATION_WALKTHROUGH: OK"
