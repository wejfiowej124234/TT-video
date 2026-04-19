# B-467 · 建单阶段纯浏览器闭环 + 全 UI 主旅程（证据收口）

**日期**：2026-04-17  
**唯一目标**：B-467（不展开商家侧、管理端）

## 结论

| 项 | 结果 |
|----|------|
| `frontend/e2e/b467-full-ui-order-journey.spec.ts`（chromium，`--workers=1`，`PLAYWRIGHT_FULL_STACK=1`，`PLAYWRIGHT_REUSE_API_SERVER=0`） | **PASS**（`1 passed`，见 `playwright-b467-run.log` 文末） |

---

## 主旅程（相对 B-466）

| 阶段 | B-466 | B-467 |
|------|-------|-------|
| **建单** | `POST /api/v1/orders`（Playwright `request`） | **旅行者 UI**：`/orders/new?guide_id=` → 选向导、填金额、**创建订单**（`postOrder`，与 `app/orders/new/page.tsx` 同源） |
| 接单 | 向导 `/escrow/:id` UI | 同左 |
| 模拟入金 | 旅行者 `/pay` UI | 同左 |
| 确认完成 | 向导 `/escrow` 链下按钮 | 同左 |
| 评价 | 旅行者 `/escrow/:id/rate` UI + 向导可见 | 同左（与 B-465 评价段一致） |

**仍非「页面点击」的辅助**：`seed-test-accounts`、`releaseSeedGuideSlotIfBlocked`；**向导 `guide_id` SSOT**：`guideRowIdForSeedGuideAccount`（`GET /me`，与 P02 一致）；**评价列表轮询**：`GET …/reviews`（Bearer `touristToken`，仅防竞态，与 B-465 一致）。

---

## 未采用的路径（缺口 / 说明）

| # | 说明 |
|---|------|
| 1 | **市场 `/market` → `BookGuideModal` / `CustomItineraryModal`** 未在本包覆盖；选用 **`/orders/new`** 与 **P02** 对齐，同为产品建单页。 |
| 2 | **商家侧 / 管理端**：按题设不展开。 |
| 3 | 全栈日志中可能出现 **`reviews` DB FK**、`chain-sync-status` **403** 等噪声；本 run **断言通过**（与 B-465/B-466 经验一致）。 |

---

## 复现命令

```bash
mkdir -p evidence/b467_full_ui_order_journey_e2e
cd frontend && export PLAYWRIGHT_FULL_STACK=1 && export PLAYWRIGHT_REUSE_API_SERVER=0 \
  && npx playwright test e2e/b467-full-ui-order-journey.spec.ts --project=chromium --workers=1 \
  2>&1 | tee ../evidence/b467_full_ui_order_journey_e2e/playwright-b467-run.log
```

---

## 证据目录

| 文件 | 含义 |
|------|------|
| `evidence/b467_full_ui_order_journey_e2e/pass_fail.md` | 本表（PASS/FAIL、与 B-466 对比、缺口、复现命令） |
| `evidence/b467_full_ui_order_journey_e2e/playwright-b467-run.log` | 最近一次 Playwright 标准输出（含 `1 passed`） |

**机读实现**：`frontend/e2e/b467-full-ui-order-journey.spec.ts`；建单 UI：`frontend/app/orders/new/page.tsx`。
