#!/usr/bin/env bash
# Official-First · Staging pre-rebuild read-only capture (backup/register).
#
#   TRAVELTRUST_OFFICIAL_FIRST_STAGING_CLEAN_REBUILD_OK=1 \
#     bash scripts/dev/official-first-staging-pre-rebuild-capture.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_official_product_reality_capture"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$EV/staging_pre_rebuild_backup_$STAMP"
mkdir -p "$BACKUP_DIR"

export REPO_ROOT="$ROOT"
# shellcheck source=lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"

echo "official-first-staging-pre-rebuild-capture: read-only backup $BACKUP_DIR"

curl -fsS --max-time 30 "$API/meta" >"$BACKUP_DIR/api-meta.json" 2>/dev/null || echo '{}' >"$BACKUP_DIR/api-meta.json"
curl -fsS --max-time 30 "$WEB/api/release-identity" >"$BACKUP_DIR/www-release-identity.json" 2>/dev/null || echo '{}' >"$BACKUP_DIR/www-release-identity.json"
curl -fsS --max-time 30 "$API/health" >"$BACKUP_DIR/api-health.txt" 2>/dev/null || true

if staging_adm_u01_prepare_dsn; then
  export DATABASE_URL="$STAGING_DATABASE_URL"
  export STAGING_DATABASE_URL
  bash "$ROOT/scripts/dev/capture-env-schema-readonly.sh" staging 2>&1 | tee "$BACKUP_DIR/schema-capture.log" || true
  cp -f "$EV/STAGING_SCHEMA_CAPTURE_LATEST.json" "$BACKUP_DIR/STAGING_SCHEMA_CAPTURE_PRE_REBUILD.json" 2>/dev/null || true
  python - <<'PY' "$BACKUP_DIR/pre_rebuild_summary.json"
import json, os, sys
from pathlib import Path
cap_path = Path("evidence/GO_official_product_reality_capture/STAGING_SCHEMA_CAPTURE_LATEST.json")
summary = {"schema": "traveltrust.staging_pre_rebuild_backup.v1", "api": os.environ.get("STAGING_API_BASE")}
if cap_path.exists():
    cap = json.loads(cap_path.read_text(encoding="utf-8"))
    prod = cap.get("production", {})
    summary.update({
        "status": cap.get("status"),
        "counts": prod.get("counts"),
        "aggregate_schema_sha256": prod.get("fingerprints", {}).get("aggregate_schema_sha256"),
        "migration_count": (prod.get("migration_state", {}).get("_sqlx_migrations", {}) or {}).get("count")
        if isinstance(prod.get("migration_state", {}).get("_sqlx_migrations"), dict)
        else len((prod.get("migration_state", {}).get("_sqlx_migrations", {}) or {}).get("rows", [])),
    })
Path(sys.argv[1]).write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
PY
else
  echo '{"error":"STAGING_DATABASE_URL unavailable"}' >"$BACKUP_DIR/pre_rebuild_summary.json"
fi

printf '%s\n' "$(basename "$BACKUP_DIR")" >"$EV/staging_pre_rebuild_backup_LATEST.txt"
echo "official-first-staging-pre-rebuild-capture: OK $BACKUP_DIR"
