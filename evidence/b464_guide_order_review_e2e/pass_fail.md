# B-464 · 向导端同一订单：接单 · 状态可见 · 完成后被评价可见（证据收口）

**日期**：2026-04-17  
**唯一目标**：B-464（不展开商家侧、管理端）

## 结论

| 项 | 结果 |
|----|------|
| `frontend/e2e/b464-guide-order-review-journey.spec.ts`（chromium，`--workers=1`，`PLAYWRIGHT_FULL_STACK=1`，`PLAYWRIGHT_REUSE_API_SERVER=0`） | **PASS**（`1 passed`，见 `playwright-b464-run.log` 文末） |

## 覆盖范围（与实现锚点）

| 验收点 | 说明 |
|--------|------|
| **接单（向导 UI）** | `guide@test` 登录 → `/escrow/:id` → `接单`/`Accept` |
| **状态可见（向导详情）** | 接单后主区 `待双边确认`/`Awaiting bilateral confirmation`；`mock-pay` 后 `已入金·待履约`/`Funded · awaiting fulfillment`；`confirm-completion` 后 `已完成`/`Completed` 或评分中类文案（`order_status_rating_*`） |
| **完成后被评价可见（向导）** | 旅行者 `POST /api/v1/orders/:id/reviews` 写入唯一 `comment` → 向导同一页 `Reviews (P23)`/`评价（P23）` + 评论文案可见（`ReviewBlock` 列表） |

**机读实现文件**：`frontend/e2e/b464-guide-order-review-journey.spec.ts`；复用 `e2e/helpers/guideSeedGuideRowId.ts`、`e2e/helpers/releaseSeedGuideSlot.ts`。

## 缺口清单（本包未声称覆盖）

| # | 缺口 | 说明 |
|---|------|------|
| 1 | **任务卡字面锚点** | 仓库内无 `B-464` 文案索引；本证据以 spec 文件名与目录 `b464_guide_order_review_e2e` 收口。 |
| 2 | **支付 / 完成确认** | `mock-pay`、`confirm-completion` 走 **REST**（与 P03/B-463 链下前置一致），**非**向导在 UI 内逐步点击；若产品要求「全程仅 UI」需另增步骤。 |
| 3 | **评价提交侧** | 旅行者评价为 **`POST …/reviews`（API）**，非 `/escrow/:id/rate` 浏览器表单；**向导侧「可见」**已验。若要求与 B-463 同源的 **旅行者 UI 提交**评价，可复用 `b463-browser-reviews-contract.spec.ts` 或在本 spec 中追加旅行者 UI 段（会拉长双端会话）。 |
| 4 | **运行环境噪声** | 全栈日志中可能出现 `chain-sync-status` **403**、或 `insert_review` **DB FK** 与内存路径并存（仍返回 200）；本 run **断言通过**，若需「仅 DB 成功」需后端/种子数据与权限单独门禁。 |

## 复现命令

```bash
mkdir -p evidence/b464_guide_order_review_e2e
cd frontend && export PLAYWRIGHT_FULL_STACK=1 && export PLAYWRIGHT_REUSE_API_SERVER=0 \
  && npx playwright test e2e/b464-guide-order-review-journey.spec.ts --project=chromium --workers=1 \
  2>&1 | tee ../evidence/b464_guide_order_review_e2e/playwright-b464-run.log
```

## 证据目录

| 文件 | 含义 |
|------|------|
| `evidence/b464_guide_order_review_e2e/pass_fail.md` | 本表（PASS/FAIL、缺口、复现命令） |
| `evidence/b464_guide_order_review_e2e/playwright-b464-run.log` | 最近一次 Playwright 标准输出（含 `1 passed`） |
