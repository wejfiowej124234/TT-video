# GO_95 · §8.2 · F-007 / F-010 / F-032 — Playwright `request`（API-only）

**绑定**：**95** §8.2 母表 **F-007**（头像）/**F-010**（mock-pay）/**F-032**（Trust growth **`GET …/config`**）**E2E** 列 **`[x]`** 闭证（**v1.4.225**）。**不**勾 **行完成**（**W/T/总%** 仍由 **行完成** 列驱动）；**不**闭 **ISS-008**（**S3 presign→PUT→commit** 全链仍开）。

## 前置

- **Postgres**：`DATABASE_URL`（与 **`sqlx::migrate`** 一致）。
- **链下 mock-pay**：API 进程 **`P3_CHAIN_OFF=1`**（与 **`skipUnlessOrderMockPayAvailable`** 探针一致）。
- **F-007 本机头像**：须 **`TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1`**（**`scripts/dev/start-api-for-playwright.{sh,ps1}`** 默认注入 **`1`**；手工 **`cargo run`** 时须自行导出）。

## 命令

```bash
cd frontend
npm run e2e:api-f007-f010-f032-local
```

期望：**`3 passed`**（**`--project=api-f007-f010-f032-chromium`**）。

## 四验（窄口径）

| 验 | 绑定 |
|---|------|
| 代码 | `frontend/e2e/f007-f010-f032-request.spec.ts` |
| 路由 | `POST /api/v1/me/profile-avatar`、`POST /api/v1/orders/:id/mock-pay`、`GET /api/v1/trust-growth/config` |
| 状态 | `P3_CHAIN_OFF=1`、`TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1`（F-007） |
| 数据 | `users.avatar_url` / `orders.status=escrowed` / `trust_growth_*` 读配置 |

## 93

- **A-AVA-001**（**F-007** 子链；本机路径）
- **B-ESC-001**（**F-010**）
- **B-TGR-001**（**F-032** 读路径）

## 与 ISS-007

本包**不**替代 **CI `build.yml`·`e2e`** 全矩阵或 **`report.json`**；**ISS-007** 仍开。
