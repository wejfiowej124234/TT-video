# TT-B317 · 83/84 Country Ledger 与 110 投影字段 Glossary 审计

**卡号**：`TT-B317-83-84-COUNTRY-LEDGER-PROJECTION-GLOSSARY-001`  
**母表**：`B-317`  
**日期**：2026-04-15  
**范围**：仅文档/台账/索引（docs-only），不改实现。

## 本轮仅读文件（<=8）

1. `docs/任务母表.md`
2. `docs/AI任务卡索引.from-stash.md`
3. `docs/AI任务卡索引.md`
4. `docs/spec/83-区域治理与收益分配-协议白皮书.md`
5. `docs/spec/84-第一阶段10国Country-Pool发行参数总表.md`
6. `docs/spec/110-阶段开发链上索引器与事件同步器.md`

## 审计目标

- 对齐 `83/84` 的 Country Pool 叙事口径与 `110` 的索引投影口径；
- 给出“概念层 vs 投影层”字段 Glossary，降低跨文档混读；
- 明确本卡不触碰 API/DB/脚本实现。

## 结论（docs-only）

- `83/84` 侧为 Country Pool 业务/参数叙事，`110` 侧为链上事件索引与运维对账投影，二者是互补关系而非替代关系。
- `110` 已明确 `fee_router_routed_events`、`region_vault_forwarded_events` 为投影表，服务于只读与对账。
- `83` 已明确 Snapshot/Claim 终局能力与仓库 Partial 的分工边界，当前无需新增实现。

## Glossary（最小映射）

- **Country Pool（83/84）**：国家池业务概念与参数口径（融资/治理叙事层）。
- **`fee_router_routed_events`（110）**：FeeRouter 路由事件投影（链上事件索引层）。
- **`region_vault_forwarded_events`（110）**：RegionVault 转出事件投影（链上事件索引层）。
- **`economic_projection_row_counts`（110）**：投影行级统计/运维观察值，不等同 Snapshot/Claim 终局。
- **Snapshot/Claim（83 附录）**：协议终局能力目标态，独立于当前投影统计视图。

## 封口登记

- Runbook：`docs/runbook/TT-B317-83-84-country-ledger-projection-glossary.md`
- 母表：`B-317` 标记 docs-only 已做
- from-stash：`TT-B317-83-84-COUNTRY-LEDGER-PROJECTION-GLOSSARY-001` 标记已封口并挂接本 runbook
