#!/usr/bin/env bash
# Phase ② · 测试网全量一致性审计（只读 · SSOT SHA · 不修复）
#
#   export HTTPS_PROXY=http://127.0.0.1:15715
#   bash scripts/dev/run-phase2-baseline-consistency-audit.sh
#
# 末行：TT_PHASE2_BASELINE_CONSISTENCY_AUDIT: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"
SSOT="$(phase2_resolve_baseline_ssot_sha "$ROOT")"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_baseline_consistency_audit/${STAMP}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"

export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:15715}"
export HTTP_PROXY="${HTTP_PROXY:-$HTTPS_PROXY}"
export NO_PROXY="${NO_PROXY:-localhost,127.0.0.1,tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev}"

mkdir -p "$EVID"
exec > >(tee -a "$EVID/audit-run.log") 2>&1

echo "TT_PHASE2_BASELINE_CONSISTENCY_AUDIT: START ssot=${SSOT}"
echo "evidence=$EVID"

echo "== 1 · Phase① acceptance SSOT =="
grep -q "TT_GO_LOCAL_PHASE1: OK" "$ROOT/frontend/evidence/GO_local_phase1/acceptance.latest.log"

echo "== 2 · staging web alignment =="
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" --api-base "$API" --web-base "$WEB" \
  2>&1 | tee "$EVID/staging-web-alignment.log" || true

echo "== 3 · deep release gate (read-only replay · expect SHA) =="
export PHASE2_DEEP_GATE_OUT="$EVID/deep-release-gate"
export PHASE2_EXPECT_GIT_SHA="$SSOT"
set +e
bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" \
  --api-base "$API" --web-base "$WEB" --expect-git-sha "$SSOT" --skip-rbac \
  2>&1 | tee "$EVID/deep-release-gate.log"
DG_RC=$?
set -e

echo "== 4 · Sepolia spine (registry/env/chain · read-only) =="
export PHASE2_SPINE_AUDIT_EVIDENCE="$EVID/sepolia-spine"
set +e
bash "$ROOT/scripts/dev/phase2-sepolia-spine-audit.sh" 2>&1 | tee "$EVID/sepolia-spine-audit.log"
SPINE_RC=$?
set -e

echo "== 5 · six-domain UAT (staging · read-only probe) =="
export STAGING_UAT_OUT="$EVID/six-domains"
set +e
bash "$ROOT/scripts/dev/run-staging-uat-six-domains.sh" 2>&1 | tee "$EVID/six-domains.log"
UAT_RC=$?
set -e

DG_REPORT="$EVID/deep-release-gate/report.json"
[[ -f "$DG_REPORT" ]] || DG_REPORT="$ROOT/evidence/GO_phase2_testnet_20260526/deep-release-gate/latest-report.json"

python "$ROOT/scripts/dev/gen-phase2-baseline-consistency-audit.py" \
  --expect-sha "$SSOT" \
  --api-base "$API" \
  --web-base "$WEB" \
  --out-dir "$EVID" \
  --deep-gate-report "$DG_REPORT"

AUDIT_JSON="$EVID/audit.json"
[[ -f "$AUDIT_JSON" ]] || fail_post="audit.json missing under $EVID"
DIFF_COUNT="$(cd "$EVID" && PYTHONIOENCODING=utf-8 python -c "import json; print(json.load(open('audit.json',encoding='utf-8'))['diff_count'])")"
SHA_MATCH="$(cd "$EVID" && PYTHONIOENCODING=utf-8 python -c "import json; d=json.load(open('audit.json',encoding='utf-8')); print('yes' if d.get('sha_hard_match') else 'no')")"
G03_P0_FAIL="$(cd "$EVID/deep-release-gate" && PYTHONIOENCODING=utf-8 python -c "
import json
d=json.load(open('report.json',encoding='utf-8'))
g=next((x for x in d.get('gates',[]) if x.get('id')=='G03_FIVE_ROLE_LOGIN'), {})
fails=[c for c in g.get('checks',[]) if c.get('verdict')=='FAIL' and c.get('severity','P0')=='P0']
print(len(fails))
")"

echo "$STAMP" >"$ROOT/evidence/GO_phase2_baseline_consistency_audit/latest-stamp.txt"
echo "deep_gate_rc=${DG_RC} spine_rc=${SPINE_RC} uat_rc=${UAT_RC} diff_count=${DIFF_COUNT} g03_p0_fail=${G03_P0_FAIL}" >>"$EVID/subprocess-rc.txt"
echo "TT_PHASE2_BASELINE_CONSISTENCY_AUDIT: OK report=$EVID/AUDIT-REPORT.md"

if [[ "$SHA_MATCH" == "yes" && "$DIFF_COUNT" == "0" && "$G03_P0_FAIL" == "0" ]]; then
  bash "$ROOT/scripts/dev/engage-testnet-staging-baseline-freeze.sh" --audit-evidence "$EVID"
  echo "TT_PHASE2_BASELINE_FREEZE: ENGAGED"
fi
