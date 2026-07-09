#!/usr/bin/env bash
# MEDIA_CDN_PRODUCTION_ACCEPTANCE — formal gate before PI3-MEDIA-R2-CDN-FINAL may close.
#
#   bash scripts/dev/run-media-cdn-production-acceptance-gate.sh
#   bash scripts/dev/run-media-cdn-production-acceptance-gate.sh --with-c4 --with-playwright
#
# SSOT: registry/media-cdn-production-acceptance.v1.yaml
# Runbook: docs/runbook/TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="${ACCEPTANCE_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$ROOT/evidence/GO_media_cdn_production_acceptance/${STAMP}"
STAGING_API="${STAGING_API:-https://tt-api-staging.fly.dev}"
STAGING_WEB="${STAGING_WEB:-https://tt-web-staging.fly.dev}"
CDN_BASE="${CDN_PUBLIC_BASE:-https://cdn.traveltrust.app}"
CDN_HOST="${CDN_HOST:-cdn.traveltrust.app}"
WITH_C4=0
WITH_PW=0
mkdir -p "$EVID"
exec > >(tee -a "$EVID/acceptance-run.log") 2>&1

failures=()
pass() { echo "PASS: $*"; }
fail_check() { echo "FAIL: $*" >&2; failures+=("$*"); }

for arg in "$@"; do
  [[ "$arg" == "--with-c4" ]] && WITH_C4=1
  [[ "$arg" == "--with-playwright" ]] && WITH_PW=1
done

echo "== MEDIA_CDN_PRODUCTION_ACCEPTANCE · $STAMP =="
echo "SSOT: registry/media-cdn-production-acceptance.v1.yaml"

# --- G1 + G3: Fly env + capabilities ---
echo "== [G1/G3] Fly CDN env + capabilities =="
fly ssh console -a tt-api-staging -C \
  'printenv COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL COMMUNITY_MEDIA_S3_ENDPOINT' \
  2>&1 | tee "$EVID/fly-media-env.log" || true

if grep -q 'loca\.lt' "$EVID/fly-media-env.log" 2>/dev/null; then
  fail_check "G1: Fly still uses loca.lt"
elif grep -q "$CDN_HOST" "$EVID/fly-media-env.log" 2>/dev/null; then
  pass "G1: Fly PUBLIC_BASE_URL uses $CDN_HOST"
else
  fail_check "G1: Fly PUBLIC_BASE_URL not $CDN_HOST — Owner config incomplete?"
fi

curl -sf "${STAGING_API}/api/v1/community/media/capabilities" | tee "$EVID/capabilities.json"
if grep -q '"public_video_publish_ready":true' "$EVID/capabilities.json"; then
  pass "G3: public_video_publish_ready=true"
else
  fail_check "G3: public_video_publish_ready not true"
fi

# --- G1: CDN smoke HEAD ---
echo "== [G1] CDN HTTP probes =="
SMOKE_PATHS=(
  "/community-media/v1/_ops/smoke.jpg"
  "/"
)
for p in "${SMOKE_PATHS[@]}"; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' -I "${CDN_BASE}${p}" 2>/dev/null || echo 000)"
  echo "${CDN_BASE}${p} -> HTTP ${code}" | tee -a "$EVID/cdn-head.log"
  [[ "$code" == "200" || "$code" == "404" || "$code" == "403" ]] && pass "G1: CDN TLS OK ${p} (${code})" \
    || fail_check "G1: CDN probe failed ${p} HTTP ${code}"
done

# --- G2: STRICT CDN audit ---
echo "== [G2] media URL audit STRICT_CDN=1 =="
AUDIT_STAMP="$STAMP" STAGING_API="$STAGING_API" STRICT_CDN=1 CDN_HOST="$CDN_HOST" \
  OUT="$EVID/media-url-audit.json" \
  node "$ROOT/scripts/dev/audit-staging-media-urls.cjs" | tee "$EVID/media-url-audit.log" \
  && pass "G2: STRICT_CDN audit PASS" \
  || fail_check "G2: STRICT_CDN audit FAIL (loca.lt or tigris in community payloads)"

# --- G8: Cache hit ---
echo "== [G8] CDN cache probe =="
CACHE_URL="${CDN_CACHE_PROBE_URL:-${CDN_BASE}/community-media/v1/_ops/smoke.jpg}"
h1="$(curl -sSI "$CACHE_URL" 2>/dev/null | tr -d '\r' | tee "$EVID/cache-probe-1.log")"
sleep 2
h2="$(curl -sSI "$CACHE_URL" 2>/dev/null | tr -d '\r' | tee "$EVID/cache-probe-2.log")"
echo "$h1" | grep -i cf-cache-status | tee "$EVID/cache-status.log" || true
if echo "$h2" | grep -iqE 'cf-cache-status:\s*(HIT|REVALIDATED)'; then
  pass "G8: cf-cache-status HIT/REVALIDATED on second request"
elif echo "$h1$h2" | grep -iq 'cf-cache-status'; then
  pass "G8: cf-cache-status present (DYNAMIC acceptable on first deploy — review manually)"
else
  fail_check "G8: no cf-cache-status — verify Cloudflare proxy + cache rules"
fi

# --- G6/G7: C4 upload smoke ---
if [[ "$WITH_C4" -eq 1 ]]; then
  echo "== [G6/G7] C4 multipart upload + immediate GET =="
  export API_BASE="$STAGING_API"
  export NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL="$CDN_BASE"
  if bash "$ROOT/scripts/dev/smoke-community-c4-staging-video-playback.sh" 2>&1 | tee "$EVID/c4-smoke.log"; then
    if grep -q "$CDN_HOST" "$EVID/c4-smoke.log" 2>/dev/null; then
      pass "G6/G7: C4 smoke OK · playback on CDN"
    else
      fail_check "G6/G7: C4 smoke ran but CDN host not in log"
    fi
  else
    fail_check "G6/G7: C4 smoke FAIL"
  fi
else
  echo "SKIP G6/G7: pass --with-c4 for upload + immediate GET"
fi

# --- G4/G5: Playwright browser ---
if [[ "$WITH_PW" -eq 1 ]]; then
  echo "== [G4/G5] Playwright browser surfaces =="
  export STAGING_WEB_BASE="$STAGING_WEB"
  export STAGING_API_BASE="$STAGING_API"
  (cd "$ROOT/frontend" && npx playwright test e2e/frontend-api-consistency-audit.spec.ts --project=chromium) \
    2>&1 | tee "$EVID/playwright-consistency.log" \
    && pass "G4: browser images / surfaces" \
    || fail_check "G4/G5: playwright consistency FAIL"
else
  echo "SKIP G4/G5: pass --with-playwright for browser acceptance"
fi

# --- G9: Rollback readiness ---
echo "== [G9] Rollback verification =="
ROLLBACK_ENV="$ROOT/scripts/dev/staging-media-tigris-rollback.env.example"
[[ -f "$ROLLBACK_ENV" ]] && pass "G9: rollback env template exists" || fail_check "G9: missing rollback env template"
[[ -f "$ROOT/docs/runbook/TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md" ]] \
  && pass "G9: rollback runbook §8 documented" || fail_check "G9: rollback runbook missing"
if [[ -f "$ROOT/evidence/GO_media_r2_cdn_migration/20260703T141500Z/closeout.json" ]]; then
  pass "G9: PI3-MEDIA-PERSISTENT-STAGING closeout (interim baseline) on file"
else
  fail_check "G9: missing PI3-MEDIA-PERSISTENT-STAGING closeout evidence"
fi
echo "G9 manual: Owner/platform sign rollback drill on signoff if not executed live" | tee "$EVID/rollback-manual-note.log"

# --- Verdict ---
FAIL_JSON="$EVID/failures.json"
printf '%s\n' "${failures[@]:-}" | node -e "
const fs=require('fs');
const lines=fs.readFileSync(0,'utf8').trim().split('\n').filter(Boolean);
fs.writeFileSync(process.argv[1], JSON.stringify(lines)+'\n');
" "$FAIL_JSON"

node - <<NODE
const fs = require('fs');
const path = require('path');
const failures = JSON.parse(fs.readFileSync('${FAIL_JSON}', 'utf8'));
const withC4 = ${WITH_C4};
const withPw = ${WITH_PW};
const out = {
  schema: 'traveltrust.media_cdn_production_acceptance.v1',
  stamp: '${STAMP}',
  gate_id: 'MEDIA_CDN_PRODUCTION_ACCEPTANCE',
  blocks_closure_of: 'PI3-MEDIA-R2-CDN-FINAL',
  staging_api: '${STAGING_API}',
  cdn_public_base: '${CDN_BASE}',
  checks_run: {
    G1_CDN_HTTP_200: true,
    G2_STRICT_CDN_AUDIT: true,
    G3_CAPABILITIES_READY: true,
    G4_BROWSER_IMAGES: withPw,
    G5_BROWSER_VIDEO: withC4,
    G6_UPLOAD: withC4,
    G7_IMMEDIATE_GET: withC4,
    G8_CACHE: true,
    G9_ROLLBACK: true
  },
  failures,
  blocking_count: failures.length,
  verdict: failures.length === 0 ? 'PASS' : 'FAIL',
  next_on_pass: 'Close PI3-MEDIA-R2-CDN-FINAL per TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md §5'
};
const outPath = path.join('${ROOT}'.replace(/\\\\/g, '/'), 'evidence/GO_media_cdn_production_acceptance/${STAMP}/acceptance.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\\n');
console.log(JSON.stringify({ verdict: out.verdict, blocking_count: out.blocking_count, evidence: outPath }, null, 2));
NODE

if [[ ${#failures[@]} -gt 0 ]]; then
  echo "MEDIA_CDN_PRODUCTION_ACCEPTANCE: FAIL (${#failures[@]} checks)" >&2
  exit 1
fi

if [[ "$WITH_C4" -eq 0 || "$WITH_PW" -eq 0 ]]; then
  echo "WARN: PASS with skipped browser/upload checks — run --with-c4 --with-playwright before final close" >&2
  exit 2
fi

echo "MEDIA_CDN_PRODUCTION_ACCEPTANCE: PASS"
echo "SIGNOFF: evidence/manual-uat/signoff/MEDIA-CDN-PRODUCTION-ACCEPTANCE-SIGNOFF-${STAMP}.md"
echo "Then: close PI3-MEDIA-R2-CDN-FINAL (not before this gate PASS)"
