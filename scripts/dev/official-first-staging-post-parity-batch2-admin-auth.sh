#!/usr/bin/env bash
# POST_PARITY_FIX_QUEUE · Batch 2 Admin/Auth · Staging closure (② only)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_official_product_reality_capture"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"

fail() { echo "official-first-batch2-admin-auth: FAIL $*" >&2; exit 2; }
info() { echo "official-first-batch2-admin-auth: $*"; }

GIT_HEAD="$(git rev-parse HEAD)"
info "git HEAD=$GIT_HEAD"

info "Phase 1 — /health /meta runtime identity"
for i in $(seq 1 24); do
  hc="$(python -c "import urllib.request; r=urllib.request.urlopen('${API}/health', timeout=20); print(r.status)" 2>/dev/null || echo 000)"
  [[ "$hc" == "200" ]] && break
  sleep 5
done
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"

meta="$(curl -fsS --max-time 30 "$API/meta")"
echo "$meta" | tee "$EV/staging_batch2_meta_${STAMP}.json"
api_sha="$(echo "$meta" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('build',{}).get('git_sha',''))")"
[[ -n "$api_sha" ]] || fail "meta missing git_sha"
info "meta git_sha=$api_sha"

info "Phase 2 — seed registry test accounts + prepare Staging DSN (ADM-U01)"
export REPO_ROOT="$ROOT"
# shellcheck source=lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
staging_adm_u01_prepare_dsn || fail "STAGING_DATABASE_URL unavailable"
export STAGING_DATABASE_URL DATABASE_URL
curl -fsS --max-time 30 -X POST "$API/auth/seed-test-accounts" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: official-first-batch2-seed-$(date -u +%Y%m%dT%H%M%SZ)" \
  -d '{}' \
  | tee "$EV/staging_batch2_seed_accounts_${STAMP}.json" || fail "seed-test-accounts"

info "Phase 3 — POST_PARITY Batch 2 Admin/Auth gate"
export STAGING_API_BASE="$API" STAGING_WEB_BASE="$WEB" TRAVELTRUST_STAGING_API_BASE="$API" ADM_U01_STRICT=1
python "$ROOT/scripts/gates/run-post-parity-fix-queue-batch2-admin-auth.py" \
  --api "$API" --web "$WEB" \
  --out "$EV/POST_PARITY_FIX_QUEUE_BATCH2_ADMIN_AUTH_${STAMP}.json" \
  || fail "POST_PARITY Batch 2 Admin/Auth gate"

cp "$EV/POST_PARITY_FIX_QUEUE_BATCH2_ADMIN_AUTH_${STAMP}.json" \
  "$EV/POST_PARITY_FIX_QUEUE_BATCH2_ADMIN_AUTH_LATEST.json"

info "DONE — inspect POST_PARITY_FIX_QUEUE_BATCH2_ADMIN_AUTH_LATEST.json"
exit 0
