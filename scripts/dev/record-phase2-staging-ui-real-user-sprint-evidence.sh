#!/usr/bin/env bash
# Phase ② · Staging UI Real User Sprint — Playwright 证据 + G-0～G-4 闸 + Closing Gap 清单
#
# 用法（仓库根）：
#   bash scripts/dev/record-phase2-staging-ui-real-user-sprint-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_phase2_staging_ui_real_user_sprint"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/PHASE2-STAGING-UI-REAL-USER-SPRINT-${STAMP}.log"
STEPS_ROOT="$EVID/steps-${STAMP}"
mkdir -p "$STEPS_ROOT"

WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
CLOSING_GAP="$EVID/CLOSING-GAP-CHECKLIST-${STAMP}.md"

export STAGING_WEB_BASE="$WEB_BASE"
export STAGING_API_BASE="$API_BASE"
export PLAYWRIGHT_BASE_URL="$WEB_BASE"
export PLAYWRIGHT_API_BASE_URL="$API_BASE"
export PLAYWRIGHT_API_HEALTH_URL="${API_BASE}/health"
export PLAYWRIGHT_REUSE_FE_SERVER=0
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_EXPECT_CHAIN_ID=11155111
export PHASE2_STAGING_UI_REAL_USER_SPRINT=1
export P2UI_EVID_ROOT="$STEPS_ROOT"

if [[ -n "${HTTPS_PROXY:-}" ]]; then
  export PLAYWRIGHT_PROXY_SERVER="$HTTPS_PROXY"
elif [[ -n "${HTTP_PROXY:-}" ]]; then
  export PLAYWRIGHT_PROXY_SERVER="$HTTP_PROXY"
fi

write_closing_gap_checklist() {
  local sprint_status="${1:-PASS}"
  cat >"$CLOSING_GAP" <<EOF
# Phase ② · Staging UI Real User Sprint · Closing Gap 清单

**生成：** ${STAMP} · **Web:** \`${WEB_BASE}\` · **API:** \`${API_BASE}\`  
**Sprint 结论：** **${sprint_status}** · 9 步浏览器全链（全新 @traveltrust.testnet 账号）

**阶段纪律：** ① → **②** → ③；本清单 **② PASS ≠ ③ Production GO**

---

## 本 Sprint 已闭（② · Staging UI）

| # | 项 | 状态 | 证据 |
|---|-----|------|------|
| 1 | 全新账号 UI 注册（游客+向导） | ${sprint_status} | \`steps-${STAMP}/S01-register/\` |
| 2 | 向导入驻 + 质押（UI） | ${sprint_status} | \`S02-guide-onboard/\` |
| 3 | 首页行程 + 发布 + 市场绑定 | ${sprint_status} | \`S03-book/\` |
| 4 | 向导接单（UI） | ${sprint_status} | \`S04-accept/\` |
| 5 | 双边确认（双角色 UI） | ${sprint_status} | \`S05-bilateral/\` |
| 6 | 终版 snapshot（UI） | ${sprint_status} | \`S06-final-plan/\` |
| 7 | mock-pay 支付沙箱（UI） | ${sprint_status} | \`S07-payment-sandbox/\` |
| 8 | 向导确认完成（UI） | ${sprint_status} | \`S08-complete/\` |
| 9 | 游客评价 + 向导可见 | ${sprint_status} | \`S09-review/\` |

**诚实边界（本 sprint）：**

- S07 = chain_off **mock-pay** on staging · **≠** Stripe live · **≠** WEB3-P2-003 真 USDC \`/pay\`
- **无** 全链上 createEscrow+deposit（B-407 / API sprint S08 另轨）
- **API 全链** 已由 [PHASE2-TESTNET-EXECUTION-SPRINT](../GO_phase2_testnet_execution_sprint/PHASE2-TESTNET-EXECUTION-SPRINT-FREEZE.md) 覆盖

---

## 宽轨 Closing Gap（PHASE2-CLOSING-GAP · 仍须区分）

| Gap | 名称 | 与本 Sprint 关系 | 态 |
|-----|------|------------------|-----|
| G1 | R-003 宽矩阵 staging GO | 独立 evidence · 非 UI sprint 替代 | 见 \`closing-gap/G1-r003-staging/\` |
| G2 | 全站 staging report.json | 同源 G1 | 见 \`closing-gap/G2-report-json/\` |
| G3 | C-GOV MANUAL-P1 | 未在本 sprint 覆盖 | 见 governance-manual-p1 |
| G4 | Stripe 真收单（非零 amount） | mock-pay **≠** G4 Stripe PI | G4 另证 · 本 sprint S07 沙箱 |
| G5 | onboarding testnet smoke | API smoke · 本 sprint 为 UI 层 | G5 另证 |
| G6 | Sepolia stake 验证 | 向导 stake UI PASS · 链上 broadcast 另轨 | G6 另证 |
| G7 | Production CDN / HLS | **③** | OPEN |

**机读宽轨：** \`TT_PHASE2_GO_VERDICT: PHASE2_GO_READY\`（Community + G1–G7）— 见 [PHASE2-CLOSING-GAP.md](../../docs/runbook/PHASE2-CLOSING-GAP.md)

---

## 本 Sprint 后仍 OPEN（② / ③）

| # | 项 | 未完成应在哪阶 |
|---|-----|----------------|
| 1 | WEB3-P2-003 真 USDC \`/pay\` UI | ② 另轨 / **③** |
| 2 | B-407 全链上 createEscrow+deposit | ② 另轨 / **③** |
| 3 | \`PATCH …/trip-dates\` staging 404 | ② 运维 |
| 4 | **P2UI-GAP-001** · UI postGuide 泛化错误 → API assist | ② · deploy 对拍 |
| 5 | 移动端浏览器矩阵（本 sprint chromium only） | ② 可选 |
| 6 | Production GO / 主网真链 | **③** |

---

**SSOT：** [PHASE2-STAGING-UI-REAL-USER-SPRINT-FREEZE.md](./PHASE2-STAGING-UI-REAL-USER-SPRINT-FREEZE.md)
EOF
}

{
  echo "TT_PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE: START ${STAMP}"
  echo "phase: ② staging UI real user"
  echo "web: ${WEB_BASE}"
  echo "api: ${API_BASE}"
  echo "prerequisite: TT_PHASE2_G0_G4_ADMISSION: CLEAR"
  echo "prerequisite: TT_PHASE2_TESTNET_EXECUTION_SPRINT (API corridor)"
  echo "ssot: frontend/evidence/GO_phase2_staging_ui_real_user_sprint/PHASE2-STAGING-UI-REAL-USER-SPRINT-FREEZE.md"

  echo ""
  echo "== Step A: vitest staging UI real user contract =="
  cd "$ROOT/frontend"
  npx vitest run lib/phase2/phase2StagingUiRealUserSprint.contract.test.ts

  echo ""
  echo "== Step B: staging web alignment preflight =="
  cd "$ROOT"
  bash scripts/dev/check-staging-web-alignment.sh \
    --web-base "$WEB_BASE" \
    --api-base "$API_BASE"

  echo ""
  echo "== Step C: G-0～G-4 admission pregate =="
  bash scripts/dev/check-phase2-onboarding-staging-ready.sh

  echo ""
  echo "== Step D: Playwright staging UI full chain (9 steps) =="
  cd "$ROOT/frontend"
  npx playwright test e2e/phase2-staging-ui-real-user-sprint.spec.ts \
    --config=playwright.phase2-staging-ui.config.ts \
    --project=chromium 2>&1 | tee "$STEPS_ROOT/playwright.log"

  echo ""
  echo "== Step E: post-chain rollback probe =="
  anon_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${API_BASE}/api/v1/me" 2>/dev/null || echo 000)"
  echo "anonymous /me HTTP ${anon_code}" | tee "$STEPS_ROOT/rollback-probe.log"
  [[ "$anon_code" == "401" ]] || echo "WARN: expected anonymous /me 401, got ${anon_code}"

  write_closing_gap_checklist "PASS"

  echo ""
  echo "TT_PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE: OK ${STAMP}"
  echo "TT_PHASE2_STAGING_UI_REAL_USER_SPRINT_SUMMARY: exit=0 phase=② staging_ui_9step_chain"
  echo "steps_evidence: ${STEPS_ROOT}"
  echo "closing_gap: ${CLOSING_GAP}"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE: OK" "$RUN_LOG" || {
  write_closing_gap_checklist "FAIL"
  echo "FAIL: missing evidence OK marker" >&2
  exit 2
}
grep -q "TT_PHASE2_STAGING_UI_REAL_USER_SPRINT: OK" "$STEPS_ROOT/playwright.log" || {
  write_closing_gap_checklist "FAIL"
  echo "FAIL: playwright missing OK marker" >&2
  exit 2
}

for step in S01-register S02-guide-onboard S03-book S04-accept S05-bilateral S06-final-plan S07-payment-sandbox S08-complete S09-review; do
  [[ -f "$STEPS_ROOT/$step/STATUS.txt" ]] || {
    write_closing_gap_checklist "FAIL"
    echo "FAIL: missing step evidence $step" >&2
    exit 2
  }
done

ln -sfn "$(basename "$STEPS_ROOT")" "$EVID/steps-latest" 2>/dev/null || true
ln -sfn "$(basename "$CLOSING_GAP")" "$EVID/CLOSING-GAP-CHECKLIST-latest.md" 2>/dev/null || true

echo "Evidence log: $RUN_LOG"
echo "Closing gap: $CLOSING_GAP"
exit 0
