#!/usr/bin/env bash
# Phase ③ · Production Preparation · P0 编排（Merchant + DB + Rollback）
#
#   export HTTPS_PROXY=http://127.0.0.1:15715  # 若需
#   fly auth whoami
#   bash scripts/dev/run-phase3-production-prep-p0.sh
#
# 前置：PHASE3_ENTRY_GATE: READY · 代码/UI/DB/RBAC 冻结
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/p0-chain-${STAMP}"
mkdir -p "$OUT"
export PHASE3_EVIDENCE_DIR="$OUT"
LOG="$OUT/p0-chain.log"
exec > >(tee -a "$LOG") 2>&1

fail() {
  echo "TT_PHASE3_PRODUCTION_PREP_P0: FAIL $*" >&2
  exit 2
}

echo "== phase3 production prep P0 · ${STAMP} =="
echo "SSOT: docs/runbook/PHASE3-PRODUCTION-PREPARATION.md"

grep -q 'PHASE3_ENTRY_GATE: READY' \
  "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/PHASE3-OWNER-SIGNOFF-SEBASTIAN-WARD-20260607.md" \
  2>/dev/null || fail "Owner sign-off / PHASE3_ENTRY_GATE READY not found"

echo ""
echo "=== P0-1 Merchant closure ==="
bash "$ROOT/scripts/dev/smoke-provider-onboarding-staging.sh" || fail "merchant closure"

echo ""
echo "=== P0-2 DB restore drill ==="
bash "$ROOT/scripts/dev/run-phase3-db-restore-drill-staging.sh" || fail "db restore drill"

echo ""
echo "=== P0-3 Release rollback drill ==="
bash "$ROOT/scripts/dev/run-phase3-fly-release-rollback-drill.sh" || fail "rollback drill"

cat > "$OUT/STATUS.txt" <<EOF
TT_PHASE3_PRODUCTION_PREP_P0: OK
at=${STAMP}
merchant: OK
db_drill: OK
rollback_drill: OK
EOF

echo ""
echo "TT_PHASE3_PRODUCTION_PREP_P0: OK"
echo "Evidence: ${OUT}"
