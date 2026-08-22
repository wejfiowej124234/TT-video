#!/usr/bin/env bash
# POST_PARITY_FIX_QUEUE · Batch 3 UI/UX · Staging closure (② only)
# FIVE-MAIN frozen — web visibility / wiring / data-link gates only.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_official_product_reality_capture"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"

fail() { echo "official-first-batch3-ui-ux: FAIL $*" >&2; exit 2; }
info() { echo "official-first-batch3-ui-ux: $*"; }

GIT_HEAD="$(git rev-parse HEAD)"
info "git HEAD=$GIT_HEAD"

info "Phase 1 — /health /meta runtime identity"
for i in $(seq 1 24); do
  hc="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 20 "$API/health" 2>/dev/null || echo 000)"
  [[ "$hc" == "200" ]] && break
  sleep 5
done
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"

meta="$(curl -fsS --max-time 30 "$API/meta")"
echo "$meta" | tee "$EV/staging_batch3_meta_${STAMP}.json"
api_sha="$(echo "$meta" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('build',{}).get('git_sha',''))")"
[[ -n "$api_sha" ]] || fail "meta missing git_sha"
info "meta git_sha=$api_sha"

info "Phase 2 — Local FIVE-MAIN + data-link green (①)"
bash "$ROOT/scripts/gates/five-main-routes-ui-antiregression-gate.sh" \
  || fail "FIVE-MAIN antiregression gate"
(
  cd "$ROOT/frontend"
  npx vitest run \
    "app/(home)/homeMarketing.contract.test.ts" \
    lib/landingItinerarySession.test.ts \
    components/market/useMarketPage.contract.test.ts \
    lib/marketTravelBookmarksSync.test.ts
) || fail "data-link contract vitest"

info "Phase 3 — POST_PARITY Batch 3 UI/UX gate (staging web probes)"
export STAGING_API_BASE="$API" STAGING_WEB_BASE="$WEB"
export POST_PARITY_BATCH3_SKIP_LOCAL_GREEN=1
python "$ROOT/scripts/gates/run-post-parity-fix-queue-batch3-ui-ux.py" \
  --api "$API" --web "$WEB" \
  --out "$EV/POST_PARITY_FIX_QUEUE_BATCH3_UI_UX_${STAMP}.json" \
  || fail "POST_PARITY Batch 3 UI/UX gate"

cp "$EV/POST_PARITY_FIX_QUEUE_BATCH3_UI_UX_${STAMP}.json" \
  "$EV/POST_PARITY_FIX_QUEUE_BATCH3_UI_UX_LATEST.json"

info "DONE — inspect POST_PARITY_FIX_QUEUE_BATCH3_UI_UX_LATEST.json"
exit 0
