# GO_95 — §7.7 · 治理 `pool` / `rewards` 预览与分轨披露（落款 · 2026-04-22 · **v1.4.126**）

**95**：`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md` **§7.7** 子项「治理 pool/rewards 接真源或 UI 降级为预览」  
**结论**：按 **「或」** 语义，**UI 降级 / 来源分轨披露** 与 **后端多轨（DB / 可选链上 SSOT / placeholder）** 已落盘；本条 **`[x]`** = **里程碑落款**，**不**表示 **83/84** 区域账本终局、**S-4** 主批次全文审计、或 **主网** 治理奖励聚合已人签闭合（与 **§7.4 域 J**/**§11.1 Governance 扩展只读** 证据包诚实边界一致）。

## 1. 后端锚点

- **`crates/api/src/routes/governance/mod.rs`** 篇注：有 DB 时读 **`governance_pool` / `governance_reward_records` / …**；无 DB 时占位。  
- **`crates/api/src/routes/governance/governance_pool.rs`**：**`GET /api/v1/governance/pool`** — 条件 **`GOVERNANCE_*_CHAIN_SSOT`** 族 env 与 **`balance_read`** 链上读；否则走 DB/占位 + **`chain_alignment_hint`**。  
- **`crates/api/src/routes/governance/router.rs`**：**`GET …/governance/pool`**、**`GET …/governance/rewards`**。

## 2. 前端锚点（预览 / 占位 / 链读分支）

- **`frontend/app/governance/page.tsx`**：**`GovernanceTargetNotice`** + **B-428** 文档指针；**`data_source === "chain_read"`** 时 **SSOT 徽章**与「非人类可读 hex」说明；**`database` / `database_empty`** → **`governance_pool_db_empty`**；否则 **`governance_pool_placeholder`**；**`rewards?.data_source === "placeholder"`** → **`governance_rewards_placeholder`**。  
- 文件头注释：**13-1 表 2**、**50-G1**、**51-H2**（占位与产品定稿边界）。

## 3. 命令（本轮机读）

```bash
bash scripts/run-check-04-routes.sh
cargo test -p traveltrust-api routes::governance::tests::governance_pool --
cargo test -p traveltrust-api routes::governance::tests::governance_rewards --
cargo test -p traveltrust-api routes::governance::governance_pool_meta_alignment_b177::tests::b177_obs_anchor_and_chain_id_equal_without_config --
```

**本机结果（摘录）**：`run-check-04-routes.sh` **exit 0**；**`governance_pool`** 占位/DB 枝 **2 passed**；**`governance_rewards`** 占位/DB 枝 **2 passed**；**`b177_obs_anchor…` 1 passed**。

## 4. 诚实边界

- **仍开**：**§7.7** 多实例内存 SSOT（**§9 ISS-009**）；**§12.1 · S-4**/**83/84/91**/**P5-1** 与 **rewards 聚合** 生产叙事终验。  
- **禁止**：仅凭本包将 **§8.2** 治理相关 **行完成** 或 **93·C** 域矩阵标为已闭。
