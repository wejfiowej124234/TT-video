# B-465 · 旅行者 UI 评价提交 + 向导端即时可见（双边闭环 · 证据收口）

**日期**：2026-04-17  
**唯一目标**：B-465 — 将 **B-463**（`/escrow/:id/rate` 浏览器提交 + `weight_breakdown`）与 **B-464**（向导 `/escrow/:id` 接单与状态、被评可见）收敛为 **同一订单、同一证据目录** 的跨端 E2E。

## 结论

| 项 | 结果 |
|----|------|
| `frontend/e2e/b465-bilateral-review-ui-e2e.spec.ts`（chromium，`--workers=1`，`PLAYWRIGHT_FULL_STACK=1`，`PLAYWRIGHT_REUSE_API_SERVER=0`） | **PASS**（`1 passed`，见 `playwright-b465-run.log` 文末） |

## 覆盖范围（双边 · 单订单）

| 阶段 | 行为 | 与 B-463 / B-464 关系 |
|------|------|------------------------|
| 前置链 | API 建单；向导 **UI** 接单；`mock-pay`、`confirm-completion` **REST** | 同 B-464 向导段 |
| 旅行者 | 登出向导 → 旅行者登录 → **`/escrow/:id/rate`**：`combobox`、评论、`Submit review`；等待 **POST …/reviews** 200；**GET** 轮询列表含评论；**Weight breakdown / 权重分解** 可见 | 对齐 B-463 首条「表单 + 成功体」 |
| 向导 | 登出旅行者 → 向导再登录 → **`/escrow/:id`**：`Reviews (P23)` + 同一条 **comment** 可见 | 对齐 B-464「被评价可见」，提交侧改为 **UI** |

**机读实现文件**：`frontend/e2e/b465-bilateral-review-ui-e2e.spec.ts`；辅助 `e2e/helpers/guideSeedGuideRowId.ts`、`e2e/helpers/releaseSeedGuideSlot.ts`。

## 与 B-463 / B-464 分工

| 包 | 保留场景 |
|----|----------|
| **B-463** `b463-browser-reviews-contract.spec.ts` | `reviewJsonContractClient` **降级**（`missing_meta`、`unknown_future_schema` 等）与合约观测；仍须单独跑。 |
| **B-464** `b464-guide-order-review-journey.spec.ts` | 向导纯链 + **API** 写入评价的最小用例；轻量回归。 |
| **B-465**（本目录） | **唯一**「旅行者 **UI** 提交 → 向导 **UI** 可见」双边闭环证据。 |

## 缺口清单（本包未声称覆盖）

| # | 缺口 | 说明 |
|---|------|------|
| 1 | **任务卡字面锚点** | 仓库内可无 `B-465` 索引；以 spec 与目录名 `b465_bilateral_review_ui_e2e` 收口。 |
| 2 | **mock-pay / confirm-completion** | 仍为 **REST**（与 Epic F / B-463 前置一致）。 |
| 3 | **运行环境噪声** | 日志中可能出现 `insert_review` **DB FK** 与内存路径并存、`chain-sync-status` **403**；本 run **断言通过**。 |

## 复现命令

```bash
mkdir -p evidence/b465_bilateral_review_ui_e2e
cd frontend && export PLAYWRIGHT_FULL_STACK=1 && export PLAYWRIGHT_REUSE_API_SERVER=0 \
  && npx playwright test e2e/b465-bilateral-review-ui-e2e.spec.ts --project=chromium --workers=1 \
  2>&1 | tee ../evidence/b465_bilateral_review_ui_e2e/playwright-b465-run.log
```

## 证据目录

| 文件 | 含义 |
|------|------|
| `evidence/b465_bilateral_review_ui_e2e/pass_fail.md` | 本表（PASS/FAIL、范围、分工、缺口、复现命令） |
| `evidence/b465_bilateral_review_ui_e2e/playwright-b465-run.log` | 最近一次 Playwright 标准输出（含 `1 passed`） |
