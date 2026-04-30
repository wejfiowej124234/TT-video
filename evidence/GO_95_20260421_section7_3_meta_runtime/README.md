# GO_95 · §7.3 · **`GET /meta` 与运行时一致** · 2026-04-21

## 口径

- **契约 SSOT**：**`docs/spec/04-后端与API.md`** **`GET /meta`** 行（**§3.4** 总表 + **TT-B167** 等互指）；**`GET /meta/build`** 与根级 **`build`** 同源（**688**）。
- **实现 SSOT**：**`crates/api/src/routes/health_meta/handlers.rs`**（组装）、**`meta_contract_keys.rs`**（**726～807** 等 `*_META_TOP_KEYS` 机读键序）、**`meta_build.rs`**（**`meta_build_snapshot`** / **`META_BUILD_TOP_KEYS`**）、**`crates/api/src/routes/health_meta/tests.rs`**（**`axum`** **`oneshot`** **`/meta`** + 子树断言）。

## 命令结果（仓库根）

```bash
cargo test -p traveltrust-api health_meta:: -- --nocapture
```

- **结果**：**`test result: ok. 60 passed; 0 failed`**（**889** filtered out；仅 **`routes::health_meta::tests`** 扇面）。
- **说明**：含 **`meta_order_messages_chain_off_mounted_false_when_absent`**、**`meta_order_messages_chain_off_mounted_true_when_present`**、**`meta_indexer_memory_populated_when_runtime_handle_present`**、**`meta_chain_contracts_759_when_chain_config_present`**、**`meta_build_path_matches_meta_build_field`** 等 **HTTP `/meta` 体** 与 **键序契约** 测试；**不**替代 **staging** 上对真实 **`DATABASE_URL`/`CHAIN_*`** 的 **`curl`** 终验，亦**不**单独闭合 **§8.2**/**F-029**/**110** 行完成。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**（含 **`check-04-api-ts-routes-vs-doc-34`** 对 **`/meta`** 字面量登记）。

## 边界（满分闸）

- **机读扇面 ≠ 闭证**：本包与 **`meta_contract_keys`** 行数统计**不**等价 **93**/**R-001 `report.json`** 或 **§8.2** 任一行 **「行完成」**。
- **与 §9**：未发现需新开 **ISS-**；**`GET /meta`** 与 **04** 叙述冲突时仍以 **04 + 本测试** 为工程对拍锚点。
