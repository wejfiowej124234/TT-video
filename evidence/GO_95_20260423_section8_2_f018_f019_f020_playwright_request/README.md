# §8.2 · F-018 / F-019 / F-020 — Playwright `request`

**95 Version 锚定**：**v1.4.220**（与 `docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md` 台账同批）。

## 1. 覆盖范围

| F | HTTP 正路径 | 93 |
|---|---------------|-----|
| **F-018** | `POST /api/v1/community/reports`（`target_type: post`）→ `status=ok` + `id` | **D-COM-010** |
| **F-019** | `GET /api/v1/community/me/posts?limit=20` → `posts` 含自建帖 `id` | **D-COM-009** |
| **F-020** | `POST /guides` + `stake` + `POST /orders` → `POST|GET /api/v1/me/market-bookmarks`（`target_type: order`） | **B-MKT-004** |

## 2. 复核命令

```bash
cd frontend
export DATABASE_URL="postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust"
npm run e2e:api-d-com-018-020-local
```

期望：**`3 passed`**。

## 3. 诚实边界

- **F-020**：本包仅 **Me·PG·订单** 星标 API；**`/market` UI** / **guide 星标** / **`DELETE` 书签** 仍 **ISS-007** / **§7.2**。
- **不**闭 **ISS-007** / **`report.json`** 全矩阵。
