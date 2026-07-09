#!/usr/bin/env bash
# Community Production Ready (G1 Domain) · Runtime Closure
# PRM-CONTENT-B001 CLOSED — regression only; new issues → PRM-CONTENT-B00X
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="evidence/GO_production_readiness/community-production-ready/${STAMP}"
export AUDIT_STAMP="$STAMP"
LOCAL_API="${LOCAL_API:-http://127.0.0.1:8080}"

echo "== Community Production Ready (G1 Domain) Runtime Closure =="
echo "stamp=$STAMP"

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
  echo "WARN: API not up — start stack first:"
  echo "  SKIP_ABI_GATE=1 SKIP_FRONTEND=1 bash scripts/dev/start-api-for-playwright.sh"
  echo "  or: ./scripts/start_dev.sh"
  if [ "${SKIP_API_WAIT:-0}" != "1" ]; then
    echo "Waiting up to 180s for ${LOCAL_API} ..."
    wait_api || {
      echo "FAIL: API still down — PRM-CONTENT-B001 remains OPEN"
      exit 1
    }
  else
    echo "SKIP_API_WAIT=1 — proceeding (expect runtime FAIL)"
  fi
fi

echo "── Admin SuperAdmin bootstrap (PERM_OFFICIAL_PUBLISH) ──"
LOCAL_ADMIN_EMAIL="${ADMIN_EMAIL:-tourist@test.com}" \
  LOCAL_ADMIN_PASSWORD="${ADMIN_PASS:-Test123!}" \
  bash scripts/dev/bootstrap-local-admin-console.sh 8080

echo "── Static alignment ──"
node scripts/dev/validate-community-content-readiness-g1.cjs --static-only --evidence-dir "${EVID}/static"

echo "── L5 Runtime checklist (17 surfaces) ──"
node scripts/dev/validate-community-production-ready-runtime.cjs --evidence-dir "$EVID"

echo "── Matrix reconcile (gap stays OPEN until manual close after review) ──"
node scripts/dev/validate-production-readiness-master-matrix.cjs

echo ""
echo "TT_COMMUNITY_PRODUCTION_READY_G1_DOMAIN: evidence at $EVID"
echo "PRM-CONTENT-B001: CLOSED (archival) — failures → open PRM-CONTENT-B00X, do not reopen B001"
