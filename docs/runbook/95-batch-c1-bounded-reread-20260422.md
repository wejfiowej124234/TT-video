# 95 · §12.2 · **C-1** 有界机读复验（`routes`/`state`/`startup` · 2026-04-22）

> **定位**：**§12.2** 表 **C-1**（**`crates/api/src/routes/mod.rs`**、**`router.rs`**、**`state.rs`**、**`startup/`**）之**有界复验**；**不**将 **§12.2 · C-1** 主行 **`[ ]`→`[x]`**；**不**替代 **v1.4.156** **`evidence/GO_95_20260422_section12_2_c1_readthrough_batch/`** 读通登记与各域 **`router()`** 行为全文审计、**Admin 同层补全**/**`cargo test` 全矩阵**、**ISS-007**/**93**/**§8.2 行完成**。

## 1. 门禁（仓库根）

```bash
bash scripts/check-07-version-triple.sh
bash scripts/run-check-04-routes.sh
bash scripts/check-08-consistency.sh
```

**结果（本机）**：三者均为 **exit 0**（**`run-check-04`**：**178** 路径块）。

## 2. 核心文件（存在性）

| 路径 | `test -f` |
|------|-----------|
| **`crates/api/src/routes/mod.rs`** | OK |
| **`crates/api/src/router.rs`** | OK |
| **`crates/api/src/state.rs`** | OK |

## 3. **`startup/`** 与 **C-1 机读扇面**（与 **95 文首**/**§12.3.4** 互证）

```bash
find crates/api/src/startup -name '*.rs' | wc -l
find crates/api/src/routes -maxdepth 1 -name '*.rs' | wc -l
find crates/api/src/routes -path '*/tests/*.rs' | wc -l
grep -o '\.merge(' crates/api/src/routes/mod.rs | wc -l
```

| 指标 | `wc -l` / 计数 |
|------|----------------|
| **`crates/api/src/startup` `*.rs`** | **6** |
| **`routes/` 顶层（`-maxdepth 1`）`*.rs`** | **35** |
| **`routes/**/tests/*.rs`** | **15** |
| **`api_router()` 内 **`.merge(`** 出现次数**（**`routes/mod.rs`**） | **21** |

**语义锚（抽检）**：**00 索引** 读前 **B-181** — **`api_router()`** 聚合 **`routes/mod.rs`**；**workflow** 内历史 **`routes/internal.rs`** 等字面 **≠** 现行目录树真值；**§12.3.4**「Admin 补充」— **`routes/admin/`** 目录 **3** `*.rs` 与 **`admin_cross_check.rs`** 等同层 `mod` 须合并理解（**勿**单目录推断全覆盖）。

## 4. 诚实边界

- **不**宣称 **C-1** 主批次已闭（仍为 **`[ ]`**）。
- **不**将本 Runbook 与 **v1.4.156** **`…section12_2_c1_readthrough_batch/`** **合并闭证**（**并列**机读复验）。
- **不**闭 **ISS-007** / **§8.2「行完成」** / **§3.1 `[x]`**。
- **台账同批**：**[00-文档索引](../spec/00-文档索引.md)** 表 **95** 行 **v1.4.190** 摘要前缀（**C-1** Runbook 指针）。
