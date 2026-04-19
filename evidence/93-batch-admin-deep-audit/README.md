# 93 矩阵 · Admin 深审计证据根目录

**批次 ID**：`93-ADMIN-DEEP`（与 `docs/runbook/93-matrix-batch-tracker.md` 互指）  
**自动化**：`frontend/e2e/93-matrix-admin-deep-batch.spec.ts`  
**机读盘点**：`python scripts/dev/inventory_admin_deep_audit.py --write evidence/93-batch-admin-deep-audit/inventory-surface.generated.md`

## 复跑

```bash
cd frontend && npx playwright test e2e/93-matrix-admin-deep-batch.spec.ts --project=chromium
```

全栈（与仓库其它 93 批一致）：

```bash
cd frontend && PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/93-matrix-admin-deep-batch.spec.ts --project=chromium
```

## 可选环境变量

| 变量 | 用途 |
|------|------|
| `ADMIN_DEEP_RUN_ID` | 固定证据子目录名（默认时间戳） |
| `PLAYWRIGHT_ADMIN_BEARER` | 管理员会话：**`GET /api/v1/admin/orders`** 壳、**向导 PATCH**、**空态 UI**、**`GET /admin/cross-check`**、**对账 GET** |
| `PLAYWRIGHT_ADMIN_ONLY_BEARER` | **可选**：**`role=admin`**（非 super）会话，用于断言 **`super_admin_required`**（优先于 `PLAYWRIGHT_ADMIN_BEARER` 参与 RBAC 负例） |
| `PLAYWRIGHT_SUPER_ADMIN_BEARER` | **可选**：**`super_admin`** 会话；未设时用 `PLAYWRIGHT_ADMIN_BEARER` 且 **`/api/v1/me.role=super_admin`** 亦可跑调度器 rerun 真写 |
| `PLAYWRIGHT_INTERNAL_API_SECRET` | 与 API **`INTERNAL_API_SECRET`** 一致时，随 **`POST /api/v1/internal/indexer-reconcile`** 发送 **`X-Internal-Api-Secret`** |

**机读收口**：每轮 `report.json` 含合并后的 **`target_matrix`**（由各 `target-*.json` 汇总）；单项证据见同目录 `rbac-*.json`、`admin-*.json`、`reconcile-*.json`、`super-admin-*.json` 等。

## TT-L4

各 `describe` 名含 **`@e2e-sepolia-deferred`**，与 **`chromium-sepolia`** `grepInvert` 一致。

## 模板

见 `_template/notes.md`。
