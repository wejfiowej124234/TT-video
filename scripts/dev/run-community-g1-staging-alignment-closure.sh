#!/usr/bin/env bash
# PRM-CONTENT-B002 · Community G1 Content/Media → Phase ② Staging alignment
#
#   bash scripts/dev/run-community-g1-staging-alignment-closure.sh
#   SKIP_STAGING_DEPLOY=1 bash scripts/dev/run-community-g1-staging-alignment-closure.sh  # validate only
#
# Requires: fly auth · staging env files · TESTNET_FREEZE_OVERRIDE=1 when freeze ACTIVE
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
export REPO_ROOT="$ROOT"

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="evidence/GO_production_readiness/community-g1-staging-alignment/${STAMP}"
export AUDIT_STAMP="$STAMP"
export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
export STAGING_WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
export LOCAL_API="$STAGING_API_BASE"
export GAP_ID="PRM-CONTENT-B002"
export COMMUNITY_VALIDATION_PROFILE="staging"
export SKIP_MEDIA_HEAD_PROBE="${SKIP_MEDIA_HEAD_PROBE:-1}"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev,localhost,127.0.0.1"

mkdir -p "$EVID"
git rev-parse HEAD >"$EVID/local-git-sha.txt"
echo "staging_api=$STAGING_API_BASE" >"$EVID/staging-target.txt"
echo "stamp=$STAMP" >>"$EVID/staging-target.txt"

echo "== PRM-CONTENT-B002 · Community G1 Staging Alignment =="
echo "evidence=$EVID"

wait_ready() {
  local n=0
  while [ "$n" -lt 120 ]; do
    if curl -sf "${STAGING_API_BASE}/health/ready" >/dev/null 2>&1; then
      echo "Staging API ready: ${STAGING_API_BASE}"
      curl -sS "${STAGING_API_BASE}/meta/build" | tee "$EVID/staging-meta-build.json" >/dev/null || true
      return 0
    fi
    n=$((n + 1))
    sleep 3
  done
  echo "FAIL: staging API not ready" >&2
  return 1
}

if [[ "${SKIP_STAGING_DEPLOY:-0}" != "1" ]]; then
  echo "── Deploy tt-api-staging (DEPLOYMENT_STATE=sync · TESTNET_FREEZE_OVERRIDE=1) ──"
  export DEPLOYMENT_STATE=sync
  TESTNET_FREEZE_OVERRIDE=1 bash "$ROOT/scripts/dev/lift-testnet-staging-freeze.sh" \
    --reason "PRM-CONTENT-B002 community G1 staging alignment @ $(git rev-parse HEAD)" 2>&1 | tee "$EVID/lift-freeze.log" || true
  TESTNET_FREEZE_OVERRIDE=1 bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" 2>&1 | tee "$EVID/fly-api-deploy.log"

  echo "── Deploy tt-web-staging ──"
  TESTNET_FREEZE_OVERRIDE=1 FLY_WEB_NO_CACHE=1 bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee "$EVID/fly-web-deploy.log"
else
  echo "SKIP_STAGING_DEPLOY=1 — skipping Fly deploy"
fi

wait_ready

echo "── Staging DATABASE_URL (fly proxy if flycast) ──"
# shellcheck source=lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
staging_adm_u01_prepare_dsn || echo "WARN: STAGING_DATABASE_URL not prepared — DB guard may skip"

if [[ -n "${STAGING_DATABASE_URL:-}" ]] && command -v sqlx >/dev/null 2>&1; then
  echo "── sqlx migrate run (staging) ──"
  (cd "$ROOT/crates/api" && DATABASE_URL="$STAGING_DATABASE_URL" sqlx migrate run) 2>&1 | tee "$EVID/sqlx-migrate-run.log" || {
    echo "WARN: sqlx migrate run failed — API startup migrator may still apply pending"
  }
  (cd "$ROOT/crates/api" && DATABASE_URL="$STAGING_DATABASE_URL" sqlx migrate info) 2>&1 | tee "$EVID/sqlx-migrate-info.log" || true
else
  echo "NOTE: sqlx CLI or STAGING_DATABASE_URL unavailable — relying on API deploy migrator"
fi

echo "── Staging runtime validation (L5 + Media · independent evidence) ──"
node "$ROOT/scripts/dev/validate-community-g1-staging-alignment.cjs" --evidence-dir "$EVID"

echo ""
echo "TT_COMMUNITY_G1_STAGING_ALIGNMENT: PASS"
echo "PRM-CONTENT-B002: ready for Matrix CLOSED after review"
echo "Evidence: $EVID"
echo "Policy: do NOT reuse local community-production-ready/20260704T* as ② PASS"
