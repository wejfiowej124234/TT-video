#!/usr/bin/env bash
# Batch-14 · apply C-04 pending guide seed on Staging Postgres (demo only).
# Usage:
#   DATABASE_URL=postgres://... bash scripts/dev/seed-batch14-c04-pending-guide.sh
#   # or: FLY_APP=tt-api-staging bash scripts/dev/seed-batch14-c04-pending-guide.sh  (uses fly postgres connect -a)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SQL="$ROOT/scripts/dev/sql/seed-batch14-c04-pending-guide.sql"
[[ -f "$SQL" ]] || { echo "missing $SQL" >&2; exit 1; }

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "[batch14-c04] applying via DATABASE_URL"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL"
elif [[ -n "${FLY_APP:-}" ]] && command -v fly >/dev/null 2>&1; then
  echo "[batch14-c04] applying via fly postgres connect -a ${FLY_APP}"
  fly postgres connect -a "$FLY_APP" <"$SQL"
else
  echo "Set DATABASE_URL or FLY_APP=tt-api-staging (with fly CLI)." >&2
  exit 2
fi
echo "[batch14-c04] OK · pending guide user=batch14-c04-pending-guide@traveltrust.test"
