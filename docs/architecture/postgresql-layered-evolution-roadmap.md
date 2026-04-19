# PostgreSQL：从单库到分层 / 读写分离 / 模块拆分 — 路线图（TravelTrust 现状对齐）

**目的**：在不大改产品语义的前提下，把数据库演进顺序说清楚：**先单库打牢 → 再逻辑分层 → 最后才物理拆分 / 分布式 SQL**。  
**现状锚点**：`traveltrust-api` 使用 **单一** `DATABASE_URL` + **`sqlx::PgPool`**（[`startup/mod.rs`](../../crates/api/src/startup/mod.rs) 当前 **`max_connections(10)`**）、**[`crates/api/migrations/*.sql`](../../crates/api/migrations/)** 顺序迁移；业务上 **`chain_off` 内存态** 与 **PostgreSQL 双写 / hydrate** 并存（见 [`db/mod.rs`](../../crates/api/src/db/mod.rs) 模块头注释）。

---

## 一、当前架构快照（“单库里的分工”）

| 类别 | 代表表 / 机制 | 角色 |
|------|----------------|------|
| **身份与会话（交易真值）** | `users`、`sessions`（[`20250228000001_users_sessions.sql`](../../crates/api/migrations/20250228000001_users_sessions.sql)） | 注册 / 登录落库；启动 **hydrate** 灌入 `ChainOffStore` |
| **订单 / 评价 / 争议（交易真值）** | `orders`、`reviews`、`disputes`、`order_messages` 等 | 链下主路径；与 **Escrow** 通过 `orders.escrow_address` 等字段衔接 |
| **链上投影（非 UI 真值、可对账）** | `event_log`、`orders_projection`、`checkpoints_sharded`（[`20260414000042_chain_indexer_projection_tables.sql`](../../crates/api/migrations/20260414000042_chain_indexer_projection_tables.sql)） | Indexer tick 写入；与 `orders` **对账**（internal reconcile 路由已有 “orders vs orders_projection” 语义） |
| **治理 / 费用 / 金库投影** | `governance_proposals_projection`、`fee_router_routed_events`、`region_vault_forwarded_events` 等 | 高读、事件追加型；已与 **只读聚合 / 观测** 强相关 |
| **域事实 / 审计** | `order_state_transition_facts`（**迁移文件名以仓库** **`crates/api/migrations/`** **为准**；**见** **[`db/mod.rs`](../../crates/api/src/db/mod.rs)** **模块头**）、`evidence_receipts`、`reconciliation_reports`、`media_access_logs` | 与主交易表 **分列**：便于合规与回放，不必与区块幂等键混在同一“主订单行”上硬塞 |

**要点**：你们已经在单库内做了 **“主交易表 vs 投影 / 事实表”** 的雏形；演进时优先 **巩固边界**，而不是先上分布式。

---

## 二、第一步：单库做到“生产级”（撑很久）

目标：**同一套 schema**，把可靠性、可观测性、写入隔离做到位。

| 主题 | 建议动作（与仓库可挂钩处） |
|------|---------------------------|
| **备份 / 恢复** | **WAL 归档 + PITR**、**每日逻辑备份**（`pg_dump` / 卷快照）、**恢复演练**制度化；链上投影表（`event_log`）体积大时单独评估保留周期与归档库。 |
| **主从（物理）** | PostgreSQL **流复制**  standby；应用层先 **不必** 改代码，仅用于 **灾备与只读报表**（见第四节）。 |
| **连接池与超时** | 今天 API 侧是 **单池 `max_connections(10)`**（[`startup/mod.rs`](../../crates/api/src/startup/mod.rs)）。生产应：**按实例 CPU / `max_connections`** 反推池大小；为 `PgPoolOptions` 配置 **`acquire_timeout`**、**`idle_timeout`**、**`max_lifetime`**；**避免** 无界排队导致 “pool timed out waiting for an open connection”。**独立 worker**（indexer、reconcile、批任务）使用 **独立池或独立角色**，与在线 API 隔离。 |
| **索引** | 已有 `orders(tourist_id/guide_id/status)` 等基线；随查询模式补：**列表 + 排序 + 过滤** 的复合索引；**投影表**按 `chain_id + block` / `event_type` 访问路径复查（见 [`20260414000042_chain_indexer_projection_tables.sql`](../../crates/api/migrations/20260414000042_chain_indexer_projection_tables.sql) 内 `event_log` 索引定义）。**禁止** 在未看执行计划前堆索引。 |
| **慢 SQL** | 开启 **`pg_stat_statements`**；对 **GET /meta**、订单列表、治理列表、indexer 写路径分别设 **预算**；慢查询进 **告警**（与现有 observability 路由文化一致）。 |
| **读写路径分层（逻辑）** | **写路径**：`chain_off` 业务 handler → **先业务规则** → **DB 双写**（已有 strict / best-effort 环境变量族）。**读路径**：列表 / dashboard **优先读投影或缓存**，冲突时 **以对账与事实表为准**（你们已有 reconcile / fact 表方向）。 |
| **Migration 规范** | 继续 **`crates/api/migrations`** 递增前缀 + **可回滚策略**（与 [`schema_evolution_center`](../../crates/api/migrations/20260308000020_schema_evolution_center.sql) 思想一致）：大表改类型用 **expand–contract**；长事务加 **`NOT VALID` 约束再 validate。 |
| **分区** | **优先候选**：**按时间** 的 append-only（`event_log`、各类 `*_events`、审计日志）；**按 `chain_id`** 若多链且单行集巨大。分区前先确认 **查询总带分区键**，否则适得其反。 |
| **Projections / cache 与主表剥离** | 已存在 **`orders` vs `orders_projection`**、**`order_state_transition_facts`**。下一步是 **产品化**：明确 **哪张表是 UI 真值**、**哪张是链上镜像**、**不一致时以谁为准**（文档化 + 测试门禁），而不是再塞一列到 `orders`。 |

---

## 三、第二步：逻辑分层（不先拆物理集群）

把数据按 **语义** 分桶，未来拆库时 **按桶搬迁**，避免“整库一坨迁”。

| 桶 | 内容（本项目映射） | 演进提示 |
|----|-------------------|----------|
| **A · 交易真值** | `users`、`sessions`、`guides`、`orders`、`reviews`、`disputes`、`order_messages`、`itineraries`、幂等键等 | **强一致双写**、严格失败语义（你们已有多种 `STRICT_*_DB_WRITE`） |
| **B · 读模型 / 聚合** | `orders_projection`、治理与费用投影、排行榜快照类表、`governance_proposals_projection` | **允许短暂滞后**；用 **异步 indexer / 批任务** 修复；对外 **声明最终一致** |
| **C · 日志 / 证据 / 分析** | `event_log`、`order_state_transition_facts`、`evidence_receipts`、`reconciliation_reports`、`media_access_logs`、各类 observability 统计表 | **append-only** 为主；**归档与 TTL** 策略与合规并行 |

**Escrow**：链上合约与交易为 **财务真值**；库里的 `escrow_address`、投影行是 **索引与展示**。分层文档里应写清：**资金状态以链为准，库为缓存/对账** — 与现有 reconcile 叙事一致。

---

## 四、第三步：物理演进（推荐顺序）

1. **主库 PostgreSQL + 流式只读副本**  
   - **报表 / 内部只读 API / 重型聚合** 指向 **只读连接串**（新 env，例如 `DATABASE_URL_RO`），写仍走主库。  
   - **代码改动面小**：在 `startup` 里可选第二池，或仅在 **读多模块** 注入 `PgPool` 只读实例。

2. **按模块拆库（不是全局分布式）**  
   - 典型切法：**(1) 账户与会话**、**(2) 订单/评价/争议**、**(3) 链索引与投影**、**(4) 治理与经济扩展**。  
   - 与你们 **桶 A/B/C** 对齐；跨库用 **最终一致**（消息队列 / outbox，未来可选）。

3. **高读压力 → projection / cache / search**  
   - **投影表**继续加厚；**Redis / KeyDB** 做 **列表缓存** 与 **热点键**；全文检索再走 **Postgres FTS 或 OpenSearch**。  
   - **禁止** 把链上长历史扫进同步 API 路径。

4. **最后才考虑“分布式 SQL”（Cockroach / Yugabyte 等）**  
   - 仅在 **跨地域强一致写入** 与 **团队运维能力** 同时到位时评估；成本高、与当前 **单区域 + 链上真相** 模型未必匹配。

---

## 五、与发布节奏的建议对应

| 阶段 | 交付物（可检查） |
|------|------------------|
| **L0** | **第一里程碑「单库生产级基线收口」** **：** **母表** **[B-474](../任务母表.md)** **（** **连接池** **治理** **·** **[`TT-B474`](../runbook/TT-B474-PG-SINGLE-DB-POOL-GOVERNANCE-001.md)** **）** **+** **[B-475](../任务母表.md)** **（** **备份** **/** **PITR** **基线** **·** **[`TT-B475`](../runbook/TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001.md)** **）** **+** **[B-476](../任务母表.md)** **（** **池** **运行时** **观测** **/** **退避** **·** **[`TT-B476`](../runbook/TT-B476-PG-POOL-RUNTIME-OBS-BACKOFF-001.md)** **）** **+** **[B-477](../任务母表.md)** **（** **池** **压力** **/** **恢复** **验收** **·** **[`TT-B477`](../runbook/TT-B477-PG-POOL-STRESS-RECOVERY-ACCEPTANCE-001.md)** **）** **+** **[B-478](../任务母表.md)** **（** **池** **阈值** **基线** **/** **发布** **门禁** **·** **[`TT-B478`](../runbook/TT-B478-PG-POOL-RELEASE-GATE-BASELINE-001.md)** **）** **+** **[B-479](../任务母表.md)** **（** **多** **实例** **池** **竞争** **压测** **/** **门禁** **·** **[`TT-B479`](../runbook/TT-B479-PG-POOL-MULTI-INSTANCE-STRESS-001.md)** **）** **+** **[B-480](../任务母表.md)** **（** **生产** **故障** **注入** **与** **双态** **SLO** **/** **韧性** **放行** **·** **[`TT-B480`](../runbook/TT-B480-PROD-FAULT-SLO-ACCEPTANCE-001.md)** **）** **+** **[B-481](../任务母表.md)** **（** **跨区域** **容灾** **/** **切换** **SLO** **·** **[`TT-B481`](../runbook/TT-B481-MULTI-REGION-DR-ACCEPTANCE-001.md)** **）** **+** **[B-482](../任务母表.md)** **（** **金融** **正确性** **/** **链** **账** **对账** **·** **[`TT-B482`](../runbook/TT-B482-FINANCIAL-CORRECTNESS-ACCEPTANCE-001.md)** **）** **+** **[B-483](../任务母表.md)** **（** **可** **审计** **/** **取证** **·** **[`TT-B483`](../runbook/TT-B483-AUDITABILITY-FORENSICS-ACCEPTANCE-001.md)** **）** **+** **[B-484](../任务母表.md)** **（** **治理** **协议** **一致性** **·** **[`TT-B484`](../runbook/TT-B484-GOVERNANCE-PROTOCOL-CONSISTENCY-ACCEPTANCE-001.md)** **）** **+** **[B-485](../任务母表.md)** **（** **用户** **级** **可** **验证** **透明** **·** **[`TT-B485`](../runbook/TT-B485-USER-VERIFIABLE-TRANSPARENCY-ACCEPTANCE-001.md)** **）** **；** **`pg_stat_statements`** **/** **慢** **SQL** **专** **项** **另** **开** **母表** **。** |
| **L1** | 索引与 explain 清单；`event_log` / facts 归档策略草案 |
| **L2** | 只读副本 + 只读连接串；读密集路由迁副本 |
| **L3** | 模块边界文档 + 拆库迁移 Runbook（仍可用逻辑复制或停机窗口） |

---

## 六、刻意不做的（防踩坑）

- **不要** 在未稳定单库前上 **全局分布式 SQL**。  
- **不要** 把 **analytics** 与 **在线事务** 混在同一 **无限制** 查询连接上。  
- **不要** 让 **indexer 写** 与 **用户请求** 共享同一 **过小** 连接池而不做队列化。

---

**文档版本**：1.0 · 2026-04-18  
