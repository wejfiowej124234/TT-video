# SQLx 迁移运维单入口（PostgreSQL / `crates/api/migrations`）

**Version:** 0.1.0  
**Status:** Runbook — **运维与开发共用**的 **正向 apply → 观测 → 回滚叙事** 路径；**不**替代 **[04 §四](../spec/04-后端与API.md)**、**[41](../spec/41-后端数据库接库与落地清单.md)**、**[55 §1.2](../spec/55-阶段-数据同步与数据库功能同步.md)** 契约正文。  
**登记来源**：[next-batch-gap-remediation-implementation-plan.md](./next-batch-gap-remediation-implementation-plan.md) **IMP-DB-001**（与 **B-324** 缺口对读）。

**仓库路径：** `docs/runbook/sqlx-migration-ops.md`

<a id="sqlx-migration-ops-entry"></a>

---

## 1. 单源与前置

| 项 | 真值 |
|----|------|
| **迁移目录** | **`crates/api/migrations/`** 下按时间戳命名的 **`.sql`**；勿使用仓库根遗留 `migrations/001_*.sql` 作为执行依据（见 **41** 篇首）。 |
| **运行库** | **`DATABASE_URL`** 指向的 **PostgreSQL** 实例（与 **[ops/RUNBOOK.md §2.5](../../ops/RUNBOOK.md)**「CockroachDB 名 vs PostgreSQL 真源」同读）。 |
| **契约句** | **04 §四**「数据库迁移策略（P0）」：须可回放；每次变更须写明 **可回滚方式**（down、备份恢复或前滚修复）及对一致性的影响。 |

---

## 2. 正向 apply（日常）

1. 配置根目录 **`.env`**：`DATABASE_URL`、**`PORT`** 等（见根 **`.env.example`**、**[ops/RUNBOOK.md](../../ops/RUNBOOK.md)**）。  
2. **任选其一**：  
   - **推荐（与本地主路径一致）**：启动 **`traveltrust-api`**（`cargo run -p traveltrust-api`）；进程在连库后会执行 **`migrator.run`**，日志中可见迁移已应用类提示（与 **41 §3.1**「执行备注」一致）。  
   - **仅跑迁移**：在 **`crates/api`** 下使用 **`sqlx migrate run`**（须已安装 **sqlx-cli** 且 **`DATABASE_URL`** 可用）。  
3. **验收**：迁移无报错；API 在需 DB 的路径上行为与 **04 §3.4** 一致；新增表/列已在 **55 §1.2** 与 **04 / 41** 登记（**O10** 纪律）。

---

## 3. 回滚与「账本」叙事（必读区分）

- **合并检表**（开发向）：向 **`crates/api/migrations/`** 合入新 **`.sql`** 时，须按 **[CONTRIBUTING · 合并检表：新增 SQLx 迁移](../../CONTRIBUTING.md#sqlx-migration-pr-checklist)** 勾选 **回滚或前滚路径**、**数据一致性**、**文档联动**。  
- **`migration_rollbacks` 等只读聚合**：**`GET /api/v1/admin/schema/migrations`** 返回的 **`migration_rollbacks`** 等为 **审计/运维只读账本**，**不等于**「仓库里每一份 **`up.sql`** 都有自动 **`down`**」。对拍见 **04 §3.4** 该路由行与实现。  
- **历史迁移**：**不**要求一次性为全部历史文件补 **`down`**；若某次变更必须可逆，在 **当次 PR** 中写明 **down**、**备份恢复** 或 **前滚热修** 之一即可。

---

## 4. 与 spec / 运维的交叉索引

| 主题 | 打开 |
|------|------|
| 迁移与表、接库勾选 | **[41](../spec/41-后端数据库接库与落地清单.md)** |
| 迁移文件 ↔ 表一览（随迭代增行） | **[55 §1.2](../spec/55-阶段-数据同步与数据库功能同步.md)** |
| API 与迁移 1:1 映射（代码驱动节） | **[04 §7.5](../spec/04-后端与API.md)** |
| 发版 / DR 叙事中的 DB 与 API 回滚 | **[ops/RUNBOOK.md](../../ops/RUNBOOK.md)**（触发阈值表、**§2.6** 等） |

---

## 5. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-05-01 | 首版：**IMP-DB-001** 单入口；正向 apply、回滚叙事与 **admin schema/migrations** 只读区分。 |
