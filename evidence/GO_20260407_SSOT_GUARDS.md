# PR/CI 静态 SSOT Guard 总览（两条已落地）

| 字段 | 值 |
|------|-----|
| **文档日 / 命名** | **2026-04-07**（`GO_20260407_*` 与 **[GO_20260407_ESCROW.md](GO_20260407_ESCROW.md)**、**[GO_20260407_B110.md](GO_20260407_B110.md)** 同批口径） |
| **任务卡** | **TT-SSOT-GUARD-GO-SUMMARY-018** |
| **并联索引** | **scripts**：[scripts/README.md](../scripts/README.md) **二、CI 门禁 · SSOT Guard 统一索引（TT-SSOT-GUARD-INDEX-017）**；**母表**：[docs/任务母表.md](../docs/任务母表.md) **SSOT Guard 门禁索引** |

本文档为 **可进 git 的静态总览**；**逐键不变量与 Runbook 演练**仍以 **04**、**[GO_20260407_ESCROW.md](GO_20260407_ESCROW.md)**、**[GO_20260407_B110.md](GO_20260407_B110.md)**、**[evidence/README.md](README.md)** 各段为准。

---

## 1. CI 入口（统一）

| 环节 | 说明 |
|------|------|
| **本地 / 预发布** | 仓库根 **`bash scripts/check-invariants.sh`**（Windows：**`scripts/check-invariants.ps1`**）；**`pre-release-automation`** 串联同一链路。 |
| **GitHub Actions** | **[`.github/workflows/build.yml`](../.github/workflows/build.yml)** — **Build** job **首步**执行 **`check-invariants.sh`**（**CI Gate v2**：**`ssot-guard-ci-v2.py`** 编排 **B-097 静态 + B-110 静态 + 响应快照契约**；`python3` 不可用时回退 **`python`**）。 |

任一子阶段 **失败** → **invariants** 失败 → **Build** 阻断。机器报告：**`target/ssot-guard-ci-v2-report.json`**；失败语义：**[scripts/templates/SSOT_GUARD_FAILURE_REPORT.md](../scripts/templates/SSOT_GUARD_FAILURE_REPORT.md)**。

---

## 2. 两条 Guard 对照

| Guard | 实现脚本 | 覆盖范围（摘要） |
|------|----------|------------------|
| **B-097** · 订单详情 **Escrow** 根级链读 | **`scripts/ssot-guard-escrow-orders-detail.py`** | **`escrow_chain_state*` / `escrow_release_state*` / `escrow_dispute_state*` / `escrow_locked_amount*` 的 **`m.insert`** **仅**允许在 **`crates/api/src/routes/orders/mod.rs`**；**`merge_escrow_*`** 内**不得**读 **`order.*`**（禁止用 DB 订单行**回填**链上 SSOT）；出现三键时须配对 **`json!("chain_read")`** / **`json!(true)`**；**列表 / 占位**响应不得带上述 **12** 个根键（与 **TT-ESCROW-SSOT-ORDER-STATE-AGGREGATE-EXCLUDE-002** 同口径）。 |
| **B-110** · 治理池 **四根级**链上 SSOT | **`scripts/ssot-guard-b110-pool-ssot.py`** | **`GET …/governance/pool`**：**`pool_balance`** 链上成功枝与根级 **`data_source` / `is_chain_ssot`**；**`country_pool*` / `treasury_pool*` / `treasury_erc20_pool*`** 的 **`m.insert` 仅** **`routes/governance.rs`**，且 **`*_data_source` / `*_is_chain_ssot`** 分别为 **`chain_read` / `true`**，**merge** 内**禁止** **`json!(0)`** 与全零 u256 字面；**`build_fee_pool_aggregate_body`**（**fee-pool-aggregates Σ**）**不得**出现上述三池族**根级**键名。 |

**契约 SSOT**：**[04 §3.4](../docs/spec/04-后端与API.md)**（**`GET /api/v1/orders/:id`**、**`GET …/governance/pool`**、**fee-pool-aggregates** 等行）。

---

## 3. 典型回归类型（会被 guard 阻断）

| 类型 | B-097 Escrow guard | B-110 Pool guard |
|------|--------------------|------------------|
| **键外溢** | 在 **`orders/mod.rs` 以外** 的 **`.rs`** 写入 **`escrow_*` SSOT `m.insert`** | 在 **`governance.rs` 以外** 写入 **`country_pool*` / `treasury_pool*` / `treasury_erc20_pool*`** 的 **`m.insert`** |
| **假 SSOT / 错误数据源** | **`merge_escrow_*`** 内出现 **`order.*`**；**`*_data_source` / `*_is_chain_ssot`** 未与 **`chain_read` / `true`** 字面配对 | **merge** 内 **`*_data_source` / `*_is_chain_ssot`** 未配对 **`chain_read` / `true`**；**`pool_balance` 链上块**缺少同块 **`data_source` / `is_chain_ssot`** |
| **占位 / 假零** | （由 **12 键聚合断言**与实现约定约束；guard 锁 **merge** 语义与 **insert 落点**） | **merge** 内 **`json!(0)`** 或 **64 位全零 hex** 字面 |
| **Σ 与主读混淆** | **列表/聚合体**若误带 **12** 个根键之一（脚本对 **002** 形状校验） | **Σ 体**（**`build_fee_pool_aggregate_body`**）嵌入 **`country_pool*` / `treasury_pool*` / `treasury_erc20_pool*`** 根级键 |

---

## 4. 横向扩展（统一规则）

若在**新的 HTTP 端点**或**新 JSON 形状**上引入**同类根级链读 SSOT**（新的 **`m.insert` 键族**或新的根级响应键）：

1. **须单独开立 TT**（任务卡 + 母表/索引登记，与 **04** 契约同批）。
2. **须新增独立 guard 脚本**，或 **在既有脚本中显式扩展 allowlist / 并列校验**；**禁止**在未改脚本、未过评审的情况下把新键「默认」算进 **B-097** 或 **B-110** 的静态范围。
3. 更新 **本总览** 或 **scripts/README** 统一索引表，保持 **CI 入口**仍经 **`check-invariants.sh`**（或并列 workflow 步骤）可发现。

---

## 5. 相关留痕文档（深读）

| 文档 | 用途 |
|------|------|
| **[GO_20260407_ESCROW.md](GO_20260407_ESCROW.md)** | **B-097** 四套键覆盖、不变量、Runbook **§7.1.3**、**B1～B3** 十二项门禁 |
| **[GO_20260407_B110.md](GO_20260407_B110.md)** | **B-110** 四根级、Σ 隔离、Runbook **§7.1.x** |
| **[evidence/README.md — 订单详情 escrow 链上 SSOT 演练](README.md#orders-detail-escrow-chain-state-ssot-drill)** | 演练 artifacts 命名与 **§7.1.3** 指针 |
| **[evidence/README.md — 治理池 B-110](README.md#governance-pool-country-pool-ssot-drill)** | **country_pool** / **treasury_erc20_pool** 等演练索引 |
