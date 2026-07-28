#!/usr/bin/env bash
# Admin L5 · Staging 系统审计探针（② · 非 Production GO）
#
#   bash scripts/dev/run-admin-l5-staging-audit.sh
#
# 可选：
#   STAGING_AUDIT_EMAIL=plantartist778@gmail.com
#   STAGING_AUDIT_PASSWORD=...
#   STAGING_ADMIN_L5_SKIP_BROWSER=1   # 跳过 Playwright 浏览器探针
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${STAGING_ADMIN_L5_AUDIT_OUT:-$ROOT/evidence/GO_staging_admin_l5_audit/$STAMP}"
# Playwright subshell `cd frontend` — relative OUT would write under frontend/ and break tee/record.
case "$OUT" in
  /*) ;;
  [A-Za-z]:/*|[A-Za-z]:\\*) ;;
  *) OUT="$ROOT/$OUT" ;;
esac
EMAIL="${STAGING_AUDIT_EMAIL:-tourist@test.com}"
PASS="${STAGING_AUDIT_PASSWORD:-Test123!}"
GIT_SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"

mkdir -p "$OUT"
REPORT="$OUT/report.json"
LOG="$OUT/run.log"
BROWSER_NDJSON="$OUT/browser.ndjson"
: >"$BROWSER_NDJSON"

log() { echo "$*" | tee -a "$LOG"; }

curl_json() {
  local method="$1" url="$2" body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -sS -w "\n__HTTP__%{http_code}__TIME__%{time_total}" -X "$method" "$url" \
      -H "Content-Type: application/json" -d "$body" --connect-timeout 20 --max-time 45
  else
    curl -sS -w "\n__HTTP__%{http_code}__TIME__%{time_total}" -X "$method" "$url" \
      -H "Content-Type: application/json" --connect-timeout 20 --max-time 45
  fi
}

curl_auth() {
  local method="$1" url="$2" token="$3"
  curl -sS -w "\n__HTTP__%{http_code}__TIME__%{time_total}" -X "$method" "$url" \
    -H "Authorization: Bearer $token" -H "Content-Type: application/json" --connect-timeout 20 --max-time 45
}

parse_http() {
  local raw="$1"
  HTTP_CODE="$(echo "$raw" | sed -n 's/.*__HTTP__\([0-9]*\)__TIME__.*/\1/p')"
  TIME_S="$(echo "$raw" | sed -n 's/.*__TIME__\([0-9.]*\)$/\1/p')"
  BODY="$(echo "$raw" | sed 's/__HTTP__[0-9]*__TIME__[0-9.]*$//')"
}

probe_fe_redirect() {
  local id="$1" url="$2" cookie="${3:-}"
  local code loc
  if [[ -n "$cookie" ]]; then
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 -b "$cookie" "$url" || echo 000)"
    loc="$(curl -sS -o /dev/null -w '%{redirect_url}' --max-time 30 -b "$cookie" "$url" || true)"
  else
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "$url" || echo 000)"
    loc="$(curl -sS -o /dev/null -w '%{redirect_url}' --max-time 30 "$url" || true)"
  fi
  node -e "
    const fs=require('fs');
    fs.appendFileSync(process.argv[1], JSON.stringify({
      id: process.argv[2], url: process.argv[3], http: Number(process.argv[4]),
      redirect: process.argv[5]||null, kind: 'fe_middleware', cookie: process.argv[6]||null
    })+'\n');
  " "$PROBES" "$id" "$url" "$code" "$loc" "$cookie"
  log "  $id HTTP $code redirect=${loc:-—}"
}

log "run-admin-l5-staging-audit: START $STAMP"
log "API=$API WEB=$WEB EMAIL=$EMAIL OUT=$OUT git=$GIT_SHA"

# Login hardening: seed may return db_failed while login still emits a Bearer
# that capabilities rejects as login_required — accept session only after cap 200.
AUDIT_TOKEN=""
ROLE=""
LOGIN_DETAIL=""
for attempt in 1 2 3 4 5 6 7 8; do
  seed_raw="$(curl -sS -X POST "$API/auth/seed-test-accounts" -H "Content-Type: application/json" \
    -d "{\"promote_admin_email\":\"$EMAIL\"}" --max-time 45 2>/dev/null || true)"
  seed_note="$(node -e "try{const o=JSON.parse(process.argv[1]);process.stdout.write(o.error||o.code||'ok')}catch(e){process.stdout.write('seed_parse')}" "$seed_raw" 2>/dev/null || echo seed_err)"
  login_raw="$(curl_json POST "$API/auth/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")"
  parse_http "$login_raw"
  AUDIT_TOKEN="$(node -e "try{const o=JSON.parse(process.argv[1]);process.stdout.write(o.token||'')}catch(e){}" "$BODY" 2>/dev/null || true)"
  ROLE="$(node -e "try{const o=JSON.parse(process.argv[1]);process.stdout.write(o.role||'')}catch(e){}" "$BODY" 2>/dev/null || true)"
  if [[ -z "$AUDIT_TOKEN" ]]; then
    LOGIN_DETAIL="attempt=$attempt seed=$seed_note login_http=$HTTP_CODE no_token"
    sleep $((attempt < 4 ? attempt : 3))
    continue
  fi
  case "$ROLE" in
    admin|super_admin) ;;
    *)
      LOGIN_DETAIL="attempt=$attempt seed=$seed_note role=$ROLE"
      AUDIT_TOKEN=""
      sleep $((attempt < 4 ? attempt : 3))
      continue
      ;;
  esac
  cap_raw="$(curl_auth GET "$API/api/v1/admin/capabilities" "$AUDIT_TOKEN")"
  parse_http "$cap_raw"
  if [[ "$HTTP_CODE" == "200" ]]; then
    LOGIN_DETAIL="attempt=$attempt seed=$seed_note role=$ROLE cap=200"
    break
  fi
  LOGIN_DETAIL="attempt=$attempt seed=$seed_note role=$ROLE cap=$HTTP_CODE (dead_token)"
  AUDIT_TOKEN=""
  sleep $((attempt < 4 ? attempt : 3))
done

if [[ -z "$AUDIT_TOKEN" ]]; then
  log "FAIL: login hardening exhausted — $LOGIN_DETAIL — set STAGING_AUDIT_EMAIL/PASSWORD"
  echo "{\"verdict\":\"FAIL\",\"reason\":\"login_or_capabilities_failed\",\"detail\":\"$LOGIN_DETAIL\",\"stamp\":\"$STAMP\"}" >"$REPORT"
  exit 2
fi
case "$ROLE" in
  admin|super_admin) ;;
  *)
    log "FAIL_P0: login_role=$ROLE — need admin|super_admin (tourist→capabilities 403 is role wall, not fe_proxy Cookie break)"
    echo "{\"verdict\":\"FAIL_P0\",\"reason\":\"login_role_not_admin\",\"login_role\":\"$ROLE\",\"stamp\":\"$STAMP\",\"note\":\"Do not treat admin_required 403 as fe_proxy_capabilities_http_401\"}" >"$REPORT"
    exit 3
    ;;
esac
log "login OK role=$ROLE token_prefix=${AUDIT_TOKEN:0:12}... ($LOGIN_DETAIL)"

PROBES="$OUT/probes.ndjson"
: >"$PROBES"

probe_api() {
  local id="$1" path="$2" auth="${3:-1}"
  local raw code t body
  if [[ "$auth" == "1" ]]; then
    raw="$(curl_auth GET "$API$path" "$AUDIT_TOKEN")"
  else
    raw="$(curl_json GET "$API$path")"
  fi
  parse_http "$raw"
  code="$HTTP_CODE"
  t="$TIME_S"
  body="$BODY"
  local err=""
  err="$(node -e "try{const o=JSON.parse(process.argv[1]);process.stdout.write(o.error||o.code||'')}catch(e){}" "$body" 2>/dev/null || true)"
  node -e "
    const fs=require('fs');
    fs.appendFileSync(process.argv[1], JSON.stringify({
      id: process.argv[2], url: process.argv[3], http: Number(process.argv[4]),
      time_s: Number(process.argv[5]), error: process.argv[6]||null,
      body_snip: (process.argv[7]||'').slice(0,200), kind: 'api'
    })+'\n');
  " "$PROBES" "$id" "$API$path" "$code" "$t" "$err" "$body"
  log "  $id HTTP $code ${t}s"
}

log "== API probes (Bearer) =="
probe_api "capabilities" "/api/v1/admin/capabilities"
probe_api "home_overview" "/api/v1/admin/metrics/home-overview"
probe_api "orders_list" "/api/v1/admin/orders?limit=20"
probe_api "users_list" "/api/v1/admin/users?limit=20"
probe_api "guides_list" "/api/v1/admin/guides?limit=20"
probe_api "disputes_list" "/api/v1/admin/disputes?limit=20"
probe_api "approvals_list" "/api/v1/admin/approvals?limit=20"
probe_api "audit_logs" "/api/v1/admin/audit-logs?limit=20"
probe_api "finance_summary" "/api/v1/admin/finance/summary"
probe_api "rbac_matrix" "/api/v1/admin/rbac/route-matrix"
probe_api "2fa_policy" "/api/v1/admin/security/2fa-policy"
probe_api "community_reports" "/api/v1/admin/community/reports?limit=20"
probe_api "provider_apps" "/api/v1/admin/provider-applications?limit=20"
probe_api "steward_apps" "/api/v1/admin/steward-applications?limit=20"

log "== auth boundary =="
probe_api "capabilities_no_auth" "/api/v1/admin/capabilities" 0

log "== FE middleware (must redirect without valid session_ok) =="
probe_fe_redirect "fe_middleware_no_cookie" "$WEB/admin" ""
probe_fe_redirect "fe_middleware_uid_only" "$WEB/admin" "traveltrust_user_id=stale-uid-only"
probe_fe_redirect "fe_middleware_uid_and_ok" "$WEB/admin" "traveltrust_user_id=stale-uid-only; traveltrust_session_ok=1"

log "== FE shell HTML (no session cookie) =="
FE_PATHS="/admin /admin/orders /admin/users /admin/permissions /admin/approvals"
for p in $FE_PATHS; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$WEB$p" --max-time 30 || echo 000)"
  log "  FE $p HTTP $code"
  echo "{\"id\":\"fe$(echo $p|tr '/' '_')\",\"url\":\"$WEB$p\",\"http\":$code,\"kind\":\"fe_shell\"}" >>"$PROBES"
done

log "== FE capabilities via same-origin proxy (Bearer) =="
cap_fe_raw="$(curl -sS -w "\n__HTTP__%{http_code}__TIME__%{time_total}" \
  "$WEB/api/v1/admin/capabilities" -H "Authorization: Bearer $AUDIT_TOKEN" --max-time 45)"
parse_http "$cap_fe_raw"
log "  FE proxy capabilities HTTP $HTTP_CODE ${TIME_S}s"
echo "{\"id\":\"fe_proxy_capabilities\",\"url\":\"$WEB/api/v1/admin/capabilities\",\"http\":$HTTP_CODE,\"time_s\":$TIME_S,\"kind\":\"fe_proxy\"}" >>"$PROBES"

BROWSER_VERDICT="SKIP"
if [[ "${STAGING_ADMIN_L5_SKIP_BROWSER:-}" != "1" ]]; then
  log "== FE browser probes (Playwright) =="
  if (
    cd "$ROOT/frontend" && \
    STAGING_WEB_BASE="$WEB" STAGING_API_BASE="$API" \
    STAGING_AUDIT_EMAIL="$EMAIL" STAGING_AUDIT_PASSWORD="$PASS" \
    STAGING_ADMIN_L5_BROWSER_OUT="$BROWSER_NDJSON" \
    npx playwright test --config=playwright.staging-admin-l5.config.ts --reporter=line 2>&1 | tee -a "$LOG"
  ); then
    BROWSER_VERDICT="PASS"
  else
    BROWSER_VERDICT="FAIL"
  fi
fi

node -e "
const fs=require('fs');
const path=require('path');
const out=process.argv[1];
const probes=fs.readFileSync(path.join(out,'probes.ndjson'),'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const p0ApiIds=['capabilities','orders_list','approvals_list','fe_proxy_capabilities'];
const p0Api=probes.filter(p=>p0ApiIds.includes(p.id) && p.http!==200);
const p0Mw=probes.filter(p=>p.kind==='fe_middleware' && ['fe_middleware_no_cookie','fe_middleware_uid_only'].includes(p.id) && p.http!==307);
const role=process.argv[6];
const roleBlock=role!=='super_admin' ? [{id:'login_role',detail:'expected super_admin for approvals 200'}] : [];
const browserVerdict=process.argv[7];
const browserBlock=browserVerdict==='FAIL' ? [{id:'browser_probe',detail:'Playwright admin-l5-staging-closure failed'}] : [];
const p0=[...p0Api,...p0Mw,...roleBlock,...browserBlock];
const fails=probes.filter(p=>p.kind==='api' && p.http!==200 && p.id!=='capabilities_no_auth');
const report={
  stamp: process.argv[2],
  git_sha: process.argv[8],
  api: process.argv[3],
  web: process.argv[4],
  audit_email: process.argv[5],
  login_role: role,
  browser_verdict: browserVerdict,
  probe_count: probes.length,
  fail_count: fails.length,
  p0_blockers: p0,
  probes,
  verdict: p0.length ? 'FAIL_P0' : (fails.length ? 'WARN' : 'PASS')
};
fs.writeFileSync(path.join(out,'report.json'), JSON.stringify(report,null,2));
const md=[
  '# Admin L5 Staging Audit',
  '',
  '- stamp: '+report.stamp,
  '- git: '+report.git_sha,
  '- web: '+report.web,
  '- audit_email: '+report.audit_email,
  '- login_role: '+report.login_role,
  '- browser: '+report.browser_verdict,
  '- verdict: **'+report.verdict+'**',
  '',
  '## P0 blockers',
  ...(p0.length ? p0.map(b=>'- '+b.id+(b.detail?(' — '+b.detail):(' HTTP '+(b.http??'?')))) : ['- (none)']),
  '',
  '## Core API',
  ...['capabilities','orders_list','approvals_list'].map(id=>{
    const p=probes.find(x=>x.id===id);
    return '- '+id+': '+(p?('HTTP '+p.http):'missing');
  }),
  '',
  '## Middleware',
  ...probes.filter(p=>p.kind==='fe_middleware').map(p=>'- '+p.id+': HTTP '+p.http+' → '+(p.redirect||'—')),
].join('\n');
fs.writeFileSync(path.join(out,'ADMIN-L5-STAGING-AUDIT-REPORT.md'), md);
console.log('verdict='+report.verdict+' p0='+p0.length+' fails='+fails.length);
" "$OUT" "$STAMP" "$API" "$WEB" "$EMAIL" "$ROLE" "$BROWSER_VERDICT" "$GIT_SHA"

log "run-admin-l5-staging-audit: DONE $OUT/report.json"
VERDICT="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).verdict)" "$REPORT")"
if [[ "$VERDICT" != "PASS" ]]; then exit 2; fi
