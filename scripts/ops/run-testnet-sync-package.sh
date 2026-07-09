#!/usr/bin/env bash
# TESTNET_SYNC_PACKAGE · 本地 HEAD → 测试网覆盖式对齐（不重置 DB · 不重跑全量 GATE）
#
# 基线真源：GATE-P1-01 = 25/25 GREEN + phase1_closed（禁止 run-site10 全链重跑）
#
#   bash scripts/ops/run-testnet-sync-package.sh --preflight
#   TESTNET_FREEZE_OVERRIDE=1 bash scripts/ops/run-testnet-sync-package.sh --deploy
#   bash scripts/ops/run-testnet-sync-package.sh --parity
#   TESTNET_MANUAL_VERIFY_PASS=1 bash scripts/ops/run-testnet-sync-package.sh --freeze-soak
#   TESTNET_FREEZE_OVERRIDE=1 bash scripts/ops/run-testnet-sync-package.sh --through-parity
#
# 末行：TT_TESTNET_SYNC_PACKAGE: PASS|PARTIAL|BLOCKED|FAIL
#
# 三态治理（须先分类）：bash scripts/ops/run-deployment-three-state.sh <sync|fix|freeze> …
# SSOT: docs/runbook/TT-DEPLOYMENT-THREE-STATE-GOVERNANCE.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export DEPLOYMENT_THREE_STATE_ROOT="$ROOT"
# shellcheck source=lib/deployment-three-state-lib.sh
source "$ROOT/scripts/ops/lib/deployment-three-state-lib.sh"
PKG_DIR="${TESTNET_SYNC_PACKAGE_DIR:-$ROOT/evidence/TESTNET_SYNC_PACKAGE}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$PKG_DIR/$STAMP"
SITE10_LOG="$ROOT/frontend/evidence/GO_local_phase1/site10-p1-slices-recheck.latest.log"
GATE_EVID="$ROOT/evidence/COMPLEXITY_CONVERGENCE/GATE-P1-01/phase1.closed.json"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API="${API%/}"
WEB="${WEB%/}"

export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:15715}"
export HTTP_PROXY="${HTTP_PROXY:-$HTTPS_PROXY}"
export NO_PROXY="${NO_PROXY:-localhost,127.0.0.1,tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev}"

DO_PREFLIGHT=0
DO_DEPLOY=0
DO_PARITY=0
DO_FREEZE_SOAK=0
THROUGH_PARITY=0

usage() {
  sed -n '2,16p' "$0" | sed 's/^# \?//'
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --preflight) DO_PREFLIGHT=1; shift ;;
    --deploy) DO_DEPLOY=1; shift ;;
    --parity) DO_PARITY=1; shift ;;
    --freeze-soak) DO_FREEZE_SOAK=1; shift ;;
    --through-parity) THROUGH_PARITY=1; DO_DEPLOY=1; DO_PARITY=1; shift ;;
    -h|--help) usage ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ "$DO_PREFLIGHT$DO_DEPLOY$DO_PARITY$DO_FREEZE_SOAK$THROUGH_PARITY" != "00000" ]] || DO_PREFLIGHT=1

mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

fail() { echo "TT_TESTNET_SYNC_PACKAGE: FAIL $*" >&2; exit 2; }
blocked() { echo "TT_TESTNET_SYNC_PACKAGE: BLOCKED $*" >&2; exit 3; }

LOCAL_SHA="$(git -C "$ROOT" rev-parse HEAD)"
echo "== TESTNET_SYNC_PACKAGE · $STAMP · baseline_sha=${LOCAL_SHA} =="
echo "policy: overlay deploy · preserve DB · no full GATE · no testnet rebuild"

assert_gate_p1_baseline() {
  echo "=== Baseline · GATE-P1-01 (唯一真源) ==="
  [[ -f "$SITE10_LOG" ]] || fail "missing $SITE10_LOG"
  grep -q "summary pass=25 fail=0" "$SITE10_LOG" 2>/dev/null || {
    local pc fc
    pc="$(grep -c RECHECK_PASS "$SITE10_LOG" 2>/dev/null || echo 0)"
    fc="$(grep -c RECHECK_FAIL "$SITE10_LOG" 2>/dev/null || echo 0)"
    [[ "$pc" -ge 25 && "$fc" -eq 0 ]] || fail "GATE-P1-01 not 25/25 (pass=$pc fail=$fc)"
  }
  [[ -f "$GATE_EVID" ]] || fail "missing $GATE_EVID — run close with --gate-passed (no re-run)"
  echo "  GATE-P1-01: 25/25 + phase1.closed OK"
  echo "  FORBIDDEN: run-site10-p1-slices-recheck-sequential.sh"
}

run_deploy_overlay() {
  echo "=== Deploy · overlay (preserve staging data) ==="
  # shellcheck source=scripts/ops/lib/deploy-governance-phase3-guard.sh
  source "$ROOT/scripts/ops/lib/deploy-governance-phase3-guard.sh"
  deploy_governance_phase3_assert_s5_allowed "$ROOT"
  [[ "${TESTNET_FREEZE_OVERRIDE:-}" == "1" ]] || blocked "set TESTNET_FREEZE_OVERRIDE=1 for overlay deploy"
  bash "$ROOT/scripts/dev/lift-testnet-staging-freeze.sh" \
    --reason "TESTNET_SYNC_PACKAGE overlay @ ${LOCAL_SHA}" 2>&1 | tee -a "$EVID/lift-freeze.log" || true

  echo "-- SSOT / contract registry --"
  bash "$ROOT/scripts/dev/phase2-staging-merge-sepolia-env.sh" 2>&1 | tee "$EVID/sepolia-merge.log"
  python "$ROOT/scripts/dev/validate-ttg-governance-cert-gates-registry.py" 2>&1 | tee "$EVID/registry-validate.log"
  python "$ROOT/scripts/dev/assert-ttg-stats-triple-sync.py" 2>&1 | tee "$EVID/stats-triple-sync.log"

  echo "-- feature flags + fly secrets (no PRIVATE_KEY) --"
  command -v fly >/dev/null 2>&1 || fail "fly CLI missing"
  fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" --secrets-only 2>&1 | tee "$EVID/fly-secrets.log"

  echo "-- API + Web overlay deploy (forward migrations on boot · no DB wipe) --"
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" 2>&1 | tee "$EVID/fly-api-deploy.log"
  FLY_WEB_NO_CACHE=1 bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee "$EVID/fly-web-deploy.log"

  node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.testnet_sync_package_deploy.v1',
  completed_at_utc:new Date().toISOString(),
  git_sha:process.argv[2],
  mode:'overlay',
  db_policy:'forward_migrations_only_no_reset',
  api:process.argv[3],
  web:process.argv[4],
},null,2)+'\n');
" "$EVID/deploy-complete.json" "$LOCAL_SHA" "$API" "$WEB"
  echo "TT_TESTNET_SYNC_PACKAGE_DEPLOY: PASS sha=${LOCAL_SHA}"
}

fetch_api_sha() {
  curl --noproxy "*" -sS --max-time 45 "${API}/meta" 2>/dev/null \
    | python -c "import json,sys; d=json.load(sys.stdin); print((d.get('build') or {}).get('git_sha',''))" 2>/dev/null || echo ""
}

run_parity_minimal() {
  echo "=== Parity · minimal (零漂移探测) ==="
  assert_gate_p1_baseline

  echo "-- route manifest (04 §3.4) --"
  bash "$ROOT/scripts/run-check-04-routes.sh" 2>&1 | tee "$EVID/04-routes.log"

  echo "-- contract matrix (local · BOOK-P0-04 同源) --"
  cargo test -p traveltrust-api matrix_93 -- --test-threads=1 2>&1 | tee "$EVID/matrix_93.log" | tail -5

  echo "-- booking core smoke (① 代码 · 非 staging GO 冒充) --"
  bash "$ROOT/scripts/dev/smoke-order-escrow-dispute-p0-local.sh" 2>&1 | tee "$EVID/oed-p0-smoke.log" | tail -8
  bash "$ROOT/scripts/dev/run-web3-itinerary-l5-green.sh" 2>&1 | tee "$EVID/web3-l5-green.log" | tail -5

  echo "-- SSOT diff (staging meta vs HEAD) --"
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-phase2-baseline-consistency-audit.py" \
    --expect-sha "$LOCAL_SHA" 2>&1 | tee "$EVID/baseline-audit.log" || true
  AUDIT_DIR="$(ls -td "$ROOT/evidence/GO_phase2_baseline_consistency_audit"/*/ 2>/dev/null | head -1 || true)"

  API_SHA="$(fetch_api_sha)"
  SHA_MATCH=no
  [[ "$LOCAL_SHA" == "$API_SHA" && -n "$API_SHA" ]] && SHA_MATCH=yes
  echo "local_sha=${LOCAL_SHA}" >"$EVID/sha-parity.txt"
  echo "api_staging_sha=${API_SHA}" >>"$EVID/sha-parity.txt"
  echo "sha_hard_match=${SHA_MATCH}" >>"$EVID/sha-parity.txt"

  ZERO_DRIFT=false
  [[ "$SHA_MATCH" == "yes" ]] && ZERO_DRIFT=true
  if [[ -n "$AUDIT_DIR" && -f "${AUDIT_DIR%/}/audit.json" ]]; then
    cp "${AUDIT_DIR%/}/audit.json" "$EVID/baseline-audit.json"
    grep -q '"sha_hard_match": true' "$EVID/baseline-audit.json" 2>/dev/null && ZERO_DRIFT=true || ZERO_DRIFT=false
  fi

  node -e "
const fs=require('fs');
const p=process.argv[1];
fs.writeFileSync(p, JSON.stringify({
  schema:'traveltrust.testnet_sync_package_parity.v1',
  checked_at_utc:new Date().toISOString(),
  local_git_sha:process.argv[4],
  api_staging_git_sha:process.argv[5],
  sha_hard_match:process.argv[2]==='yes',
  zero_drift:process.argv[3]==='true',
  checks:['04_routes','matrix_93','oed_p0_smoke','web3_l5_green','baseline_consistency_audit'],
},null,2)+'\n');
" "$EVID/parity.json" "$SHA_MATCH" "$ZERO_DRIFT" "$LOCAL_SHA" "$API_SHA"

  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-testnet-sync-package-manifest.py" \
    --evidence-dir "$EVID" --parity-json "$EVID/parity.json" --deploy-mode overlay

  cat >"$EVID/MANUAL-VERIFY-CHECKLIST.md" <<MD
# TESTNET_SYNC_PACKAGE · 人工验证（② · staging）

**基线 SHA:** \`${LOCAL_SHA}\`
**诚实边界：** 通过本清单 **≠** ③ Production GO

## A · Booking Core（traveler → guide → order → escrow → completion）

1. 登录 staging 旅行者账号 → \`/market\` 或向导详情
2. 选择向导 → 创建订单 → 双边确认 → mock-pay / escrow 路径可达
3. 完成或 dispute 路径可浏览（只读验收即可）

## B · Itinerary（country → city → booking）

1. \`/\` 或 \`/market\`：选 **product_countries** 十国之一 + 预设 city
2. 创建行程 / 自定义行程 draft → 预览 → 订单草稿

## 签字后继续

\`\`\`bash
export TESTNET_MANUAL_VERIFY_PASS=1
bash scripts/ops/run-deployment-three-state.sh freeze --freeze-soak
\`\`\`
MD

  if [[ "$ZERO_DRIFT" == "true" ]]; then
    echo "TT_TESTNET_SYNC_PACKAGE_PARITY: PASS zero_drift=YES sha=${LOCAL_SHA}"
  else
    echo "TT_TESTNET_SYNC_PACKAGE_PARITY: PARTIAL sha_match=${SHA_MATCH} api_sha=${API_SHA}"
  fi
}

run_freeze_soak() {
  echo "=== Freeze Candidate + 72h Soak ==="
  [[ "${TESTNET_MANUAL_VERIFY_PASS:-}" == "1" ]] || blocked "complete MANUAL-VERIFY-CHECKLIST then TESTNET_MANUAL_VERIFY_PASS=1"

  AUDIT_DIR="$(ls -td "$ROOT/evidence/GO_phase2_baseline_consistency_audit"/*/ 2>/dev/null | head -1 || true)"
  [[ -n "$AUDIT_DIR" ]] || fail "missing baseline consistency audit — run --parity first"

  echo "-- Freeze Candidate manifest @ HEAD --"
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-freeze-candidate-manifest.py" \
    --build-log "$LOG" --alignment-report "${AUDIT_DIR%/}/AUDIT-REPORT.md" 2>&1 | tee "$EVID/freeze-candidate-manifest.log"

  bash "$ROOT/scripts/dev/engage-testnet-staging-baseline-freeze.sh" \
    --audit-evidence "${AUDIT_DIR%/}" \
    --reason "TESTNET_SYNC_PACKAGE manual verify PASS · GATE-P1-01 baseline · overlay @ HEAD" \
    2>&1 | tee "$EVID/engage-freeze.log"

  export P2FC_SOAK_SUPERSEDE=1
  bash "$ROOT/scripts/ops/p2fc-launch-staging-soak-72h.sh" 2>&1 | tee "$EVID/launch-soak.log"

  node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.testnet_sync_package_freeze_soak.v1',
  completed_at_utc:new Date().toISOString(),
  git_sha:process.argv[2],
  manual_verify_pass:true,
  soak_policy:'P2FC_SOAK_SUPERSEDE=1 read_only_no_redeploy',
},null,2)+'\n');
" "$EVID/freeze-soak-complete.json" "$LOCAL_SHA"

  echo "TT_TESTNET_SYNC_PACKAGE_FREEZE_SOAK: LAUNCHED sha=${LOCAL_SHA}"
  echo "  observe: bash scripts/ops/p2fc-soak-attest.sh"
}

[[ "$DO_PREFLIGHT" == "1" || "$DO_DEPLOY" == "1" || "$DO_PARITY" == "1" || "$DO_FREEZE_SOAK" == "1" ]] && assert_gate_p1_baseline

export DO_DEPLOY DO_FREEZE_SOAK
if [[ "$DO_DEPLOY" == "1" || "$DO_PARITY" == "1" || "$THROUGH_PARITY" == "1" ]]; then
  case "${DEPLOYMENT_STATE:-}" in
    sync|fix) deployment_three_state_assert_fly_allowed ;;
    freeze) deployment_three_state_blocked "freeze state forbids --deploy/--parity fly path" ;;
    *)
      deployment_three_state_blocked "set DEPLOYMENT_STATE=sync|fix via run-deployment-three-state.sh before deploy/parity"
      ;;
  esac
  [[ "${DEPLOYMENT_STATE}" != "fix" || "$DO_DEPLOY" != "1" ]] || deployment_three_state_assert_fix_preconditions
fi
if [[ "$DO_FREEZE_SOAK" == "1" ]]; then
  export DEPLOYMENT_STATE="${DEPLOYMENT_STATE:-freeze}"
  deployment_three_state_assert_declared
  [[ "${DEPLOYMENT_STATE}" == "freeze" ]] || deployment_three_state_blocked "--freeze-soak requires DEPLOYMENT_STATE=freeze"
  deployment_three_state_assert_no_mixed
fi
if [[ "$DO_PREFLIGHT" == "1" && "$DO_DEPLOY" != "1" && "$DO_PARITY" != "1" && "$DO_FREEZE_SOAK" != "1" ]]; then
  case "${DEPLOYMENT_STATE:-}" in
    sync|fix|freeze|'') ;;
    *) deployment_three_state_blocked "invalid DEPLOYMENT_STATE for preflight" ;;
  esac
  echo "=== Preflight ==="
  bash "$ROOT/scripts/run-check-04-routes.sh" >/dev/null 2>&1 && echo "  04 routes: OK" || echo "  04 routes: FAIL"
  API_SHA="$(fetch_api_sha)"
  echo "  staging_api_sha=${API_SHA:-unknown} local=${LOCAL_SHA}"
  fly auth whoami >/dev/null 2>&1 && echo "  fly: authenticated" || echo "  fly: not authenticated"
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-testnet-sync-package-manifest.py" --evidence-dir "$EVID"
  echo "TT_TESTNET_SYNC_PACKAGE: PREFLIGHT_OK evidence=$EVID"
  exit 0
fi

[[ "$DO_DEPLOY" == "1" ]] && run_deploy_overlay
[[ "$DO_PARITY" == "1" ]] && run_parity_minimal
[[ "$DO_FREEZE_SOAK" == "1" ]] && run_freeze_soak

echo "TT_TESTNET_SYNC_PACKAGE: PASS evidence=$EVID"
exit 0
