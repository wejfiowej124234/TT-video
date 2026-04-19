# ENV-DB-PROOF（与 smoke 第 10 步对齐）

**目的**：证明 API 所用 PostgreSQL 上 **`orders` / `users` / `order_messages`** 可抽检，与 **R-003 铁律 ①**「写后读」口径一致（本包为**本地**证据）。

**执行方式**：`DATABASE_URL` 已导出时，`scripts/dev/smoke-ab-core-chain.sh` 第 10 步输出：

```text
10) PostgreSQL 抽检（docker exec traveltrust-postgres psql，无本机 psql）
   DB: orders + users + order_messages OK
```

**本轮结果**：见同目录上级 `smoke.stdout.txt` 摘录 — **OK**。

**说明**：具体行级 SQL 与订单 id 以 smoke 输出为准；本仓库不提交连接串明文。
