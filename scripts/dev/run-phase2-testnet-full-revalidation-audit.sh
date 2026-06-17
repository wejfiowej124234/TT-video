#!/usr/bin/env bash
# SUPERSEDED · Phase ② · Testnet Full Re-Validation Audit（RECONCILED 基线 · 不继承旧 SHA 结论）
#
# **毕业序 SSOT：** `scripts/dev/run-phase2-graduation-closure-program.sh`
# TESTNET_STAGING_FREEZE ACTIVE 时默认 exit 2 · Owner 取证：`LEGACY_ORCHESTRATOR_OK=1`
#
#   bash scripts/dev/run-phase2-testnet-full-revalidation-audit.sh
#   bash scripts/dev/run-phase2-testnet-full-revalidation-audit.sh --skip-playwright
#   bash scripts/dev/run-phase2-testnet-full-revalidation-audit.sh --skip-evidence-record
#
# SSOT baseline: staging /meta.build.git_sha (= RECONCILED deploy SHA)
# 诚实边界：② full re-validation ≠ TT_TESTNET_GRADUATION:CLOSED（须 G-06 soak + G-09）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-legacy-orchestrator-guard.sh
source "$ROOT/scripts/dev/lib/phase2-legacy-orchestrator-guard.sh"
phase2_legacy_orchestrator_guard "$ROOT" "$(basename "$0")" || exit $?

SKIP_PW=0
SKIP_RECORD=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-playwright) SKIP_PW=1; shift ;;
    --skip-evidence-record) SKIP_RECORD=1; shift ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_graduation/full-revalidation-${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/full-revalidation-${STAMP}.log"
exec > >(tee -a "$LOG") 2>&1

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
FE="${FE%/}"

export OPEN_TESTNET_P0_COUNT="${OPEN_TESTNET_P0_COUNT:-0}"
export OPEN_TESTNET_P1_COUNT="${OPEN_TESTNET_P1_COUNT:-0}"
export TT_PHASE2_READINESS="${TT_PHASE2_READINESS:-100}"
export PHASE2_FULL_REVALIDATION=1
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev,localhost,127.0.0.1"

echo "TT_PHASE2_TESTNET_FULL_REVALIDATION_AUDIT: START ${STAMP}"

# —— Phase 0: RECONCILED baseline gate ——
if ! curl --noproxy "*" -sS --max-time 45 "${API}/meta" >"$EVID/baseline-meta.json"; then
  echo '{"error":"meta_fetch_failed"}' >"$EVID/baseline-meta.json"
fi
BASELINE_SHA="$(node -e "const j=require('fs').readFileSync(process.argv[1],'utf8'); const m=JSON.parse(j); console.log(m.build?.git_sha||'');" "$EVID/baseline-meta.json")"
[[ -n "$BASELINE_SHA" ]] || { echo "FAIL: staging /meta git_sha empty" >&2; exit 2; }

RECON_JSON="$(ls -t "$ROOT/evidence/GO_phase2_testnet_graduation"/FREEZE-LIFT-EXECUTION-REPORT-*.json 2>/dev/null | head -1 || true)"
RECON_SHA=""
if [[ -n "$RECON_JSON" && -f "$RECON_JSON" ]]; then
  RECON_SHA="$(node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(j.shas?.staging||'');" "$RECON_JSON")"
fi

node -e "
const fs=require('fs');
const stamp=process.argv[1], baseline=process.argv[2], recon=process.argv[3], out=process.argv[4];
fs.writeFileSync(out, JSON.stringify({
  stamp, staging_git_sha: baseline, reconciled_report_sha: recon,
  reconciled_match: !recon || baseline===recon
}, null, 2)+'\n');
" "$STAMP" "$BASELINE_SHA" "$RECON_SHA" "$EVID/baseline-gate.json"

export PHASE2_EXPECT_GIT_SHA="$BASELINE_SHA"
export PHASE2_REVALIDATION_BASELINE_SHA="$BASELINE_SHA"

echo "baseline_sha=${BASELINE_SHA}"

# —— Phase 1: alignment + parity + spine ——
echo ""
echo "== Phase 1: staging alignment + API parity + Sepolia spine =="
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" 2>&1 | tee "$EVID/staging-web-alignment.log" || true
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/staging-api-parity-probe.py" 2>&1 | tee "$EVID/staging-api-parity.log" || true
if [[ -f "$ROOT/scripts/dev/phase2-sepolia-spine-audit.sh" ]]; then
  bash "$ROOT/scripts/dev/phase2-sepolia-spine-audit.sh" 2>&1 | tee "$EVID/sepolia-spine-audit.log" || true
fi

# —— Phase 2: TN-P1 / D6 / D24 evidence refresh (current baseline only) ——
if [[ "$SKIP_RECORD" != "1" ]]; then
  echo ""
  echo "== Phase 2: TN-P1-010 + D6 + D24 evidence refresh =="
  bash "$ROOT/scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh" 2>&1 | tee "$EVID/record-tn-p1-010.log" || true
  bash "$ROOT/scripts/dev/record-tn-p1-d6-reliability-surface-staging-evidence.sh" 2>&1 | tee "$EVID/record-tn-p1-d6.log" || true
  bash "$ROOT/scripts/dev/record-tn-p1-d24-surface-staging-evidence.sh" 2>&1 | tee "$EVID/record-tn-p1-d24.log" || true
else
  echo "SKIP evidence record (--skip-evidence-record)"
fi

# —— Phase 3: deep release gate + admin RBAC ——
echo ""
echo "== Phase 3: deep release gate + admin RBAC matrix =="
PHASE2_DEEP_GATE_OUT="$EVID/deep-release-gate" \
  bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" --expect-git-sha "$BASELINE_SHA" 2>&1 | tee "$EVID/deep-release-gate.log" || true

if [[ -f "$ROOT/scripts/gates/run-admin-rbac-staging-matrix.py" ]]; then
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/gates/run-admin-rbac-staging-matrix.py" 2>&1 | tee "$EVID/admin-rbac-matrix.log" || true
fi

# —— Phase 4: human acceptance (Playwright) ——
if [[ "$SKIP_PW" != "1" ]]; then
  echo ""
  echo "== Phase 4: Phase28 human acceptance (browser) =="
  HAT_OUT="$EVID/phase28-human-acceptance" \
    HAT_SKIP_DEEP_GATE=1 \
    bash "$ROOT/scripts/dev/run-phase28-human-acceptance-test.sh" 2>&1 | tee "$EVID/phase28-hat.log" || true
else
  echo "SKIP Playwright HAT (--skip-playwright)"
fi

# —— Phase 5: closure governance audit (G×A · D1–D24 · graduation matrix) ——
echo ""
echo "== Phase 5: closure governance audit =="
bash "$ROOT/scripts/dev/run-phase2-testnet-closure-governance-audit.sh" 2>&1 | tee "$EVID/closure-governance-audit.log" || true
GOV_EVID="$(ls -td "$ROOT/evidence/GO_phase2_testnet_graduation"/*/ 2>/dev/null | grep -v full-revalidation | head -1 || true)"
GOV_EVID="${GOV_EVID%/}"
if [[ -n "$GOV_EVID" && -d "$GOV_EVID" ]]; then
  cp -r "$GOV_EVID"/* "$EVID/governance-audit-snapshot/" 2>/dev/null || mkdir -p "$EVID/governance-audit-snapshot" && cp -r "$GOV_EVID"/* "$EVID/governance-audit-snapshot/" 2>/dev/null || true
fi

# —— Phase 6: consolidated report ——
echo ""
echo "== Phase 6: consolidated full re-validation report =="
node "$ROOT/scripts/dev/emit-phase2-full-revalidation-report.mjs" \
  --evid-dir "$EVID" \
  --stamp "$STAMP" \
  --baseline-sha "$BASELINE_SHA" \
  --gov-evid "${GOV_EVID:-}" \
  --api "$API" \
  --fe "$FE"

echo ""
echo "TT_PHASE2_TESTNET_FULL_REVALIDATION_AUDIT: DONE ${STAMP}"
echo "evidence: ${EVID}"
grep -E '^TT_PHASE2_TESTNET_FULL_REVALIDATION:' "$EVID"/FULL-REVALIDATION-REPORT-*.md 2>/dev/null | tail -1 || true
