# 黄金基线 · 变更即回归（控制规则）

**基线日**：2026-04-17 · **机读路径冻结**：[**`TT-TESTNET-ACCEPTANCE-ROLLUP-20260417` §3](./TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md)

**何时触发五维重跑**：仅当 PR 涉及 **合约、`crates/api`、indexer（含路由/观测/索引接线）、前端对 API 或链上地址的调用或接线** — 合并前必须完成下表并与 **run_20260417** 证据 **对比无破坏**（数值或 PASS 语义不回退；新 `run_<UTC>` 可并存，**勿覆盖**旧目录）。

**何时不触发五维重跑**：**纯文档**改动（Runbook、spec、注释、与链/API 无关的 CI 文案等）— **只做基线抽查**：冻结路径是否仍有效、引用是否与 **[`TT-TESTNET-ACCEPTANCE-ROLLUP-20260417` §3](./TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md)** 一致即可，**不**要求重跑 N1 / N2 / 线 A / 线 B / Treasury 脚本。

| # | 维度 | 重跑 / 对比 |
|---|------|-------------|
| 1 | **N1** | `scripts/ops/ttg-econ-align-read.sh` → 新 `chain_reads.json` **对比** 基线 **`evidence/ttg_econ_align/run_20260417T083300Z_compare/chain_reads.json`**（`chain_id` / `token` / `total_supply` / `treasury_balance` / `block_number` 语义一致或能解释漂移） |
| 2 | **N2** | `scripts/ops/ttg-econ-align-compare.sh`（`API_BASE_URL` 与运行中 API 一致）→ **`api_db_compare.json`** **`verdict`** 须仍为 **`PASS`**，并对照基线同文件 **checks** |
| 3 | **线 A** | `evidence/GO_20260417_line_a_minimal/artifacts/run_line_a_validation.sh` 一类流程 **重跑**，**CONCLUSION** 六条仍成立 |
| 4 | **线 B（B-417）** | 对 **当前** Governor/Timelock 栈 **新** `b417-governance-execution-report.json`：**`execution_verdict=GO`**、**`dry_run=false`**（脚本 **`b417-evidence-pack-verify.sh`**） |
| 5 | **Treasury.spend** | 若动到金库/执行载荷：**新** `run_<UTC>/` **或** 书面声明未触达该路径；否则 **对比** **`run_20260417T0810Z/`** 仍可作为历史 PASS 快照 |

---

## §X · 单人开发最小回归规则（Golden Baseline）

- **改接线**（合约 / API / indexer / 前端调用）→ **必跑五维**（N1 / N2 / 线 A / 线 B / Treasury.spend），**新开** `evidence/run_<UTC>/`，**不得覆盖** `run_20260417` 基线。
- **仅改文档** → 抽查 **[`TT-TESTNET-ACCEPTANCE-ROLLUP-20260417` §3](./TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md)**，确保路径 / 证据仍可达。
- **任一地址 / 端口 / 真值变更** → 同步检查 **根 `.env`**、**`GET /meta`**、**B-434 v3**（[`decision_record.v3.json`](../../evidence/timelock_truth_arbitration/decision_record.v3.json)），**不得**出现多套 SSOT。

**文档版本**：1.2 · 2026-04-17
