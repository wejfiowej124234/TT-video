# N2 快照对账结论（TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001）

**证据目录**：`evidence/ttg_econ_align/run_20260417T073429Z_compare/`  
**锚点来源**：`chain_reads.json`（与 N1 `run_20260417T073353Z` 同源复制）

## 锚点（冻结）

| 字段 | 值 |
|------|-----|
| `chain_id` | 11155111 |
| `block_number` | **10676467** |
| `token` (TTG) | `0x9f88a0072319c5d5c6ec1c61082288f6b86511a2` |
| `total_supply`（链上 wei 十进制串） | `10000000000000000000000000` |
| `treasury_balance` | `0` |

## A. `ttg-econ-align-compare.sh`（`/meta` 配置映射）

**结果**：**PASS**（见同目录 `api_db_compare.json`，exit 0）。

- `chain_id`、`governance_token_address`、`treasury_address` 与 `chain_reads` / 环境一致。

## B. Indexer 延迟（`GET /meta` → `indexer.checkpoint`）

| 项 | 值 |
|----|-----|
| `indexer.checkpoint.block_number` | 10671964 |
| 锚点 `block_number` | 10676467 |
| **落后块数** `anchor − checkpoint` | **4503** |

对照 **N2 Runbook §6.1**：软上限 32、**硬上限 128**。  
**4503 ≫ 128** → 按 Runbook：**不得**因索引器进度而对「全量 N2」标 **PASS**；至少 **SUSPECT**（若后续存在「投影数值 vs 链上」且不一致则 **FAIL**）。

## C. `total_supply` / `treasury_balance` 的 API 投影

当前 **`GET /meta`** **未**提供与 **`chain_reads.json`** 同字段的 TTG **`total_supply` / 金库余额** 数值投影；**本节数值对账记为「未实现 / 缺投影落点」**，不据此判 FAIL，但 **N2 全量 GO 仍受 §B 索引器延迟约束**。

## 综合判定（N2）

| 维度 | 判定 |
|------|------|
| **配置映射**（chain_id / TTG / treasury） | **PASS** |
| **索引器相对锚点块** | **SUSPECT**（落后超硬窗口） |
| **TTG 数值投影 vs 链上** | **SUSPECT**（无可用 API 键；以链上 `chain_reads` 为真） |

**推荐对外一句**：**N2 综合 = SUSPECT** —— **系统配置与链上地址一致**；**索引器 checkpoint 远低于 N1 锚点块**；**TTG 供给/金库余额尚未经 HTTP 投影与链上同锚点对拍**。

---

生成时间：UTC 2026-04-17（与 `api_db_compare.json` 同批运行）。
