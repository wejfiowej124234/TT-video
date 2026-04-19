# Admin 深审计 · 人工 SSOT（与机读 `inventory-surface.generated.md` 互补）

| 维度 | 状态 | 说明 |
|------|------|------|
| 机读 UI↔API 前缀 | **已实现** | 运行 `scripts/dev/inventory_admin_deep_audit.py` 生成 `inventory-surface.generated.md` |
| RBAC 403（游客/向导 Bearer） | **已实现** | `93-matrix-admin-deep-batch.spec.ts` + `rbac-*.json` |
| 游客 Admin UI 403 文案 | **已实现** | `/admin/orders` + `admin-orders-403-tourist.png` |
| 订单消息 POST+GET+UI | **已实现**（须 `chain_off`） | 同 spec，`escrow-messages-*.json` |
| Admin 列表空态（真管理员 + 零数据） | **已实现（自动化）** | `93-matrix-admin-deep-batch.spec.ts`：`state=__93deep_empty__` 过滤 + UI **`admin_empty_table`**；`admin-orders-empty-filter-*.json/png` |
| Admin 写路径（审批/flags/scheduler…） | **部分自动化** | **PATCH 向导**（admin 即可）+ **super scheduler rerun**（须 DB 或 SKIP）；`super_admin_required` 负例须 **`PLAYWRIGHT_ADMIN_ONLY_BEARER`** 或 role=admin 的 Bearer |
| 对账类 POST→GET 闭环 | **已实现（自动化）** | **`POST /internal/indexer-reconcile`** `persist:true` ↔ **`GET …/admin/indexer/reconcile-report/:id`** `summary.stats` 对拍；缺链/库时 **SKIP** 留证 |

**93 映射**：D-ADM-002（权限/壳）+ B-MSG-002（消息深链）+ 下一批 D-ADM 写路径。
