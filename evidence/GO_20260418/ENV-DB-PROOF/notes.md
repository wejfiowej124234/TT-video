## 铁律① · staging PostgreSQL 写后读（须执行人补全）

本文件在运行 `scripts/dev/r003_staging_full_regression.py` 时会被写入骨架；**首轮合格交付**须追加：

1. **连接口径**：说明使用只读账号 / 审计查询路径（**勿**粘贴完整 `DATABASE_URL` 密码）。
2. **写后读**：至少一条与 **B 域主链**一致的二次查询（例如 `orders.id` = `phase2/b_domain_chain.redacted.json` 中 `order_id`）。
3. **时间**：与 `report.json` 的 `started_at`～`finished_at` 同一次回归窗口可复核。

### 执行人勾选（**未完成** **前** **`release_gate`≠GO** **不得** **宣称** **首轮** **闭环**）

| # | 项 | 执行人 | 日期 (UTC) | 备注（**脱敏**） |
|---|----|--------|-------------|------------------|
| 1 | 确认 **`report.json`** 为本轮 **`run_r003_staging_full_regression.py` / `run_r003_staging_evidence_chain.py`** 产出 | | | 路径：`evidence/GO_20260418/report.json` |
| 2 | **`release_gate`** 会签（**GO / PARTIAL_GO / NO_GO**）与 **`release_gate_reason`** 已读 | | | 与 **R-003 §3.1** 一致 |
| 3 | **写后读** SQL 或审计界面截图索引（**无** **密码** **/** **无** **整串** **连接串**） | | | 例：`SELECT id,state FROM orders WHERE id='<uuid>'` |
| 4 | 与 **`phase2/b_domain_chain.redacted.json`**（或等价脱敏锚）**对齐** **的** **键** **（** **`order_id`** **/** **`user_id`** **等** **）** | | | |
| 5 | **TT-B486** / **母表 B-486** **状态** **同步**（**可选** **同** **commit**） | | | 见 **[from-stash 一览 420](../../docs/AI任务卡索引.from-stash.md#tt-b486-93-r003-staging-batch-001)** |
