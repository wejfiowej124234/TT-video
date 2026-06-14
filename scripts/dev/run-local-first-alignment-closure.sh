#!/usr/bin/env bash
# Local-First 100% Alignment Closure · WT = sole SSOT
#
#   bash scripts/dev/run-local-first-alignment-closure.sh
#   bash scripts/dev/run-local-first-alignment-closure.sh --skip-deploy
#   bash scripts/dev/run-local-first-alignment-closure.sh --skip-evidence
#
# Sequence: supersede soak → deploy → evidence @ HEAD → LOCAL_FIRST 100% → fresh 72h → graduation audit
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SKIP_DEPLOY=0
SKIP_EVIDENCE=0
for arg in "$@"; do
  case "$arg" in
    --skip-deploy) SKIP_DEPLOY=1 ;;
    --skip-evidence) SKIP_EVIDENCE=1 ;;
  esac
done

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_graduation/local-first-closure-${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
FE="${FE%/}"
export STAGING_API_BASE="$API"
export STAGING_FE_BASE="$FE"
export STAGING_WEB_BASE="$FE"

HEAD_SHA="$(git rev-parse HEAD)"
export PHASE2_EXPECT_GIT_SHA="$HEAD_SHA"
export PHASE2_SSOT_BASELINE_SHA="$HEAD_SHA"
export PHASE2_REVALIDATION_BASELINE_SHA="$HEAD_SHA"

echo "TT_LOCAL_FIRST_ALIGNMENT_CLOSURE: START ${STAMP}"
echo "HEAD=${HEAD_SHA}"

# —— 0 · closure WT must be committed ——
CLOSURE_DIRTY="$(git status --porcelain \
  scripts/dev/run-phase2-final-single-ssot-reconciliation.sh \
  scripts/dev/run-local-first-alignment-closure.sh \
  scripts/dev/emit-freeze-lift-execution-report.mjs \
  scripts/dev/emit-local-first-alignment-audit.mjs \
  scripts/dev/lib/staging-adm-u01-env.sh \
  scripts/gates/run-admin-rbac-staging-matrix.py \
  frontend/e2e/helpers/adminCapabilitiesSession.ts 2>/dev/null | wc -l | tr -d ' ' || true)"
if [[ "${CLOSURE_DIRTY:-0}" != "0" ]]; then
  echo "FAIL: closure-critical paths still dirty — commit WT before closure" >&2
  git status --porcelain scripts frontend/e2e/helpers/adminCapabilitiesSession.ts >&2 || true
  exit 2
fi

DEPLOY_NON_E2E="$(git status --porcelain | awk '{print $2}' | grep -E '^(crates/|frontend/|contracts/|registry/|deploy/)' | grep -v '^frontend/e2e/' | wc -l | tr -d ' ' || true)"
if [[ "${DEPLOY_NON_E2E:-0}" != "0" ]]; then
  echo "FAIL: ${DEPLOY_NON_E2E} non-e2e deploy-SSOT paths dirty" >&2
  exit 2
fi

# —— 1 · supersede pre-alignment soak ——
echo ""
echo "== Phase 1: supersede pre-alignment P2FC soak jobs =="
SOAK_ROOT="$ROOT/evidence/P2FC_SOAK_72H_STAGING"
ARCHIVE_SOAK="$SOAK_ROOT/archive/superseded-pre-local-first-${STAMP}"
mkdir -p "$ARCHIVE_SOAK"
for job in "$SOAK_ROOT"/job-*; do
  [[ -d "$job" ]] || continue
  if [[ -f "$job/pid.txt" ]]; then
    pid="$(cat "$job/pid.txt" 2>/dev/null || true)"
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
    rm -f "$job/pid.txt"
  fi
  echo "{\"superseded_at\":\"${STAMP}\",\"reason\":\"local-first-100-alignment-closure\",\"baseline_sha\":\"${HEAD_SHA}\"}" \
    >"$job/SUPERSEDED.json"
  mv "$job" "$ARCHIVE_SOAK/" 2>/dev/null || true
done
rm -f "$SOAK_ROOT/COMPLETED.json" 2>/dev/null || true
echo "soak-supersede: → $ARCHIVE_SOAK"

# —— 2 · deploy API + Web @ HEAD ——
if [[ "$SKIP_DEPLOY" == "0" ]]; then
  echo ""
  echo "== Phase 2: deploy tt-api-staging + tt-web-staging @ HEAD =="
  export TESTNET_FREEZE_OVERRIDE=1
  export TRAVELTRUST_GIT_SHA="$HEAD_SHA"
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" 2>&1 | tee "$EVID/deploy-api.log"
  if ! TESTNET_FREEZE_OVERRIDE=1 FLY_WEB_OOM_FIX=1 FLY_WEB_REMOTE_BUILD=1 \
    BUILD_NODE_MAX_OLD_SPACE_SIZE=6144 FLY_WEB_BUILDER_MEMORY_MB=8192 \
    bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee "$EVID/deploy-web.log"; then
    TESTNET_FREEZE_OVERRIDE=1 bash "$ROOT/scripts/dev/tt-web-staging-oom-fix-deploy.sh" 2>&1 | tee -a "$EVID/deploy-web.log"
  fi
  sleep 20
fi

curl --noproxy "*" -sS --max-time 45 "${API}/meta" >"$ROOT/evidence/.tmp-ssot-meta.json"
curl --noproxy "*" -sS --max-time 45 "${FE}/meta" >"$ROOT/evidence/.tmp-ssot-web-meta.json"
STAGING_SHA="$(node -e "const j=JSON.parse(require('fs').readFileSync('evidence/.tmp-ssot-meta.json','utf8')); console.log(j.build?.git_sha||'');")"
WEB_SHA="$(node -e "const j=JSON.parse(require('fs').readFileSync('evidence/.tmp-ssot-web-meta.json','utf8')); console.log(j.build?.git_sha||'');")"
echo "HEAD=${HEAD_SHA} api=${STAGING_SHA} web=${WEB_SHA}"
[[ "$HEAD_SHA" == "$STAGING_SHA" && "$HEAD_SHA" == "$WEB_SHA" ]] || {
  echo "FAIL: HEAD != staging meta after deploy" >&2
  exit 2
}

if [[ "$SKIP_EVIDENCE" == "0" ]]; then
  echo ""
  echo "== Phase 3: TN-P1-010 =="
  bash "$ROOT/scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh" 2>&1 | tee "$EVID/tn-p1-010.log"

  echo ""
  echo "== Phase 4: D24 =="
  bash "$ROOT/scripts/dev/record-tn-p1-d24-surface-staging-evidence.sh" 2>&1 | tee "$EVID/tn-p1-d24.log"

  echo ""
  echo "== Phase 5: D6 =="
  bash "$ROOT/scripts/dev/record-tn-p1-d6-reliability-surface-staging-evidence.sh" 2>&1 | tee "$EVID/tn-p1-d6.log"

  echo ""
  echo "== Phase 6: ADM-U01 formal archive =="
  REPO_ROOT="$ROOT" ADM_U01_RUN_ID="run_local_first_${STAMP}" \
    bash "$ROOT/scripts/dev/record-adm-u01-staging-evidence.sh" 2>&1 | tee "$EVID/adm-u01.log"

  echo ""
  echo "== Phase 7: Deep Release Gate (G04 inline) =="
  REPO_ROOT="$ROOT" bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" \
    --expect-git-sha "$HEAD_SHA" 2>&1 | tee "$EVID/deep-gate.log"
  grep -q 'TT_PHASE2_DEEP_RELEASE_GATE: PASS' "$EVID/deep-gate.log" || exit 2

  echo ""
  echo "== Phase 8: Phase28 HAT =="
  bash "$ROOT/scripts/dev/run-phase28-human-acceptance-test.sh" 2>&1 | tee "$EVID/hat.log"
fi

echo ""
echo "== Phase 9: Local-First alignment audit =="
node "$ROOT/scripts/dev/emit-local-first-alignment-audit.mjs" --evidence-dir "$EVID/alignment-audit" 2>&1 | tee "$EVID/local-first-audit.log"
grep -q 'TT_LOCAL_FIRST_ALIGNMENT: 100_PERCENT_ALIGNED' "$EVID/local-first-audit.log" || exit 2

echo ""
echo "== Phase 10: Single-SSOT reconciliation =="
node "$ROOT/scripts/dev/emit-freeze-lift-execution-report.mjs" --evidence-dir "$EVID" 2>&1 | tee "$EVID/ssot-audit.log"
bash "$ROOT/scripts/dev/run-single-ssot-reconciliation-audit.sh" 2>&1 | tee "$EVID/single-ssot-audit.log" || true

echo ""
echo "== Phase 11: fresh 72h P2FC soak @ aligned HEAD =="
bash "$ROOT/scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh" 2>&1 | tee "$EVID/soak-start.log"

echo ""
echo "== Phase 12: graduation governance audit =="
bash "$ROOT/scripts/dev/run-phase2-testnet-closure-governance-audit.sh" 2>&1 | tee "$EVID/graduation-audit.log"

echo ""
echo "== Phase 13: post-soak graduation closure (requires COMPLETED.json) =="
P2FC_SOAK_EXPECTED_JOB="$(ls -td "$SOAK_ROOT"/job-* 2>/dev/null | head -1 | xargs basename 2>/dev/null || true)"
export P2FC_SOAK_EXPECTED_JOB
bash "$ROOT/scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh" 2>&1 | tee "$EVID/post-soak.log" || true

echo ""
echo "TT_LOCAL_FIRST_ALIGNMENT_CLOSURE: DONE ${STAMP}"
grep -E '^TT_LOCAL_FIRST_ALIGNMENT:' "$EVID/local-first-audit.log" | tail -1
grep -E '^TT_SINGLE_SSOT_RECONCILIATION:' "$EVID/ssot-audit.log" | tail -1 || true
echo "evidence: ${EVID}"
