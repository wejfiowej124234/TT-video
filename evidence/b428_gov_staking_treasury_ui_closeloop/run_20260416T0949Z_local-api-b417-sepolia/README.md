# B-428 · 真实证据包 · `run_20260416T0949Z_local-api-b417-sepolia`

**Runbook**：[docs/runbook/TT-B428-GOV-STAKING-TREASURY-UI-CLOSELOOP-001.md](../../docs/runbook/TT-B428-GOV-STAKING-TREASURY-UI-CLOSELOOP-001.md)

## 环境与脱敏

| 项 | 值 |
|----|-----|
| **API** | `http://127.0.0.1:8080`（本机运行中的 `traveltrust-api`） |
| **前端截图** | `http://127.0.0.1:3012`（`npm run build` → `npm run start` 生产态） |
| **链上 queue/execute** | **Sepolia**；与仓库内 **B-417 GO** 证据 **[run_20260416T0602Z](../../b417_governance_execution_runs/run_20260416T0602Z/)** 同源互证 |
| **GET `/meta`（本机 API）** | `chain_id`=`137`，`chain.contracts`=`null`（**与 Runbook 前置「759 七键非空」不一致**）；本包 **pool/treasury 机读**仍以 **`GET /api/v1/governance/pool`** 为准，叙事上须与 **目标测试网** 部署对读 |
| **鉴权** | 进程 **`auth_placeholder_layer`** 下，匿名 **`GET /api/v1/*`**（除白名单）须 **`X-User-Id`** 或 **`Authorization`**；本包 **`pool-*.json`** 使用 **固定测试 UUID** 请求头（**非**生产密钥） |

## Runbook §3 / §5 勾选

- [x] **A** `/governance` 首屏 + **`GET /meta`** 节选：`screenshots/A-governance-home.png` + `meta-chain-contracts.json`
- [x] **B** 委托 + voting-power：`screenshots/B-delegate.png` + `voting-power-sample.json`
- [x] **C** 提案列表 / 详情：`screenshots/C-proposals-list.png`；详情页在无后端 Governor 投影时返回 **500**，仍留 `C-proposal-detail-id-1.png` 作为「路由存在」证据（**非**产品绿服状态）
- [x] **D** queue / execute：**`D-queue-tx-sepolia-etherscan.png`**、**`D-execute-tx-sepolia-etherscan.png`**（Sepolia Etherscan；与 `b417-chain-step-*.json` / `b417-governance-execution-report-cross-ref.json` 对齐）
- [x] **E** 池/分账叙事补充：`screenshots/E-fee-routes-pool-narrative-supplement.png` + `pool-before.json` / `pool-after.json`（本实例 **前后一致**，符合 Runbook「无变化亦须说明」）
- [x] **身份双池质押（与 TTG 正交）**：`screenshots/S-staking-dual-pool-narrative.png`（`/staking`）

## 截图 SHA256（PNG）

见本目录 `screenshots/SHA256SUMS.txt`。

## 互证文件

- `b417-governance-execution-report-cross-ref.json` ← B-417 **`execution_verdict: GO`**
- `b417-chain-step-queue.json` / `b417-chain-step-execute.json`（侧车）

## GO / NO-GO

- **GO（本仓库封口）**：**B-428** 演示链 **文档 + 可复核 JSON + PNG + B-417 互证** 已齐；**目标生产/测试网**若 **`/meta.chain.contracts` 非空**，建议另开 **`run_<UTC>_<env_tag>`** 复拍 **A/E** 以对齐 **759** 叙事。
- **NO-GO 条件**：缺本目录 **`pool-before`/`pool-after`** 或可核验的 **B-417** 互证路径。
