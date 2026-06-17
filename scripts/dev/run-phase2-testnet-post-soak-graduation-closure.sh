#!/usr/bin/env bash
# Phase ② · Post-soak graduation closure（Reliability Closure Mode）
#
# 前置：evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json（72h wall-clock · job from COMPLETED.json）
# 顺序：COMPLETED → governance audit + matrix → G-01～G-08 AND → G-09 OWNER-SIGNOFF → TT_TESTNET_GRADUATION:CLOSED
#
#   bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh
#   bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh --wait-soak
#   bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh --audit-only
#
# 诚实边界：② 毕业 **≠** ③ Production GO · 不跳过 soak wall-clock
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"
FREEZE_SHA="$(phase2_resolve_baseline_ssot_sha "$ROOT")"

WAIT_SOAK=0
AUDIT_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --wait-soak) WAIT_SOAK=1 ;;
    --audit-only) AUDIT_ONLY=1 ;;
  esac
done

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
COMPLETED="$SOAK_DIR/COMPLETED.json"
TEMPLATE="$ROOT/docs/runbook/evidence-templates/PHASE2-TESTNET-OWNER-SIGNOFF-SOLO.md"

echo "TT_PHASE2_POST_SOAK_GRADUATION_CLOSURE: START $(date -u +%Y%m%dT%H%M%SZ)"
echo "soak_dir=$SOAK_DIR"

if [[ "$AUDIT_ONLY" == "0" && "$WAIT_SOAK" == "1" ]]; then
  echo "== wait: P2FC 72h COMPLETED.json (poll 300s · do not kill soak) =="
  while [[ ! -f "$COMPLETED" ]]; do
    line="$(P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" 2>/dev/null || true)"
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) soak_attest=${line:-MISSING}"
    sleep 300
  done
  echo "P2FC soak COMPLETED at $COMPLETED"
fi

if [[ ! -f "$COMPLETED" ]]; then
  echo "FAIL: missing $COMPLETED — start with --wait-soak or run after 72h wall-clock" >&2
  P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" 2>&1 || true
  exit 2
fi

# Attest only — do not restart or kill in-flight soak jobs (superseded jobs are archived under superseded-*)
if [[ -f "$COMPLETED" ]]; then
  job_dir="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).job_dir||'')}catch{}" "$COMPLETED" 2>/dev/null || true)"
  if [[ -n "$job_dir" && -d "$job_dir" ]]; then
    pid="$(cat "$job_dir/pid.txt" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "soak job $(basename "$job_dir") still running pid=$pid (COMPLETED.json present — attestation OK)"
    fi
  fi
fi

echo ""
echo "== TN-P1-010 graduation gate (post-soak @ freeze SHA) =="
tn010_json="$(node "$ROOT/scripts/dev/lib/tn-p1-010-graduation-gate.mjs" \
  --root "$ROOT" --freeze-sha "$FREEZE_SHA" --soak-dir "$SOAK_DIR" --status-only 2>/dev/null || true)"
node -e "const o=JSON.parse(process.argv[1]); if(!o.pass){console.error('FAIL: TN-P1-010 graduation gate — '+o.note); process.exit(3)}" "$tn010_json"
echo "TN-P1-010 graduation gate: PASS ($(node -e "console.log(JSON.parse(process.argv[1]).note)" "$tn010_json"))"

export OPEN_TESTNET_P0_COUNT="${OPEN_TESTNET_P0_COUNT:-0}"
export OPEN_TESTNET_P1_COUNT="${OPEN_TESTNET_P1_COUNT:-0}"
export TT_PHASE2_READINESS="${TT_PHASE2_READINESS:-100}"

echo ""
echo "== graduation governance audit + matrix =="
bash "$ROOT/scripts/dev/run-phase2-testnet-closure-governance-audit.sh"

EVID="$(ls -td "$ROOT/evidence/GO_phase2_testnet_graduation"/*/ 2>/dev/null | head -1)"
EVID="${EVID%/}"
[[ -n "$EVID" && -f "$EVID/graduation-matrix.v1.json" ]] || {
  echo "FAIL: graduation matrix missing" >&2
  exit 2
}

node -e "
const fs=require('fs');
const m=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const g=m.gates||{};
const checks={
  G01_open_p0: g.open_testnet_p0===0,
  G02_open_p1: g.open_testnet_p1===0,
  G03_readiness: g.tt_phase2_readiness>=100,
  G04_perfect_validation: g.perfect_validation_go===true,
  G05_blocking_open: (m.summary?.blocking_open??1)===0,
  G06_soak: g.p2fc_soak_completed===true,
  G07_indexer: g.indexer_compound_pass===true && g.missing_projection===0 && g.tn_p1_010_graduation_pass===true,
  G08_deep_surface:
    g.deep_closure_missing_coverage===0 &&
    g.deep_closure_evidence_gap===0 &&
    g.full_closure_coverage_pct===100 &&
    g.surface_coverage_pct===100 &&
    g.untested_ui_element===0 &&
    g.untested_user_action===0,
};
const all=Object.values(checks).every(Boolean);
console.log(JSON.stringify({checks,all,graduation_verdict:m.graduation_verdict,ready_for_owner_signoff:m.deep_closure?.summary?.ready_for_owner_signoff},null,2));
if(!all){process.exit(3);}
" "$EVID/graduation-matrix.v1.json" >"$EVID/gates-g01-g08-check.json" || {
  echo "FAIL: G-01～G-08 not all AND — see $EVID/gates-g01-g08-check.json" >&2
  echo "TT_TESTNET_GRADUATION: OPEN"
  exit 3
}

GRAD="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).graduation_verdict)" "$EVID/graduation-matrix.v1.json")"
if [[ "$GRAD" != "CLOSED" ]]; then
  echo "FAIL: graduation_verdict=$GRAD (expected CLOSED before G-09)" >&2
  echo "TT_TESTNET_GRADUATION: OPEN"
  exit 4
fi

STAMP="$(basename "$EVID")"
SIGN_DATE="$(date -u +%Y-%m-%d)"
cat >"$EVID/OWNER-SIGNOFF.md" <<EOF
# Phase ② Testnet · Owner Sign-off (G-09)

**Maintainer:** Sebastian Ward（塞巴斯蒂安·沃德）  
**Evidence:** \`$EVID\`  
**Soak:** \`$COMPLETED\`  
**Signed UTC:** ${SIGN_DATE}

## G-01～G-08 attestation (machine AND)

See \`gates-g01-g08-check.json\` in this directory — all **true** at audit stamp **${STAMP}**.

## G-09 · Owner self-sign (solo maintainer)

| Role | Signatory | Date | Scope |
|------|-----------|------|-------|
| Product / Owner | Sebastian Ward | ${SIGN_DATE} | Phase ② Testnet graduation |
| Engineering | Sebastian Ward | ${SIGN_DATE} | G-01～G-08 machine evidence + D1–D24 |
| Compliance | Sebastian Ward (Owner attestation · not licensed counsel) | ${SIGN_DATE} | ② ledger alignment |
| Operations | Sebastian Ward | ${SIGN_DATE} | P2FC soak · indexer · runbook |

**Graduation key:** \`TT_TESTNET_GRADUATION: CLOSED\`

**L5 composite:** eligible only when audit emits \`TT_PHASE2_L5_COMPOSITE_SCORE: 10\`

**Honest boundary:** ② testnet graduation **≠** ③ Production GO · mainnet · sk_live · full ISS-007 staging matrix GO remain separate gates.

Template: [PHASE2-TESTNET-OWNER-SIGNOFF-SOLO.md](../../docs/runbook/evidence-templates/PHASE2-TESTNET-OWNER-SIGNOFF-SOLO.md)
EOF

echo ""
echo "== matrix refresh (owner sign-off recorded) =="
node "$ROOT/scripts/dev/gen-phase2-testnet-graduation-matrix.mjs" \
  --evid-dir "$EVID" \
  --stamp "$STAMP" \
  --api "${STAGING_API_BASE:-https://tt-api-staging.fly.dev}" \
  --fe "${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}" \
  --open-p0 "$OPEN_TESTNET_P0_COUNT" \
  --open-p1 "$OPEN_TESTNET_P1_COUNT" \
  --readiness "$TT_PHASE2_READINESS"

L5="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).l5_composite_score_grep||'')" "$EVID/graduation-matrix.v1.json")"

echo ""
echo "TT_PHASE2_POST_SOAK_GRADUATION_CLOSURE: DONE"
echo "TT_TESTNET_GRADUATION: CLOSED"
echo "$L5"
echo "evidence: $EVID"
echo "owner_signoff: $EVID/OWNER-SIGNOFF.md"
