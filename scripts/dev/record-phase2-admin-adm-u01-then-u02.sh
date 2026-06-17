#!/usr/bin/env bash
# Phase ② Admin 收口（严格顺序 · 合并后才可标 ②）：
#   1) ADM-U01 持久 Staging RBAC 矩阵
#   2) ADM-U02 同环境 2FA/审批链
#   3) merge closure-report.json → release_gate GO
#   4) 末行 TT_PHASE2_ADMIN_STAGING: PASS（仅此允许标 Admin Phase ②）
#
#   export STAGING_API_BASE=https://<fly-api>
#   export STAGING_FE_BASE=https://<fly-fe>
#   export STAGING_DATABASE_URL=postgresql://...
#   bash scripts/dev/record-phase2-admin-adm-u01-then-u02.sh
#
# 标台账前：bash scripts/gates/validate-phase2-admin-staging-closure.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

ENV_FILE="${PHASE2_ADMIN_STAGING_ENV:-$REPO_ROOT/scripts/dev/.env.staging-onboarding.local}"
if [[ -f "$ENV_FILE" ]]; then
  echo "sourcing ${ENV_FILE}"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

export ADM_U01_STRICT=1
export ADM_U02_STRICT=1
export ADM_U01_REQUIRE_PERSISTENT_HOST="${ADM_U01_REQUIRE_PERSISTENT_HOST:-1}"
export ADM_U02_REQUIRE_PERSISTENT_HOST="${ADM_U02_REQUIRE_PERSISTENT_HOST:-1}"

STAGING_API_BASE="${STAGING_API_BASE:-${TRAVELTRUST_STAGING_API_BASE:-}}"
export STAGING_API_BASE="${STAGING_API_BASE%/}"
[[ -n "$STAGING_API_BASE" ]] || {
  echo "FAIL: set STAGING_API_BASE (Fly API HTTPS) before running Phase ② admin close" >&2
  exit 1
}
[[ -n "${STAGING_FE_BASE:-}" ]] || {
  echo "FAIL: set STAGING_FE_BASE (Fly FE HTTPS) — required for ADM-U01 Playwright" >&2
  exit 1
}
export STAGING_FE_BASE="${STAGING_FE_BASE%/}"
export STAGING_DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"
[[ -n "${STAGING_DATABASE_URL:-}" ]] || {
  echo "FAIL: STAGING_DATABASE_URL required (same DB as Staging API)" >&2
  exit 1
}

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
CLOSURE_ROOT="$REPO_ROOT/evidence/GO_phase2_admin_staging_closure"
RUN_ID="run_phase2_admin_${STAMP}"
EVID="$CLOSURE_ROOT/${RUN_ID}"
mkdir -p "$EVID"
RUN_LOG="$EVID/orchestrator-${STAMP}.log"

PY="${PYTHON:-}"
if [[ -z "$PY" ]]; then
  command -v python >/dev/null 2>&1 && PY=python || PY=python3
fi

_orchestrate() {
  echo "TT_PHASE2_ADMIN_STAGING: START ${STAMP}"
  echo "STAGING_API_BASE=${STAGING_API_BASE}"
  echo "STAGING_FE_BASE=${STAGING_FE_BASE}"
  echo "sequence=U01-persistent-rbac,U02-staging-2fa-approval,merge"
  echo "ADM_U01_REQUIRE_PERSISTENT_HOST=${ADM_U01_REQUIRE_PERSISTENT_HOST}"
  echo "ADM_U02_REQUIRE_PERSISTENT_HOST=${ADM_U02_REQUIRE_PERSISTENT_HOST}"

  echo "=== Step 1/3: ADM-U01 (persistent Staging RBAC matrix) ==="
  export ADM_U01_PROVISION_API_BASE="${ADM_U01_PROVISION_API_BASE:-$STAGING_API_BASE}"
  export ADM_U01_PROBE_API_BASE="${ADM_U01_PROBE_API_BASE:-$STAGING_API_BASE}"
  export ADM_U01_NO_LOCAL_FE_FALLBACK=1
  export ADM_U01_DEPLOYMENT_KIND=persistent_staging
  export ADM_U01_RUN_ID="${ADM_U01_RUN_ID:-adm_u01_${STAMP}}"
  bash "$REPO_ROOT/scripts/dev/record-adm-u01-staging-evidence.sh"
  U01_EVID="$REPO_ROOT/evidence/GO_staging_admin_rbac_matrix/${ADM_U01_RUN_ID}"
  [[ -f "$U01_EVID/report.json" ]] || { echo "FAIL: ADM-U01 report.json missing"; return 1; }
  cp -f "$U01_EVID/report.json" "$EVID/adm-u01-report.json"
  grep -q 'TT_ADM_U01_EVIDENCE: PASS' "$U01_EVID"/run-*.log 2>/dev/null \
    || grep -q 'TT_ADM_U01_EVIDENCE: PASS' "$U01_EVID"/latest-run.log 2>/dev/null \
    || { echo "FAIL: ADM-U01 log missing TT_ADM_U01_EVIDENCE: PASS"; return 1; }
  U01_RG="$("$PY" -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('release_gate',''))" "$EVID/adm-u01-report.json")"
  [[ "$U01_RG" == "GO" ]] || { echo "FAIL: ADM-U01 release_gate=$U01_RG"; return 1; }
  echo "step1: ADM-U01 release_gate=GO"

  echo "=== Step 2/3: ADM-U02 (same Staging — 2FA / approval / audit) ==="
  export ADM_U02_RUN_ID="${ADM_U02_RUN_ID:-adm_u02_${STAMP}}"
  bash "$REPO_ROOT/scripts/dev/record-adm-u02-staging-evidence.sh"
  U02_EVID="$REPO_ROOT/evidence/GO_staging_admin_adm_u02/${ADM_U02_RUN_ID}"
  [[ -f "$U02_EVID/report.json" ]] || { echo "FAIL: ADM-U02 report.json missing"; return 1; }
  cp -f "$U02_EVID/report.json" "$EVID/adm-u02-report.json"
  grep -q 'TT_ADM_U02_STAGING_EVIDENCE: PASS' "$U02_EVID"/run-*.log 2>/dev/null \
    || grep -q 'TT_ADM_U02_STAGING_EVIDENCE: PASS' "$U02_EVID/smoke-run.log" 2>/dev/null \
    || { echo "FAIL: ADM-U02 missing TT_ADM_U02_STAGING_EVIDENCE: PASS"; return 1; }
  U02_RG="$("$PY" -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('release_gate',''))" "$EVID/adm-u02-report.json")"
  [[ "$U02_RG" == "GO" ]] || { echo "FAIL: ADM-U02 release_gate=$U02_RG"; return 1; }
  echo "step2: ADM-U02 release_gate=GO"

  echo "=== Step 3/3: merge closure evidence ==="
  "$PY" "$REPO_ROOT/scripts/gates/merge-phase2-admin-staging-closure.py" "$EVID"

  {
    echo "status: PASS"
    echo "phase: ②"
    echo "artifact: PHASE2-ADMIN-ADM-U01-U02"
    echo "adm_u01_run_id: ${ADM_U01_RUN_ID}"
    echo "adm_u02_run_id: ${ADM_U02_RUN_ID}"
    echo "staging_api_base: ${STAGING_API_BASE}"
    echo "staging_fe_base: ${STAGING_FE_BASE}"
    echo "closure_report: closure-report.json"
    echo "mark_phase2_allowed: true"
    echo "at: ${STAMP}"
  } > "$EVID/STATUS.txt"

  mkdir -p "$CLOSURE_ROOT"
  if ! ln -sfn "$RUN_ID" "$CLOSURE_ROOT/latest" 2>/dev/null; then
    printf '%s\n' "$RUN_ID" > "$CLOSURE_ROOT/latest-run-id.txt"
  fi

  echo "TT_PHASE2_ADMIN_STAGING: PASS ${STAMP}"
  echo ""
  echo "Admin Phase ② mark ALLOWED — run before editing ADMIN-L5-AUDIT-TASKS:"
  echo "  bash scripts/gates/validate-phase2-admin-staging-closure.sh"
}

set -o pipefail
_orchestrate 2>&1 | tee "$RUN_LOG"
ORCH_RC="${PIPESTATUS[0]}"
if [[ "$ORCH_RC" -ne 0 ]]; then
  echo "TT_PHASE2_ADMIN_STAGING: FAIL (orchestrator exit ${ORCH_RC})" >&2
  exit "$ORCH_RC"
fi
grep -q 'TT_PHASE2_ADMIN_STAGING: PASS' "$RUN_LOG" || {
  echo "TT_PHASE2_ADMIN_STAGING: FAIL (PASS line missing from log)" >&2
  exit 1
}
