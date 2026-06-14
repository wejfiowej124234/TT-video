# Phase ② · Staging UI Real User Sprint · Closing Gap 清单

**生成：** 20260610T035106Z · **Web:** `https://tt-web-staging.fly.dev` · **API:** `https://tt-api-staging.fly.dev`  
**Sprint 结论：** **PASS** · 9 步浏览器全链（全新 @traveltrust.testnet 账号）

**阶段纪律：** ① → **②** → ③；本清单 **② PASS ≠ ③ Production GO**

---

## 本 Sprint 已闭（② · Staging UI）

| # | 项 | 状态 | 证据 |
|---|-----|------|------|
| 1 | 全新账号 UI 注册（游客+向导） | PASS | `steps-20260610T035106Z/S01-register/` |
| 2 | 向导入驻 + 质押（UI） | PASS | `S02-guide-onboard/` |
| 3 | 首页行程 + 发布 + 市场绑定 | PASS | `S03-book/` |
| 4 | 向导接单（UI） | PASS | `S04-accept/` |
| 5 | 双边确认（双角色 UI） | PASS | `S05-bilateral/` |
| 6 | 终版 snapshot（UI） | PASS | `S06-final-plan/` |
| 7 | mock-pay 支付沙箱（UI） | PASS | `S07-payment-sandbox/` |
| 8 | 向导确认完成（UI） | PASS | `S08-complete/` |
| 9 | 游客评价 + 向导可见 | PASS | `S09-review/` |

**诚实边界（本 sprint）：**

- S07 = chain_off **mock-pay** on staging · **≠** Stripe live · **≠** WEB3-P2-003 真 USDC `/pay`
- **无** 全链上 createEscrow+deposit（B-407 / API sprint S08 另轨）
- **API 全链** 已由 [PHASE2-TESTNET-EXECUTION-SPRINT](../GO_phase2_testnet_execution_sprint/PHASE2-TESTNET-EXECUTION-SPRINT-FREEZE.md) 覆盖

---

## 宽轨 Closing Gap（PHASE2-CLOSING-GAP · 仍须区分）

| Gap | 名称 | 与本 Sprint 关系 | 态 |
|-----|------|------------------|-----|
| G1 | R-003 宽矩阵 staging GO | 独立 evidence · 非 UI sprint 替代 | 见 `closing-gap/G1-r003-staging/` |
| G2 | 全站 staging report.json | 同源 G1 | 见 `closing-gap/G2-report-json/` |
| G3 | C-GOV MANUAL-P1 | 未在本 sprint 覆盖 | 见 governance-manual-p1 |
| G4 | Stripe 真收单（非零 amount） | mock-pay **≠** G4 Stripe PI | G4 另证 · 本 sprint S07 沙箱 |
| G5 | onboarding testnet smoke | API smoke · 本 sprint 为 UI 层 | G5 另证 |
| G6 | Sepolia stake 验证 | 向导 stake UI PASS · 链上 broadcast 另轨 | G6 另证 |
| G7 | Production CDN / HLS | **③** | OPEN |

**机读宽轨：** `TT_PHASE2_GO_VERDICT: PHASE2_GO_READY`（Community + G1–G7）— 见 [PHASE2-CLOSING-GAP.md](../../docs/runbook/PHASE2-CLOSING-GAP.md)

---

## 本 Sprint 后仍 OPEN（② / ③）

| # | 项 | 未完成应在哪阶 |
|---|-----|----------------|
| 1 | WEB3-P2-003 真 USDC `/pay` UI | ② 另轨 / **③** |
| 2 | B-407 全链上 createEscrow+deposit | ② 另轨 / **③** |
| 3 | `PATCH …/trip-dates` staging 404 | ② 运维 |
| 4 | **P2UI-GAP-001** · UI postGuide 泛化错误 → API assist | ② · deploy 对拍 |
| 5 | 移动端浏览器矩阵（本 sprint chromium only） | ② 可选 |
| 6 | Production GO / 主网真链 | **③** |

---

**SSOT：** [PHASE2-STAGING-UI-REAL-USER-SPRINT-FREEZE.md](./PHASE2-STAGING-UI-REAL-USER-SPRINT-FREEZE.md)
