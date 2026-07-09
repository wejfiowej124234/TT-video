#!/usr/bin/env bash
# Community Media Runtime Readiness (G1 · PRM-MEDIA-B001) — not PCP architecture
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="evidence/GO_production_readiness/community-media-runtime-ready/${STAMP}"
export AUDIT_STAMP="$STAMP"
LOCAL_API="${LOCAL_API:-http://127.0.0.1:8080}"

echo "== Community Media Runtime Readiness (G1 · PRM-MEDIA-B001) =="
echo "stamp=$STAMP"

# shellcheck source=scripts/dev/lib/tt-run-psql.sh
source "$ROOT/scripts/dev/lib/tt-run-psql.sh"
run_psql() { tt_run_psql "$@"; }

wait_api() {
  local n=0
  while [ "$n" -lt 90 ]; do
    if curl -sf "${LOCAL_API}/health/ready" >/dev/null 2>&1; then
      echo "API ready: ${LOCAL_API}"
      return 0
    fi
    n=$((n + 1))
    sleep 2
  done
  return 1
}

if ! curl -sf "${LOCAL_API}/health/ready" >/dev/null 2>&1; then
  echo "WARN: API not up — start: SKIP_ABI_GATE=1 bash scripts/dev/start-api-for-playwright.sh"
  wait_api || {
    echo "FAIL: API down — PRM-MEDIA-B001 stays OPEN"
    exit 1
  }
fi

echo "── DB remediation (migration 20260704140000) ──"
MIG="crates/api/migrations/20260704140000_community_media_runtime_readiness_g1.sql"
if [ ! -f "$MIG" ]; then
  echo "FAIL: migration missing"
  exit 1
fi
if command -v psql >/dev/null 2>&1; then
  psql "${DATABASE_URL:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}" \
    -v ON_ERROR_STOP=1 -q -f "$MIG"
else
  node scripts/dev/apply-community-media-migration-g1.mjs
fi

echo "── Admin SuperAdmin bootstrap ──"
LOCAL_ADMIN_EMAIL="${ADMIN_EMAIL:-tourist@test.com}" \
  LOCAL_ADMIN_PASSWORD="${ADMIN_PASS:-Test123!}" \
  bash scripts/dev/bootstrap-local-admin-console.sh 8080

echo "── Media audit (DB + API surfaces) ──"
node scripts/dev/audit-community-media-runtime-readiness.cjs --evidence-dir "${EVID}/audit" || {
  echo "WARN: audit reported legacy rows — continuing to runtime validator"
}

echo "── G1 Media runtime validator ──"
node scripts/dev/validate-community-media-runtime-readiness-g1.cjs --evidence-dir "$EVID"

echo "── Matrix reconcile ──"
node scripts/dev/validate-production-readiness-master-matrix.cjs

echo ""
echo "TT_COMMUNITY_MEDIA_RUNTIME_READINESS_G1: evidence at $EVID"
echo "PRM-MEDIA-B001: close ONLY when community-media-runtime-signoff.json verdict=COMMUNITY_MEDIA_RUNTIME_READY_G1"
