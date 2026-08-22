#!/usr/bin/env bash
# Official-First · Staging post-deploy verify + OCS seed + runtime parity
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_official_product_reality_capture"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"

fail() { echo "official-first-staging-post-deploy: FAIL $*" >&2; exit 2; }
info() { echo "official-first-staging-post-deploy: $*"; }

GIT_HEAD="$(git rev-parse HEAD)"
info "git HEAD=$GIT_HEAD"

info "Phase 1 — /health /meta / release-identity"
for i in $(seq 1 30); do
  hc="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 20 "$API/health" 2>/dev/null || echo 000)"
  if [[ "$hc" == "200" ]]; then break; fi
  sleep 10
done
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"

meta="$(curl -fsS --max-time 30 "$API/meta")"
echo "$meta" | tee "$EV/staging_post_deploy_meta_${STAMP}.json"
api_sha="$(echo "$meta" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('git_sha') or d.get('build',{}).get('git_sha',''))")"
[[ -n "$api_sha" ]] || fail "meta missing git_sha"
[[ "$api_sha" != 1915ec4d* ]] || fail "stale API image 1915ec4d still live"
info "meta git_sha=$api_sha"

curl -fsS --max-time 30 "$WEB/api/release-identity" | tee "$EV/staging_post_deploy_release_identity_${STAMP}.json"

info "Phase 2 — migration startup (recent logs + /meta database_connected)"
fly logs -a tt-api-staging --no-tail 2>&1 | tail -8 | tee "$EV/staging_post_deploy_logs_${STAMP}.log" || true
db_ok="$(echo "$meta" | python -c "import sys,json; d=json.load(sys.stdin); print('1' if d.get('database_connected') else '0')")"
[[ "$db_ok" == "1" ]] || fail "API /meta database_connected=false"
if fly logs -a tt-api-staging --no-tail 2>&1 | tail -15 | grep -q "missing in the resolved migrations"; then
  fail "API crash-loop on migration mismatch (recent logs)"
fi
if ! fly logs -a tt-api-staging --no-tail 2>&1 | tail -80 | grep -qE "TravelTrust API listening|listening on"; then
  info "startup banner not in recent logs — /health + database_connected accepted as migration PASS"
fi

info "Phase 3 — seed registry test accounts + prepare Staging DSN"
export REPO_ROOT="$ROOT"
# shellcheck source=lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
staging_adm_u01_prepare_dsn || fail "STAGING_DATABASE_URL unavailable"
export STAGING_DATABASE_URL DATABASE_URL
curl -fsS --max-time 30 -X POST "$API/auth/seed-test-accounts" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: official-first-seed-$(date -u +%Y%m%dT%H%M%SZ)" \
  -d '{}' \
  | tee "$EV/staging_post_deploy_seed_accounts_${STAMP}.json" || fail "seed-test-accounts"

info "Phase 4 — Auth/Admin smokes"
export STAGING_API_BASE="$API" TRAVELTRUST_STAGING_API_BASE="$API"
export ADM_U01_STRICT=1
bash "$ROOT/scripts/gates/smoke-admin-rbac-staging-matrix.sh" 2>&1 | tee "$EV/staging_post_deploy_admin_smoke_${STAMP}.log" \
  || fail "admin RBAC smoke"

info "Phase 4b — bootstrap OCS super admin (PG · sanitized · preclean @ocs)"
STAGING_OCS_ADMIN_EMAIL="${STAGING_OCS_ADMIN_EMAIL:-adm-10x4-20260719143519@traveltrust.test}"
export STAGING_OCS_ADMIN_EMAIL
python "$ROOT/scripts/dev/official-first-bootstrap-staging-ocs-admin.py" \
  || fail "OCS admin bootstrap"
info "Phase 4c — hydrate OCS admin into API memory"
fly apps restart tt-api-staging >/dev/null 2>&1 || true
for i in $(seq 1 36); do
  hc="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 20 "$API/health" 2>/dev/null || echo 000)"
  [[ "$hc" == "200" ]] && break
  sleep 5
done
[[ "$hc" == "200" ]] || fail "API not healthy after OCS admin hydrate restart"
# Avoid stale partial OCS state from prior attempts on the same stamp dir
rm -f "$EV"/staging_ocs_seed_*/state.json 2>/dev/null || true

info "Phase 4d — OCS asset baseline on API volume (M7-07 · community_post_media)"
API_BASE="$API" FLY_APP=tt-api-staging OUT="$EV/staging_ocs_asset_bootstrap_${STAMP}.json" \
  node "$ROOT/scripts/dev/bootstrap-ocs-official-assets.cjs" 2>&1 | tee "$EV/staging_ocs_asset_bootstrap_${STAMP}.log" \
  || fail "OCS asset baseline bootstrap"

info "Phase 5 — OCS sanitized seed"
export TRAVELTRUST_OFFICIAL_FIRST_STAGING_OCS_SEED_OK=1
export TRAVELTRUST_OCS_STAGING_HYDRATE_RESTART=1
set -o pipefail
API_BASE="$API" OCS_EVIDENCE_DIR="$EV/staging_ocs_seed_${STAMP}" \
  STAGING_OCS_ADMIN_EMAIL="${STAGING_OCS_ADMIN_EMAIL:-adm-10x4-20260719143519@traveltrust.test}" \
  bash "$ROOT/scripts/dev/run-official-cold-start-dataset.sh" 2>&1 | tee "$EV/staging_ocs_seed_${STAMP}.log"
ocs_rc="${PIPESTATUS[0]}"
[[ "$ocs_rc" -eq 0 ]] || fail "OCS sanitized seed exit $ocs_rc"

info "Phase 6 — runtime reality compare (post-OCS API settle)"
for i in $(seq 1 36); do
  hc="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 20 "$API/health" 2>/dev/null || echo 000)"
  [[ "$hc" == "200" ]] && break
  sleep 5
done
[[ "$hc" == "200" ]] || fail "API not healthy before runtime compare (got $hc)"
python "$ROOT/scripts/dev/official-first-runtime-reality-compare.py" --api "$API" --web "$WEB"

info "Phase 6b — POST_PARITY Batch 1 CMS/OCS gate"
python "$ROOT/scripts/gates/run-post-parity-fix-queue-batch1-cms-ocs.py" --api "$API" \
  --out "$EV/POST_PARITY_FIX_QUEUE_BATCH1_CMS_OCS_${STAMP}.json" \
  || fail "POST_PARITY Batch 1 CMS/OCS gate"

python - <<'PY'
import json
from datetime import datetime, timezone
from pathlib import Path
now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
ev = Path('evidence/GO_official_product_reality_capture')
rt = json.loads((ev/'OFFICIAL_RUNTIME_REALITY_COMPARE_LATEST.json').read_text())
status = json.loads((ev/'OFFICIAL_FIRST_CLEAN_REBUILD_STATUS.json').read_text())
status['recorded_utc'] = now
status['phases']['E_verify_pass'] = 'RUNTIME_COMPLETE' if rt.get('PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS') == 'ISSUED' else 'RUNTIME_NOT_ZERO'
status['PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS'] = rt.get('PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS')
status['runtime_reality_compare'] = 'OFFICIAL_RUNTIME_REALITY_COMPARE_LATEST.json'
status.pop('runtime_parity_blocker', None)
(ev/'OFFICIAL_FIRST_CLEAN_REBUILD_STATUS.json').write_text(json.dumps(status, indent=2)+'\n', encoding='utf-8')
if rt.get('PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS') == 'ISSUED':
    (ev/'PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS_LATEST.json').write_text(json.dumps({
        'schema': 'traveltrust.product_and_documentation_runtime_parity_pass.v1',
        'issued_utc': now,
        'track': 'OFFICIAL_FIRST_CLEAN_REBUILD_CONVERGENCE',
        'compare_artifact': 'OFFICIAL_RUNTIME_REALITY_COMPARE_LATEST.json',
        'schema_parity_artifact': 'OFFICIAL_PRODUCT_REALITY_COMPARE_LATEST.json',
        'tt_production_go': 'NO_GO',
    }, indent=2)+'\n', encoding='utf-8')
print('status', status.get('PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS'))
PY

info "DONE — inspect OFFICIAL_RUNTIME_REALITY_COMPARE_LATEST.json"
