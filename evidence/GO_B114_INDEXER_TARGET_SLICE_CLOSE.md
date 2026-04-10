# B-114 索引器 Target 切片收口（B-114-1～5 · 母表 / 台账留痕）

**锚点**：母表 **B-114**（**07 §六 6.3B·序3** / **110** 域）之 **子切片**收口；**不**声称 **spec/110** 全文其余 Target 均已 **Implemented**；**不**改写 **B-115 / B-116 / P5 / Epic A / C / D / E / F** 已封口语义或证据路径。

**收口日期**：2026-04-09

**台账互指**：[**docs/任务母表.md**](../docs/任务母表.md) **B-114** 行

---

## B-114-1 · Reorg 安全（内存回滚与 DB 删尾同源）

| 项 | 内容 |
|----|------|
| **目标** | 链回滚（reorg）时索引器内存状态可回退，与 **`perform_indexer_reorg_rewind_execute`** 的 DB 删尾同界；重扫 canonical log 不堆叠同一 **`(chain_id, block_number, log_index)`**，checkpoint 可重新对齐。 |
| **修改范围（落地）** | **`crates/api/src/chain/indexer.rs`**（**`rewind_indexer_memory_state_after_reorg`** + **`#[cfg(test)]`**）；**`crates/api/src/routes/internal.rs`**（调用同源回滚，删尾 / replay 语义未改）。 |
| **任务卡索引** | **`TT-B114-1-REORG-SAFETY-001`**（见 [**docs/AI任务卡索引.md**](../docs/AI任务卡索引.md)） |
| **验收命令** | `cargo test -p traveltrust-api reorg` |

**测试结果（本仓库复核，2026-04-09）**

```
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; … filtered out
```

---

## B-114-2 · 全量扫链区间（`from_block` → `to_block`）

| 项 | 内容 |
|----|------|
| **目标** | **`eth_getLogs`** **inclusive** 窗口合法（**`from_block > to_block`** 拒收）；解析结果剔除落在 **`[from_block, to_block]`** 外的 log，防越界污染 checkpoint / 投影。 |
| **修改范围（落地）** | **`crates/api/src/chain/indexer.rs`**（**`validate_inclusive_block_range_for_eth_get_logs`**、**`filter_escrow_log_entries_to_inclusive_block_range`**；各 **`fetch_*_logs`** 入口校验与过滤）。 |
| **验收命令** | `cargo test -p traveltrust-api b114_2_indexer_scan_range` |

**测试结果（本仓库复核，2026-04-09）**

```
running 2 tests
test chain::indexer::tests::b114_2_indexer_scan_range_validate_rejects_from_gt_to ... ok
test chain::indexer::tests::b114_2_indexer_scan_range_filter_keeps_inclusive_bounds_only ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; … filtered out
```

---

## B-114-3 · `orders` 链域（投影同步不跨链污染）

| 项 | 内容 |
|----|------|
| **目标** | **`sync_orders_from_projection_for_chain`** 仅改写 **`orders.chain_id` 为空（历史）或等于本次投影链** 的行；已钉死为其它链的订单不被本链投影回放误更新。 |
| **修改范围（落地）** | **`crates/api/src/db/orders.rs`**（**`orders_row_allowed_projection_sync_chain_domain`** + **`b114_3_orders_chain_domain_*`** 单测）；**`crates/api/src/db/orders_projection.rs`**（同步循环门闸 + **`SyncOrdersFromProjectionSummary.skipped_orders_chain_domain_mismatch`**）。 |
| **验收命令** | `cargo test -p traveltrust-api b114_3_orders_chain_domain` |

**测试结果（本仓库复核，2026-04-09）**

```
running 2 tests
test db::orders::b114_3_orders_chain_domain_tests::b114_3_orders_chain_domain_legacy_null_allows_sync_under_any_projection_chain ... ok
test db::orders::b114_3_orders_chain_domain_tests::b114_3_orders_chain_domain_stamped_row_requires_matching_projection_chain ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; … filtered out
```

---

## B-114-4 · 连续多区块 reorg 重放（`TT-B114-4-REORG-MULTI-BLOCK-REPLAY-001`）

| 项 | 内容 |
|----|------|
| **目标** | 单次 **`rewind_indexer_memory_state_after_reorg(from_block)`** 剥除 **`block_number >= from_block`** 的**连续 N 块**（例原 **10/11/12**）；重放新 canonical **10'/11'/12'** 后 **幂等键** **`(chain_id, block_number, log_index)`** 唯一、**`last_block` / `last_block_hash`** 止于新链尾、**不残留** 旧 fork 载荷；重放后对同键再 **`append`** 须判重复（防双写）。 |
| **修改范围（落地）** | **`crates/api/src/chain/indexer.rs`**（**`rewind_indexer_memory_state_after_reorg`** 文档注释 **B-114-4**；**`#[cfg(test)]`** **`b114_4_reorg_multi_block_*`**）。 |
| **任务卡索引** | **`TT-B114-4-REORG-MULTI-BLOCK-REPLAY-001`**（见 [**docs/AI任务卡索引.md**](../docs/AI任务卡索引.md)） |
| **验收命令** | `cargo test -p traveltrust-api b114_4_reorg_multi_block` |

**测试结果（本仓库复核，2026-04-09）**

```
running 2 tests
test chain::indexer::tests::b114_4_reorg_multi_block_replay_duplicate_append_is_rejected ... ok
test chain::indexer::tests::b114_4_reorg_multi_block_rewind_then_replay_replaces_canonical_prefix ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; … filtered out
```

---

## B-114-5 · reorg 后 tick 起扫与 rewind 内存联动（`TT-B114-5`）

| 项 | 内容 |
|----|------|
| **目标** | reorg 后 **`indexer_tick`** 用于 **`eth_getLogs`** 的 **`scan_from_block`**（下界）与 rewind 后内存 **`IndexerState`** 一致：**`last_block + 1`**；**`reorg_detected` → rewind → `continue`** 后首轮回合重算 **不断档、不重扫已确认尾块**。 |
| **修改范围（落地）** | **仅** **`crates/api/src/chain/indexer.rs`**（**`indexer_tick_scan_from_block_lower_bound`** + **`#[cfg(test)]`** **`b114_5_reorg_tick_scan_from_block_*`**）；**`crates/api/src/routes/internal.rs`**（**`indexer_tick`** 读锁内改为调用该函数，与原先 **`g.last_block + 1`** 同源）。 |
| **验收命令** | `cargo test -p traveltrust-api b114_5_reorg_tick_scan_from_block` |
| **测试结果** | **2 passed**，**0 failed**（本仓库复核） |

**测试结果（摘录）**

```
running 2 tests
test chain::indexer::tests::b114_5_reorg_tick_scan_from_block_matches_memory_after_rewind ... ok
test chain::indexer::tests::b114_5_reorg_tick_scan_from_block_after_multi_block_replay ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; … filtered out
```

---

## 全包回归（可选、非本子切片替代条件）

```bash
cargo test -p traveltrust-api
```

**说明**：以 **CI / 本地** 当前 **`cargo test -p traveltrust-api`** 全绿为准；本 **GO** 不替代 **B-116** Foundry / 前端等其它域验收。

---

## 明确排除（非本 GO 封口范围）

- **110** 文档中未列入 **B-114-1～5** 的其它 **Target** 句：**不**因本文件自动闭合。
- **B-115 / B-116 / P5 / Epic A / C / D / E / F**：本切片 **不**修改其实现封口语义；互证仍以各卷 **GO** 为准。
