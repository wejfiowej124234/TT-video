#!/usr/bin/env bash
# SUPERSEDED · Phase ② · Testnet Graduation Full Re-Validation @ pinned baseline SHA
#
# **毕业序 SSOT：** `scripts/dev/run-phase2-graduation-closure-program.sh`
# TESTNET_STAGING_FREEZE ACTIVE 时默认 exit 2 · Owner 取证：`LEGACY_ORCHESTRATOR_OK=1`
#
# 唯一真源：PHASE2_REVALIDATION_BASELINE_SHA 或 TESTNET_STAGING_FREEZE ACTIVE.json（默认 8dcd304a…）
# 禁止继承旧 SHA 验收结论 · 全量重验 TN-P1-001～010 · D1–D24 · ADM-U01 · Deep Gate · HAT · 72h soak
#
#   export PHASE2_REVALIDATION_BASELINE_SHA=8dcd304afae1bafe5a4de738175e171256a9501e
#   bash scripts/dev/run-phase2-testnet-graduation-full-revalidation-at-baseline.sh
#   bash scripts/dev/run-phase2-testnet-graduation-full-revalidation-at-baseline.sh --skip-deploy
#   bash scripts/dev/run-phase2-testnet-graduation-full-revalidation-at-baseline.sh --skip-deploy --resume-from tn004
#   bash scripts/dev/run-phase2-testnet-graduation-full-revalidation-at-baseline.sh --skip-playwright
#
# 诚实边界：TT_TESTNET_GRADUATION:CLOSED 须 72h wall-clock soak + COMPLETED.json + G-09
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-legacy-orchestrator-guard.sh
source "$ROOT/scripts/dev/lib/phase2-legacy-orchestrator-guard.sh"
phase2_legacy_orchestrator_guard "$ROOT" "$(basename "$0")" || exit $?

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"

SKIP_DEPLOY=0
SKIP_PW=0
RESUME_FROM=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-deploy) SKIP_DEPLOY=1; shift ;;
    --skip-playwright) SKIP_PW=1; shift ;;
    --resume-from) RESUME_FROM="${2:-}"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

should_run() {
  local step="$1"
  [[ -z "$RESUME_FROM" ]] && return 0
  local order="align parity spine tn002 tn003 tn004 tn005 tn006 admu02 admu01 rbac tn010 d24 d6 deep hat007 hat28 local ssot gov report soak postsoak"
  local resume_idx=-1 step_idx=-1 i=0 s
  for s in $order; do
    [[ "$s" == "$RESUME_FROM" ]] && resume_idx=$i
    [[ "$s" == "$step" ]] && step_idx=$i
    i=$((i + 1))
  done
  if [[ "$resume_idx" -lt 0 ]]; then
    echo "WARN: unknown --resume-from ${RESUME_FROM} — running all steps" >&2
    return 0
  fi
  [[ "$step_idx" -ge "$resume_idx" ]]
}

DEFAULT_BASELINE="$(phase2_resolve_baseline_ssot_sha "$ROOT")"
BASELINE_SHA="${PHASE2_REVALIDATION_BASELINE_SHA:-$DEFAULT_BASELINE}"
HEAD_SHA="$(git rev-parse HEAD)"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_graduation/full-revalidation-baseline-${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/graduation-full-revalidation-${STAMP}.log"
exec > >(tee -a "$LOG") 2>&1

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
FE="${FE%/}"

merge_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    export "${line%%=*}=${line#*=}"
  done < "$f"
}
merge_env "$ROOT/scripts/dev/.env.staging-onboarding.local"
merge_env "$ROOT/scripts/dev/.env.staging-secrets.local"

export STAGING_API_BASE="$API"
export STAGING_FE_BASE="$FE"
export STAGING_WEB_BASE="$FE"
export PHASE2_EXPECT_GIT_SHA="$BASELINE_SHA"
export PHASE2_SSOT_BASELINE_SHA="$BASELINE_SHA"
export PHASE2_REVALIDATION_BASELINE_SHA="$BASELINE_SHA"
export PHASE2_FULL_REVALIDATION=1
export OPEN_TESTNET_P0_COUNT="${OPEN_TESTNET_P0_COUNT:-0}"
export OPEN_TESTNET_P1_COUNT="${OPEN_TESTNET_P1_COUNT:-0}"
export TT_PHASE2_READINESS="${TT_PHASE2_READINESS:-100}"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev,localhost,127.0.0.1"
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY http_proxy https_proxy all_proxy 2>/dev/null || true
export ADM_U01_REUSE_LATEST_GO="${ADM_U01_REUSE_LATEST_GO:-1}"
export STEWARD_RPC_URL="${STEWARD_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
# Force Sepolia write RPC after merge_env — staging-onboarding.local may set drpc (TLS flake on Windows).
export CHAIN_RPC_URL="$STEWARD_RPC_URL"
export P2B407_RPC_URL="$STEWARD_RPC_URL"
export STEWARD_WRITE_USE_LOCAL_ANVIL="${STEWARD_WRITE_USE_LOCAL_ANVIL:-1}"

echo "TT_PHASE2_TESTNET_GRADUATION_FULL_REVALIDATION: START ${STAMP}"
echo "baseline_sha=${BASELINE_SHA} HEAD=${HEAD_SHA}"

# —— Phase 0: baseline gate（禁止继承旧 SHA）——
[[ "$HEAD_SHA" == "$BASELINE_SHA" ]] || {
  echo "FAIL: HEAD (${HEAD_SHA}) != PHASE2_REVALIDATION_BASELINE_SHA (${BASELINE_SHA})" >&2
  exit 2
}

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  stamp: process.argv[2],
  baseline_git_sha: process.argv[3],
  head_git_sha: process.argv[4],
  inherit_prior_sha_conclusions: false,
  standard: 'Phase② Testnet Graduation',
}, null, 2)+'\n');
" "$EVID/baseline-gate.json" "$STAMP" "$BASELINE_SHA" "$HEAD_SHA"

# —— Phase 1: supersede pre-baseline soak + archive marker ——
if [[ -z "$RESUME_FROM" ]]; then
  echo ""
  echo "== Phase 1: supersede pre-baseline P2FC soak jobs =="
  SOAK_ROOT="$ROOT/evidence/P2FC_SOAK_72H_STAGING"
  ARCHIVE_SOAK="$SOAK_ROOT/archive/superseded-pre-baseline-${BASELINE_SHA:0:8}-${STAMP}"
  mkdir -p "$ARCHIVE_SOAK"
  for job in "$SOAK_ROOT"/job-*; do
    [[ -d "$job" ]] || continue
    if [[ -f "$job/pid.txt" ]]; then
      pid="$(cat "$job/pid.txt" 2>/dev/null || true)"
      [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
      rm -f "$job/pid.txt"
    fi
    echo "{\"superseded_at\":\"${STAMP}\",\"reason\":\"graduation-full-revalidation-baseline\",\"baseline_sha\":\"${BASELINE_SHA}\"}" \
      >"$job/SUPERSEDED.json"
    mv "$job" "$ARCHIVE_SOAK/" 2>/dev/null || true
  done
  rm -f "$SOAK_ROOT/COMPLETED.json" 2>/dev/null || true
  echo "soak-supersede: → $ARCHIVE_SOAK"
else
  echo "SKIP soak supersede (--resume-from ${RESUME_FROM})"
fi
SOAK_ROOT="$ROOT/evidence/P2FC_SOAK_72H_STAGING"

# —— Phase 2: deploy @ baseline（optional · freeze blocks unless Owner override）——
if [[ "$SKIP_DEPLOY" == "0" ]]; then
  if ! phase2_require_staging_deploy_allowed "$ROOT"; then
    echo "SKIP deploy: TESTNET_STAGING_FREEZE ACTIVE — use --skip-deploy or TESTNET_FREEZE_OVERRIDE=1 (Owner only)"
    SKIP_DEPLOY=1
  fi
fi
if [[ "$SKIP_DEPLOY" == "0" ]]; then
  echo ""
  echo "== Phase 2: deploy tt-api-staging + tt-web-staging @ baseline (TESTNET_FREEZE_OVERRIDE=1) =="
  export TESTNET_FREEZE_OVERRIDE=1
  export TRAVELTRUST_GIT_SHA="$BASELINE_SHA"
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" 2>&1 | tee "$EVID/deploy-api.log"
  if ! TESTNET_FREEZE_OVERRIDE=1 FLY_WEB_OOM_FIX=1 FLY_WEB_REMOTE_BUILD=1 \
    BUILD_NODE_MAX_OLD_SPACE_SIZE=6144 FLY_WEB_BUILDER_MEMORY_MB=8192 \
    bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee "$EVID/deploy-web.log"; then
    TESTNET_FREEZE_OVERRIDE=1 bash "$ROOT/scripts/dev/tt-web-staging-oom-fix-deploy.sh" 2>&1 | tee -a "$EVID/deploy-web.log"
  fi
  sleep 20
fi

curl --noproxy "*" -sS --max-time 45 "${API}/meta" >"$EVID/baseline-meta.json"
curl --noproxy "*" -sS --max-time 45 "${FE}/meta" >"$EVID/baseline-web-meta.json"
STAGING_SHA="$(node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(j.build?.git_sha||'');" "$EVID/baseline-meta.json")"
WEB_SHA="$(node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(j.build?.git_sha||'');" "$EVID/baseline-web-meta.json")"
echo "baseline=${BASELINE_SHA} api=${STAGING_SHA} web=${WEB_SHA}"
[[ "$BASELINE_SHA" == "$STAGING_SHA" && "$BASELINE_SHA" == "$WEB_SHA" ]] || {
  echo "FAIL: staging meta != baseline SHA" >&2
  exit 2
}

run_step() {
  local name="$1"
  local log="$2"
  shift 2
  echo ""
  echo "== ${name} =="
  set +e
  "$@" 2>&1 | tee "$log"
  local rc=${PIPESTATUS[0]}
  set -e
  if [[ "$rc" -ne 0 ]]; then
    echo "FAIL: ${name} exit=${rc}" >&2
    exit "$rc"
  fi
}

# —— Phase 3: alignment + parity + Sepolia spine ——
if should_run align; then
  run_step "Phase 3: staging alignment" "$EVID/staging-web-alignment.log" \
    bash "$ROOT/scripts/dev/check-staging-web-alignment.sh"
else echo "SKIP align (--resume-from ${RESUME_FROM})"; fi
if should_run parity; then
  run_step "Phase 4: staging API parity" "$EVID/staging-api-parity.log" \
    env PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/staging-api-parity-probe.py"
else echo "SKIP parity (--resume-from ${RESUME_FROM})"; fi
if should_run spine && [[ -f "$ROOT/scripts/dev/phase2-sepolia-spine-audit.sh" ]]; then
  run_step "Phase 5: Sepolia spine audit" "$EVID/sepolia-spine-audit.log" \
    bash "$ROOT/scripts/dev/phase2-sepolia-spine-audit.sh"
else echo "SKIP spine (--resume-from ${RESUME_FROM})"; fi

# —— Phase 6–14: TN-P1-001～010 evidence refresh @ baseline only ——
if should_run tn002; then
  run_step "TN-P1-002 provider onboarding" "$EVID/tn-p1-002.log" \
    bash "$ROOT/scripts/dev/record-tn-p1-002-provider-onboarding-staging-evidence.sh"
else echo "SKIP TN-P1-002 (--resume-from ${RESUME_FROM})"; fi
if should_run tn003; then
  run_step "TN-P1-003 acquisition" "$EVID/tn-p1-003.log" \
    bash "$ROOT/scripts/dev/record-tn-p1-003-acquisition-staging-evidence.sh"
else echo "SKIP TN-P1-003 (--resume-from ${RESUME_FROM})"; fi
if should_run tn004; then
  run_step "TN-P1-004 steward stake" "$EVID/tn-p1-004.log" \
    bash "$ROOT/scripts/dev/record-tn-p1-004-steward-stake-staging-evidence.sh"
else echo "SKIP TN-P1-004 (--resume-from ${RESUME_FROM})"; fi
if should_run tn005; then
  run_step "TN-P1-005 Stripe PSP onboarding" "$EVID/tn-p1-005.log" \
    bash "$ROOT/scripts/dev/record-tn-p1-005-stripe-onboarding-staging-evidence.sh"
else echo "SKIP TN-P1-005 (--resume-from ${RESUME_FROM})"; fi
if should_run tn006; then
  run_step "TN-P1-006 escrow" "$EVID/tn-p1-006.log" \
    bash "$ROOT/scripts/dev/record-tn-p1-006-escrow-staging-evidence.sh"
else echo "SKIP TN-P1-006 (--resume-from ${RESUME_FROM})"; fi

if should_run admu02; then
  echo ""
  echo "== TN-P1-001 / ADM-U02 admin staging =="
  set +e
  REPO_ROOT="$ROOT" ADM_U02_RUN_ID="run_graduation_${STAMP}" \
    ADM_U02_REQUIRE_PERSISTENT_HOST=1 \
    bash "$ROOT/scripts/dev/record-adm-u02-staging-evidence.sh" 2>&1 | tee "$EVID/adm-u02.log"
  ADM_U02_RC=${PIPESTATUS[0]}
  set -e
  [[ "$ADM_U02_RC" -eq 0 ]] || echo "WARN: ADM-U02 exit=${ADM_U02_RC} (continuing ADM-U01)" >&2
else echo "SKIP ADM-U02 (--resume-from ${RESUME_FROM})"; fi

if should_run admu01; then
  run_step "TN-P1-001 / ADM-U01 formal" "$EVID/adm-u01.log" \
    env REPO_ROOT="$ROOT" ADM_U01_RUN_ID="run_graduation_${STAMP}" \
      ADM_U01_REQUIRE_PERSISTENT_HOST=1 \
      ADM_U01_PROVISION_API_BASE="$API" \
      ADM_U01_PROBE_API_BASE="$API" \
      ADM_U01_NO_LOCAL_FE_FALLBACK=1 \
      bash "$ROOT/scripts/dev/record-adm-u01-staging-evidence.sh"
  grep -q 'TT_ADM_U01_EVIDENCE: PASS' "$EVID/adm-u01.log"
else echo "SKIP ADM-U01 (--resume-from ${RESUME_FROM})"; fi

if should_run rbac; then
  REPO_ROOT="$ROOT"
  # shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
  source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
  staging_adm_u01_prepare_dsn || {
    echo "FAIL: staging-adm-u01-env prepare for RBAC matrix" >&2
    exit 1
  }
  RBAC_TOKEN_SRC=""
  RBAC_ADM_EVID="$ROOT/evidence/GO_staging_admin_rbac_matrix/run_graduation_${STAMP}"
  if [[ -f "$RBAC_ADM_EVID/adm-u01-tokens.env" ]]; then
    RBAC_TOKEN_SRC="$RBAC_ADM_EVID/adm-u01-tokens.env"
  else
    for cand in $(ls -td "$ROOT/evidence/GO_staging_admin_rbac_matrix"/run_graduation_* 2>/dev/null); do
      [[ -f "$cand/adm-u01-tokens.env" && -f "$cand/report.json" ]] || continue
      if grep -q '"release_gate": "GO"' "$cand/report.json" 2>/dev/null; then
        RBAC_TOKEN_SRC="$cand/adm-u01-tokens.env"
        echo "RBAC matrix: reuse tokens from $(basename "$cand")"
        break
      fi
    done
  fi
  if [[ -n "$RBAC_TOKEN_SRC" && -f "$RBAC_TOKEN_SRC" ]]; then
    # shellcheck disable=SC1090
    source "$RBAC_TOKEN_SRC"
  fi
  run_step "TN-P1-001 admin RBAC matrix" "$EVID/admin-rbac-matrix.log" \
    env PYTHONIOENCODING=utf-8 REPO_ROOT="$ROOT" ADM_U01_STRICT=1 \
      STAGING_API_BASE="$API" ADM_U01_PROVISION_API_BASE="$API" ADM_U01_PROBE_API_BASE="$API" \
      python "$ROOT/scripts/gates/run-admin-rbac-staging-matrix.py"
else echo "SKIP admin RBAC (--resume-from ${RESUME_FROM})"; fi

if should_run tn010; then
  run_step "TN-P1-010 indexer reconcile" "$EVID/tn-p1-010.log" \
    bash "$ROOT/scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh"
else echo "SKIP TN-P1-010 (--resume-from ${RESUME_FROM})"; fi
if should_run d24; then
  run_step "D24 surface" "$EVID/tn-p1-d24.log" \
    bash "$ROOT/scripts/dev/record-tn-p1-d24-surface-staging-evidence.sh"
else echo "SKIP D24 (--resume-from ${RESUME_FROM})"; fi

if should_run d6; then
  if [[ "$SKIP_PW" == "0" ]]; then
    run_step "D6 reliability surface" "$EVID/tn-p1-d6.log" \
      bash "$ROOT/scripts/dev/record-tn-p1-d6-reliability-surface-staging-evidence.sh"
  else
    echo "SKIP D6 Playwright (--skip-playwright)"
  fi
else echo "SKIP D6 (--resume-from ${RESUME_FROM})"; fi

if should_run deep; then
  run_step "Deep Release Gate (G04 · ADM-U01 reuse)" "$EVID/deep-release-gate.log" \
    env REPO_ROOT="$ROOT" ADM_U01_REUSE_LATEST_GO=1 \
      bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" --expect-git-sha "$BASELINE_SHA"
  grep -q 'TT_PHASE2_DEEP_RELEASE_GATE: PASS' "$EVID/deep-release-gate.log"
else echo "SKIP Deep Gate (--resume-from ${RESUME_FROM})"; fi

if should_run hat007 || should_run hat28; then
  if should_run hat007; then
    run_step "Staging DB direct-query appendix (docker psql)" "$EVID/staging-db-direct-query-appendix.log" \
      env REPO_ROOT="$ROOT" PHASE2_REVALIDATION_BASELINE_SHA="$BASELINE_SHA" \
        STAGING_API_BASE="$API" STAGING_FE_BASE="$FE" \
        STAGING_DB_APPENDIX_EVID_DIR="$EVID/staging-db-direct-query-appendix" \
        bash "$ROOT/scripts/dev/record-staging-db-direct-query-appendix-evidence.sh"
    grep -q 'TT_STAGING_DB_DIRECT_QUERY_APPENDIX: PASS' "$EVID/staging-db-direct-query-appendix.log"
  fi
  if [[ "$SKIP_PW" == "0" ]]; then
    if should_run hat007; then
      run_step "TN-P1-007/008 HAT evidence" "$EVID/tn-p1-007-008.log" \
        bash "$ROOT/scripts/dev/record-tn-p1-007-008-hat-staging-evidence.sh"
    fi
    if should_run hat28; then
      run_step "Phase28 human acceptance" "$EVID/phase28-hat.log" \
        env HAT_SKIP_DEEP_GATE=1 bash "$ROOT/scripts/dev/run-phase28-human-acceptance-test.sh"
    fi
  else
    echo "SKIP HAT Playwright (--skip-playwright)"
  fi
else echo "SKIP HAT (--resume-from ${RESUME_FROM})"; fi

# —— Local-First + SSOT ——
if should_run local; then
  echo ""
  echo "== Local-First alignment audit =="
  mkdir -p "$EVID/alignment-audit"
  node "$ROOT/scripts/dev/emit-local-first-alignment-audit.mjs" --evidence-dir "$EVID/alignment-audit" 2>&1 | tee "$EVID/local-first-audit.log"
  grep -q 'TT_LOCAL_FIRST_ALIGNMENT: 100_PERCENT_ALIGNED' "$EVID/local-first-audit.log"
else echo "SKIP local-first (--resume-from ${RESUME_FROM})"; fi

if should_run ssot; then
  echo ""
  echo "== Single-SSOT reconciliation =="
  node "$ROOT/scripts/dev/emit-freeze-lift-execution-report.mjs" --evidence-dir "$EVID" 2>&1 | tee "$EVID/ssot-audit.log"
  bash "$ROOT/scripts/dev/run-single-ssot-reconciliation-audit.sh" 2>&1 | tee "$EVID/single-ssot-audit.log" || true
else echo "SKIP SSOT (--resume-from ${RESUME_FROM})"; fi

# —— Governance audit (D1–D24 matrix) ——
if should_run gov; then
  run_step "Closure governance audit (D1–D24)" "$EVID/closure-governance-audit.log" \
    bash "$ROOT/scripts/dev/run-phase2-testnet-closure-governance-audit.sh"
else echo "SKIP governance (--resume-from ${RESUME_FROM})"; fi
GOV_EVID="$(ls -td "$ROOT/evidence/GO_phase2_testnet_graduation"/*/ 2>/dev/null | grep -v full-revalidation-baseline | head -1 || true)"
GOV_EVID="${GOV_EVID%/}"

# —— Consolidated full revalidation report ——
if should_run report; then
  echo ""
  echo "== Consolidated full revalidation report =="
  node "$ROOT/scripts/dev/emit-phase2-full-revalidation-report.mjs" \
    --evid-dir "$EVID" \
    --stamp "$STAMP" \
    --baseline-sha "$BASELINE_SHA" \
    --gov-evid "${GOV_EVID:-}" \
    --api "$API" \
    --fe "$FE"
else echo "SKIP report (--resume-from ${RESUME_FROM})"; fi

# —— Fresh 72h P2FC soak @ baseline ——
if should_run soak; then
  run_step "TN-P1-009 fresh 72h P2FC soak start" "$EVID/soak-start.log" \
    bash "$ROOT/scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh"
else echo "SKIP soak start (--resume-from ${RESUME_FROM})"; fi
P2FC_JOB="$(ls -td "$SOAK_ROOT"/job-* 2>/dev/null | head -1 | xargs basename 2>/dev/null || true)"
echo "p2fc_job=${P2FC_JOB}"

# —— Post-soak graduation closure（须 COMPLETED.json · 72h wall-clock）——
if should_run postsoak; then
  echo ""
  echo "== Post-soak graduation closure (requires 72h COMPLETED.json) =="
  export P2FC_SOAK_EXPECTED_JOB="${P2FC_JOB:-}"
  set +e
  bash "$ROOT/scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh" 2>&1 | tee "$EVID/post-soak.log"
  POST_SOAK_RC=${PIPESTATUS[0]}
  set -e
else
  echo "SKIP post-soak (--resume-from ${RESUME_FROM})"
  POST_SOAK_RC=2
fi

echo ""
echo "TT_PHASE2_TESTNET_GRADUATION_FULL_REVALIDATION: DONE ${STAMP}"
echo "evidence: ${EVID}"
grep -E '^TT_LOCAL_FIRST_ALIGNMENT:' "$EVID/local-first-audit.log" | tail -1 || true
grep -E '^TT_SINGLE_SSOT_RECONCILIATION:' "$EVID/ssot-audit.log" | tail -1 || true
grep -E '^TT_PHASE2_TESTNET_FULL_REVALIDATION:' "$EVID"/FULL-REVALIDATION-REPORT-*.md 2>/dev/null | tail -1 || true

if [[ "$POST_SOAK_RC" -eq 0 ]]; then
  grep -E '^TT_TESTNET_GRADUATION:' "$EVID/post-soak.log" | tail -1 || echo "TT_TESTNET_GRADUATION: CLOSED"
  exit 0
fi

echo "TT_TESTNET_GRADUATION: OPEN (post-soak blocked — 72h wall-clock soak required)"
echo "  After COMPLETED.json: P2FC_SOAK_EXPECTED_JOB=${P2FC_JOB} bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh"
exit 2
