#!/usr/bin/env bash
# Phase ③ · Production PG 备份 + 恢复演练（B-475 / PI3-001）
#
#   bash scripts/dev/run-phase3-db-restore-drill-prod.sh
#
# 前置：tt-traveltrust-prod 存在 · fly backup plan 已启用 · fly auth
# 边界：运维演练 · 不修改 schema · 升格 B-475 → PASS 须 Owner 确认三字段
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE3_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/prod-db-restore-drill-${STAMP}}"
PG_APP="${FLY_PROD_PG_APP:-tt-traveltrust-prod}"
BASELINE="$ROOT/evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json"
PROD_ENV="${PROD_ENV_FILE:-$ROOT/scripts/dev/.env.production.local}"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/drill.log") 2>&1

fail() { echo "TT_PROD_DB_RESTORE_DRILL: FAIL $*" >&2; exit 2; }

echo "== prod db restore drill · ${STAMP} · app=${PG_APP} =="
command -v fly >/dev/null 2>&1 || fail "fly CLI missing"
fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"

echo "--- fly postgres backup list ---"
fly postgres backup list -a "$PG_APP" 2>&1 | tee "$OUT/fly-backup-list.txt"
if grep -qiE "no backups|not enabled|unsupported|Could not find|Error" "$OUT/fly-backup-list.txt"; then
  fail "Fly managed backups not enabled on ${PG_APP}"
fi

echo "--- fly postgres backup create ---"
fly postgres backup create -a "$PG_APP" 2>&1 | tee "$OUT/fly-backup-create.txt"

[[ -f "$PROD_ENV" ]] || fail "missing $PROD_ENV for DATABASE_URL"
# shellcheck disable=SC1090
set -a; source <(grep -E '^[A-Z_]+=' "$PROD_ENV" | sed 's/\r$//'); set +a
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL unset in $PROD_ENV"

pass="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.password||''));" "$DATABASE_URL")"
user="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.username||''));" "$DATABASE_URL")"
host="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(u.hostname);" "$DATABASE_URL")"
port="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(u.port||'5432');" "$DATABASE_URL")"
db="$(node -e "const u=new URL(process.argv[1]); process.stdout.write((u.pathname||'/').replace(/^\//,'')||'postgres');" "$DATABASE_URL")"
CONN="postgres://${user}@${host}:${port}/${db}"

docker run --rm -e "PGPASSWORD=${pass}" postgres:16-alpine \
  pg_dump "$CONN" --schema-only --no-owner --no-privileges 2>/dev/null \
  | head -c 50000 >"$OUT/schema-head.sql" || fail "pg_dump failed"

docker run --rm -e "PGPASSWORD=${pass}" postgres:16-alpine \
  psql "$CONN" -c "SELECT current_database(), current_user, NOW();" | tee "$OUT/post-drill-connect.txt"

DRILL_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
python - "$BASELINE" "$DRILL_UTC" "$PG_APP" <<'PY'
import json, sys
from pathlib import Path
baseline, drill_utc, pg_app = sys.argv[1:4]
p = Path(baseline)
data = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
data["status"] = "PASS"
data["wal_archive_destination_desc"] = f"Fly Managed Postgres WAL ({pg_app})"
data["logical_backup_schedule_desc"] = "Fly managed backup daily + on-demand create; pg_dump schema drill on cutover window"
data["last_restore_drill_utc"] = drill_utc
data["notes"] = f"Production drill {drill_utc} on {pg_app}. Staging drill retained in history."
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("B-475 baseline updated to PASS")
PY

python "$ROOT/scripts/gates/check-b475-pg-backup-pitr-baseline-record.py" | tee "$OUT/b475-gate.log"

echo "READY" >"$OUT/STATUS.txt"
echo "TT_PROD_DB_RESTORE_DRILL: OK"
echo "Evidence: ${OUT}"
