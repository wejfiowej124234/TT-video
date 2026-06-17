#!/usr/bin/env bash
# P2FC · Phase ② full coverage validation（graduation-aligned · ② only · ≠ ③ GO）
#
# 历史 33-track harness 已收敛至 graduation SSOT；本脚本提供稳定入口：
#   S01 soak attestation · graduation status ·（soak 完成后）governance audit
#
#   bash scripts/ops/phase2-full-coverage-validation.sh
#   bash scripts/ops/phase2-full-coverage-validation.sh --audit-only
#
# 末行：TT_PHASE2_FULL_COVERAGE: GO|FAIL · TT_P2FC_S01_SOAK: GO|INFLIGHT|MISSING
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
AUDIT_ONLY=0
for arg in "$@"; do
  [[ "$arg" == "--audit-only" ]] && AUDIT_ONLY=1
done

FREEZE_SHA="$(phase2_resolve_baseline_ssot_sha "$ROOT")"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${P2FC_DIR:-$ROOT/evidence/PHASE2_FULL_COVERAGE/full-${STAMP}}"
mkdir -p "$EVID"

soak_line=""
soak_rc=0
soak_line="$(P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" 2>/dev/null)" || soak_rc=$?
soak_verdict="MISSING"
if [[ "$soak_rc" -eq 0 ]]; then
  soak_verdict="GO"
elif [[ "$soak_rc" -eq 2 ]]; then
  soak_verdict="INFLIGHT"
fi

echo "TT_P2FC_FULL_COVERAGE: START ${STAMP}"
echo "  freeze_sha=${FREEZE_SHA}"
echo "  soak_dir=${SOAK_DIR}"
echo "  soak_attest=${soak_line:-MISSING} (rc=${soak_rc})"

bash "$ROOT/scripts/dev/run-phase2-graduation-closure-program.sh" --status \
  | tee "$EVID/graduation-status.log" || true

tn010_json="$(node "$ROOT/scripts/dev/lib/tn-p1-010-graduation-gate.mjs" \
  --root "$ROOT" --freeze-sha "$FREEZE_SHA" --soak-dir "$SOAK_DIR" --status-only 2>/dev/null || echo '{"pass":false}')"
echo "$tn010_json" >"$EVID/tn-p1-010-graduation-gate.json"

if [[ "$AUDIT_ONLY" -eq 0 && "$soak_verdict" == "GO" ]]; then
  echo ""
  echo "== post-soak governance audit =="
  bash "$ROOT/scripts/dev/run-phase2-testnet-closure-governance-audit.sh" \
    2>&1 | tee "$EVID/governance-audit.log" || true
fi

node -e "
const fs=require('fs');
const soak=process.argv[1];
const tn=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const out={
  schema:'phase2_full_coverage_validation.v1',
  stamp:process.argv[3],
  phase:'②',
  p2fc_s01_soak:soak,
  tn_p1_010_graduation_pass:!!tn.pass,
  tn_p1_010_note:tn.note||'',
  ssot:'run-phase2-graduation-closure-program.sh',
  honest_boundary:'P2FC 33-track legacy orchestrator superseded · ≠ Production GO'
};
fs.writeFileSync(process.argv[4], JSON.stringify(out,null,2)+'\n');
const go = soak==='GO' && tn.pass;
console.log('TT_P2FC_S01_SOAK: '+soak);
console.log('TT_PHASE2_FULL_COVERAGE: '+(go?'GO':'FAIL'));
process.exit(go?0:2);
" "$soak_verdict" "$EVID/tn-p1-010-graduation-gate.json" "$STAMP" "$EVID/full_coverage_manifest.v1.json"
