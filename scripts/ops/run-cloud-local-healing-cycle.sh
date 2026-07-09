#!/usr/bin/env bash
# Cloud-to-Local AI Self-Healing CI · 闭环编排
#
#   bash scripts/ops/run-cloud-local-healing-cycle.sh --phase detect
#   bash scripts/ops/run-cloud-local-healing-cycle.sh --phase execute --proposal evidence/.../FIX-PROPOSAL.json
#   bash scripts/ops/run-cloud-local-healing-cycle.sh --phase validate --with-parity
#   bash scripts/ops/run-cloud-local-healing-cycle.sh --phase recheck
#   bash scripts/ops/run-cloud-local-healing-cycle.sh --ci-local-smoke
#
# SSOT: docs/runbook/TT-CLOUD-LOCAL-AI-SELF-HEALING-CI.md
# 末行: TT_CLOUD_LOCAL_HEALING_CYCLE: PASS|FAIL|INFLIGHT
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/CLOUD_LOCAL_HEALING_CI/cycles/$STAMP"
PHASE=""
PROPOSAL=""
WITH_PARITY=0
CI_SMOKE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --phase) PHASE="$2"; shift 2 ;;
    --proposal) PROPOSAL="$2"; shift 2 ;;
    --with-parity) WITH_PARITY=1; shift ;;
    --ci-local-smoke) CI_SMOKE=1; shift ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$EVID"
H="$ROOT/scripts/ops/cloud-local-healing"
rc=0

if [[ "$CI_SMOKE" == "1" ]]; then
  bash "$H/cloud-detect-and-report.sh" >>"$EVID/smoke.log" 2>&1 || true
  P2FC_SOAK_DIR=evidence/P2FC_SOAK_72H_STAGING bash scripts/ops/p2fc-soak-attest.sh >>"$EVID/smoke.log" 2>&1 || true
  echo "TT_CLOUD_LOCAL_HEALING_CYCLE: PASS mode=ci-local-smoke evidence=$EVID"
  exit 0
fi

case "$PHASE" in
  detect)
    bash "$H/cloud-detect-and-report.sh" 2>&1 | tee "$EVID/detect.log" || rc=2
    ;;
  execute)
    [[ -n "$PROPOSAL" ]] || { echo "TT_CLOUD_LOCAL_HEALING_CYCLE: FAIL missing --proposal" >&2; exit 2; }
    FIX_PROPOSAL_PATH="$PROPOSAL" bash "$H/local-fix-executor.sh" --execute 2>&1 | tee "$EVID/execute.log" || rc=2
    ;;
  validate)
    args=()
    [[ "$WITH_PARITY" == "1" ]] && args+=(--with-parity)
    bash "$H/testnet-sync-validator.sh" "${args[@]}" 2>&1 | tee "$EVID/validate.log" || rc=2
    ;;
  recheck)
    bash "$H/cloud-recheck.sh" 2>&1 | tee "$EVID/recheck.log" || rc=2
    ;;
  full)
    bash "$H/cloud-detect-and-report.sh" >>"$EVID/full.log" 2>&1 || rc=2
    [[ -n "$PROPOSAL" ]] && FIX_PROPOSAL_PATH="$PROPOSAL" bash "$H/local-fix-executor.sh" --execute >>"$EVID/full.log" 2>&1 || true
    bash "$H/testnet-sync-validator.sh" --with-parity >>"$EVID/full.log" 2>&1 || rc=2
    bash "$H/cloud-recheck.sh" >>"$EVID/full.log" 2>&1 || rc=2
    ;;
  *)
    echo "TT_CLOUD_LOCAL_HEALING_CYCLE: FAIL unknown --phase (detect|execute|validate|recheck|full)" >&2
    exit 2
    ;;
esac

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.cloud_local_healing_cycle.v1',
  stamp:process.argv[2],
  phase:process.argv[3]||'ci-smoke',
  rc:Number(process.argv[4]),
  ssot:'docs/runbook/TT-CLOUD-LOCAL-AI-SELF-HEALING-CI.md'
},null,2)+'\n');
" "$EVID/CYCLE-MANIFEST.json" "$STAMP" "$PHASE" "$rc"

[[ "$rc" -eq 0 ]] && { echo "TT_CLOUD_LOCAL_HEALING_CYCLE: PASS phase=${PHASE:-smoke} evidence=$EVID"; exit 0; }
[[ "$rc" -eq 2 && "$PHASE" == "recheck" ]] && { echo "TT_CLOUD_LOCAL_HEALING_CYCLE: INFLIGHT phase=recheck evidence=$EVID"; exit 2; }
echo "TT_CLOUD_LOCAL_HEALING_CYCLE: FAIL phase=$PHASE evidence=$EVID"
exit 2
