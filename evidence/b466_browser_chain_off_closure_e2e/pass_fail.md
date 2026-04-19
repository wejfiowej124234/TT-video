# B-466 · 订单旅程 REST 辅助盘点 + 浏览器可替代最小闭环（证据收口）

**日期**：2026-04-17  
**唯一目标**：B-466（不展开商家侧、管理端）

## 结论

| 项 | 结果 |
|----|------|
| `frontend/e2e/b466-browser-chain-off-pay-complete.spec.ts`（chromium，`--workers=1`，`PLAYWRIGHT_FULL_STACK=1`，`PLAYWRIGHT_REUSE_API_SERVER=0`） | **PASS**（`1 passed`，见 `playwright-b466-run.log` 文末） |

---

## 一、当前旅程中仍常以 REST「辅助推进」的步骤（盘点）

以下指 **E2E / 集成脚本** 中常见的 `Playwright.request.post` 或裸 `curl` 直打 API，而非用户可见 UI。

| 步骤 | 典型 REST | 现有 E2E 引用 | 浏览器侧真实入口（产品代码） |
|------|-----------|---------------|------------------------------|
| 种子账号 | `POST /auth/seed-test-accounts` | 多数全栈 E2E | 测试专用；非生产用户路径 |
| 建单 | `POST /api/v1/orders` | P03/P04/B-463/B-464/B-465 等 | 市场/定制下单 UI（本包为**隔离变量仍用 API 建单**） |
| 接单 | `POST …/accept` | `b463` `createCompletedOrder`、`epic-f-normal-release-real` | **`OrderActionsBlock`** `orderAccept` → 与 REST 同源 |
| **模拟入金（P3 链下）** | `POST …/mock-pay` | B-463/B-464/B-465、Epic F | **`/pay`**：`orderMockPay`（`pay_mockPay_cta`） |
| **确认完成（链下闸开时）** | `POST …/confirm-completion` | 同上、`releaseSeedGuideSlot` | **`OrderActionsBlock`**：`orderConfirmCompletion`（`escrow_confirmCompletion`）；有链上 escrow 且闸关时走 **EIP-712 intent**（`escrow_confirmCompletionSign`） |
| 评价 | `POST …/reviews` | B-464（API）、B-463/B-465（UI） | `/escrow/:id`、`/rate` 的 `ReviewBlock` |
| 释放向导档期（辅助） | `…/cancel` 或 `…/confirm-completion` | `releaseSeedGuideSlot.ts` | 与上表「确认完成」同源；属测试卫生而非主旅程 |

**链上路径（本包不验收真钱包）**：入金 / release / dispute 等依赖 **`EscrowOnChainActions`** + 钱包；与 `P3_CHAIN_OFF` / `order_mock_pay_enabled` 链下闭环正交。

---

## 二、本包「可由浏览器替代」的最小闭环（相对 B-463/B-464/B-465）

| 对比 | 先前合并旅程（如 B-465） | B-466 最小闭环 |
|------|--------------------------|----------------|
| `mock-pay` | E2E **`request.post`** | **旅行者**登录 → **`/pay?orderId=`** → 点击 **模拟入金** → 断言 **POST …/mock-pay** 200（由浏览器发起） |
| `confirm-completion` | E2E **`request.post`** | **向导**登录 → **`/escrow/:id`** → 点击 **确认完成（链下）** → 断言 **POST …/confirm-completion** 200（由浏览器发起） |
| 建单 | 多为 API | **仍 `POST /orders`**，避免与市场 UI 交织，突出「支付/托管/完成」两段 UI 替代 |

**前置条件**：`GET /meta` 与 Playwright API 启动脚本须 **`P3_CHAIN_OFF` / `order_mock_pay_enabled` 等价**（与 `readOrderMockPayEnabledFromMeta` 一致）；否则 `/pay` 无模拟入金按钮、`EscrowDetail` 可能仅展示钱包签名完成。

---

## 三、缺口清单（本包未声称覆盖）

| # | 缺口 |
|---|------|
| 1 | **建单**仍为 **REST**，非旅行者浏览器下单。 |
| 2 | **接单**本包用 **向导 UI**（与 P03 一致）；若仅验收「支付/完成」浏览器化，接单段可再改为 API 以进一步缩短（未做）。 |
| 3 | **链上入金 / 释放 / 争议**：非 P3 链下闭环；需钱包与合约环境。 |
| 4 | **商家侧 / 管理端**：按题设不展开。 |
| 5 | **`releaseSeedGuideSlot`、seed** 仍为测试 REST；非产品旅程。 |
| 6 | 日志中可能出现的 **`chain-sync-status` 403**、**reviews DB FK** 等与 B-464/B-465 同源噪声；本 run **断言通过**。 |

---

## 复现命令

```bash
mkdir -p evidence/b466_browser_chain_off_closure_e2e
cd frontend && export PLAYWRIGHT_FULL_STACK=1 && export PLAYWRIGHT_REUSE_API_SERVER=0 \
  && npx playwright test e2e/b466-browser-chain-off-pay-complete.spec.ts --project=chromium --workers=1 \
  2>&1 | tee ../evidence/b466_browser_chain_off_closure_e2e/playwright-b466-run.log
```

---

## 证据目录

| 文件 | 含义 |
|------|------|
| `evidence/b466_browser_chain_off_closure_e2e/pass_fail.md` | 本表（PASS/FAIL、盘点、最小闭环、缺口、复现命令） |
| `evidence/b466_browser_chain_off_closure_e2e/playwright-b466-run.log` | 最近一次 Playwright 标准输出（含 `1 passed`） |

**机读实现**：`frontend/e2e/b466-browser-chain-off-pay-complete.spec.ts`；UI 锚点：`frontend/app/pay/page.tsx`（`pay_mockPay_cta`）、`frontend/components/escrow/EscrowDetail/OrderActionsBlock.tsx`（`escrow_confirmCompletion`）。
