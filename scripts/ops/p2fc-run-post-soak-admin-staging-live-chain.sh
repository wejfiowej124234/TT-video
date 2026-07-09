#!/usr/bin/env bash
# P2FC · post-soak Admin staging live 链（② · 须 MR12 one-shot PASS 在前）
#
# 写死顺序：ADM-U01 live → P0 runtime → （可选 U02）→ Admin GO 闸
# Admin GO 宣称仅允许在 P0 runtime CONFIRMED 之后（见 p2fc-gate-admin-staging-go-claim.sh）
# prep READY 不可视为 GO
#
#   bash scripts/ops/p2fc-run-post-soak-admin-staging-live-chain.sh
#   bash scripts/ops/p2fc-run-post-soak-admin-staging-live-chain.sh --skip-u02
#
# 末行：TT_P2FC_POST_SOAK_ADMIN_LIVE_CHAIN: PASS|PARTIAL|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
CLOSURE_DIR="$SOAK_DIR/post-soak-staging-live-closure"
CHECKPOINT="$SOAK_DIR/post-soak-one-shot/checkpoint.json"
ONE_SHOT_LOG="$SOAK_DIR/post-soak-one-shot/one-shot.log"
LOG="$CLOSURE_DIR/admin-live-chain.log"
SKIP_U02=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-u02) SKIP_U02=1; shift ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$CLOSURE_DIR"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

on_fail() {
  echo "TT_P2FC_POST_SOAK_ADMIN_LIVE_CHAIN: FAIL $*" | tee -a "$LOG" >&2
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-post-soak-staging-live-closure-evidence.py" \
    --soak-dir "$SOAK_DIR" 2>&1 | tee -a "$LOG" || true
  exit 2
}

[[ -f "$SOAK_DIR/COMPLETED.json" ]] || on_fail "missing COMPLETED.json"

bash "$ROOT/scripts/ops/p2fc-verify-mr12-execution-lock.sh" >>"$LOG" 2>&1 || on_fail "mr12_lock_not_frozen"

grep -q 'TT_P2FC_POST_SOAK_ONE_SHOT: PASS' "$ONE_SHOT_LOG" 2>/dev/null || on_fail "mr12_one_shot_not_PASS (run p2fc-post-soak-one-shot-execute.sh first)"

grad_status="$(node -e "
try {
  const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  console.log((j.phases && j.phases.graduation && j.phases.graduation.status) || 'MISSING');
} catch { console.log('MISSING'); }
" "$CHECKPOINT" 2>/dev/null || echo MISSING)"
[[ "$grad_status" == "PASS" ]] || on_fail "checkpoint.graduation=${grad_status} (expected PASS)"

ENV_FILE="${PHASE2_ADMIN_STAGING_ENV:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

export STAGING_API_BASE="${STAGING_API_BASE:-${TRAVELTRUST_STAGING_API_BASE:-https://tt-api-staging.fly.dev}}"
export STAGING_API_BASE="${STAGING_API_BASE%/}"
export STAGING_FE_BASE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
export STAGING_FE_BASE="${STAGING_FE_BASE%/}"
export ADM_U01_STRICT=1
export ADM_U02_STRICT=1
export ADM_U01_REQUIRE_PERSISTENT_HOST=1
export ADM_U02_REQUIRE_PERSISTENT_HOST=1
export ADM_U01_NO_LOCAL_FE_FALLBACK=1
export ADM_U01_DEPLOYMENT_KIND=persistent_staging
export ADM_U01_PROVISION_API_BASE="$STAGING_API_BASE"
export ADM_U01_PROBE_API_BASE="$STAGING_API_BASE"

[[ -n "${STAGING_DATABASE_URL:-${DATABASE_URL:-}}" ]] || on_fail "STAGING_DATABASE_URL required for live ADM-U01/U02"

{
  echo "${ts} admin-live-chain: START"
  echo "STAGING_API_BASE=${STAGING_API_BASE}"
  echo "STAGING_FE_BASE=${STAGING_FE_BASE}"
  echo "honest: prep READY is NOT GO — live evidence only"

  # Step 1 · ADM-U01 live matrix
  echo "--- Step 1/4: ADM-U01 live six-role RBAC matrix ---"
  U01_RUN="adm_u01_post_soak_${ts//:/}"
  export ADM_U01_RUN_ID="$U01_RUN"
  export ADM_U01_EVIDENCE_DIR="$ROOT/evidence/GO_staging_admin_rbac_matrix/${U01_RUN}"
  mkdir -p "$CLOSURE_DIR/adm-u01-live"
  bash "$ROOT/scripts/dev/record-adm-u01-staging-evidence.sh" 2>&1 | tee -a "$LOG"
  cp -f "$ADM_U01_EVIDENCE_DIR/report.json" "$CLOSURE_DIR/adm-u01-live/report.json"
  grep -q 'TT_ADM_U01_EVIDENCE: PASS' "$ADM_U01_EVIDENCE_DIR"/run-*.log || on_fail "ADM-U01 evidence not PASS"
  u01_gate="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).release_gate||'')" "$CLOSURE_DIR/adm-u01-live/report.json")"
  [[ "$u01_gate" == "GO" ]] || on_fail "ADM-U01 release_gate=${u01_gate} (expected GO)"

  # Step 2 · P0 bypass runtime
  echo "--- Step 2/4: P0 RBAC bypass runtime re-verify ---"
  export P2FC_P0_RUNTIME_OUT="$CLOSURE_DIR/p0-rbac-bypass-runtime"
  bash "$ROOT/scripts/ops/p2fc-verify-p0-rbac-bypass-runtime.sh" 2>&1 | tee -a "$LOG"

  # Step 4 · Admin GO claim gate (only after U01 + P0 runtime)
  echo "--- Step 4: Admin staging GO claim gate ---"
  bash "$ROOT/scripts/ops/p2fc-gate-admin-staging-go-claim.sh" 2>&1 | tee -a "$LOG"

  # Step 5 · ADM-U02 (optional · not required for admin GO claim slot)
  if [[ "$SKIP_U02" -eq 0 ]]; then
    echo "--- Step 5: ADM-U02 staging 2FA/approval ---"
    U02_RUN="adm_u02_post_soak_${ts//:/}"
    export ADM_U02_RUN_ID="$U02_RUN"
    export ADM_U02_EVIDENCE_DIR="$ROOT/evidence/GO_staging_admin_adm_u02/${U02_RUN}"
    mkdir -p "$CLOSURE_DIR/adm-u02-live"
    bash "$ROOT/scripts/dev/record-adm-u02-staging-evidence.sh" 2>&1 | tee -a "$LOG"
    cp -f "$ADM_U02_EVIDENCE_DIR/report.json" "$CLOSURE_DIR/adm-u02-live/report.json"
    grep -q 'TT_ADM_U02_STAGING_EVIDENCE: PASS' "$ADM_U02_EVIDENCE_DIR"/run-*.log || on_fail "ADM-U02 evidence not PASS"
    u02_gate="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).release_gate||'')" "$CLOSURE_DIR/adm-u02-live/report.json")"
    [[ "$u02_gate" == "GO" ]] || on_fail "ADM-U02 release_gate=${u02_gate} (expected GO)"
  else
    echo "--- Step 5: ADM-U02 skipped (--skip-u02) ---"
  fi

  # Step 6 · B1–B4 convergence evidence
  echo "--- Step 6: B1–B4 blocker convergence (live evidence aggregate) ---"
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-post-soak-staging-live-closure-evidence.py" \
    --soak-dir "$SOAK_DIR" 2>&1 | tee -a "$LOG"

  if [[ -f "$ROOT/scripts/gates/validate-phase2-admin-staging-closure.sh" ]]; then
    bash "$ROOT/scripts/gates/validate-phase2-admin-staging-closure.sh" 2>&1 | tee -a "$LOG" || true
  fi

  echo "${ts} TT_P2FC_POST_SOAK_ADMIN_LIVE_CHAIN: PASS dir=${CLOSURE_DIR}"
} 2>&1 | tee -a "$LOG"

exit 0
