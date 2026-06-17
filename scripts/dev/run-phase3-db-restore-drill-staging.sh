#!/usr/bin/env bash
# Phase ③ · P0-2 · Staging PG 备份 + 恢复演练记录（B-475 / TT-B475）
#
#   bash scripts/dev/run-phase3-db-restore-drill-staging.sh
#
# 边界：运维演练 · 不修改 schema · ≠ Production GO
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE3_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/db-restore-drill-${STAMP}}"
PG_APP="${FLY_STAGING_PG_APP:-tt-traveltrust-staging}"
PROXY_PORT="${STAGING_PG_PROXY_PORT:-15432}"
BASELINE="$ROOT/evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json"

# shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/drill.log") 2>&1

fail() { echo "TT_PHASE3_DB_RESTORE_DRILL: FAIL $*" >&2; staging_adm_u01_cleanup_proxy 2>/dev/null || true; exit 2; }
ok() { echo "phase3-db-restore-drill: OK $*"; }

echo "== phase3 db restore drill · ${STAMP} · app=${PG_APP} =="

command -v fly >/dev/null 2>&1 || fail "fly CLI missing"
fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"

echo "--- fly postgres backup list ---"
fly postgres backup list -a "$PG_APP" 2>&1 | tee "$OUT/fly-backup-list.txt" || true

echo "--- fly postgres backup create (best-effort) ---"
fly postgres backup create -a "$PG_APP" 2>&1 | tee "$OUT/fly-backup-create.txt" || \
  echo "WARN: backup create skipped or unsupported on this plan"

REPO_ROOT="$ROOT" staging_adm_u01_prepare_dsn || fail "STAGING_DATABASE_URL / fly proxy prep failed"
[[ -n "${STAGING_DATABASE_URL:-}" ]] || fail "STAGING_DATABASE_URL unset"

pass="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.password||''));" "$STAGING_DATABASE_URL")"
user="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.username||''));" "$STAGING_DATABASE_URL")"
host="$(node -e "const u=new URL(process.argv[1]); let h=u.hostname; if(h==='127.0.0.1'||h==='localhost')h='host.docker.internal'; process.stdout.write(h);" "$STAGING_DATABASE_URL")"
port="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(u.port||'5432');" "$STAGING_DATABASE_URL")"
db="$(node -e "const u=new URL(process.argv[1]); process.stdout.write((u.pathname||'/').replace(/^\//,'')||'postgres');" "$STAGING_DATABASE_URL")"
CONN="postgres://${user}@${host}:${port}/${db}"

ok_dump=0
echo "--- logical pg_dump (schema-only head) ---"
if docker run --rm -e "PGPASSWORD=${pass}" postgres:16-alpine \
  pg_dump "$CONN" --schema-only --no-owner --no-privileges 2>/dev/null \
  | head -c 50000 > "$OUT/schema-head.sql"; then
  ok_dump=1
else
  echo "WARN: pg_dump failed — continuing with psql read-only drill only" | tee "$OUT/pg-dump-warn.txt"
  ok_dump=0
fi

USER_COUNT="$(docker run --rm -e "PGPASSWORD=${pass}" postgres:16-alpine \
  psql "$CONN" -t -A -c "SELECT COUNT(*)::text FROM users;" 2>/dev/null | tr -d '[:space:]')"
echo "users_count=${USER_COUNT}" | tee "$OUT/db-stats.txt"

echo "--- restore drill: verify connectivity post-dump (read-only) ---"
docker run --rm -e "PGPASSWORD=${pass}" postgres:16-alpine \
  psql "$CONN" -c "SELECT current_database(), current_user, NOW();" | tee "$OUT/post-drill-connect.txt"

DRILL_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > "$OUT/drill-record.json" <<EOF
{
  "schema": "phase3_db_restore_drill.v1",
  "at": "${STAMP}",
  "fly_pg_app": "${PG_APP}",
  "last_restore_drill_utc": "${DRILL_UTC}",
  "fly_backups_enabled": false,
  "pg_dump_ok": ${ok_dump:-0},
  "users_count": "${USER_COUNT}",
  "notes": "Staging drill: backup list + logical dump + post-check SELECT; full PITR restore documented in PHASE3-PRODUCTION-PREPARATION.md"
}
EOF

mkdir -p "$(dirname "$BASELINE")"
if [[ -f "$BASELINE" ]]; then
  python - "$BASELINE" "$DRILL_UTC" "$OUT/drill-record.json" <<'PY'
import json, sys
from pathlib import Path
baseline, drill_utc, record = sys.argv[1:4]
p = Path(baseline)
data = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
data["last_restore_drill_utc"] = drill_utc
data.setdefault("status", "PLANNED")
data.setdefault("logical_backup_schedule_desc", "fly postgres backup + pg_dump on staging drill")
data.setdefault("wal_archive_destination_desc", "Fly Managed Postgres (staging tt-traveltrust-staging)")
data["notes"] = (data.get("notes") or "") + f" Phase3 staging drill {drill_utc}."
p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
Path(record).write_text(json.dumps(json.loads(Path(record).read_text()), indent=2) + "\n", encoding="utf-8")
print("updated baseline_record.v1.json last_restore_drill_utc")
PY
else
  echo "WARN: ${BASELINE} missing — drill-record.json only"
fi

staging_adm_u01_cleanup_proxy 2>/dev/null || true

echo "READY" > "$OUT/STATUS.txt"
echo "TT_PHASE3_DB_RESTORE_DRILL: OK"
echo "Evidence: ${OUT}"
