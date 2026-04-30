# GO_95 · §7.7 已知缺口 — 已勾子项机读重验（2026-04-22）

## 1. 范围（刻意收窄）

仅复跑**支撑 §7.7 中已 `[x]` 条目**的机读链（**mock 互斥** / **270 计划落款旁证** / **幂等狭义**），并加跑 **`schedule_engine::tests`** 作为 **ISS-009** 登记后的**非闭证**旁证（与 **`…section7_7_known_gaps/README.md` §6** 一致）。

**不**将本包用作 **§7.7** 仍 **`[ ]]`** 两条的闭证：

- **多实例内存 SSOT** → **§9 ISS-009**、**§7.7** 清单行仍 **`[ ]`**。
- **治理 pool/rewards 真源 / UI** → **§7.7** 清单行仍 **`[ ]`**。

## 2. 命令与结果（仓库根）

```bash
cargo test -p traveltrust-api idempotency
# → 4 passed（含 **`idempotency_http_contract_tests`** 子集 + **`idempotency_cache_meta_top_keys_order_and_literals_753`** + **`db::idempotency::key_hash_tests::key_hash_stable_*`**）

cargo test -p traveltrust-api key_hash_tests
# → 1 passed（**`key_hash_stable_for_method_path_idem_key`**）

cargo test -p traveltrust-api schedule_engine::tests
# → 1 passed（**`load_from_path_valid_json_ok`**）；**不**闭合 **ISS-009** / **多实例 SSOT**

bash scripts/run-check-04-routes.sh
# → exit 0
```

## 3. 主叙事 SSOT

**`evidence/GO_95_20260422_section7_7_known_gaps/README.md`** — §1～§5 锚点与 **诚实边界**；本包为**同日追加机读重跑**登记。

## 4. 诚实边界

- **`idempotency` 过滤匹配 4 条** 中含 **`key_hash_tests`** 之一，与单独 **`key_hash_tests` 1 passed`** 存在**子集重叠**；以 **`cargo test`**  stdout **「running N tests」** 为真值。
- **270 / ISS-008 / F-007 S3 成功链** 仍开；**120** 全文人签仍开。
