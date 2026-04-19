# 运维 / 预检 SQL（非迁移）

与 **`crates/api/migrations/`** 中的 **schema 迁移** 分离：本目录为 **只读盘点**、**预检** 等 **手工或 CI 外** 脚本。

| 文件 | 说明 |
|------|------|
| [`users_role_preflight_inventory.sql`](./users_role_preflight_inventory.sql) | **B-311**：`users.role` 直方图与允许集外值（与 **`admin::is_supported_target_role`** 对齐）；Runbook **[`docs/runbook/users-role-preflight-inventory.md`](../../docs/runbook/users-role-preflight-inventory.md)** |
