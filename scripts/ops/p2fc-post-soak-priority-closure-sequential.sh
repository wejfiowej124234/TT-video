#!/usr/bin/env bash
# P2FC · 优先级闭环顺序执行（② · COMPLETED 后 · 无运行时证据不得宣称 GO）
#
# 写死顺序：
#   S0 Soak COMPLETED → S1 MR12 → S2 ADM-U01 → S3 P0 runtime
#   → S4 B1–B4 → S5 ADM-U02 → S6 D3 → S7 D1/D2/D4 → runtime adjudication
#
#   bash scripts/ops/p2fc-post-soak-priority-closure-sequential.sh --status-only
#   bash scripts/ops/p2fc-post-soak-priority-closure-sequential.sh --execute
#   bash scripts/ops/p2fc-post-soak-priority-closure-sequential.sh --watch
#
# 末行：TT_P2FC_PRIORITY_CLOSURE_SEQUENTIAL: PASS|INFLIGHT|PARTIAL|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
COMPLETED="$SOAK_DIR/COMPLETED.json"
CLOSURE_DIR="$SOAK_DIR/post-soak-staging-live-closure"
LOG="$CLOSURE_DIR/priority-closure-sequential.log"
ONE_SHOT_LOG="$SOAK_DIR/post-soak-one-shot/one-shot.log"
STATUS_ONLY=0
EXECUTE=0
WATCH=0
STRAT_F=0
POLL_SEC="${P2FC_PRIORITY_CLOSURE_POLL_SEC:-300}"

strat_f_active() {
  [[ "${P2FC_STRAT_F_PRE_SOAK:-0}" == "1" ]] && return 0
  [[ -f "$ROOT/evidence/GO_phase2_deploy_backlog/FINAL-CANDIDATE-EXECUTION-LOCK.json" ]] && return 0
  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --status-only) STATUS_ONLY=1; shift ;;
    --execute) EXECUTE=1; shift ;;
    --watch) WATCH=1; EXECUTE=1; shift ;;
    --strat-f) STRAT_F=1; export P2FC_STRAT_F_PRE_SOAK=1; shift ;;
    -h|--help)
      sed -n '2,16p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$CLOSURE_DIR"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

refresh_tracker() {
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-priority-closure-tracker.py" \
    --soak-dir "$SOAK_DIR" 2>&1 | tee -a "$LOG"
}

on_fail() {
  echo "${ts} TT_P2FC_PRIORITY_CLOSURE_SEQUENTIAL: FAIL $*" | tee -a "$LOG" >&2
  refresh_tracker || true
  bash "$ROOT/scripts/ops/p2fc-query-runtime-adjudication.sh" --refresh 2>&1 | tee -a "$LOG" || true
  exit 2
}

mr12_pass() {
  if strat_f_active && [[ -f "$SOAK_DIR/final-candidate-pre-soak/deploy-complete.json" ]]; then
    return 0
  fi
  grep -q 'TT_P2FC_POST_SOAK_ONE_SHOT: PASS' "$ONE_SHOT_LOG" 2>/dev/null
}

adm_u01_go() {
  [[ -f "$CLOSURE_DIR/adm-u01-live/report.json" ]] || return 1
  [[ "$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).release_gate||'')}catch{console.log('')}" "$CLOSURE_DIR/adm-u01-live/report.json")" == "GO" ]]
}

p0_confirmed() {
  [[ -f "$CLOSURE_DIR/p0-rbac-bypass-runtime/latest.json" ]] || return 1
  [[ "$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).status||'')}catch{console.log('')}" "$CLOSURE_DIR/p0-rbac-bypass-runtime/latest.json")" == "CONFIRMED" ]]
}

blockers_cleared() {
  local n
  n="$(node -e "
try {
  const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  process.stdout.write(String(j.open_blocker_count ?? 99));
} catch { process.stdout.write('99'); }
" "$CLOSURE_DIR/staging-live-closure.latest.json" 2>/dev/null || echo 99)"
  [[ "$n" == "0" ]]
}

adm_u02_go() {
  [[ -f "$CLOSURE_DIR/adm-u02-live/report.json" ]] || return 1
  [[ "$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).release_gate||'')}catch{console.log('')}" "$CLOSURE_DIR/adm-u02-live/report.json")" == "GO" ]]
}

d3_pass() {
  [[ -f "$CLOSURE_DIR/web3-live-risk-convergence.latest.json" ]] || return 1
  [[ "$(node -e "try{const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));console.log((j.domain_verdicts||{}).D3||'')}catch{console.log('')}" "$CLOSURE_DIR/web3-live-risk-convergence.latest.json")" == "PASS" ]]
}

d124_pass() {
  [[ -f "$CLOSURE_DIR/web3-live-risk-convergence.latest.json" ]] || return 1
  local rc=0
  set +e
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-web3-live-risk-convergence.py" --soak-dir "$SOAK_DIR" >/dev/null 2>&1
  rc=$?
  set -e
  [[ "$rc" -eq 0 ]]
}

run_sequential() {
  {
    echo "${ts} priority-closure-sequential: START execute=1"
    bash "$ROOT/scripts/ops/p2fc-verify-mr12-execution-lock.sh"

    if strat_f_active; then
      echo "STRAT-F: skip S0 COMPLETED gate"
    else
      [[ -f "$COMPLETED" ]] || on_fail "S0 missing COMPLETED.json"
    fi

    # S1 · MR12 one-shot (STRAT-F: deploy phase already ran)
    if mr12_pass; then
      echo "S1 MR12/deploy: already PASS — skip"
    elif [[ -f "$COMPLETED" && -n "${P2FC_RUNTIME_SHA_FROZEN:-}" ]]; then
      echo "--- S1: MR12 runtime convergence (no redeploy) ---"
      export P2FC_RUNTIME_SHA_FROZEN
      bash "$ROOT/scripts/ops/p2fc-post-soak-mr12-runtime-convergence.sh" 2>&1 | tee -a "$LOG"
      mr12_pass || on_fail "S1 MR12 runtime convergence not PASS"
    else
      echo "--- S1: MR12 one-shot execute ---"
      bash "$ROOT/scripts/ops/p2fc-post-soak-one-shot-execute.sh" 2>&1 | tee -a "$LOG"
      mr12_pass || on_fail "S1 MR12 one-shot not PASS"
    fi

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
    export ADM_U01_STRICT=1 ADM_U02_STRICT=1
    export ADM_U01_REQUIRE_PERSISTENT_HOST=1 ADM_U02_REQUIRE_PERSISTENT_HOST=1
    export ADM_U01_NO_LOCAL_FE_FALLBACK=1
    export ADM_U01_DEPLOYMENT_KIND=persistent_staging
    export ADM_U01_PROVISION_API_BASE="$STAGING_API_BASE"
    export ADM_U01_PROBE_API_BASE="$STAGING_API_BASE"
    [[ -n "${STAGING_DATABASE_URL:-${DATABASE_URL:-}}" ]] || on_fail "STAGING_DATABASE_URL required for S2/S5 live"

    # S2 · ADM-U01 live
    if adm_u01_go; then
      echo "S2 ADM-U01: already GO — skip"
    else
      echo "--- S2: ADM-U01 live RBAC matrix ---"
      U01_RUN="adm_u01_priority_${ts//:/}"
      export ADM_U01_RUN_ID="$U01_RUN"
      export ADM_U01_EVIDENCE_DIR="$ROOT/evidence/GO_staging_admin_rbac_matrix/${U01_RUN}"
      mkdir -p "$CLOSURE_DIR/adm-u01-live"
      bash "$ROOT/scripts/dev/record-adm-u01-staging-evidence.sh" 2>&1 | tee -a "$LOG"
      cp -f "$ADM_U01_EVIDENCE_DIR/report.json" "$CLOSURE_DIR/adm-u01-live/report.json"
      grep -q 'TT_ADM_U01_EVIDENCE: PASS' "$ADM_U01_EVIDENCE_DIR"/run-*.log || on_fail "S2 ADM-U01 evidence not PASS"
      adm_u01_go || on_fail "S2 ADM-U01 release_gate not GO"
    fi

    # S3 · P0 runtime
    if p0_confirmed; then
      echo "S3 P0 runtime: already CONFIRMED — skip"
    else
      echo "--- S3: P0 RBAC bypass runtime ---"
      export P2FC_P0_RUNTIME_OUT="$CLOSURE_DIR/p0-rbac-bypass-runtime"
      bash "$ROOT/scripts/ops/p2fc-verify-p0-rbac-bypass-runtime.sh" 2>&1 | tee -a "$LOG"
      p0_confirmed || on_fail "S3 P0 runtime not CONFIRMED"
    fi

    # S4 · B1–B4 live evidence aggregate
    echo "--- S4: B1–B4 blocker convergence evidence ---"
    PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-post-soak-staging-live-closure-evidence.py" \
      --soak-dir "$SOAK_DIR" 2>&1 | tee -a "$LOG" || true
    blockers_cleared || on_fail "S4 open_blocker_count not 0"

    # S5 · ADM-U02 live
    if adm_u02_go; then
      echo "S5 ADM-U02: already GO — skip"
    else
      echo "--- S5: ADM-U02 live ---"
      U02_RUN="adm_u02_priority_${ts//:/}"
      export ADM_U02_RUN_ID="$U02_RUN"
      export ADM_U02_EVIDENCE_DIR="$ROOT/evidence/GO_staging_admin_adm_u02/${U02_RUN}"
      mkdir -p "$CLOSURE_DIR/adm-u02-live"
      bash "$ROOT/scripts/dev/record-adm-u02-staging-evidence.sh" 2>&1 | tee -a "$LOG"
      cp -f "$ADM_U02_EVIDENCE_DIR/report.json" "$CLOSURE_DIR/adm-u02-live/report.json"
      grep -q 'TT_ADM_U02_STAGING_EVIDENCE: PASS' "$ADM_U02_EVIDENCE_DIR"/run-*.log || on_fail "S5 ADM-U02 evidence not PASS"
      adm_u02_go || on_fail "S5 ADM-U02 release_gate not GO"
    fi

    # S6 · D3 live merge
    echo "--- S6: D3 FAIL convergence (live merge) ---"
    PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-web3-live-risk-convergence.py" \
      --soak-dir "$SOAK_DIR" 2>&1 | tee -a "$LOG" || on_fail "S6 D3 convergence"
    d3_pass || on_fail "S6 D3 verdict not PASS"

    # S7 · D1/D2/D4 WARN convergence
    echo "--- S7: D1/D2/D4 WARN/OPEN convergence ---"
    d124_pass || on_fail "S7 D1/D2/D4 open_warn_count not 0"

    # Admin GO gate + runtime adjudication (唯一合法 GO 出口)
    echo "--- Final: Admin GO claim gate + runtime adjudication ---"
    bash "$ROOT/scripts/ops/p2fc-gate-admin-staging-go-claim.sh" 2>&1 | tee -a "$LOG"
    PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-post-soak-staging-live-closure-evidence.py" \
      --soak-dir "$SOAK_DIR" 2>&1 | tee -a "$LOG" || true
    refresh_tracker
    bash "$ROOT/scripts/ops/p2fc-query-runtime-adjudication.sh" --refresh 2>&1 | tee -a "$LOG"

    echo "${ts} TT_P2FC_PRIORITY_CLOSURE_SEQUENTIAL: PASS"
  } 2>&1 | tee -a "$LOG"
}

if [[ "$STATUS_ONLY" -eq 1 ]]; then
  refresh_tracker
  exit $?
fi

if [[ "$EXECUTE" -eq 0 ]]; then
  echo "usage: --status-only | --execute | --watch" >&2
  exit 2
fi

if [[ "$WATCH" -eq 1 ]]; then
  echo $$ >"$CLOSURE_DIR/priority-closure-watcher.pid"
  echo "${ts} priority-closure: watch COMPLETED.json poll=${POLL_SEC}s" >>"$LOG"
  while [[ ! -f "$COMPLETED" ]]; do
    refresh_tracker 2>&1 | tail -1 >>"$LOG" || true
    sleep "$POLL_SEC"
  done
fi

if strat_f_active || [[ -f "$COMPLETED" ]]; then
  run_sequential
else
  refresh_tracker
  echo "TT_P2FC_PRIORITY_CLOSURE_SEQUENTIAL: INFLIGHT await COMPLETED.json" >&2
  exit 2
fi
exit 0
