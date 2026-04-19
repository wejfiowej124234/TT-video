# Treasury.spend 最小闭环 · 固定真源（SSOT 指针）

**目的**：在 `evidence/b417_governance_execution_runs/` 下为 **`TT-TREASURY-SPEND-MINI-EVIDENCE-001`** 提供 **唯一** 目录指针，避免与「任意 B-417 `run_*`」或 **旧 `proposalId`** 混淆。

**总验收索引（测试网「当前状态」三入口之一）**：测试网主链路结论与基线冻结见 **[`docs/runbook/TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md`](../../docs/runbook/TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md)**；**N2** 机读真值见 **最新** **`evidence/ttg_econ_align/run_<UTC>_compare/api_db_compare.json`**（本 SSOT 对应轮次见该文档 **§3 基线表**）。

**当前真源目录（PASS）**：

- **`run_20260417T0810Z/`** — 详见该目录 **[`README.md`](run_20260417T0810Z/README.md)**（含 **`PROPOSAL_ID=2`**、queue/execute **tx**、**`TreasurySpent`** 核对要点）。

**更新规则**：若未来重跑 Treasury.spend 专用闭环并替换真源，应 **新开** `run_<UTC>/`、更新 **本文件** 与 **`TT-TREASURY-SPEND-MINI-EVIDENCE-001`** 的「已落盘真源」段，**勿**覆盖历史目录（保留审计可追溯）。
