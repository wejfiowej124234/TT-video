#!/usr/bin/env bash
# POST_PARITY_FIX_QUEUE · Batch 5 Assets/i18n · Staging closure (② only)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_official_product_reality_capture"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
OFFICIAL="${OFFICIAL_WEB_BASE:-https://www.web3-ttg.com}"

fail() { echo "official-first-batch5-assets-i18n: FAIL $*" >&2; exit 2; }
info() { echo "official-first-batch5-assets-i18n: $*"; }

GIT_HEAD="$(git rev-parse HEAD)"
info "git HEAD=$GIT_HEAD"

info "Phase 1 — release-identity pin (OPS-v9)"
rid="$(curl -fsS --max-time 30 "$WEB/api/release-identity")"
echo "$rid" | tee "$EV/staging_batch5_release_identity_${STAMP}.json"
rid_sha="$(echo "$rid" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('git_sha',''))")"
[[ "$rid_sha" == 3e356617* ]] || fail "release-identity sha not OPS-v9 pin (got $rid_sha)"

info "Phase 2 — Local i18n vitest (skip if POST_PARITY_BATCH5_SKIP_LOCAL_GREEN=1)"
export POST_PARITY_BATCH5_SKIP_LOCAL_GREEN="${POST_PARITY_BATCH5_SKIP_LOCAL_GREEN:-1}"

info "Phase 3 — POST_PARITY Batch 5 Assets/i18n gate"
export STAGING_WEB_BASE="$WEB" OFFICIAL_WEB_BASE="$OFFICIAL"
python "$ROOT/scripts/gates/run-post-parity-fix-queue-batch5-assets-i18n.py" \
  --web "$WEB" --official "$OFFICIAL" \
  --out "$EV/POST_PARITY_FIX_QUEUE_BATCH5_ASSETS_I18N_${STAMP}.json" \
  || fail "POST_PARITY Batch 5 Assets/i18n gate"

cp "$EV/POST_PARITY_FIX_QUEUE_BATCH5_ASSETS_I18N_${STAMP}.json" \
  "$EV/POST_PARITY_FIX_QUEUE_BATCH5_ASSETS_I18N_LATEST.json"

info "DONE — inspect POST_PARITY_FIX_QUEUE_BATCH5_ASSETS_I18N_LATEST.json"
exit 0
