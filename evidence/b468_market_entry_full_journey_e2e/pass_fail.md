# B-468 · 市场入口 → 预订 CTA → 建单 → 履约 → 评价（证据收口）

**日期**：2026-04-17  
**唯一目标**：B-468（不展开商家侧、管理端）

## 结论

| 项 | 结果 |
|----|------|
| `frontend/e2e/b468-market-discovery-full-ui-journey.spec.ts`（chromium，`--workers=1`，`PLAYWRIGHT_FULL_STACK=1`，`PLAYWRIGHT_REUSE_API_SERVER=0`） | **PASS**（`1 passed`，见 `playwright-b468-run.log` 文末） |

---

## 用户入口闭环（相对 B-467）

| 阶段 | B-467 起点 | B-468 起点 |
|------|------------|------------|
| 发现 / 选择 | 直达 `/orders/new?guide_id=` | **`/market`** → 视图 **Guides / 向导** → 目标向导卡片 **`guide-title-{id}`** |
| 预订 | （无） | 卡片 **「Book guide」/「预约向导」** → **`BookGuideModal`**（`book_guide_title`） |
| 进入建单 | 已在 `/orders/new` | 弹层内 **「Select itinerary & book」/「选择行程并预约」** → `ordersNewHrefForGuide` → **`/orders/new?guide_id=`** |
| 建单 → 履约 → 评价 | 与 `postOrder`、接单、`/pay` mock、`confirm-completion`、`/rate`、向导可见 **同源** | 同左（与 B-467 后半段一致） |

**机读锚点**：`frontend/components/market/BookGuideModal.tsx`（`ordersNewHrefForGuide`）、`frontend/components/market/GuideCard.tsx`（预约按钮）、`frontend/lib/ordersGuideDeepLink.ts`。

---

## `/guides/[id]` 与抽屉（已由 B-469 收口）

**B-469**（`evidence/b469_guides_drawer_booking_e2e/pass_fail.md`）：**`GuideDetailDrawer` → `BookGuideModal`** 与 **`/guides/[id]` → `BookGuideModal`** 浏览器 E2E，与本文 **B-468** **同一** `ordersNewHrefForGuide` / **`POST /api/v1/orders`** 建单闭环。

---

## 缺口清单（相对 B-468 初版）

| # | 说明 |
|---|------|
| 1 | ~~**抽屉详情路径**~~ → **B-469** 已覆盖（**查看向导** → 抽屉内预约 → `BookGuideModal`）。 |
| 2 | ~~**`/guides/[id]`**~~ → **B-469** 已覆盖（主 CTA 打开 **`BookGuideModal`**，与 B-468 同源弹层）。 |
| 3 | 测试卫生与 B-467 相同：`seed`、`releaseSeedGuideSlot`、`guide_id` SSOT；B-469 建单至 **订单已创建** toast，**未** 重复 B-468 全链路履约。 |
| 4 | 环境噪声（`reviews` FK、`chain-sync` 403 等）可能存在；B-468 / B-469 run **断言通过**。 |

---

## 复现命令

```bash
mkdir -p evidence/b468_market_entry_full_journey_e2e
cd frontend && export PLAYWRIGHT_FULL_STACK=1 && export PLAYWRIGHT_REUSE_API_SERVER=0 \
  && npx playwright test e2e/b468-market-discovery-full-ui-journey.spec.ts --project=chromium --workers=1 \
  2>&1 | tee ../evidence/b468_market_entry_full_journey_e2e/playwright-b468-run.log
```

---

## 证据目录

| 文件 | 含义 |
|------|------|
| `evidence/b468_market_entry_full_journey_e2e/pass_fail.md` | 本表 |
| `evidence/b468_market_entry_full_journey_e2e/playwright-b468-run.log` | Playwright 输出（含 `1 passed`） |
