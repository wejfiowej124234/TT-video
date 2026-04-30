# GO_95 · §8.2 · F-012 / F-013 / F-014 · Playwright `request`

**台账**：**95** **Version 1.4.218** · **§0.2** · **§6** · **§8.2·E2E+行完成** · **§3.1** **`[x]`**

## 1. 绑定 F

| F | 路由 | 证据 |
|---|------|------|
| **F-012** | `POST /api/v1/itineraries` | 响应 **`status=ok`** **`version=1`** **`order_status=draft`** **`order_id`** |
| **F-013** | `POST /api/v1/orders/:id/confirm-final-plan` | **`expected_version: 1`** → **`snapshot_hash`** 以 **`0x`** 前缀 |
| **F-014** | `POST /api/v1/community/posts` → `GET /api/v1/community/feed?limit=20` | **`posts`** 含新帖 **`id`**（与 **`community_feed_like_collect_db_api_tests`** 对齐） |

## 2. 代码 / 脚本 / 配置

- **Spec**：`frontend/e2e/f012-f013-f014-request.spec.ts`
- **Project**：`frontend/playwright.config.ts` → **`api-itin-feed-chromium`**
- **入口**：`npm run e2e:api-itin-feed-local` → `frontend/scripts/run-e2e-api-itin-feed-local.mjs`

## 3. 复跑

```bash
cd frontend && npm run e2e:api-itin-feed-local
```

**本机（Cursor）**：**`3 passed (2.6s)`**（**`api-itin-feed-chromium`**）。

## 4. Effective Delta

- **§8.2**：**F-012/013/014** **E2E** + **行完成** **`[x]`**
- **§3.1**：同上三行 **`[x]`**
- **§0.2**：**W 9→12**，**A 9→12**，**T 9/33→12/33**，**C 53/78→56/78**，**总 % 60→63**
- **§9·ISS-002**：**现象** **12/33**；**仍缺** **21/33**；**ISS** 仍 **`[ ]]`**（**`report.json` 全矩阵** 等）
- **R**：**未变**（**§3** **F-012～014** **PARTIAL** 未因本批单独升格 **READY**）
