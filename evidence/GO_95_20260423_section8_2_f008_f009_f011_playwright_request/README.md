# GO_95 · §8.2 · F-008 / F-009 / F-011 · Playwright `request`（B 域订单）

**台账**：**95** **Version 1.4.217** · **§0.2 最后刷新** · **§6** **1.4.217** · **§8.2 母表** **E2E**/**行完成** · **§3.1** **F-008/009/011** **`[x]`**

## 1. 绑定 F 与正路径

| F | HTTP（相对 `PLAYWRIGHT_API_BASE_URL`） | 断言要点 |
|---|------------------------------------------|----------|
| **F-008** | `POST /auth/register` ×2 → `POST /api/v1/guides` → `POST /api/v1/guides/:id/stake` → `POST /api/v1/orders` | **`status=ok`**，**`order.id`** 非空，**`order.status=created`** |
| **F-009** | `GET /api/v1/orders` | **`items`** 含 **`F-008`** 创建之 **`order.id`** |
| **F-011** | `POST /api/v1/orders/:id/set-escrow-address` → `GET /api/v1/orders/:id` | 响应 **`escrow_address`** 与详情 **`order.escrow_address`** 均为占位 **`0x1234…7890`**（链下；**真链托管**仍 **ISS-007**） |

## 2. 代码 / 路由 / 配置

- **Spec**：`frontend/e2e/orders-b-domain-request.spec.ts`（**`test.describe.serial`**，三用例）。
- **Playwright project**：`frontend/playwright.config.ts` → **`api-b-orders-chromium`**（**`testMatch`** **`**/orders-b-domain-request.spec.ts`**）。
- **本地入口**：`frontend/package.json` → **`e2e:api-b-orders-local`** → **`scripts/run-e2e-api-b-orders-local.mjs`**（**`PLAYWRIGHT_API_ONLY=1`**；默认补 **`P3_CHAIN_OFF=1`** / **`CHAIN_RPC_URL=`** 与 **`e2e:api-auth-local`** 同口径）。

## 3. 复跑命令（须 Postgres + 迁移）

在 **`frontend`** 目录：

```bash
npm run e2e:api-b-orders-local
```

期望末行：**`3 passed`**（**`api-b-orders-chromium`**）。

**前置**：`DATABASE_URL` 可达且 **`traveltrust-api`** 可由 **`scripts/dev/start-api-for-playwright.*`** 正常启动（脚本在未监听 **8080** 时会 **`cargo build -p traveltrust-api`**）。

## 4. 与 Rust API·IT 的互证

- **`orders_create_list_set_escrow_address_db_api_tests`**（**`matrix_93_b_ord_*`** ↔ **B-ORD-001/003/006**）— 同一路由与 JSON 形状；本包为 **Playwright·E2E** 归档，**不**替代 **93 全矩阵** / **`report.json`**（**ISS-007** 仍开）。

## 5. 本轮 Effective Delta（登记用）

- **§8.2**：**F-008 / F-009 / F-011** 之 **E2E** 格 **`[x]`**（与既有 **UT / API·IT / 93 / 负例`**[x]`** 同列闭合 **行完成**）。
- **§3.1**：**F-008 / F-009 / F-011** **`[x]`**。
- **§0.2**：**W** **6→9**，**A** **6→9**，**T** **6/33→9/33**；**C** 分子 **A+U=53**（**53/78**）；**总 %** **63→60**（四分项按 **§0.1** 重算，**非**功能退步）。
- **§9·ISS-002**：**现象**与 **仍缺** 小节同步 **9/33** 行完成 / **24/33** 未完成；**ISS** 行仍 **`[ ]]`**。
