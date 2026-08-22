#!/usr/bin/env bash
# Schema-only capture for Local or Staging DB (read-only; no DDL/DML).
#
#   DATABASE_URL=postgres://... \
#     bash scripts/dev/capture-env-schema-readonly.sh local
#
#   STAGING_DATABASE_URL=postgres://... \
#     bash scripts/dev/capture-env-schema-readonly.sh staging
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

LABEL="${1:-}"
[[ "$LABEL" == "local" || "$LABEL" == "staging" ]] \
  || { echo "usage: capture-env-schema-readonly.sh {local|staging}" >&2; exit 2; }

if [[ "$LABEL" == "local" ]]; then
  DSN="${LOCAL_DATABASE_URL:-${DATABASE_URL:-}}"
  ENV_FILE="${LOCAL_ENV_FILE:-$ROOT/scripts/dev/.env.local}"
elif [[ "$LABEL" == "staging" ]]; then
  DSN="${STAGING_DATABASE_URL:-}"
  ENV_FILE="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging.local}"
fi

if [[ -z "$DSN" && -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source <(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed 's/\r$//' || true)
  set +a
  DSN="${DATABASE_URL:-}"
fi

if [[ -z "$DSN" && "$LABEL" == "staging" ]]; then
  DSN="$(fly ssh console -a tt-api-staging -C 'printenv DATABASE_URL' 2>/dev/null | tr -d '\r' | grep -E '^postgres' | head -1 || true)"
fi

[[ -n "$DSN" ]] || { echo "FAIL: no DATABASE_URL for $LABEL" >&2; exit 2; }

OUT_DIR="$ROOT/evidence/GO_official_product_reality_capture"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
export PRODUCTION_DATABASE_URL="$DSN"
export CAPTURE_LABEL="$LABEL"

python "$ROOT/scripts/dev/capture-official-prod-schema-readonly.py" \
  --out-dir "$OUT_DIR" \
  --stamp "${LABEL^^}_${STAMP}" \
  --label "$LABEL"

echo "capture-env-schema-readonly: OK label=$LABEL stamp=${LABEL^^}_${STAMP}"
