#!/usr/bin/env bash
# Official Production · read-only schema-only Reality Capture (parity RUNTIME gap).
#
# Policy:
#   - SELECT against information_schema / pg_catalog / migration bookkeeping tables only
#   - NO user/business row dumps
#   - NO DDL/DML / migration / repair / Production mutation
#   - NO ACCEPT_ED substitute
#
#   TT_OFFICIAL_PROD_SCHEMA_CAPTURE_OK=1 \
#     bash scripts/dev/capture-official-prod-schema-readonly.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=lib/fly-mpg-pg.sh
source "$ROOT/scripts/dev/lib/fly-mpg-pg.sh"

[[ "${TT_OFFICIAL_PROD_SCHEMA_CAPTURE_OK:-}" == "1" ]] \
  || { echo "capture-official-prod-schema-readonly: FAIL set TT_OFFICIAL_PROD_SCHEMA_CAPTURE_OK=1" >&2; exit 2; }

OUT_DIR="$ROOT/evidence/GO_official_product_reality_capture"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
PROXY_PORT="${FLY_PROD_MPG_PROXY_PORT:-16381}"
PROXY_PID=""
CLUSTER_NAME="${FLY_PROD_MPG_NAME:-tt-traveltrust-prod}"
# hostname from living DSN used q49ypo4e98pr17ln
CLUSTER_ID="${FLY_PROD_MPG_CLUSTER_ID:-$(fly_mpg_cluster_id_for_name "$CLUSTER_NAME")}"
[[ -n "$CLUSTER_ID" ]] || CLUSTER_ID="q49ypo4e98pr17ln"

cleanup() {
  if [[ -n "${PROXY_PID:-}" ]] && kill -0 "$PROXY_PID" 2>/dev/null; then
    kill "$PROXY_PID" 2>/dev/null || true
    wait "$PROXY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

command -v fly >/dev/null 2>&1 || { echo "fly CLI missing" >&2; exit 2; }
fly auth whoami >/dev/null 2>&1 || { echo "fly not authenticated" >&2; exit 2; }

echo "capture-official-prod-schema-readonly: cluster_id=$CLUSTER_ID proxy=$PROXY_PORT"

# Prefer Owner local prod env file if present (gitignored); else Fly SSH.
RAW_DSN=""
PROD_ENV="${PROD_ENV_FILE:-$ROOT/scripts/dev/.env.production.local}"
if [[ -f "$PROD_ENV" ]]; then
  # shellcheck disable=SC1090
  set -a
  # only pull DATABASE_URL line
  # shellcheck disable=SC1091
  source <(grep -E '^DATABASE_URL=' "$PROD_ENV" | sed 's/\r$//' || true)
  set +a
  RAW_DSN="${DATABASE_URL:-}"
fi
if [[ -z "$RAW_DSN" ]]; then
  RAW_DSN="$(fly ssh console -a tt-api-prod -C 'printenv DATABASE_URL' 2>/dev/null | tr -d '\r' | grep -E '^postgres' | head -1 || true)"
fi
[[ -n "$RAW_DSN" ]] || { echo "FAIL: could not obtain DATABASE_URL (local prod env or tt-api-prod)" >&2; exit 2; }

# Start MPG proxy
fly mpg proxy "$CLUSTER_ID" -p "$PROXY_PORT" >"$OUT_DIR/mpg-proxy-schema-capture.log" 2>&1 &
PROXY_PID=$!
sleep 3
kill -0 "$PROXY_PID" 2>/dev/null || { echo "FAIL: mpg proxy did not start"; tail -20 "$OUT_DIR/mpg-proxy-schema-capture.log"; exit 2; }

# Rewrite DSN host/port to local proxy (password stays in env only)
export PRODUCTION_DATABASE_URL
PRODUCTION_DATABASE_URL="$(
  python - <<'PY' "$RAW_DSN" "$PROXY_PORT"
import sys
from urllib.parse import urlparse, urlunparse, quote
u = urlparse(sys.argv[1])
port = sys.argv[2]
# force localhost proxy
netloc = f"{u.username}:{u.password}@127.0.0.1:{port}"
print(urlunparse((u.scheme, netloc, u.path, '', u.query, '')))
PY
)"
# drop RAW from shell history surface
unset RAW_DSN

# Optional staging DSN for pairwise (same policy)
STAGING_DATABASE_URL="${STAGING_DATABASE_URL:-}"
if [[ -z "$STAGING_DATABASE_URL" ]] && fly status -a tt-api-staging >/dev/null 2>&1; then
  STG_RAW="$(fly ssh console -a tt-api-staging -C 'printenv DATABASE_URL' 2>/dev/null | tr -d '\r' | grep -E '^postgres' | head -1 || true)"
  if [[ -n "$STG_RAW" ]]; then
    # staging often direct — try as-is first; if host is flympg, skip pairwise this run
    export STAGING_DATABASE_URL="$STG_RAW"
  fi
fi

python "$ROOT/scripts/dev/capture-official-prod-schema-readonly.py" \
  --out-dir "$OUT_DIR" \
  --stamp "$STAMP"

echo "capture-official-prod-schema-readonly: OK stamp=$STAMP"
