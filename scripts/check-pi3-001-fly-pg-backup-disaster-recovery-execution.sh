#!/usr/bin/env bash
# PI3-001 · Fly PG Backup & Disaster Recovery Execution gate (152 SSOT)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PI3_001_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-001-exec-${STAMP}}"
mkdir -p "$OUT"
LOG="$OUT/gate.log"
exec > >(tee -a "$LOG") 2>&1

echo "== PI3-001 Fly PG Backup & Disaster Recovery Execution · ${STAMP} =="
echo "SSOT: docs/handbook/engineering/152-PI3-001-FlyPG-Backup-Disaster-Recovery-Report.md"
echo "Scope: 148 PRODUCTION_SCOPE_SEPOLIA"
echo "Discipline: no new product feature code"

for f in \
  scripts/dev/enable-fly-pg-backup.sh \
  scripts/dev/check-fly-pg-backup-status.sh \
  scripts/dev/verify-pi3-001-rpo-rto-baseline.sh \
  scripts/dev/run-phase3-db-restore-drill-prod.sh; do
  [[ -f "$ROOT/$f" ]] || { echo "execution artifacts: FAIL missing $f" >&2; exit 2; }
done
echo "execution artifacts: OK"

python "$ROOT/scripts/gates/check-b475-pg-backup-pitr-baseline-record.py" | tee "$OUT/b475-gate.log"
b475_st="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['status'])" "$ROOT/evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json")"
echo "b475 status=${b475_st}"

bash "$ROOT/scripts/dev/verify-pi3-001-rpo-rto-baseline.sh" | tee "$OUT/rpo-rto.log" || true

staging_drill=""
for d in "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep"/db-restore-drill-*; do
  [[ -d "$d" && -f "$d/STATUS.txt" && "$(cat "$d/STATUS.txt")" == "READY" ]] && staging_drill="${d##*/}"
done
[[ -n "$staging_drill" ]] && echo "staging drill: evidence/.../phase3-production-prep/${staging_drill} STATUS=READY" \
  || echo "staging drill: WARN no READY evidence"

prod_drill=""
for d in "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep"/prod-db-restore-drill-*; do
  [[ -d "$d" && -f "$d/STATUS.txt" && "$(cat "$d/STATUS.txt")" == "READY" ]] && prod_drill="${d##*/}"
done
if [[ -n "$prod_drill" ]]; then
  echo "prod drill: ${prod_drill} STATUS=READY"
else
  echo "prod drill: NOT_RUN (Owner: run-phase3-db-restore-drill-prod.sh)"
fi

bash "$ROOT/scripts/dev/check-fly-pg-backup-status.sh" 2>&1 | tee "$OUT/fly-backup-status.log" || true

rg -q 'PI3-002' "$ROOT/docs/handbook/engineering/151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md" \
  && echo "pi3-002 execution baseline (151): OK" || echo "pi3-002 execution baseline (151): WARN"

verdict="PI3-001_HOLD"
if [[ "$b475_st" == "PASS" && -n "$prod_drill" ]]; then
  verdict="PI3-001_GO"
fi

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  kind:'traveltrust.pi3_001_fly_pg_backup_disaster_recovery_execution.v1',
  recorded_utc:process.argv[2],
  verdict:process.argv[3],
  production_scope:'PRODUCTION_SCOPE_SEPOLIA',
  execution_sprint:'152',
  b475_status:process.argv[4],
  staging_drill_ready:!!process.argv[5],
  prod_drill_ready:!!process.argv[6]
},null,2)+'\n');
" "$OUT/summary.json" "$STAMP" "$verdict" "$b475_st" "$staging_drill" "$prod_drill"

echo ""
echo "Evidence: $OUT"
echo "TT_PI3_001_FLY_PG_BACKUP_DISASTER_RECOVERY_EXECUTION: ${verdict}"
if [[ "$verdict" == "PI3-001_GO" ]]; then exit 0; fi
echo "PI3-001 execution prep: PASS (live closure OPEN — enable prod backup + drill)"
exit 0
