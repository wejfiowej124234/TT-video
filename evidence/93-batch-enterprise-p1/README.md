# 93 矩阵 · 企业级 P1 批次证据根目录

**批次 ID**：`93-ENTERPRISE-P1`（与 `docs/runbook/93-matrix-batch-tracker.md` 互指）  
**自动化**：`frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts`  
**结论口径**：本目录下每个 **`run_id/`** 子目录放一次手工或 CI 导出的截图、`notes.md`、可选 `report.json` 片段；Playwright 默认可在 `frontend/test-results/` 与 `playwright-report` 查看 trace。

## 建议 `run_id` 命名

`run_YYYYMMDDThhmmssZ_<git-short-sha>`（与 **R-001** `evidence/GO_*` 习惯一致，勿覆盖已冻结 GO 目录）。

**TT-L4**：本批用例标题含 **`@e2e-sepolia-deferred`**，由既有 **`chromium-sepolia`** 的 `grepInvert` 排除，**不**进入 `npm run e2e:sepolia` 基线计数。

## 单批复跑命令

```bash
cd frontend && npx playwright test e2e/93-matrix-enterprise-p1-batch.spec.ts --project=chromium
```

全栈（与 `PLAYWRIGHT_FULL_STACK=1` 一致时由 `playwright.config` 拉起 API + Next）：

```bash
cd frontend && PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/93-matrix-enterprise-p1-batch.spec.ts --project=chromium
```

## 覆盖映射（本轮）

| 路由 / 主题 | 用例 ID | 说明 |
|-------------|---------|------|
| `/me` 资料编辑 + `GET /api/v1/me` | A-ME-002 | UI 写 → API 再读 |
| `/market` 深链 + `GET /api/v1/discover/orders` | B-MKT-002 扩展 | URL 与列表 API 对拍 |
| `/community/messages` | D-COM-004 | 空态或首条与 `GET …/conversations` 对拍 |
| `/guide` | B-GDE-* 向导台 | `guide@test.com` 主区域 |
| `/admin/finance*` | D-ADM-002 扩展 | 占位 Cookie 抽检 |
| `/me` 未登录 | A-LOG-003 类 | 清会话后门禁 |
| `/auth/login` 错密 | A-NEG / 登录负例 | `role=alert` 错误态 |

## 模板子目录

见 `_template/`：`notes.md`、`curl-examples.sh`（可复制到每次 `run_id/`）。
