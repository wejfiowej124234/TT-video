#!/usr/bin/env bash
# RPO / RTO baseline verification（PI3-001 Execution · static + B-475 fields）
#
#   bash scripts/dev/verify-pi3-001-rpo-rto-baseline.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASELINE="$ROOT/evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json"
MATRIX="$ROOT/docs/runbook/PRODUCTION-DB-BACKUP-RPO-RTO-MATRIX-SEPOLIA-SCOPE.md"

pass=0
fail_n=0
warn_n=0
pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }
section() { echo ""; echo "=== $* ==="; }

section "1 · B-475 baseline record"
[[ -f "$BASELINE" ]] && pass "baseline_record.v1.json present" || fail "missing baseline_record.v1.json"

python "$ROOT/scripts/gates/check-b475-pg-backup-pitr-baseline-record.py" >/dev/null 2>&1 \
  && pass "B-475 shape gate OK" || fail "B-475 shape gate FAIL"

b475_st="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('status',''))" "$BASELINE")"
pass "B-475 status=${b475_st}"

for k in wal_archive_destination_desc logical_backup_schedule_desc last_restore_drill_utc; do
  v="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get(sys.argv[2],''))" "$BASELINE" "$k")"
  [[ -n "$v" ]] && pass "baseline ${k} set" || warn "baseline ${k} empty"
done

section "2 · RPO / RTO matrix (148 Sepolia scope)"
[[ -f "$MATRIX" ]] && pass "PRODUCTION-DB-BACKUP-RPO-RTO-MATRIX present" || fail "missing RPO/RTO matrix"
rg -q 'PRODUCTION_SCOPE_SEPOLIA' "$MATRIX" && pass "148 Sepolia scope locked" || fail "matrix missing Sepolia scope"
rg -q 'RPO' "$MATRIX" && pass "RPO documented" || fail "RPO missing"
rg -q 'RTO' "$MATRIX" && pass "RTO documented" || fail "RTO missing"
rg -q 'tt-traveltrust-prod' "$MATRIX" && pass "prod PG app documented" || fail "prod PG app missing"

section "3 · Recovery drill scripts"
for s in run-phase3-db-restore-drill-staging.sh run-phase3-db-restore-drill-prod.sh; do
  [[ -f "$ROOT/scripts/dev/$s" ]] && pass "scripts/dev/$s" || fail "missing $s"
done

section "4 · Evidence chain"
latest_staging="$(ls -d "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep"/db-restore-drill-* 2>/dev/null | sort | tail -1 || true)"
if [[ -n "$latest_staging" && -f "${latest_staging}/STATUS.txt" ]]; then
  st="$(cat "${latest_staging}/STATUS.txt")"
  [[ "$st" == "READY" ]] && pass "staging drill evidence READY (${latest_staging##*/})" || warn "staging drill STATUS=${st}"
else
  warn "no staging db-restore-drill evidence"
fi

latest_prod="$(ls -d "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep"/prod-db-restore-drill-* 2>/dev/null | sort | tail -1 || true)"
if [[ -n "$latest_prod" && -f "${latest_prod}/STATUS.txt" ]]; then
  st="$(cat "${latest_prod}/STATUS.txt")"
  [[ "$st" == "READY" ]] && pass "prod drill evidence READY (${latest_prod##*/})" || warn "prod drill STATUS=${st}"
else
  if [[ "$b475_st" == "PASS" ]]; then
    fail "B-475 PASS but no prod-db-restore-drill evidence"
  else
    warn "no prod-db-restore-drill evidence (expected until Owner runs prod drill)"
  fi
fi

section "5 · RPO/RTO live satisfaction (derived)"
if [[ "$b475_st" == "PASS" ]]; then
  pass "B-475 PASS → RPO/RTO targets met per matrix §6"
else
  warn "B-475 ${b475_st} → RPO/RTO not satisfied for Production GO"
fi

echo ""
echo "verify-pi3-001-rpo-rto-baseline: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
[[ "$fail_n" -eq 0 ]] || exit 2
