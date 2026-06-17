#!/usr/bin/env bash
# TESTNET-REALITY-UAT-SPRINT — 五角色真人全链路 · staging · 只登记 P0/P1 · 不新增功能
#
#   FREEZE_GIT_SHA=<ACTIVE.json git_sha> bash scripts/dev/record-testnet-reality-uat-sprint-evidence.sh
#
# 角色：游客 · 向导 · 商家 · 管理员 · 运营（P2HA 收购/运营 + FRCA 治理轨）
# 目标：TT_TESTNET_REALITY_UAT_GO 裁决（② testnet · ≠ ③ Production GO）
#
# 可选：
#   REALITY_UAT_SKIP_SIX_DOMAINS=1   跳过 Playwright 六域（须已有 latest uat-findings）
#   REALITY_UAT_SKIP_FRCA=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/testnet-reality-uat-sprint/${STAMP}"
RUN_LOG="$ROOT/evidence/testnet-reality-uat-sprint/TESTNET-REALITY-UAT-SPRINT-${STAMP}.log"
FREEZE_SHA="${FREEZE_GIT_SHA:-$(phase2_resolve_baseline_ssot_sha "$ROOT")}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
REPORT="$ROOT/docs/runbook/TESTNET-REALITY-UAT-SPRINT-REPORT.md"

fail() { echo "record-testnet-reality-uat-sprint: FAIL $*" >&2; exit 2; }

mkdir -p "$EVID"

{
  echo "TT_TESTNET_REALITY_UAT_SPRINT: START ${STAMP}"
  echo "freeze_sha=${FREEZE_SHA}"
  echo "targets: api=${API} web=${WEB}"

  echo ""
  echo "== Step 0: SHA freeze =="
  LOCAL_SHA="$(git rev-parse HEAD)"
  STAGING_SHA="$(curl -sS --max-time 30 "${API}/meta" | python -c "import sys,json; print(json.load(sys.stdin).get('build',{}).get('git_sha',''))")"
  echo "local=${LOCAL_SHA} staging=${STAGING_SHA} freeze=${FREEZE_SHA}" | tee "$EVID/sha-freeze.log"
  [[ "$LOCAL_SHA" == "$FREEZE_SHA" && "$STAGING_SHA" == "$FREEZE_SHA" ]] \
    || fail "SHA mismatch — redeploy staging or reset HEAD to freeze before UAT"

  echo ""
  echo "== Step 1: staging seed (admin promote) =="
  curl -sS --max-time 45 -X POST "${API}/auth/seed-test-accounts" \
    -H "Content-Type: application/json" -d '{}' | tee "$EVID/seed.log"
  curl -sS --max-time 45 -X POST "${API}/auth/seed-test-accounts" \
    -H "Content-Type: application/json" \
    -d '{"promote_admin_email":"tourist@test.com"}' | tee -a "$EVID/seed.log"

  echo ""
  echo "== Step 2: FRCA 五角色 API 全链路 =="
  if [[ "${REALITY_UAT_SKIP_FRCA:-}" == "1" ]]; then
    echo "SKIP REALITY_UAT_SKIP_FRCA=1"
    FRCA_JSON="$(ls -td "$ROOT/evidence/five-role-full-chain-audit"/*/frca-findings.json 2>/dev/null | head -1)"
    [[ -n "$FRCA_JSON" ]] || fail "no prior frca-findings.json"
    cp "$FRCA_JSON" "$EVID/frca-findings.json"
  else
    export FRCA_API_BASE="$API" FRCA_WEB_BASE="$WEB"
    bash "$ROOT/scripts/dev/run-five-role-full-chain-audit.sh" 2>&1 | tee "$EVID/frca.log"
    grep -q "FRCA_FIVE_ROLE_FULL_CHAIN: PASS" "$EVID/frca.log" || grep -q "FRCA_FIVE_ROLE_FULL_CHAIN: CONDITIONAL" "$EVID/frca.log" \
      || fail "FRCA not PASS/CONDITIONAL"
    FRCA_DIR="$(ls -td "$ROOT/evidence/five-role-full-chain-audit"/*/ 2>/dev/null | head -1)"
    cp "$FRCA_DIR/frca-findings.json" "$EVID/frca-findings.json"
  fi

  echo ""
  echo "== Step 3: P2HA 四角色 staging 探针（含 运营） =="
  export P2HA_PHASE=staging P2HA_WEB_BASE="$WEB" P2HA_API_BASE="$API"
  export P2HA_OUT="$EVID/p2ha-staging" P2HA_ALLOW_SEED=1
  mkdir -p "$EVID/p2ha-staging"
  python "$ROOT/scripts/dev/phase2-human-acceptance-probe.py" 2>&1 | tee "$EVID/p2ha-staging.log"
  grep -q "P2HA_VERDICT_STAGING: PASS" "$EVID/p2ha-staging.log" || fail "P2HA staging NO-GO"

  echo ""
  echo "== Step 4: 六域 Playwright UAT =="
  if [[ "${REALITY_UAT_SKIP_SIX_DOMAINS:-}" == "1" ]]; then
    echo "SKIP REALITY_UAT_SKIP_SIX_DOMAINS=1"
    UAT_JSON="$(ls -td "$ROOT/evidence/staging-uat-six-domains"/*/uat-findings.json 2>/dev/null | head -1)"
    [[ -n "$UAT_JSON" ]] || fail "no prior uat-findings.json"
    cp "$UAT_JSON" "$EVID/uat-findings.json"
  else
    export STAGING_UAT_OUT="$EVID/six-domains"
    bash "$ROOT/scripts/dev/run-staging-uat-six-domains.sh" 2>&1 | tee "$EVID/six-domains.log"
    cp "$EVID/six-domains/uat-findings.json" "$EVID/uat-findings.json"
  fi

  echo ""
  echo "== Step 5: Closing Gap 宽轨 =="
  bash "$ROOT/scripts/dev/record-phase2-closing-gap-status.sh" 2>&1 | tee "$EVID/closing-gap.log"
  grep -q "TT_PHASE2_CLOSING_GAP_STATUS: OK" "$EVID/closing-gap.log" || fail "closing gap refresh failed"

  echo ""
  echo "== Step 6: 合并 P0/P1 缺口 + GO 裁决 =="
  python "$ROOT/scripts/dev/generate-testnet-reality-uat-sprint-report.py" \
    --stamp "$STAMP" \
    --evid-dir "$EVID" \
    --freeze-sha "$FREEZE_SHA" \
    --out "$REPORT" \
    --closing-gap "$ROOT/evidence/GO_phase2_testnet_20260526/closing-gap/STATUS.txt"

  grep -q "TT_TESTNET_REALITY_UAT_GO: GO" "$REPORT" || fail "Testnet Reality UAT GO not met — see $REPORT"

  echo ""
  echo "TT_TESTNET_REALITY_UAT_SPRINT: OK ${STAMP}"
  echo "TT_TESTNET_REALITY_UAT_GO: GO ${STAMP}"
  echo "report: ${REPORT}"
  echo "evidence: ${EVID}"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_TESTNET_REALITY_UAT_SPRINT: OK" "$RUN_LOG" || exit 1
ln -sfn "$STAMP" "$ROOT/evidence/testnet-reality-uat-sprint/latest" 2>/dev/null || true
exit 0
