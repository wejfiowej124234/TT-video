# GO_95 · §7.5 数据库 · hydrate · 双写基线重验（2026-04-22）

## 1. 目的

在 **《95》§7.5** 四条已 **`[x]`** 的前提下，重数 **`migrations`**、复跑 **孤儿行程 backfill** 单测、补跑 **`DUAL_WRITE_FAILURE_POLICY`** 归一化单测、再跑 **04 路由闸**。  
**不**替代 **`evidence/GO_95_20260422_section7_5_db_hydrate_dualwrite/README.md`** 全文锚点；**不**替代 **staging** **`SELECT count(*)`** 归档 / **拔线双写演练**。

## 2. 命令与结果（仓库根）

```bash
find crates/api/migrations -name '*.sql' | wc -l
# → 70

cargo test -p traveltrust-api backfill_inserts_minimal
# → 1 passed（**`backfill_minimal_itinerary_memory_tests::backfill_inserts_minimal_bundle_when_order_has_no_itinerary`**）

cargo test -p traveltrust-api state::dual_write_policy_tests
# → 1 passed（**`normalize_aliases_and_default`**）

bash scripts/run-check-04-routes.sh
# → exit 0
```

## 3. 与 §7.5 子条互证

| §7.5 子条 | 主证（2026-04-22 域审包） |
|-----------|---------------------------|
| **migrations** / 启动 **`migrator.run`** | **`…section7_5_db_hydrate_dualwrite/README.md` §1** |
| **hydrate** 计数叙事 | **同包 §2** |
| **孤儿订单行程** | **同包 §3** + **`backfill_inserts_minimal`** |
| **strict 双写** | **同包 §4** + 本轮 **`dual_write_policy_tests`**（**策略字符串**归一；**非**订单流 **`accept_cancel_pay_complete`** 全矩阵） |

## 4. 诚实边界

- **`dual_write_policy_tests`** 仅覆盖 **`state.rs`** **`normalize_dual_write_policy_str`**；**订单流** 在 **`TRAVELTRUST_STRICT_ORDER_DB_WRITE=1`** 下的内存回滚仍以 **代码走读 + §7.5 原证据 §4** 为主。
- **`migrations` = 70** 为**文件扇面**；生产已应用须 **`_sqlx_migrations`** / 启动日志人证。
