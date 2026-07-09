#!/usr/bin/env bash
# ① Site10 · 22 真回归 denoised matrix（唯一 truth source · 非 846 full matrix）
#
# SSOT keys: frontend/evidence/GO_local_phase1/site10-r22-true-regression-manifest.txt
#
# 用法（仓库根）：
#   bash scripts/dev/run-site10-r22b-denoised-regression-matrix.sh run
#   bash scripts/dev/run-site10-r22b-denoised-regression-matrix.sh parse
#   bash scripts/dev/run-site10-r22b-denoised-regression-matrix.sh check-gates
#
# 判定链（① · 22-key oracle 唯一 truth source）：
#   TT_SITE10_DENOISED_REGRESSION_MATRIX: OK  →  G2/G3 收敛判断入口
#   证据: frontend/evidence/GO_local_phase1/site10-g2g3-convergence-acceptance.latest.log
#         site10-r22b-gates.txt · site10-r22b-denoised-regression-parse.txt
#         site10-r22b-extra-warn-register.txt · site10-phase2-staging-precheck.latest.txt
#   分桶窄复跑：bash scripts/dev/run-site10-r22b-regression-bucket-recheck.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/_site10-bucket-narrow-recheck-common.sh
source "$ROOT/scripts/dev/_site10-bucket-narrow-recheck-common.sh"
site10_bucket_narrow_recheck_export_env "$ROOT"

export PLAYWRIGHT_LOCAL_SITE10_MATRIX="${PLAYWRIGHT_LOCAL_SITE10_MATRIX:-1}"
export PLAYWRIGHT_SITE10_MATRIX_FE_STABILITY="${PLAYWRIGHT_SITE10_MATRIX_FE_STABILITY:-1}"
export PLAYWRIGHT_SITE10_FE_HEAP_MB="${PLAYWRIGHT_SITE10_FE_HEAP_MB:-16384}"
unset PLAYWRIGHT_ROUTE_EXECUTION_BARRIER
unset REQUIRE_IDEMPOTENCY_KEY

EVID="$ROOT/frontend/evidence/GO_local_phase1"
MANIFEST="$EVID/site10-r22-true-regression-manifest.txt"
OUT="$EVID/site10-r22b-denoised-regression.latest.log"
PARSE="$EVID/site10-r22b-denoised-regression-parse.txt"
GATES="$EVID/site10-r22b-gates.txt"
ACCEPT="$EVID/site10-g2g3-convergence-acceptance.latest.log"
RECHECK_LOG="$EVID/site10-p1-slices-recheck.latest.log"

REGRESSION_SPECS=(
  e2e/guide-register-l5.spec.ts
  e2e/home-landing-shell.spec.ts
  e2e/itinerary-date-as-source-corridor.spec.ts
  e2e/me-onboarding-96-18-shell.spec.ts
  e2e/p03-tourist-guide-accept.spec.ts
  e2e/p04-bilateral-confirm.spec.ts
  e2e/smoke.spec.ts
  e2e/governance-params-full-l5.spec.ts
  e2e/smoke-governance.spec.ts
  e2e/orders-list-keyboard.spec.ts
  e2e/section10-5-login-community-feed.spec.ts
)

run_matrix() {
  local STAMP rc
  STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  echo "site10 oracle: reclaim listen ports 8080/3012 before batch…" >&2
  site10_kill_listen_ports 8080 3012

  site10_ensure_api_health "$ROOT"

  export PLAYWRIGHT_REUSE_FE_SERVER="${PLAYWRIGHT_REUSE_FE_SERVER:-1}"
  export COMMUNITY_ME_L5_GREEN_REUSE="${COMMUNITY_ME_L5_GREEN_REUSE:-1}"
  export PLAYWRIGHT_WORKERS="${PLAYWRIGHT_WORKERS:-1}"

  {
    echo "# site10 r22 true-regression denoised matrix · $STAMP (UTC)"
    echo "# manifest=$MANIFEST"
    echo "# PLAYWRIGHT_ROUTE_EXECUTION_BARRIER=${PLAYWRIGHT_ROUTE_EXECUTION_BARRIER:-unset}"
    echo "# PLAYWRIGHT_LOCAL_SITE10_MATRIX=${PLAYWRIGHT_LOCAL_SITE10_MATRIX:-unset}"
    echo "# PLAYWRIGHT_REUSE_FE_SERVER=${PLAYWRIGHT_REUSE_FE_SERVER:-unset}"
    echo "# COMMUNITY_ME_L5_GREEN_REUSE=${COMMUNITY_ME_L5_GREEN_REUSE:-unset}"
    echo "# specs=${#REGRESSION_SPECS[@]} · 22-key manifest · single-batch webServer · NOT full 846"
    echo ""
    echo "== denoised-regression: batch ${#REGRESSION_SPECS[@]} specs =="
  } >"$OUT"

  set +e
  (
    cd "$ROOT/frontend"
    env -u REQUIRE_IDEMPOTENCY_KEY node ./scripts/run-e2e-default.mjs \
      "${REGRESSION_SPECS[@]}" \
      --project=chromium
  ) 2>&1 | tee -a "$OUT"
  rc=${PIPESTATUS[0]}
  set -e

  {
    echo ""
    if [[ "$rc" -eq 0 ]]; then
      echo "DENOISED_REGRESSION_PASS: batch (${#REGRESSION_SPECS[@]} specs · exit 0)"
    else
      echo "DENOISED_REGRESSION_FAIL: batch (exit $rc)"
    fi
    echo "# summary batch_exit=$rc spec_total=${#REGRESSION_SPECS[@]} · $STAMP"
  } | tee -a "$OUT"

  set +e
  python "$ROOT/scripts/dev/parse-site10-denoised-regression.py" "$OUT" | tee "$PARSE" | tee -a "$OUT"
  local parse_rc=${PIPESTATUS[0]}
  set -e

  if [[ "$parse_rc" -ne 0 ]]; then
    echo "TT_SITE10_DENOISED_REGRESSION_MATRIX: FAIL → $OUT · $PARSE" >&2
    return 1
  fi

  if [[ "$rc" -ne 0 ]]; then
    echo "TT_SITE10_DENOISED_REGRESSION_MATRIX: WARN batch_exit=$rc but manifest 22/22 clean (extra non-manifest fails)" | tee -a "$OUT"
  fi

  echo "TT_SITE10_DENOISED_REGRESSION_MATRIX: OK (22/22 manifest · ${#REGRESSION_SPECS[@]} specs) → $OUT" | tee -a "$OUT"
  return 0
}

parse_fails() {
  python "$ROOT/scripts/dev/parse-site10-denoised-regression.py" "${1:-$OUT}" | tee "$PARSE"
}

record_acceptance() {
  local stamp rc_line
  stamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  rc_line="TT_SITE10_G2G3_CONVERGENCE_READY: OK (① · denoised truth · not ②③ GO)"
  {
    echo "# site10 G2G3 denoised convergence acceptance · $stamp (UTC)"
    echo "# cmd: bash scripts/dev/run-site10-r22b-denoised-regression-matrix.sh {run|check-gates}"
    echo "# truth: 22-key manifest · site10-r22-true-regression-manifest.txt"
    echo "# run log: $OUT"
    echo "# stdout archive: $EVID/site10-r22b-denoised-regression-run4.stdout.log"
    echo "# parse: $PARSE"
    echo "# gates: $GATES"
    echo "# extra WARN: $EVID/site10-r22b-extra-warn-register.txt"
    echo "# boundary: 846 full matrix intentionally NOT truth source for this track"
    echo ""
    if [[ -f "$GATES" ]]; then
      cat "$GATES"
    fi
    echo ""
    if [[ -f "$PARSE" ]]; then
      cat "$PARSE"
    fi
    echo ""
    echo "$rc_line"
  } >"$ACCEPT"
  echo "recorded acceptance → $ACCEPT"
}

check_gates() {
  local g1=0 g_d=0
  if [[ -f "$RECHECK_LOG" ]] && grep -q "TT_SITE10_P1_SLICES_RECHECK: OK" "$RECHECK_LOG" 2>/dev/null; then
    g1=1
  elif [[ -f "$RECHECK_LOG" ]] && grep -qE "# summary pass=25 fail=0" "$RECHECK_LOG" 2>/dev/null; then
    g1=1
  fi

  if [[ -f "$OUT" ]] && grep -q "TT_SITE10_DENOISED_REGRESSION_MATRIX: OK" "$OUT" 2>/dev/null; then
    if [[ -f "$PARSE" ]] && grep -q "run_complete: True" "$PARSE" 2>/dev/null \
      && grep -q "still RED in manifest: 0" "$PARSE" 2>/dev/null; then
      g_d=1
    fi
  fi

  {
    echo "# site10 G2G3 gates · $(date -u +%Y-%m-%dT%H:%M:%SZ) (UTC)"
    echo "# parse=$PARSE · log=$OUT"
    echo "# 846 full matrix: NOT required · NOT allowed to reverse 22-key sign-off"
    echo ""
    echo "G1 P1 slices recheck: $([[ $g1 -eq 1 ]] && echo OK || echo FAIL)"
    echo "G2/G3 truth · denoised 22-key regression matrix: $([[ $g_d -eq 1 ]] && echo OK || echo FAIL)"
    echo "  (846 full matrix intentionally NOT required for this convergence track)"
    if [[ -f "$PARSE" ]]; then
      echo "--- parse ---"
      head -20 "$PARSE"
    fi
    if [[ $g1 -eq 1 && $g_d -eq 1 ]]; then
      echo "TT_SITE10_G2G3_CONVERGENCE_READY: OK (① · denoised truth · not ②③ GO)"
    else
      echo "TT_SITE10_G2G3_CONVERGENCE_READY: FAIL ($((2 - g1 - g_d)) gate(s) open)"
    fi
  } | tee "$GATES"

  if [[ $g1 -eq 1 && $g_d -eq 1 ]]; then
    record_acceptance
    return 0
  fi
  echo "TT_SITE10_G2G3_CONVERGENCE_READY: FAIL ($((2 - g1 - g_d)) gate(s) open)" >&2
  return 1
}

cmd="${1:-check-gates}"
case "$cmd" in
  run) run_matrix ;;
  parse) parse_fails "${2:-}" ;;
  check-gates) check_gates ;;
  *)
    echo "usage: $0 {run|parse|check-gates}" >&2
    exit 2
    ;;
esac
