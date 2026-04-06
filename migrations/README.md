# 数据库迁移说明（仓库根 `migrations/`）

## 权威单源（开发与生产）

**`traveltrust-api` 唯一生效的迁移目录**为：

**[`crates/api/migrations/`](../crates/api/migrations/)** — SQLx 时间戳 `.sql` 文件（当前与 [55-阶段-数据同步与数据库功能同步](../docs/spec/55-阶段-数据同步与数据库功能同步.md) §1.2 一览一致）。

- 本地/CI：在设置 `DATABASE_URL` 后执行  
  `cd crates/api && sqlx migrate run`  
  或启动 API（启动流程会应用迁移，见 [41-后端数据库接库与落地清单](../docs/spec/41-后端数据库接库与落地清单.md)）。
- 设计对照：[04-附录-DDL草案](../docs/spec/04-附录-DDL草案.md)、[04-后端与API](../docs/spec/04-后端与API.md) §四。

## 本目录下 `001_*.sql` / `002_*.sql` / `003_*.sql` 的定位

本目录中的 `001_initial.sql`、`002_phase2_business.sql`、`003_add_chain_fields_and_community.sql` 为**早期手工草稿**，**可能与 `crates/api/migrations` 已分叉**。请勿将其作为生产结构或文档引用的**唯一依据**；审计、接库、发版核对均以 **`crates/api/migrations`** 为准。

若需对比历史草案与当前实现，应逐表对照 SQLx 迁移与 04-附录-DDL，而不是假设两路径等价。

## 回滚与变更

生产变更须遵循 Runbook 与 04 §四；回滚策略以 **SQLx 迁移版本** 与运维记录为准，勿单独依赖本目录脚本的 DROP 顺序作为现行规范。
