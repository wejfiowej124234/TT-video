#!/usr/bin/env bash
# Phase② · Final Single-SSOT Reconciliation（WT → Commit → Staging → Evidence）
#
#   bash scripts/dev/run-phase2-final-single-ssot-reconciliation.sh
#   bash scripts/dev/run-phase2-final-single-ssot-reconciliation.sh --skip-deploy
#   bash scripts/dev/run-phase2-final-single-ssot-reconciliation.sh --skip-evidence
#
# Target: TT_SINGLE_SSOT_RECONCILIATION: RECONCILED_100_PERCENT
# Then: run-phase2-testnet-closure-governance-audit.sh (final graduation audit)
#
# 诚实边界：RECONCILED_100_PERCENT ≠ TT_TESTNET_GRADUATION:CLOSED（须 72h soak + G-09）
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
EVID="$ROOT/evidence/GO_phase2_testnet_graduation/final-ssot-reconciliation-${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/run-${STAMP}.log"
exec > >(tee -a "$LOG") 2>&1

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
FE="${FE%/}"

echo "TT_PHASE2_FINAL_SINGLE_SSOT_RECONCILIATION: START ${STAMP}"

# —— 0 · WT deploy-SSOT gate ——
SSOT_DIRTY="$(git status --porcelain | awk '{print $2}' | grep -E '^(crates/|frontend/|contracts/|registry/|deploy/)' | wc -l | tr -d ' ')"
if [[ "$SSOT_DIRTY" != "0" ]]; then
  echo "FAIL: ${SSOT_DIRTY} deploy-SSOT paths dirty — commit WT before reconciliation" >&2
  git status --porcelain | awk '{print $2}' | grep -E '^(crates/|frontend/|contracts/|registry/|deploy/)' | head -20 >&2 || true
  exit 2
fi

HEAD_SHA="$(git rev-parse HEAD)"
export PHASE2_EXPECT_GIT_SHA="$HEAD_SHA"
export PHASE2_REVALIDATION_BASELINE_SHA="$HEAD_SHA"

curl --noproxy "*" -sS --max-time 45 "${API}/meta" >"$EVID/baseline-meta-pre.json" || true

# —— 1 · Deploy API + Web (same commit) ——
if [[ "$SKIP_DEPLOY" == "0" ]]; then
  echo ""
  echo "== Phase 1: deploy tt-api-staging + tt-web-staging (TESTNET_FREEZE_OVERRIDE=1) =="
  export TESTNET_FREEZE_OVERRIDE=1
  export TRAVELTRUST_GIT_SHA="$HEAD_SHA"
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" 2>&1 | tee "$EVID/deploy-api.log"
  TESTNET_FREEZE_OVERRIDE=1 TRAVELTRUST_GIT_SHA="$HEAD_SHA" \
    bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee "$EVID/deploy-web.log"
  sleep 15
fi

curl --noproxy "*" -sS --max-time 45 "${API}/meta" >"$EVID/baseline-meta-post.json"
STAGING_SHA="$(node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(j.build?.git_sha||'');" "$EVID/baseline-meta-post.json")"
echo "HEAD=${HEAD_SHA} staging=${STAGING_SHA}"

if [[ "$HEAD_SHA" != "$STAGING_SHA" ]]; then
  echo "WARN: HEAD != staging /meta git_sha after deploy — check TRAVELTRUST_GIT_SHA injection" >&2
fi

# —— 2 · Evidence chain (same SHA · do not inherit old conclusions) ——
if [[ "$SKIP_EVIDENCE" == "0" ]]; then
  echo ""
  echo "== Phase 2: TN-P1-010 indexer reconcile =="
  bash "$ROOT/scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh" 2>&1 | tee "$EVID/tn-p1-010.log" || true

  echo ""
  echo "== Phase 3: D24 surface evidence =="
  bash "$ROOT/scripts/dev/record-tn-p1-d24-surface-staging-evidence.sh" 2>&1 | tee "$EVID/tn-p1-d24.log"

  echo ""
  echo "== Phase 4: D6 reliability surface evidence =="
  bash "$ROOT/scripts/dev/record-tn-p1-d6-reliability-surface-staging-evidence.sh" 2>&1 | tee "$EVID/tn-p1-d6.log"

  echo ""
  echo "== Phase 5: ADM-U01 + Deep Release Gate =="
  REPO_ROOT="$ROOT" source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
  staging_adm_u01_prepare_dsn || true
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/gates/run-admin-rbac-staging-matrix.py" 2>&1 | tee "$EVID/adm-u01.log"
  REPO_ROOT="$ROOT" bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" \
    --expect-git-sha "$HEAD_SHA" 2>&1 | tee "$EVID/deep-release-gate.log"

  echo ""
  echo "== Phase 6: Phase28 HAT =="
  bash "$ROOT/scripts/dev/run-phase28-human-acceptance-test.sh" 2>&1 | tee "$EVID/phase28-hat.log"

  echo ""
  echo "== Phase 7: supersede prior soak · start fresh 72h P2FC =="
  bash "$ROOT/scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh" 2>&1 | tee "$EVID/tn-p1-009-soak-start.log"
fi

# —— 3 · Single-SSOT audit (RECONCILED_100_PERCENT) ——
echo ""
echo "== Phase 8: Single-SSOT reconciliation audit =="
curl --noproxy "*" -sS --max-time 45 "${API}/meta" >"$ROOT/evidence/.tmp-ssot-meta.json"
node "$ROOT/scripts/dev/emit-freeze-lift-execution-report.mjs" --evidence-dir "$EVID" 2>&1 | tee "$EVID/single-ssot-audit.log"

# —— 4 · Final graduation audit ——
echo ""
echo "== Phase 9: closure governance audit (final graduation audit) =="
bash "$ROOT/scripts/dev/run-phase2-testnet-closure-governance-audit.sh" 2>&1 | tee "$EVID/closure-governance-audit.log"

VERDICT="$(grep -E '^TT_SINGLE_SSOT_RECONCILIATION:' "$EVID/single-ssot-audit.log" | tail -1 || true)"
echo ""
echo "TT_PHASE2_FINAL_SINGLE_SSOT_RECONCILIATION: DONE ${STAMP}"
echo "${VERDICT:-TT_SINGLE_SSOT_RECONCILIATION: UNKNOWN}"
echo "evidence: ${EVID}"
