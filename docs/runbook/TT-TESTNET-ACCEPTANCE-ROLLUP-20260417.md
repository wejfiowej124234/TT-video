# 测试网总验收结论（最终版）· 2026-04-17

**用途**：回答「**当前测试网验收结论是什么、证据在哪**」——**只看本节列出的入口**，不必在 `evidence/` 里四处翻找。**不替代**各 TT 正文、证据目录原文、区块浏览器实查。

**变更即回归**：仅 **合约 / API / indexer / 前端调用或接线** 改动须五维重跑并对照 **run_20260417**；**纯文档** 只做基线抽查 — [`TT-TESTNET-GOLDEN-BASELINE-REGRESSION.md`](./TT-TESTNET-GOLDEN-BASELINE-REGRESSION.md)（**单人最小口诀**见该文 **§X**）。

---

## 0 · 当前测试网「最终真值」唯一入口（请只引用这三处）

| # | 入口 | 内容 |
|---|------|------|
| 1 | **本文档**（本页） | 总验收叙述：**主链路已证** / **边界外未证项** / **本轮基线** |
| 2 | **[`TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md`](../../evidence/b417_governance_execution_runs/TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md)** | **Treasury.spend** 最小闭环 **PASS** 的 **固定目录**（`run_<UTC>/` **+** `PROPOSAL_ID`） |
| 3 | **最新** **`ttg_econ_align/run_<UTC>_compare/api_db_compare.json`**（本基线见下表 **N2**） | **N2** 薄层对账机读结论（`verdict` **+** `api_base_url` **+** checks） |

**互证（仍属主链路真值，但不必与上表混为「第四入口」）**：**[`TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001`](./TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001.md)**（防误解表与边界外模块清单）。

---

## 1 · 总验收结论（相对历史「主链路已证 / 边界已列明 / 剩余未证单列」的更新）

**主链路**：**FeeRouter 收入分配 → GovernanceTreasury 入账 → 经 B-434 v3 裁断之 Timelock 控制的治理执行（含 B-417）→ Treasury.spend 专用最小闭环**，在测试网上已形成 **可复核** 证据链；叙述须 **按各 TT 分别引用**，不得合并成一句「全系统已证」。

**本轮相对上一版收口**：

- **N2** 已由 **SUSPECT** **收敛为** **PASS**（**`api_db_compare.json` → `verdict":"PASS"`**）：**同一锚点**下 **`chain_id` / 合约地址 / `total_supply` / `treasury_balance`** 与 **`GET /meta`**（含 **`chain.ttg_econ_anchor`**）一致；**仍不**等于 **全量经济分配或全链持仓** 的独立 E2E（见边界文档 **§2**）。
- **`GET /meta`**（**`chain.ttg_econ_anchor`**）与 **`GET /api/v1/internal/ttg-econ-anchor`** 在本轮已作为 **N2** 对账落点 **可用**（见 **[`TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001`](./TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001.md)**）。
- **当前「未证」项**：**仅保留** **[`TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001`](./TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001.md) §2～§4** 中 **明确不在** 上述主链路范围内的模块（例如 **DID/向导体系、双质押池独立 E2E、Region/Reserve 业务全叙事、逐合约矩阵签收** 等）；**不得**把主链路 GO **误推**为这些域已验收。

---

## 2 · 主链路已证（证据指针 · 本基线）

| 主题 | 结论摘要 | 真源或目录 |
|------|----------|------------|
| **B-434 Timelock 真源裁断（v3）** | 全栈资金与治理接线须与此 **三键** 同源 | [`evidence/timelock_truth_arbitration/decision_record.v3.json`](../../evidence/timelock_truth_arbitration/decision_record.v3.json) |
| **线 A** | FeeRouter + `GET /meta` + 分轨观测 **最小集 PASS** | [`evidence/GO_20260417_line_a_minimal/`](../../evidence/GO_20260417_line_a_minimal/) |
| **线 B / B-417** | Governor / Timelock **queue → execute**，证据包 **`execution_verdict=GO`** | [`evidence/b417_governance_execution_runs/`](../../evidence/b417_governance_execution_runs/)（通用索引见内 **`README.md`**） |
| **线 B · Treasury.spend 最小闭环** | **PASS**（**`TreasurySpent`** / 证据包 **`exit 0`**） | **[`TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md`](../../evidence/b417_governance_execution_runs/TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md)** → **`run_20260417T0810Z/`**（**`PROPOSAL_ID=2`**；勿与 id=1 等旧提案混读） |
| **TTG · N1（链上只读）** | **`chain_reads.json`** 与 **v3** 同栈代币/金库地址；供 **N2** 锚点 | **本基线**：[`evidence/ttg_econ_align/run_20260417T083300Z_compare/chain_reads.json`](../../evidence/ttg_econ_align/run_20260417T083300Z_compare/chain_reads.json) |
| **TTG · N2（配置与投影薄对账）** | **`verdict":"PASS"`** | **本基线**：[`evidence/ttg_econ_align/run_20260417T083300Z_compare/api_db_compare.json`](../../evidence/ttg_econ_align/run_20260417T083300Z_compare/api_db_compare.json) |
| **全栈资金观测封口（加分项）** | **TT-B435** 与 **`evidence/b435_*`** | [`evidence/b435_fullstack_fund_testnet_closeout/`](../../evidence/b435_fullstack_fund_testnet_closeout/README.md) — **不与** Treasury.spend 最小闭环 **混为同一验收单** |

**细则与 Runbook**：**[`TT-GOV-TOKEN-ECON-ALIGN-001`](./TT-GOV-TOKEN-ECON-ALIGN-001.md)**（N1）、**[`TT-TREASURY-SPEND-MINI-EVIDENCE-001`](./TT-TREASURY-SPEND-MINI-EVIDENCE-001.md)**、**[`TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001`](./TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)**。

---

## 3 · 本轮冻结基线（后续改动请按「相对本基线是否破坏」验收）

| 项目 | 冻结值 |
|------|--------|
| **API 端口约定（仓库 SSOT）** | **`traveltrust-api`** 默认 **`PORT=8080`**（**`API_BASE_URL` / `GET /meta` 同源**）；全栈时 **Next 开发服 `3012`**（见 **根目录** **`.env.example`** **§监听端口**）。**N2 本包记录**：`api_base_url` = `http://127.0.0.1:8080`（见 **`api_db_compare.json`**）。 |
| **B-434 v3 真值** | **`decision_record.v3.json`**：`timelock_truth_decision=B`，**canonical Timelock / Governor / TTG** 三键见该文件（**Sepolia `chain_id=11155111`**）。 |
| **N1 / N2 证据目录（本轮）** | **`evidence/ttg_econ_align/run_20260417T083300Z_compare/`**（**`chain_reads.json`** **+** **`api_db_compare.json`** **+** 同目录 **`meta_snapshot.json`** 等）。更新时 **新开** **`run_<UTC>_compare/`**，**勿覆盖**本目录。 |
| **Treasury.spend 真源目录** | **`evidence/b417_governance_execution_runs/run_20260417T0810Z/`**（指针以 **[`TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md`](../../evidence/b417_governance_execution_runs/TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md)** 为准）。 |

---

## 4 · 边界外未证项（不得默认已做）

完整 **防误解表** 与 **下一批 TT 清单**：**[`TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001`](./TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001.md)** **§2～§4**。

---

**文档版本**：2.0 · **2026-04-17**（总验收最终版 + 三入口 + 基线冻结）
