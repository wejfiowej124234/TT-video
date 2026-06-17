#!/usr/bin/env bash
# Enable Fly managed PG backups（PI3-001 · Owner action · no product code）
#
#   bash scripts/dev/enable-fly-pg-backup.sh tt-traveltrust-prod
#   bash scripts/dev/enable-fly-pg-backup.sh tt-traveltrust-staging
set -euo pipefail

APP="${1:-tt-traveltrust-prod}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="${PI3_001_BACKUP_ENABLE_EVIDENCE:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/fly-pg-backup-enable-${APP}-${STAMP}}"

command -v fly >/dev/null 2>&1 || { echo "fly CLI missing" >&2; exit 2; }
fly auth whoami >/dev/null 2>&1 || { echo "fly not authenticated" >&2; exit 2; }

mkdir -p "$OUT"
exec > >(tee -a "$OUT/enable.log") 2>&1

echo "== enable Fly PG backup · app=${APP} · ${STAMP} =="

echo "--- fly pg backup enable ---"
fly pg backup enable -a "$APP" 2>&1 | tee "$OUT/fly-backup-enable.txt"

echo "--- fly postgres backup create ---"
fly postgres backup create -a "$APP" 2>&1 | tee "$OUT/fly-backup-create.txt"

echo "--- fly postgres backup list ---"
fly postgres backup list -a "$APP" 2>&1 | tee "$OUT/fly-backup-list.txt"

if grep -qiE "not enabled|no backups|Could not find|Error" "$OUT/fly-backup-list.txt"; then
  echo "TT_FLY_PG_BACKUP_ENABLE: FAIL" >&2
  exit 2
fi

echo "READY" >"$OUT/STATUS.txt"
echo "TT_FLY_PG_BACKUP_ENABLE: OK"
echo "Evidence: ${OUT}"
