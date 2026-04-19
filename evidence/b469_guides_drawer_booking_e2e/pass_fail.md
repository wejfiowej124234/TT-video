# B-469 · `/guides/[id]` & `GuideDetailDrawer` 预约 → `BookGuideModal` → `/orders/new`（与 B-468 收敛）

**日期**：2026-04-17  
**唯一目标**：B-469（不展开商家侧、管理端）

## 结论

| 项 | 结果 |
|----|------|
| `frontend/e2e/b469-guides-drawer-booking-convergence.spec.ts`（chromium，`--workers=1`，`PLAYWRIGHT_FULL_STACK=1`，`PLAYWRIGHT_REUSE_API_SERVER=0`） | **PASS**（`2 passed`，约 32s） |

## 与 B-468 对齐（收敛断言）

| 入口 | 路径 | `BookGuideModal` | `guide_id` query | 建单 |
|------|------|------------------|------------------|------|
| B-468 | `/market` → 卡片「预约向导」→ 弹层 | ✅ `book_guide_title` | ✅ `/orders/new?guide_id=`（`ordersNewHrefForGuide`） | 见 `b468-market-discovery-full-ui-journey.spec.ts` |
| B-469-A | `/market` → **查看向导** → `GuideDetailDrawer` →「预约」→ 关抽屉 → 弹层 | ✅ 同源组件 | ✅ 同左 | `POST /api/v1/orders` 200 + 订单已创建 toast |
| B-469-B | `/guides/[id]` → **向该向导下单**（按钮打开弹层，与 B-468 一致） | ✅ 同源组件 | ✅ 同左 | 同左 |

**实现真值**：`frontend/app/guides/[id]/page.tsx` 使用 **`BookGuideModal`**（**`frontend/components/market/BookGuideModal.tsx`**，内链 **`ordersNewHrefForGuide`**），与 **`frontend/app/market/page.tsx`** 一致。

## 复现命令

```bash
mkdir -p evidence/b469_guides_drawer_booking_e2e
cd frontend && export PLAYWRIGHT_FULL_STACK=1 && export PLAYWRIGHT_REUSE_API_SERVER=0 \
  && npx playwright test e2e/b469-guides-drawer-booking-convergence.spec.ts --project=chromium --workers=1 \
  2>&1 | tee ../evidence/b469_guides_drawer_booking_e2e/playwright-b469-run.log
```

## 主索引互证（避免母表 / evidence / 主索引可见性分叉）

| 资源 | 链接 |
|------|------|
| `docs/AI任务卡索引.md` **一览 378** | [`TT-B469-GUIDES-DRAWER-BOOKING-CONVERGENCE-E2E-001`](../../docs/AI任务卡索引.md#tt-b469-guides-drawer-booking-convergence-e2e-001) |

## 证据目录

| 文件 | 含义 |
|------|------|
| `evidence/b469_guides_drawer_booking_e2e/pass_fail.md` | 本表 |
| `evidence/b469_guides_drawer_booking_e2e/playwright-b469-run.log` | （可选）Playwright 完整输出 |
