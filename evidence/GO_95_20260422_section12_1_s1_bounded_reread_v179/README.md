# GO_95 · §12.1 · S-1 有界机读复验（v1.4.179）

**日期**：2026-04-22  
**范围（95 §12.1 · S-1）**：对 **00/01/04/07/08-5/14/95** 主批次目标的 **锚点复验 + 机读闸门**；**不**重开 **v1.4.150** **`…section12_1_s1_readthrough_batch/`** 或 **v1.4.162** **`…section12_1_s1_supplement_readthrough_batch/`** 的全文读通结论；**不**将 **§12.1 · S-1** 主表 **`[ ]`→`[x]`**。

## 1. 文档锚点（抽样 · 有界）

| 文档 | 锚点 | 结论 |
|------|------|------|
| **01** | 篇首 **# TravelTrust 总库总览框架**、读前摘要表、**§〇** 入口句 | 与 **07/04/14** 入口链叙述一致（**未**做 §1～§10 全文审计） |
| **07** | **`### 0.6 API · ABI · 路由域`** — **`api_router()`** **21** 次 **`merge`** 域列表 | 与 **`routes/mod.rs`** **`.merge` 计数 21** 同源；**07 Version** **1.0.858**（见 **`check-07-version-triple`**） |
| **08-5** | **`#clean-clone-prereq`**（`docs/spec/08-5-CI与一致性落地说明.md` **L48**） | **clean clone** 前置锚存在；本轮以 **`check-08-consistency.sh` exit 0** 为 **08-5** 扇面旁证 |
| **14** | **`### 2.1 权威源：04 §三 与 crates/api 实际路由`**（约 **L130**） | **HTTP 表 SSOT** 仍归 **04 §3.4**；与 **S-1** 读通批次叙事一致 |
| **04** | （机读）**`run-check-04-routes`** | **178** 路径块与 **04 §3.4** 对齐（脚本 stdout） |

## 2. 代码真值（api_router）

**文件**：`crates/api/src/routes/mod.rs`  
**机读**：对 **`crates/api/src/routes/mod.rs`** 统计 **`.merge(`** 出现次数 → **21**（与 **07 §零 0.6**、**14 §2.1**、**95 §12.3** 表体一致）。

## 3. 根入口三角（与 v1.4.162 同口径复数）

| 指标 | 命令 | 结果 |
|------|------|------|
| `.env.example` 行数 | `wc -l .env.example` | **475** |
| `README.md` | `wc -l README.md` | **203** |
| `CONTRIBUTING.md` | `wc -l CONTRIBUTING.md` | **196** |

## 4. 闸门（exit 0）

| 命令 | 结果 |
|------|------|
| `bash scripts/check-07-version-triple.sh` | **OK**（07 **1.0.858**） |
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `bash scripts/check-08-consistency.sh` | **exit 0**（stdout：**08-4 has CI version line** … **skip version-bump rule**） |

## 5. 诚实边界

- **§12.1 · S-1** 主表 **`[ ]`** **不变**：**00/01/04/07/08-5/14/95** 全文通读 + 关闭发现项仍属 **Owner** 主批次。  
- **00↔95**：若维护者要求索引一致，须显式 **「台账同批」** 更新 **[00-文档索引](00-文档索引.md)** 表 **95** 行 **Version**。
