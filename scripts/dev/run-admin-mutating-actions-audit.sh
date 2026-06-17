#!/usr/bin/env bash
# Admin Mutating Actions Audit（② staging · 暂停新增功能 / Production GO）
#
#   bash scripts/dev/run-admin-mutating-actions-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${AMWA_OUT:-$ROOT/evidence/admin-mutating-actions-audit/${STAMP}}"
API="${AMWA_API_BASE:-${STAGING_API_BASE:-https://tt-api-staging.fly.dev}}"

mkdir -p "$OUT"
export AMWA_OUT="$OUT"
export AMWA_API_BASE="$API"
export AMWA_ADMIN_EMAIL="${AMWA_ADMIN_EMAIL:-${STAGING_AUDIT_EMAIL:-tourist@test.com}}"
export AMWA_PASSWORD="${AMWA_PASSWORD:-${STAGING_AUDIT_PASSWORD:-Test123!}}"

echo "== Admin Mutating Actions Audit · ${STAMP} =="
echo "api=${API} admin=${AMWA_ADMIN_EMAIL}"
echo "NOTE: 暂停新增功能 · 仅写链审计"

set +e
python "$ROOT/scripts/dev/admin-mutating-actions-audit.py" 2>&1 | tee "$OUT/probe.log"
PROBE_EXIT=$?
set -e

FINDINGS="$OUT/amwa-findings.json"

if [[ -f "$ROOT/scripts/gates/run-admin-rbac-staging-matrix.py" ]] && [[ "${AMWA_SKIP_RBAC_MATRIX:-}" != "1" ]]; then
  echo "amwa: ADM-U01 six-role write matrix …"
  export STAGING_API_BASE="$API"
  export ADM_U01_EVIDENCE_DIR="$OUT/adm-u01-write-matrix"
  mkdir -p "$ADM_U01_EVIDENCE_DIR"
  python "$ROOT/scripts/gates/run-admin-rbac-staging-matrix.py" 2>&1 | tee "$OUT/rbac-matrix.log" || true
fi

python "$ROOT/scripts/dev/generate-admin-mutating-audit-report.py" \
  --findings "$FINDINGS" \
  --out "$ROOT/docs/runbook/ADMIN-MUTATING-ACTIONS-AUDIT-REPORT.md"

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/admin-mutating-actions-audit/latest" 2>/dev/null || true

VERDICT="$(PYTHONIOENCODING=utf-8 python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['verdict'])" "$FINDINGS")"
echo "AMWA_ADMIN_MUTATING: $VERDICT"
echo "Report: docs/runbook/ADMIN-MUTATING-ACTIONS-AUDIT-REPORT.md"
echo "Evidence: $OUT"

[[ "$VERDICT" == "NO-GO" ]] && exit 1
[[ "$PROBE_EXIT" -ne 0 ]] && exit 1
exit 0
