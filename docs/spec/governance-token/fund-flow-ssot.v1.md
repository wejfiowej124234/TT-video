# Fund Flow SSOT v1 — 四类资金分轨唯一真源

**Version:** 1.0.0  
**Status:** **LOCKED（Protocol Convergence · P0）**  
**Companion:** [protocol-ssot.v1.md](protocol-ssot.v1.md) · [state-machine.v1.md](state-machine.v1.md) · [ttg-allocation-permissions-flows-ssot-v1.md](ttg-allocation-permissions-flows-ssot-v1.md)

---

## §0 原则

1. **四类资金永不混账：** TTG · USDC Country Pool · Escrow 订单托管 · FeeRouter 可分配手续费。  
2. **链为余额真值**（83 附录 I）；后端/UI **只读投影**。  
3. **「可退」仅指 NAV 赎回轨**；TTG 质押 = **责任抵押释放**，**不是** 本金刚性兑付。

---

## §1 四类资金定义

| 轨 | 资产 | 来源 | 真值合约/模块 |
|----|------|------|----------------|
| **R1 · TTG** | 治理代币 | Treasury 铸造/分配、换币、转账 | `GovernanceVotesToken` |
| **R2 · Country Pool** | USDC/USDT | 用户认购、APP 认领 | `CountryPool` / `RegionVault`（Target） |
| **R3 · Escrow** | USDC/USDT | 旅行者订单订金 | `Escrow` / `EscrowFactory` |
| **R4 · Fee** | USDC/USDT | 订单可分配手续费 | `FeeRouter` → 国家桶 / Global |

**正交（84 §1.1.1）：** L1/L2 gas、争议仲裁费、向导 **IdentityStakingPool** slash **不** 进入 R4 的 45/55 分母。

---

## §2 R2 · USDC Country Pool 子账结构（Target）

```text
USDC 认购 / 换币入账（分轨 B · 84 §1.2.1）
        ↓
   CountryPool（按 jurisdiction 分池）
        ├─ ReserveVault        协议强制准备金（5～10% NAV · DAO 参数）
        ├─ OperationsVault     已计提运营预算（按月多签释放 · 主理人不可单签）
        ├─ ClaimVault          Snapshot 后可 Claim 分配（83 附录 D）
        └─ RedemptionVault     窗口期 NAV 赎回队列（§4）
```

| 子账 | 谁可动 | 可提？ | 退款语义 |
|------|--------|--------|----------|
| **ReserveVault** | Timelock / 多签 | 否（除治理核准） | 缓冲，不分配给个人 |
| **OperationsVault** | 多签 + 预算帽 | 否 | **已花费运营费不退**；只影响 NAV |
| **ClaimVault** | 合约 Claim | 持有人 Claim | 按 Snapshot 规则，**非** 认购本金保证 |
| **RedemptionVault** | 赎回合约 | 窗口内 pro-rata | **NAV 比例赎回**（§4） |

**禁止：** 从 R2 子账 **直接发主理人工资** 而无 OperationsVault 预算帽与披露；**禁止** 与 R3 Escrow 同一地址。

---

## §3 R1 · TTG · StewardStakePool（Target · P2 合约）

```text
用户 TTG 余额
        ↓ approve
   StewardStakePool.stake(jurisdiction_id, amount, application_id)
        ├─ 锁定：不可转卖/不可重复 stake 同一 jurisdiction
        ├─ 投票权：质押期间 getPastVotes 规则见 14 §1.1.0（不双重计票）
        └─ 释放：见 state-machine · steward_application → released
```

| 动作 | 可提？ | 说明 |
|------|--------|------|
| **申请前钱包 TTG** | 是 | 自由转账 |
| **stake 锁定中** | **否** | 责任抵押 |
| **审核驳回** | 延迟可释 | [protocol-ssot §3](protocol-ssot.v1.md) `steward_stake_release_delay_days` |
| **Seat 任内主动辞任** | 有条件释 | 最短任期 + 通知期；**非** 全额即时 |
| **违规 slash** | 否 | 罚没至 ProtocolVault |

**与 R2 无关：** TTG 质押 **不参与** USDC NAV 赎回公式。

---

## §4 NAV 赎回（R2 · Redemption 轨）

**公式（企业级 · 非本金保证）：**

```text
NAV = PoolAssets − Reserve − AccruedOperations − PendingClaims − PendingRedemptions

UserRedemption = NAV × (user_shares / total_shares)
```

| 项 | 说明 |
|----|------|
| **封闭期** | [protocol-ssot §3](protocol-ssot.v1.md) `country_pool_subscription_lock_months` |
| **窗口** | 每季度 `redemption_window_days_per_quarter` 天 |
| **上限** | 单窗口赎回 ≤ `redemption_max_nav_pct_bps` × NAV |
| **超额** | 队列 pro-rata 或顺延下一窗口 |

**状态机：** [state-machine.v1 §3](state-machine.v1.md) `redemption_*`。

---

## §5 R3 · Escrow（订单 · 简述）

```text
Traveler 支付 → Escrow 锁仓 → release/refund（Guide/Traveler 状态机 · 53）
```

| 属性 | 值 |
|------|-----|
| 与 TTG/Country Pool | **完全隔离** |
| Governor 能否直接动用 | **禁止**（governance-token/02 §4.6） |
| 主理人 Seat | **无** 订单内操作权（87 §5） |

---

## §6 R4 · FeeRouter（手续费 · 简述）

```text
订单可分配费 → FeeRouter → 45% 国家桶 → RegionVault…
                          → 55% Global Pool → 65/20/15
```

**参数 SSOT：** [protocol-ssot.v1 §2](protocol-ssot.v1.md) — **禁止** 在 84/89 另写 45/55。

---

## §7 签字与治理矩阵

| 资金动作 | 执行者 | 治理 |
|----------|--------|------|
| Escrow release/refund | Traveler/Guide（状态机） | 合约 |
| FeeRouter 比例 | GlobalDAO | Timelock |
| OperationsVault 拨付 | 多签 | 预算 + 披露 |
| TTG stake/slash | StewardStakePool | 合约 + Admin 审核门 |
| NAV 赎回 | Redemption 合约 | 窗口 + 队列 |
| 团队 15% 释放 | Treasury | cliff/vest（01 对外稿） |

---

## §8 变更记录

| Version | Date | Note |
|---------|------|------|
| 1.0.0 | 2026-05-27 | P0 初版：四轨 + CountryPool 四 Vault + NAV 赎回 |
