# GO_95 · §8.2 · F-029 / F-030 / F-031 — Playwright `request`（2026-04-23）

与 **95 v1.4.224** 互链。**窄口径 E2E**：**不**替代 **110 Runbook**/**reconcile 全链**（**F-029**）、**Admin 正权全矩阵**/**IA 文案**（**F-030**/**F-031**）；**§8.2·行完成** 仍 **`[ ]`**（**ISS-002**）。

## 1 四验（摘要）

| 验 | 绑定 |
|---|------|
| 代码 | `frontend/e2e/f029-f030-f031-request.spec.ts` · `frontend/scripts/run-e2e-api-f029-f030-f031-local.mjs` |
| 路由 | `GET /api/v1/internal/indexer-status`；`GET /api/v1/admin/schema/migrations`；`POST /api/v1/market/acquisition/listings` · `POST /api/v1/community/posts` |
| 状态 | `P3_CHAIN_OFF=1` · `PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`；可选 **`INTERNAL_API_SECRET`** → **`PLAYWRIGHT_INTERNAL_API_SECRET`** |
| 数据 | `DATABASE_URL` → 已迁移 Postgres |

## 2 复跑命令

```bash
export DATABASE_URL="${DATABASE_URL:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"
cd frontend && npm run e2e:api-f029-f030-f031-local
```

期望：**`3 passed`**（`--project=api-f029-f030-f031-chromium`）。

## 3 与 93

- **F-029** ↔ **D-IDX-001**（Rust：`matrix_93_d_idx_001_*`）。
- **F-030** ↔ **D-ADM-003**（Rust：`matrix_93_d_adm_003_*`；本 E2E 仅 **非 admin 403**）。
- **F-031** ↔ **D-COM-011**（Rust：`matrix_93_d_com_011_*`）。

**不**闭 **ISS-007** / **ISS-002**。
