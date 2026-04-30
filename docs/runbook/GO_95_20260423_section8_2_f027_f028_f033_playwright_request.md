# GO_95 · §8.2 · F-027 / F-028 / F-033 — Playwright `request`（2026-04-23）

> 本机证据包（与 **95 v1.4.223** 互链）。**复跑闭环（同 PR）**：**`npm run e2e:api-f027-f028-f033-local` → `3 passed`**（`DATABASE_URL` + `P3_CHAIN_OFF=1`）；**`REQUIRE_IDEMPOTENCY_KEY=1`** 下 **所有变异 POST**（含 **`/auth/register`**）须 **`Idempotency-Key`**；**`GET …/orders/:id/reviews`** 须 **`Authorization: Bearer`**（**`auth_placeholder_layer`** 非公开路径）；**`chain_off::reviews`** 旅客评价 **`reviewee_id`** 须为 **`guides.user_id`**（**`reviews.reviewee_id` → `users.id`** FK）。若仓库 `evidence/` 可写，维护者可镜像复制到 **`evidence/GO_95_20260423_section8_2_f027_f028_f033_playwright_request/README.md`**。

## 1 四验（摘要）

| 验 | 绑定 |
|---|------|
| 代码 | `frontend/e2e/f027-f028-f033-request.spec.ts` · `frontend/scripts/run-e2e-api-f027-f028-f033-local.mjs` |
| 路由 | `POST /api/v1/orders/:id/reviews` · `GET …/reviews`；`POST /api/v1/trust-growth/ingest`；`POST /api/v1/itineraries/custom` · `POST|GET /api/v1/itineraries/custom/drafts*` |
| 状态 | `P3_CHAIN_OFF=1` · `REQUIRE_IDEMPOTENCY_KEY=1`（本批 E2E 脚本注入）· `PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1` |
| 数据 | `DATABASE_URL` → 已迁移 Postgres |

## 2 复跑命令（仓库根 / Git Bash）

```bash
export DATABASE_URL="${DATABASE_URL:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"
cd frontend && npm run e2e:api-f027-f028-f033-local
```

期望：**`3 passed`**（`--project=api-f027-f028-f033-chromium`）。

## 3 与 93 / ISS

- **F-027** ↔ **B-ESC-003**（Rust：`matrix_93_b_esc_003_*`）。
- **F-028** ↔ **B-IDM-001**（Rust：`matrix_93_b_idm_001_*`）。
- **F-033** ↔ **D-ITN-002**（Rust：`matrix_93_d_itn_002_*`）。

**不**闭 **ISS-007**（`report.json` / CI 全矩阵）或 **ISS-009**。
