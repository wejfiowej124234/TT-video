# TT-B428 · B-428 — 质押→投票→执行→池/国库 UI 最短演示闭环

**母表**：`B-428`  
**卡号**：`TT-B428-GOV-STAKING-TREASURY-UI-CLOSELOOP-001`  
**前置**：双池质押 + 新治理分轨 + **TT-B408** 影响面板已对齐；链上已部署 **Governor / Timelock / governance_token / Treasury / FeeRouter** 等（**`GET /meta` → `chain.contracts` 759 七键** 非空）。  
**日期**：2026-04-16  

---

## 1. 闭环一句话

在**同一目标环境**内，用**最短操作序列**把下列因果串成可讲解、可截图的叙事：**链上质押或持有治理票权 →（可选委托）→ 对 Governor 提案投票 → queue/execute 经过 Timelock → 国库/池侧余额或只读聚合在 `/governance` 相关页可被指认**；全程**不**依赖本仓库未实现的假数据。

---

## 2. 叙事边界（与 B-410 / B-090 / B-092 / B-098 对读）

| 概念 | 用户可见落点 | 说明 |
|------|----------------|------|
| **身份质押（Guide / Provider）** | 向导/服务商注册与质押流（非 `/governance` 主列表核心） | **81**/**订单押金** 与 **TTG 治理投票权** 正交；演示中**口头区分**「身份池」与「治理代币快照票权」。 |
| **治理代币票权** | `GET /api/v1/governance/voting-power`、`/governance/delegate`、提案详情 **`voting_power_at_snapshot`** | **B-098**：`getPastVotes` 与链上 Governor 快照一致；链下委托 **B-092** 仅 MVP 信号路径。 |
| **提案与执行** | `/governance/proposals`、`/governance/proposals/:id`、钱包 **castVote**；**queue/execute** 见 **B-417** | **B-408** 影响面板声明：HTTP **不**返回 execution **targets/calldatas**；执行核对以链上为准。 |
| **池 / 国库只读** | `/governance`（**`GET …/governance/pool`**）、可选 **`/governance/fee-routes`** | **B-110** 根级 **`pool_balance` / `country_pool*` / `treasury_*`** 与 **Σ 投影** 不得混读（**04 / ops RUNBOOK**）。 |

---

## 3. 最短演示路径（推荐顺序）

### 3.1 环境与只读锚点（5 分钟内）

1. 打开前端 **`/governance`**，确认 **`GovernanceTargetNotice`** 与（若已接）**池/金库**根级链上读段落。  
2. 另开 **`GET /meta`**（或 **`/meta/build`**），确认 **`chain.contracts`** 含 **`governor_address`、`timelock_address`、`governance_token_address`、`treasury_address`、`fee_router_address`、`guide_staking_address`、`staking_provider_address`**。  
3. **截图/录屏 A**：`/governance` 首屏 + 浏览器 Network 中 **`/meta`** JSON 片段（可打码 RPC）。

### 3.2 票权：委托与 voting-power（可选但利于讲解）

1. 登录后打开 **`/governance/delegate`**，按产品规则说明委托/撤销（**B-092**）。  
2. **`GET /api/v1/governance/voting-power`**（或前端已发起的同名请求），保存 **`on_chain_vote_weight`** / **`unified_on_chain_vote_weight_u256_dec`** 若存在。  
3. **截图/录屏 B**：委托页 + voting-power 响应关键字段。

### 3.3 提案与投票（Governor 模式）

1. 打开 **`/governance/proposals`**，确认 **`data_source=governance_proposals_projection`** 时列表与 **`/proposal-status`** 药丸（**Epic A** 叙事）。  
2. 进入 **`/governance/proposals/:id`**，展开 **B-090 说明**、**B-408 影响面板**、**castVote calldata**。  
3. 使用连接 **`governance_token`** 的钱包在 **Governor** 上发送 **`castVote`**（**勿**使用本页链下 POST 假票）。  
4. **截图/录屏 C**：提案详情（含 impact 标签）+ 钱包交易提交页（哈希可打码）。

### 3.4 Queue / Execute（Timelock）

1. 按部署环境在链上完成 **queue**（若尚未 **Queued**）与 **delay** 届满后的 **execute**。  
2. **权威操作指引**：**[`evidence/b417_governance_execution_runs/README.md`](../../evidence/b417_governance_execution_runs/README.md)**、**[`ops/RUNBOOK.md`](../../ops/RUNBOOK.md)** 中 **B-417** 段、**`scripts/ops/b417-*.sh`**。  
3. **截图/录屏 D**：执行前后 **Timelock** / **Governor** 浏览器视图或团队认可的区块浏览器链接列表。

### 3.5 执行后：池与国库「可见变化」

1. 再次打开 **`/governance`** 与 **`GET /api/v1/governance/pool`**，对比执行前后根级 **`treasury_pool` / `treasury_erc20_pool` / `pool_balance`**（以 **04** 与 **B-110** 门闸为准；**无变化亦有效**——需在演示中说明「本提案未定向改变该读数」）。  
2. 可选：**`/governance/fee-routes`**、**`/governance/vault-forwards`** 作为 **83/84** 分账叙事补充，**不**替代金库主读。  
3. **截图/录屏 E**：**pool** JSON 或 UI 前后对比（同一浏览器宽度、脱敏地址）。

---

## 4. 证据落盘（钉死路径）

建议每轮演示使用独立目录，避免覆盖：

```text
evidence/b428_gov_staking_treasury_ui_closeloop/run_<UTC>_<env_tag>/
  README.md                 # 本 Runbook §3 勾选表 + 环境变量表（脱敏）
  screenshots/              # A～E 或等效命名
  optional_screen_recording.md  # 录屏文件名校验 SHA256（若交付视频）
  meta-chain-contracts.json # curl GET /meta 节选
  pool-before.json / pool-after.json
```

仓库内索引：**[`evidence/README.md`](../../evidence/README.md#b428-gov-staking-treasury-ui-closeloop)**。

**已封口示例（GO）**：**[`evidence/b428_gov_staking_treasury_ui_closeloop/run_20260416T0949Z_local-api-b417-sepolia/README.md`](../../evidence/b428_gov_staking_treasury_ui_closeloop/run_20260416T0949Z_local-api-b417-sepolia/README.md)**（**`b428-closeout-record.json`**）。

--- 

## 5. 验收清单（GO / NO-GO）

- [ ] 至少 **1 组**前后可对的 **`governance/pool`**（或等效 curl）与 **说明文字**（为何变/为何不变）。  
- [ ] 至少 **1 张**提案详情含 **B-408** 影响标签与 **castVote** 区。  
- [ ] **queue/execute** 与 **B-417** 证据链 **无矛盾**（或明确标注「演示环境未跑完整 L3，仅投票到此为止」）。  
- [ ] 口述或字幕中区分 **身份双池质押** 与 **TTG 治理票权**。

---

## 6. 互证文档

- **89**（治理 UI Target / B-408 Partial）  
- **04 §3.4**（`governance/proposals`、`governance/pool`）  
- **81**（身份质押 vs 治理）  
- **governance-token/02 §4.5**（影响面板与 calldata）  
- **Epic A**：[Epic-A-governance-execution-ux-ladder.md](./Epic-A-governance-execution-ux-ladder.md)
