# TT-B318 · FeeRouter internal 导出字段与 admin 边界 Glossary 审计

**卡号**：`TT-B318-FEE-ROUTER-INTERNAL-EXPORT-FIELD-GLOSSARY-001`  
**母表**：`B-318`  
**日期**：2026-04-15  
**范围**：仅文档/台账/索引（docs-only）；不改实现。

## 本轮仅读文件（<=8）

1. `docs/任务母表.md`
2. `docs/AI任务卡索引.from-stash.md`
3. `docs/AI任务卡索引.md`
4. `docs/spec/04-后端与API.md`
5. `docs/spec/110-阶段开发链上索引器与事件同步器.md`
6. `docs/spec/83-区域治理与收益分配-协议白皮书.md`

## 审计目标

- 明确 FeeRouter 导出/查询字段口径在 `04` 与 `110` 的映射关系；
- 明确 public 路由与 admin/internal 导出边界；
- 保持 docs-only，不触碰 API/DB/脚本实现。

## 审计结论

- `110` 已给出 FeeRouter 投影主表与只读入口：`fee_router_routed_events`、`GET /api/v1/governance/fee-routes`、`GET /api/v1/admin/fee-router/routed-events`。
- `04` 已区分 public 契约（governance）与 admin/internal 观测/导出路径，且强调 drift 观测键不改 public 契约。
- `83` 已明确协议叙事层（Target）与仓库投影/运维层（Partial）边界，适合作为字段解释的上位语义来源。
- 结论：B-318 采用 docs-only 封口，仅做字段词汇登记与边界说明。

## 字段 Glossary（最小集）

- **`fee_router_routed_events`**：FeeRouter 事件投影表（链上事件索引层，非订单状态机）。
- **`GET /api/v1/governance/fee-routes`**：public 只读查询面（公开契约，不承载 admin 导出语义）。
- **`GET /api/v1/admin/fee-router/routed-events`**：admin 查询面（可含 summary 与审计动作语义）。
- **`…/fee-router/routed-events/export`**：导出面（internal/admin 运维用途；JSON/CSV 等导出形状以 04/110 为准）。
- **`fee_router_fee_routes_vs_routed_events_drift_observability`**：漂移观测键（运维观测层，不改 public 契约）。

## 封口登记

- Runbook：`docs/runbook/TT-B318-fee-router-internal-export-field-glossary.md`
- 母表：`B-318` 标记 docs-only 已做
- from-stash：`TT-B318-FEE-ROUTER-INTERNAL-EXPORT-FIELD-GLOSSARY-001` 标记已封口并挂接本 runbook
