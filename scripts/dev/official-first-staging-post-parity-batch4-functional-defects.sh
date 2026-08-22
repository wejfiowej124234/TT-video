#!/usr/bin/env bash
# POST_PARITY_FIX_QUEUE · Batch 4 Functional Defects · Staging closure (② only)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_official_product_reality_capture"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
OFFICIAL="${OFFICIAL_WEB_BASE:-https://www.web3-ttg.com}"

fail() { echo "official-first-batch4-functional-defects: FAIL $*" >&2; exit 2; }
info() { echo "official-first-batch4-functional-defects: $*"; }

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
echo "$meta" | tee "$EV/staging_batch4_meta_${STAMP}.json"
api_sha="$(echo "$meta" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('build',{}).get('git_sha',''))")"
[[ -n "$api_sha" ]] || fail "meta missing git_sha"
info "meta git_sha=$api_sha"

info "Phase 2 — Local API regression (① · skip if POST_PARITY_BATCH4_SKIP_LOCAL_REGRESSION=1)"
export POST_PARITY_BATCH4_SKIP_LOCAL_REGRESSION="${POST_PARITY_BATCH4_SKIP_LOCAL_REGRESSION:-1}"

info "Phase 3 — POST_PARITY Batch 4 Functional Defects gate"
export STAGING_WEB_BASE="$WEB" OFFICIAL_WEB_BASE="$OFFICIAL"
python "$ROOT/scripts/gates/run-post-parity-fix-queue-batch4-functional-defects.py" \
  --web "$WEB" --official "$OFFICIAL" \
  --out "$EV/POST_PARITY_FIX_QUEUE_BATCH4_FUNCTIONAL_DEFECTS_${STAMP}.json" \
  || fail "POST_PARITY Batch 4 Functional Defects gate"

cp "$EV/POST_PARITY_FIX_QUEUE_BATCH4_FUNCTIONAL_DEFECTS_${STAMP}.json" \
  "$EV/POST_PARITY_FIX_QUEUE_BATCH4_FUNCTIONAL_DEFECTS_LATEST.json"

info "DONE — inspect POST_PARITY_FIX_QUEUE_BATCH4_FUNCTIONAL_DEFECTS_LATEST.json"
exit 0
