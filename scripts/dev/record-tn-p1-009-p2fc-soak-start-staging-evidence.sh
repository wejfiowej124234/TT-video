#!/usr/bin/env bash
# TN-P1-009 · P2FC 72h soak START 证据（② · 仅记录 · 不关闭 TN-P1-009）
#
# 前置：TN-P1-010 等 staging 配置稳定后执行 testnet-staging-freeze-for-soak.sh
# 完成判据：evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json + p2fc-soak-attest.sh
#
#   bash scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-009-soak-start-${STAMP}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
export STAGING_API_BASE="$STAGING_API"
export P2FC_SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_009_P2FC_SOAK_START_EVIDENCE: START ${STAMP}"

FREEZE="$ROOT/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"
if [[ ! -f "$FREEZE" ]]; then
  echo "== staging freeze marker (soak policy) =="
  bash "$ROOT/scripts/ops/testnet-staging-freeze-for-soak.sh" | tee "$EVID/freeze.log"
fi
cp "$FREEZE" "$EVID/staging-freeze-active.json"

if [[ -f "$P2FC_SOAK_DIR/COMPLETED.json" ]]; then
  echo "TN-P1-009: soak already COMPLETED at $P2FC_SOAK_DIR/COMPLETED.json"
  cp "$P2FC_SOAK_DIR/COMPLETED.json" "$EVID/soak-completed.json"
  echo "TT_TN_P1_009_P2FC_SOAK_START_EVIDENCE: ALREADY_COMPLETE ${STAMP}"
  exit 0
fi

echo ""
echo "== launch 72h soak (background) =="
bash "$ROOT/scripts/ops/p2fc-launch-staging-soak-72h.sh" 2>&1 | tee "$EVID/launch.log"

JOB_DIR="$(ls -dt "$P2FC_SOAK_DIR"/job-* 2>/dev/null | head -1 || true)"
[[ -n "$JOB_DIR" ]] || { echo "FAIL: no soak job dir under $P2FC_SOAK_DIR" >&2; exit 2; }
cp "$JOB_DIR/job.json" "$EVID/soak-job.json" 2>/dev/null || true

node -e "
const fs=require('fs');
const summary={
  schema:'tn_p1_009_p2fc_soak_start.v1',
  stamp:process.argv[1],
  phase:'② testnet',
  status:'INFLIGHT',
  soak_dir:process.argv[2],
  job_dir:process.argv[3]||null,
  required_sec:259200,
  honest_boundary:'72h wall-clock soak in flight · TN-P1-009 stays OPEN until COMPLETED.json · no new product features during soak'
};
fs.writeFileSync(process.argv[4], JSON.stringify(summary,null,2)+'\n');
" "$STAMP" "$P2FC_SOAK_DIR" "${JOB_DIR:-}" "$EVID/report.json"

cat >"$EVID/STATUS.txt" <<EOF
status: INFLIGHT
phase: ②
artifact: TN-P1-009 P2FC 72h soak START
at: ${STAMP}
close_when: evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json
EOF

echo ""
echo "TT_TN_P1_009_P2FC_SOAK_START_EVIDENCE: RECORDED ${STAMP}"
echo "evidence: ${EVID}"
echo "soak_job: ${JOB_DIR:-unknown}"
