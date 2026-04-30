# §8.2 · F-015 / F-016 / F-017 — Playwright `request`（D 域社区）

**95 Version 锚定**：**v1.4.219**（与 `docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md` **台账同批**）。

## 1. 覆盖范围（与母表一致）

| F | 能力 | HTTP 正路径 | 93 编号 |
|---|------|-------------|---------|
| **F-015** | 发帖落库 | `POST /api/v1/community/posts` → `GET /api/v1/community/posts/:id`（**`post.body`** 一致） | **D-COM-002** |
| **F-016** | 点赞 | `POST …/posts/:id/like` → **`status=ok`**, **`created=true`**（首次） | **D-COM-003** |
| **F-017** | 收藏 | `POST …/posts/:id/collect` → **`status=ok`**, **`created=true`**（首次） | **D-COM-008** |

## 2. 代码 / 路由 / 状态 / 数据（四验）

- **代码**：`frontend/e2e/f015-f016-f017-request.spec.ts`；`frontend/scripts/run-e2e-api-d-com-015-017-local.mjs`；`frontend/playwright.config.ts` **project** `api-d-com-015-017-chromium`；`frontend/package.json` **`e2e:api-d-com-015-017-local`**。
- **路由**：与 **`crates/api/src/routes/community/community_feed_like_collect_db_api_tests.rs`**（**`matrix_93_d_com_*`**）及 **04 §3.4** 社区 posts/like/collect 同源。
- **状态**：**`npm run e2e:api-d-com-015-017-local`**（cwd **`frontend`**）→ **`3 passed`**（**`DATABASE_URL`** 指向可达 Postgres；**`P3_CHAIN_OFF=1`**、**`PLAYWRIGHT_API_ONLY=1`** 由 runner 与既有 api-itin 口径对齐）。
- **数据**：每用例 **`/auth/register`** 新用户 → **`community_posts` / `community_likes` / `community_collects`** 由 API 落库（与 Rust DB·IT 同池）。

## 3. 机读命令（复核）

```bash
cd frontend
export DATABASE_URL="postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust"
npm run e2e:api-d-com-015-017-local
```

期望末行：**`3 passed`**。

## 4. §8.2 回填

本证据包对应 **§8.2** 母表 **F-015 / F-016 / F-017** 的 **E2E** 与 **行完成** **`[x]`**（五格此前已齐；**93** 列仍以 **`matrix_93_d_com_*`** 为窄口径主证）。

**不**闭 **ISS-007**（全矩阵 **`report.json`** / **MANUAL-P1** 子项仍开）；**不**单独升格 **§3** **READY** 列（**F-015～017** 仍为 **READY*** / **PARTIAL** 以 **95 §3** 主表为准）。
