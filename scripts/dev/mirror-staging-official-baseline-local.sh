#!/usr/bin/env bash
# Mirror Staging official ops baseline to Local PostgreSQL + Public Catalog align.
# Goal: Local API reads same OCS/SOPCP/OCIP data as Staging (single official baseline).
#
#   bash scripts/dev/mirror-staging-official-baseline-local.sh
#
# Requires: docker traveltrust-postgres, fly CLI, local API on :8080 (restarted after DB sync).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="${MIRROR_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$ROOT/evidence/GO_operations_platform_alignment/${STAMP}"
STAGING_STATE="$ROOT/evidence/GO_official_cold_start_dataset/20260703T044855Z/state.json"
LOCAL_API="${LOCAL_API:-http://127.0.0.1:8080}"
STAGING_API="${STAGING_API:-https://tt-api-staging.fly.dev}"
FLY_PG_APP="${FLY_PG_APP:-tt-traveltrust-staging}"
PROXY_PORT="${FLY_PG_PROXY_PORT:-15432}"
LOCAL_DB="${LOCAL_DB_NAME:-traveltrust}"
DUMP_FILE="$EVID/staging-db.dump"

mkdir -p "$EVID"
exec > >(tee -a "$EVID/mirror-run.log") 2>&1

echo "== mirror-staging-official-baseline-local · $STAMP =="

# Load staging DB creds
ENV_FILE="$ROOT/scripts/dev/.env.staging-onboarding.local"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source <(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed 's/flycast/127.0.0.1:'"$PROXY_PORT"'/')
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "FAIL: no DATABASE_URL from $ENV_FILE"
  exit 1
fi

echo "== [1/6] fly proxy $FLY_PG_APP :$PROXY_PORT -> :5432 =="
fly proxy "$PROXY_PORT:5432" -a "$FLY_PG_APP" >>"$EVID/fly-proxy.log" 2>&1 &
PROXY_PID=$!
sleep 4

cleanup() {
  kill "$PROXY_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Parse DATABASE_URL for pg_dump (proxy replaces flycast host)
STAGING_URL="${DATABASE_URL/flycast/127.0.0.1:$PROXY_PORT}"
STAGING_URL="${STAGING_URL/tt-traveltrust-staging.flycast/127.0.0.1:$PROXY_PORT}"

echo "== [2/6] pg_dump staging (custom format) =="
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "WARN: pg_dump not on PATH — skipping DB clone; falling back to OCS API apply"
  SKIP_DB_CLONE=1
else
  pg_dump "$STAGING_URL" --no-owner --no-acl -Fc -f "$DUMP_FILE" 2>>"$EVID/pg-dump.log" || SKIP_DB_CLONE=1
fi

if [[ "${SKIP_DB_CLONE:-0}" != "1" && -f "$DUMP_FILE" && -s "$DUMP_FILE" ]]; then
  echo "== [3/6] restore -> local docker $LOCAL_DB =="
  if docker ps --format '{{.Names}}' | grep -qx traveltrust-postgres; then
    docker exec traveltrust-postgres psql -U traveltrust -d postgres -v ON_ERROR_STOP=1 \
      -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$LOCAL_DB' AND pid <> pg_backend_pid();" \
      2>/dev/null || true
    docker exec traveltrust-postgres psql -U traveltrust -d postgres -v ON_ERROR_STOP=1 \
      -c "DROP DATABASE IF EXISTS $LOCAL_DB WITH (FORCE);"
    docker exec traveltrust-postgres psql -U traveltrust -d postgres -v ON_ERROR_STOP=1 \
      -c "CREATE DATABASE $LOCAL_DB OWNER traveltrust;"
    docker exec -i traveltrust-postgres pg_restore -U traveltrust -d "$LOCAL_DB" --no-owner --no-acl <"$DUMP_FILE" \
      2>>"$EVID/pg-restore.log" || true
    echo "PASS: local DB restored from staging dump"
  else
    echo "WARN: traveltrust-postgres not running — skip restore"
    SKIP_DB_CLONE=1
  fi
else
  SKIP_DB_CLONE=1
fi

if [[ "${SKIP_DB_CLONE:-0}" == "1" ]]; then
  echo "== [3b] fallback: OCS apply on local API =="
  API_BASE="$LOCAL_API" OCS_STAMP="${STAMP}-local-ocs" \
    OCS_EVIDENCE_DIR="$EVID/ocs-apply" \
    bash "$ROOT/scripts/dev/run-official-cold-start-dataset.sh" || true
  STAGING_STATE="$EVID/ocs-apply/state.json"
fi

echo "== [4/6] align local public catalog (SOPCP) =="
API="$LOCAL_API" STATE="$STAGING_STATE" \
  OUT="$EVID/single-official-baseline-align.json" \
  node "$ROOT/scripts/dev/align-single-official-baseline-staging.cjs"

echo "== [5/6] SOPCP + OCIP audits on local =="
API="$LOCAL_API" STATE="$STAGING_STATE" \
  OUT="$EVID/sopcp-audit.json" \
  node "$ROOT/scripts/dev/audit-single-official-baseline.cjs" 2>&1 | tee "$EVID/sopcp-audit.log" || true

API="$LOCAL_API" STATE="$STAGING_STATE" \
  OUT="$EVID/ocip-audit.json" \
  node "$ROOT/scripts/dev/audit-official-catalog-identity.cjs" 2>&1 | tee "$EVID/ocip-audit.log" || true

echo "== [6/6] Local ↔ Staging alignment audit =="
LOCAL_API="$LOCAL_API" STAGING_API="$STAGING_API" STATE="$STAGING_STATE" \
  OUT="$EVID/alignment-audit.json" \
  ALIGN_STAMP="$STAMP" \
  node "$ROOT/scripts/dev/audit-operations-platform-local-staging-alignment.cjs"

echo "mirror-staging-official-baseline-local: done evidence=$EVID"
