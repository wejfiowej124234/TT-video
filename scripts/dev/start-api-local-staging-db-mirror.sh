#!/usr/bin/env bash
# Local API · Staging PostgreSQL mirror (official ops baseline data parity).
# Local process + Staging DB = same OCS/SOPCP/OCIP rows without pg_dump version skew.
#
#   bash scripts/dev/start-api-local-staging-db-mirror.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PORT=8080
PROXY_PORT="${FLY_PG_PROXY_PORT:-15432}"
FLY_PG_APP="${FLY_PG_APP:-tt-traveltrust-staging}"
ENV_FILE="$ROOT/scripts/dev/.env.staging-onboarding.local"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_operations_platform_alignment/${STAMP}"
mkdir -p "$EVID"

log() { echo "$*" | tee -a "$EVID/start-mirror-api.log"; }

if [[ ! -f "$ENV_FILE" ]]; then
  log "FAIL: missing $ENV_FILE"
  exit 1
fi

STAGING_DB_URL="$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//')"
STAGING_DB_URL="${STAGING_DB_URL//@tt-traveltrust-staging.flycast:5432/@127.0.0.1:${PROXY_PORT}/}"
STAGING_DB_URL="${STAGING_DB_URL//@127.0.0.1:5432/@127.0.0.1:${PROXY_PORT}/}"

log "== start-api-local-staging-db-mirror · $STAMP =="
log "fly proxy $FLY_PG_APP $PROXY_PORT:5432"
fly proxy "$PROXY_PORT:5432" -a "$FLY_PG_APP" >>"$EVID/fly-proxy.log" 2>&1 &
echo $! >"$EVID/fly-proxy.pid"
sleep 5

if command -v powershell.exe >/dev/null 2>&1; then
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$ROOT/scripts/dev/stop-api-thorough.ps1" -ApiPort "$PORT" 2>/dev/null || true
else
  npx --yes kill-port "$PORT" 2>/dev/null || true
fi
sleep 2

# Staging mirror must not use ① local seed stack (.env SEED_GUIDE_PUBLIC_MARKET=1 / profile=local).
export DATABASE_URL="$STAGING_DB_URL"
export PORT="$PORT"
export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-0}"
export TRAVELTRUST_DEPLOYMENT_PROFILE="${TRAVELTRUST_DEPLOYMENT_PROFILE:-staging_mirror}"
export TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=0
export TRAVELTRUST_SEED_MULTI_DEMO_PUBLIC_MARKET=0
export TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1
unset TRAVELTRUST_ONBOARDING_LOCAL_DEV || true
unset TRAVELTRUST_MANUAL_ACCEPTANCE || true

log "building traveltrust-api (FSM fixes)..."
cargo build -p traveltrust-api >>"$EVID/cargo-build.log" 2>&1

API_LOG="$EVID/api-mirror.log"
log "starting API PORT=$PORT (staging DB via proxy; profile=$TRAVELTRUST_DEPLOYMENT_PROFILE)"
nohup env \
  DATABASE_URL="$STAGING_DB_URL" \
  PORT="$PORT" \
  SEED_TEST_ACCOUNTS="$SEED_TEST_ACCOUNTS" \
  TRAVELTRUST_DEPLOYMENT_PROFILE="$TRAVELTRUST_DEPLOYMENT_PROFILE" \
  TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=0 \
  TRAVELTRUST_SEED_MULTI_DEMO_PUBLIC_MARKET=0 \
  TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 \
  cargo run -p traveltrust-api >>"$API_LOG" 2>&1 &
echo $! >"$EVID/api.pid"

for i in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
    log "OK health=200 pid=$(cat "$EVID/api.pid")"
  log "DATABASE_URL host=127.0.0.1:$PROXY_PORT (staging mirror)"
  log "evidence=$EVID"
    exit 0
  fi
  sleep 2
done

log "FAIL: /health timeout — tail $API_LOG"
tail -30 "$API_LOG" || true
exit 2
