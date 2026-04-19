# `users.role` 迁移前只读盘点（B-311）

**卡号**：`TT-B311-87-USERS-ROLE-PREFLIGHT-INVENTORY-001` · **母表** `B-311`  
**规格**：**87** [§11.1 实现快照](../spec/87-TravelTrust-角色体系技术文档-融合架构版.md#111-实现快照与-12-目标差距-2026-04-02)（`users.role` 与 **87 §1.2** 目标态差距）  
**本批边界**：只提供 **只读 SQL + 本 Runbook**；**不**修改 `users` 表 **DEFAULT**、**CHECK** 或应用内枚举常量（后续 **DDL + API 兼容期** 另开 TT）。

## 何时跑

在计划执行任何会收紧 `users.role` 约束或批量 `UPDATE role` 的迁移之前，对 **目标环境数据库** 跑一次，并把查询结果存档（截图、CSV 或 `psql` 会话日志）。

## 前置条件

- 已配置可连到目标库的 **`DATABASE_URL`**（或等价的 `psql` 连接参数）。
- 使用与线上同大版本的 **`psql`**（建议 **`-v ON_ERROR_STOP=1`**）。

## 命令

在仓库根目录：

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/sql/users_role_preflight_inventory.sql
```

Windows（Git Bash）同上；若使用 `DATABASE_URL` 以外的连接串，将 `"$DATABASE_URL"` 替换为实际连接参数。

## 如何读结果

1. **第一节（直方图）**：所有 **原样** `role` 字符串及用户数；与 **04 / 41** 当前真值对照。
2. **第二节（非允许集）**：`lower(trim(role))` 不在应用允许集内的行；**期望为空**；若有行，须在迁移设计中单开豁免或清洗策略（**不**在本卡内执行写库）。
3. **第三节（空白异常）**：`role` 与 `trim(role)` 不一致；**期望为空**。
4. **第四节**：用户总行数核对。

**允许集真值**（实现侧）：`crates/api/src/routes/admin/mod.rs` 中 **`is_supported_target_role`** 所列字面量；本 SQL 中 `NOT IN (...)` 列表须与其 **同批维护**。

## 互证

- **87** §11.1.1 机读锚点表「`users.role` 迁移前盘库」行  
- **母表** [`docs/任务母表.md`](../任务母表.md) **B-311**  
- **索引** [`docs/AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md) 一览 **321**
