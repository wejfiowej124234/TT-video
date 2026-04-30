# 95 · §12.2 · **C-2** 有界机读复验（`chain_off` / `db` / `migrations` · 2026-04-22）

> **定位**：**§12.2** 表 **C-2**（**`chain_off/*`**、**`db/`**、**`migrations/`** 与 **95 §12.3.2**/**110**/**§7.5** 互指）之**有界复验**；**不**将 **§12.2 · C-2** 主行 **`[ ]`→`[x]`**；**不**替代 **v1.4.157** **`evidence/GO_95_20260422_section12_2_c2_readthrough_batch/`** 读通登记与 **`db/`** 全文走读、**110**/**§7.5**/**§3 F** 主批次、**ISS-009**/**93**/**§8.2 行完成**。

## 1. 门禁（仓库根）

```bash
bash scripts/check-07-version-triple.sh
bash scripts/run-check-04-routes.sh
bash scripts/check-08-consistency.sh
```

**结果（本机）**：三者均为 **exit 0**（**`run-check-04`**：**178** 路径块；**`check-07`**：**07** **1.0.858** 三线）。

## 2. 核心文件（存在性）

| 路径 | `test -f` |
|------|-----------|
| **`crates/api/src/chain_off/mod.rs`** | OK |
| **`crates/api/src/db/mod.rs`** | OK |

## 3. **C-2 机读扇面**（与 **95 文首**/**§12.3.2**/**§11.1** 互证）

```bash
find crates/api/src/chain_off -name '*.rs' | wc -l
find crates/api/src/db -name '*.rs' | wc -l
find crates/api/migrations -name '*.sql' | wc -l
```

| 指标 | 计数 |
|------|------|
| **`chain_off/**/*.rs`** | **36** |
| **`db/**/*.rs`** | **76** |
| **`migrations/*.sql`** | **70** |

**语义锚（抽检）**：**§11.1** **`…chain_off_extensions/`** — **`cargo test -p traveltrust-api chain_off::` → 162 passed** 为扩展面旁证，**不**替代 **C-2** **`db/`** 模块级走读；**§7.5** **`…section7_5_db_hydrate_dualwrite_supplement/`** — **hydrate / 双写** 与 **`migrations` 70** 对读仍属独立子证。

## 4. 诚实边界

- **不**宣称 **C-2** 主批次已闭（仍为 **`[ ]`**）。
- **不**将本 Runbook 与 **v1.4.157** **`…section12_2_c2_readthrough_batch/`** **合并闭证**（**并列**机读复验）。
- **不**闭 **ISS-009** / **§8.2「行完成」** / **§3.1 `[x]`**。
- **台账同批**：**[00-文档索引](../spec/00-文档索引.md)** 表 **95** 行 **v1.4.191** 摘要前缀（**C-2** Runbook 指针；**与** **v1.4.190** **C-1** **版本号分轨**）。
