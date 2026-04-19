# B-463 · 浏览器端 reviews 提交 / 展示 + `reviewJsonContractClient`（证据收口）

**日期**：2026-04-17  
**唯一目标**：B-463（不展开向导/商家后续任务）

## 结论

| 项 | 结果 |
|----|------|
| `frontend/e2e/b463-browser-reviews-contract.spec.ts`（chromium，`--workers=1`，建议 `PLAYWRIGHT_FULL_STACK=1`） | **PASS**（4 passed，见 `playwright-b463-run.log` 文末） |

## 覆盖范围（与代码锚点）

| 验收点 | 说明 |
|--------|------|
| **评价表单** | `/escrow/:id/rate` → `ReviewBlock`：`combobox` 评分、`comment` 输入、`Submit review` / `提交评价` |
| **提交成功** | 等待 `POST …/reviews` 200；**API 轮询** `GET …/reviews` 直至 `items[].comment` 含本次文案（避免仅依赖 UI 竞态） |
| **列表展示** | 页面可见评论文案；与 `ReviewBlock` 列表 `li` 一致 |
| **`reviewJsonContractClient` 消费** | 成功提交后展示 **Weight breakdown / 权重分解**（`weight_breakdown` → `parseWeightBreakdown`） |
| **降级路径 B-453** | `NODE_ENV=development` 下 `console.warn("[analytics]", "review_json_contract_degrade", payload)`：`waitForEvent('console')` 校验 **`degrade`** + **`api_path`**（`get_reviews` / `post_review`） |
| **缺 meta** | Playwright `page.route` 改写 `GET`/`POST` 响应，去掉 `meta` → 期望 `missing_meta` |
| **未来 schema** | `page.route` 注入 `meta.review_json_contract.schema_version: 999` → 期望 `unknown_future_schema` |

**机读实现文件**：`frontend/lib/reviewJsonContract.ts`（`parseReviewJsonContractMeta`）、`frontend/lib/reviewJsonContractObservability.ts`（`observeReviewJsonContractClient`）、`frontend/lib/analytics.ts`（`trackReviewJsonContractDegrade`）、`frontend/lib/apiClient/orders.ts`（`getOrderReviews` / `postReview`）。

**未纳入本包 E2E**：`malformed_meta` 已由 `frontend/lib/reviewJsonContract.test.ts` 覆盖；若需与浏览器同源，可在本 spec 增加一条 `route` 注入非法 `schema_version` 的用例。

## 复现命令

```bash
cd frontend && export PLAYWRIGHT_FULL_STACK=1 && export PLAYWRIGHT_REUSE_API_SERVER=0 \
  && npx playwright test e2e/b463-browser-reviews-contract.spec.ts --project=chromium --workers=1
```

**说明**：若本机 **8080** 已被占用，可先停旧 `traveltrust-api`，或临时设 `PLAYWRIGHT_REUSE_API_SERVER=1` 复用已起 API（证据日志抓取时曾用 reuse 避免端口冲突）。

## 证据文件

| 文件 | 含义 |
|------|------|
| `pass_fail.md` | 本表 |
| `playwright-b463-run.log` | 最近一次 Playwright 标准输出（含 `4 passed`） |
