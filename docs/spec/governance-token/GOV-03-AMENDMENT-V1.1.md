# GOV-03 Amendment V1.1 — Seat-only concentration · no wallet vote cap

**Document ID:** `GOV-03-AMENDMENT-V1.1`  
**Version:** v1.1-20260711  
**Status:** **ACTIVE（Owner 拍板 · 修订 GOV-03 子集 · 其余 GOV-01/02/04 不变）**  
**Amends:** [TTG-TOKENOMICS-FREEZE-V1 §2 GOV-03](TTG-TOKENOMICS-FREEZE-V1.md)  
**Companion:** [GENESIS-GOVERNANCE-PHASE.md](GENESIS-GOVERNANCE-PHASE.md) · [protocol-ssot.v1.yaml](protocol-ssot.v1.yaml)

**阶段边界：** ① SSOT + 本地合约/前端 **≠** ② Sepolia 已部署 Governor 仍可能为 legacy 400 bps（须 Timelock 升级） **≠** ③ 主网部署按 V1.1

---

## §0 Owner 决策摘要

**移除：** 单地址 TTG **持仓 / 治理投票权重** ≤ 4% 总供应（`max_voting_power_per_address_bps`）。

**保留：** 同一控制主体 **≤ 1** Active Seat（一国一控 · Seat 路径）。

**保留（Seat 路径）：** 同一控制主体 Seat 质押合计 ≤ 4% 总供应（`max_aggregate_seat_stake_per_entity_bps` = 400）— 与 CN/US 等 **steward_stake_bps** 门槛对齐，**非** 泛钱包持仓 cap。

**替代保护（流程 · 非数值 cap）：**

```text
Team 15%        → Vesting 合约
Treasury 20%    → Safe multisig
        ↓
Proposal → Vote（GOV-02 · quorum ≥4% · approval ≥50%）
        ↓
Timelock 48h
        ↓
Execute（Treasury / Seat / 参数）
```

**理由（Owner）：** 15% team 桶若强制拆成多个 ≤4% 钱包，不提高安全，只增加运营复杂度；行业常见做法是 **不限制钱包持仓**，用 **vesting + multisig + 治理流程 + 利益披露** 约束。

---

## §1 参数变更表

| 参数键 | V1（2026-06-16） | **V1.1（2026-07-11）** |
|--------|------------------|------------------------|
| `max_active_seats_per_controlling_entity` | 1 | **1（不变）** |
| `max_voting_power_cap_disabled` | — | **true** |
| `max_voting_power_per_address_bps` | 400 | **0**（**仅当 cap_disabled=false 时生效** · **disabled=true 时 = Unlimited，≠ No Vote**） |
| `max_aggregate_seat_stake_per_entity_bps` | 400 | **400（不变 · 仅 Seat 质押路径）** |

---

## §2 禁止 / 允许

| 允许 | 禁止 |
|------|------|
| team vesting 合约 / Safe 持有 **>4%** TTG（未解锁部分在 vesting 内） | 同一控制主体 **>1** Active Seat |
| 大持有人经 **GOV-02** 投票 + **48h Timelock** 动用 Treasury | 未披露利益的 team/advisors 投票（GOV-02） |
| Seat 路径聚合质押 ≤ 4% / entity | 通过嵌套地址规避 **Seat** 一国一控（② KYC / `controllingEntityOf` 绑定） |

---

## §3 消费方同步清单

| 消费方 | 动作 |
|--------|------|
| [TTG-TOKENOMICS-FREEZE-V1](TTG-TOKENOMICS-FREEZE-V1.md) | §2 GOV-03 + §7 changelog |
| `protocol-ssot.v1.yaml` / `.md` | `max_voting_power_per_address_bps: 0` |
| [GENESIS-GOVERNANCE-PHASE](GENESIS-GOVERNANCE-PHASE.md) | 删除「team 须拆 ≤4%/地址」叙述 |
| [08-4 §9-c](../08-4-对外口径包.md) | 对外口径 |
| `/governance/params` | 前端 `governanceParamsTokenomicsModel.ts` + i18n |
| `TtgGovFreezeConstants` | `MAX_VOTING_POWER_PER_ADDRESS_BPS = 0` |
| ② Sepolia | **Governor proxy 升级** 前链上仍可能读数 400 — 见 verify 脚本 legacy 分支 |

---

## §4 变更记录

| Version | Date | Note |
|---------|------|------|
| v1.1-20260711 | 2026-07-11 | Owner：移除单地址 4% cap · Seat 一国一控 + 流程保护 |
