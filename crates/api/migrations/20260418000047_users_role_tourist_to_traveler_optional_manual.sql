-- 699：存量 `users.role` 从 `tourist` 规范为 `traveler` 的**运维可选**说明（默认不执行 UPDATE）。
-- 须在审计报表/产品验收后，于 psql 手工评估再执行；勿在未全链路验收前批量改生产数据。
-- 示例（默认注释；需要时去掉行首 `--`）：
-- UPDATE users SET role = 'traveler', updated_at = now() WHERE LOWER(TRIM(role)) = 'tourist';

-- sqlx 占位：零数据变更，仅登记流水与注释锚点。
SELECT 1 AS migration_699_users_role_manual_notes_applied;
