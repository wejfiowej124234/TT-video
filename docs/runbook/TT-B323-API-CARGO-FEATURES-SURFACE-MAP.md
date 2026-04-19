# TT-B323 · `traveltrust-api` Cargo `[features]` 暴露面地图（审计登记）

**卡号**：`TT-B323-API-CARGO-FEATURES-SURFACE-MAP-001` · **母表** `B-323`  
**日期**：2026-04-15  
**范围**：仅 **文档 / 台账 / 索引**；**先审计后登记**；**不改** `Cargo.toml`、**不**引入 `cfg(feature)`、**不**改路由实现。

**术语**

- **本卡「Cargo features」**：Rust crate **`[features]`** / **`cfg(feature = "…")`** 编译期开关。  
- **与 04「Feature Flag / flags API」区分**：后者为 **运行时** 产品与运营开关（**`GET /api/v1/admin/flags`** 等），**非** 本卡映射对象。

---

## 1. 本轮仅读文件清单（≤8）

| # | 路径 |
|---|------|
| 1 | `Cargo.toml`（workspace 根） |
| 2 | `crates/api/Cargo.toml` |
| 3 | `crates/core/Cargo.toml` |
| 4 | `docs/spec/04-后端与API.md`（**§3.5** **`admin/flags`** 等行 — **产品** feature flag 叙事，对照 **非** Cargo） |
| 5 | `CONTRIBUTING.md`（**`cargo check`/`cargo test -p traveltrust-api`** 预检句） |
| 6 | `.cursor/rules/traveltrust-ai-collab.mdc`（默认 **`cargo test -p traveltrust-api`** 边界） |
| 7 | `scripts/README.md`（篇首或 **§二** 与 **Rust/API** 相关预检指针，若有） |
| 8 | `docs/AI任务卡索引.from-stash.md`（一览 **333** / **本 TT** 登记行） |

**说明**：未将 **`crates/api/src/**/*.rs`** 列入上表（**>8**），**`cfg(feature)`** 命中改由 **仓库级检索** 审计（见 §2.1）。

---

## 2. 审计结论

### 2.1 全仓 `Cargo.toml` 与 `cfg(feature)`

- **检索**：仓库内 **所有** `Cargo.toml` **无** **`[features]`** 段（含 **workspace 根**、**`crates/api`**、**`crates/core`**）。  
- **`crates/api/src`**：**无** **`cfg(feature`** / **`cfg!(feature`** 匹配（编译期按 feature 分叉 **不存在**）。

### 2.2 「feature → 路由 / 依赖」映射表（登记真值）

| Cargo `feature` 名 | 影响的依赖/模块 | 条件编译路由/行为 |
|--------------------|-----------------|-------------------|
| **（空）** | **—** | **—** |

**结论**：当前 **`traveltrust-api` / `traveltrust-core`** **无** 自声明 **`[features]`**，**无** 按 **Cargo feature** 切换的 **HTTP 路由面**；**依赖** 均为 **非 optional** 直连（暴露面由 **整包编译** 决定，**不**按 feature 切片）。

### 2.3 与文档/协作叙述的关系

- **04**、**CONTRIBUTING**、**AI 协作规则** 中的 **`cargo test -p traveltrust-api`** 与 **CI** **`cargo test --workspace`** 差异，属于 **预检范围** / **门禁范围**，**不是** Cargo **`[features]`** 矩阵。  
- 若未来引入 **`[features]`**（例如 **`minimal`**、**`chain-off-only`** 等），须 **另开 TT** 补：**`Cargo.toml` 表** + **`cfg` 命中清单** + **与 04 契约/路由** 的对照，避免 **双 SSOT**。

---

## 3. 缺口登记（仅记录 · 本卡不改实现）

| 缺口 | 说明 |
|------|------|
| **题面 vs 现状** | 索引/主题簇曾用 **「API features 暴露面地图」** 表述；**当前实现为「空集」** — **非** 遗漏路由登记，而是 **尚未引入** crate-level **`[features]`**。本 runbook **固定真值**，避免误读为「地图未写完」。 |
| **无独立 spec 节** | **04** **未**要求 **Rust `Cargo.toml` `[features]`** 与 **HTTP** 表互锁；**合理**（当前无 features）。日后 **首增** **`[features]`** 时建议 **同批** 在 **04 §四** 或 **母表** 钉 **可选编译边界** 一句。 |
| **`scripts/README.md` 深度** | 若篇首仅索引门禁而未逐条写 **`[features]`**，**不**算文档错误；本卡 **不**强制扩写 **scripts/README**（**非**本轮范围）。 |

---

## 4. 验收（本卡 · docs-only）

- 本 Runbook + **母表 B-323** + **from-stash 一览 333** 互证完成。  
- **未**修改任何 **`Cargo.toml`**、**`src/**/*.rs`**。

---

## 5. 互证

- **母表**：[`docs/任务母表.md`](../任务母表.md) **B-323**  
- **执行索引**：[`docs/AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md) 一览 **333** · **`### TT-B323-API-CARGO-FEATURES-SURFACE-MAP-001`**
