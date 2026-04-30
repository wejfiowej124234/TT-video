# GO_95 · §7.5 数据库 · hydrate · 双写 — 机读复验（补充 · v1.4.168）

## §1 命令与退出码（仓库根 · Git Bash）
```text
OK: 07 version triple aligned (1.0.858).
run-check-04-routes.sh exit=0
migrations *.sql count:
70
db *.rs count:
76
--- cargo test backfill_inserts_minimal (tail) ---

running 1 test
test chain_off::orders::backfill_minimal_itinerary_memory_tests::backfill_inserts_minimal_bundle_when_order_has_no_itinerary ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 964 filtered out; finished in 0.00s

--- cargo test state::dual_write_policy_tests (tail) ---
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.33s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)

running 1 test
test state::dual_write_policy_tests::normalize_aliases_and_default ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 964 filtered out; finished in 0.00s

```

## §2 与 95 §7.5 四子条关系
- **migrations 70**：与文首/§12.3.2 同源 `find crates/api/migrations -name '*.sql' | wc -l`。
- **孤儿订单行程**：`backfill_inserts_minimal` 过滤命中 `chain_off::orders::backfill_minimal_itinerary_memory_tests::backfill_inserts_minimal_bundle_when_order_has_no_itinerary` **1 passed**。
- **双写策略 env 归一**：`state::dual_write_policy_tests::normalize_aliases_and_default` **1 passed**（`DUAL_WRITE_FAILURE_POLICY` 别名；**不**含 PG 拔线）。
- **hydrate / strict 订单 DB 写**：仍以 **`…section7_5_db_hydrate_dualwrite/README.md` §2～§4** 与 **v1.4.84**/**v1.4.111** **`…db_hydrate_baseline/`** 叙事为主；本包为 **有界机读复验**。

## §3 诚实边界
- **不**用本包替代：生产/预发 **`_sqlx_migrations`** 台账、**staging** 逐表 **`count(*)`** 归档 **R-001**、**§10.5** **STRICT** 全链故障注入、**§7.7 / ISS-009** 多实例内存 SSOT。
