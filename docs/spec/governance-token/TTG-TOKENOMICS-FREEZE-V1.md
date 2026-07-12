# TTG Tokenomics Freeze V1 — 经济模型唯一真源

> **ALLOCATION SUPERSEDED (2026-07-12):** 创世分配表（六桶 25/20/15/15/5/20）已被 **[TTG-TOKENOMICS-GENESIS-V2](./TTG-TOKENOMICS-GENESIS-V2.md)** 取代（四块 15/5/30/50）。  
> **仍有效：** GOV-01～GOV-04、废止持币自动现金分红、P1–P4 USDC 叙事、Seat 退出不退 USDC 等非分配条款（除非 V2/后续 DD 明示修改）。

**Document ID:** `TTG-TOKENOMICS-FREEZE-V1`  
**Version:** v1-20260616  
**Status:** **PARTIALLY SUPERSEDED** — allocation → Genesis V2; GOV gates retained  
**Supersedes:** 一切「按 TTG 持仓自动分 55% 现金」「刚性分红」「HolderDividendVault 自动分红」叙事  
**Companion：** [protocol-ssot.v1.md](protocol-ssot.v1.md) · [TTG-TOKENOMICS-GENESIS-V2](./TTG-TOKENOMICS-GENESIS-V2.md) · [country-revenue-model-v1-draft §2.1](country-revenue-model-v1-draft.md) · [ttg-primary-market-and-exit-policy-v1-draft.md](ttg-primary-market-and-exit-policy-v1-draft.md) · [ttg-allocation-permissions-flows-ssot-v1.md](ttg-allocation-permissions-flows-ssot-v1.md)

**阶段边界：** ① 文档 + `/governance/params` 公示 **≠** ② Sepolia 合约部署 **≠** ③ 法务对外印刷 GO  
**Gate-2.4 关系：** Settlement `splitNetProfit` 45/55 **不变**（ABI 冻结）；**GOV-01～04** 约束 **GovernanceTreasury / Primary Market / Governor** — **独立 PR · 不混入 Ledger ABI**

---

## §0 冻结声明

自 **2026-06-16** 起，**TTG Tokenomics V1** 为 TravelTrust **唯一经济模型真源**，用于：

- Gate-2.4 前置评审与 Sepolia 实施包读口  
- `/governance/params` 产品公示  
- Whitepaper / Pitch Deck 摘抄  
- 08-4 路径 B 交叉引用  
- Legal Checklist 签核项  

**禁止** 在业务文档、UI、对外材料中重新引入已废止叙事（见 §6）。

---

## §1 Tokenomics V1 骨架（已冻结 · 非 GOV 专条）

| 层 | 规则 | SSOT |
|----|------|------|
| **供应** | 10,000,000 TTG · **Genesis V2 四块 15/5/30/50**（Team 1.5M · Community Incentive 0.5M · DAO Treasury 3M · Public Sale 5M） | [TTG-TOKENOMICS-GENESIS-V2](./TTG-TOKENOMICS-GENESIS-V2.md) · [protocol-ssot §1](protocol-ssot.v1.md) |
| **净利润第一步** | 单国 NetProfit **45% StewardPath / 55% Global Treasury** | [country-revenue-model §2](country-revenue-model-v1-draft.md) |
| **Treasury 顺序** | **P1 运营 → P2 安全 → P3 生态 → P4 Reserve** | §2.1 |
| **P4 默认** | **留库** · **须治理投票** 方可用 · **GOV-01 cap** | §2 GOV-01 |
| **Seat 退出** | 180d 冷静 → KPI → 解锁 TTG · **不退 USDC** | [ttg-primary-market §2](ttg-primary-market-and-exit-policy-v1-draft.md) |
| **公众发行** | 三轮 **800K / 1.2M / 3M**（Registry 初值 · 合计 5M）· **GOV-04 单钱包 cap** | §2 GOV-04 · [ttg-vesting-registry](../../../registry/ttg-vesting-registry.v1.yaml) · [ttg-primary-market §3](ttg-primary-market-and-exit-policy-v1-draft.md) |

---

## §2 治理硬闸 GOV-01～GOV-04（FROZEN）

### GOV-01 · Treasury 30% Cap

| 字段 | 值 |
|------|-----|
| **Rule ID** | `GOV-01` |
| **参数键** | `treasury_p4_deploy_cap_bps` = **3000**（**30.00%**） |
| **公式** | `deployCap = min(P4Surplus, TreasuryReserveBalance × treasury_p4_deploy_cap_bps / 10000)` |
| **TreasuryReserveBalance** | P4 子账 **未承诺 / 未锁定** USDC · **不含** P1～P3 已 earmark 或已 spend |
| **周期** | 与 [accounting-spec PR-01](country-pool-net-profit-accounting-spec-v1.md) **QUARTER** 对齐 |
| **禁止** | 跳过 P1～P3 · 自动按 TTG 持仓发现金 · 单周期 deployCap **> 30% Reserve** |

**治理可选项（经 GOV-02 投票 · 非默认）：** A 回购 · B 销毁 · C 持币奖励 · D 生态 · E 国家池 — 详见 [ttg-primary-market §1.3](ttg-primary-market-and-exit-policy-v1-draft.md)

---

### GOV-02 · 治理法定人数 / Quorum

| 字段 | 值 |
|------|-----|
| **Rule ID** | `GOV-02` |
| **参数键** | `governance_quorum_bps` = **400**（参与投票 TTG **≥ 4.00%** `TTG_TOTAL_SUPPLY`） |
| | `governance_approval_threshold_bps` = **5000**（赞成票 **≥ 50%** 已投权重） |
| | `governance_timelock_delay_hours` = **48** |
| **适用范围** | P4 动用 · 公众 Round 2/3 开启 · GOV 参数修订 · Treasury 回购/销毁提案 |
| **冲突披露** | `team` / 初创团队 founding multisig **须** 披露利益 · **禁止** 未披露投票（Genesis V2 **无**独立 advisors 创世桶；披露对象为 team / founding multisig） |
| **回购执行（②）** | TWAP **≥ 7 天** · 单笔 **≤ 5%** 当日 DEX 深度 |

---

### GOV-03 · Seat 集中度限制（**V1.1 修订 · 2026-07-11**）

**Amendment SSOT：** [GOV-03-AMENDMENT-V1.1.md](GOV-03-AMENDMENT-V1.1.md)

| 字段 | 值 |
|------|-----|
| **Rule ID** | `GOV-03` |
| **参数键** | `max_active_seats_per_controlling_entity` = **1**（同一控制主体 **≤ 1** Active Seat · **一国一控**） |
| | `max_voting_power_cap_disabled` = **true**（**显式关闭单地址权重上限**） |
| | `max_voting_power_per_address_bps` = **0**（**仅当 cap_disabled=false 时生效** · **0 在此语义 = Unlimited，≠ No Vote**） |
| | `max_aggregate_seat_stake_per_entity_bps` = **400**（**仅 Seat 质押路径** · 同一控制主体质押合计 **≤ 4.00%** 总供应） |
| **流程保护（非 cap）** | **Team 15%** → Vesting · **DAO Treasury 30%**（Genesis V2）→ Safe → **Proposal → Vote（GOV-02）→ Timelock 48h → Execute** |
| **Phase 1** | 十国各 **1 Seat** · [protocol-ssot §4](protocol-ssot.v1.md) `seat_cap: 1` / 辖区 |
| **禁止** | 同一控制主体 **>1** Active Seat · 未披露 team / founding multisig 投票（GOV-02）· 嵌套地址规避 **Seat** 绑定（② KYC / `controllingEntityOf`） |
| **废止（V1.1）** | 单地址 TTG **持仓 / 投票权重 ≤ 4%** — **不得** 再作为 team 15% 拆分依据 |

---

### GOV-04 · 单钱包认购上限

| 字段 | 值 |
|------|-----|
| **Rule ID** | `GOV-04` |
| **参数键** | `public_sale_per_wallet_cap_ttg` = **25000**（**0.25%** × 10M） |
| | `public_sale_min_purchase_usdc` = **100** |
| **适用轮次** | **Round 1 Early / Round 2 / Round 3**（默认同 cap · 修订须 **GOV-02** 提案） |
| **轮次硬顶** | R1 **800,000** · R2 **1,200,000** · R3 **3,000,000** TTG（Registry 初值 · 合计 5M · 见 [ttg-vesting-registry](../../../registry/ttg-vesting-registry.v1.yaml) · [Genesis V2](./TTG-TOKENOMICS-GENESIS-V2.md)） |
| **禁止** | 单钱包通过多地址拆分 **规避** GOV-04（② **须** 合规/KYC 或链上累计 cap） |

---

## §3 机读镜像（YAML · API · 前端）

**Authoritative keys：** [protocol-ssot.v1.yaml](protocol-ssot.v1.yaml) `governance_freeze_v1` · `GET /api/v1/governance/protocol-reference`（② 对齐）

```yaml
governance_freeze_v1:
  document_id: TTG-TOKENOMICS-FREEZE-V1
  frozen_at: "2026-06-16"
  gov_freeze_v2_sepolia_baseline: "GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE · ACTIVE"
  GOV-01:
    treasury_p4_deploy_cap_bps: 3000
  GOV-02:
    governance_quorum_bps: 400
    governance_approval_threshold_bps: 5000
    governance_timelock_delay_hours: 48
  GOV-03:
    max_active_seats_per_controlling_entity: 1
    max_voting_power_cap_disabled: true
    max_voting_power_per_address_bps: 0          # disabled=true → unlimited weight, NOT no vote
    max_aggregate_seat_stake_per_entity_bps: 400
    gov_03_amendment: GOV-03-AMENDMENT-V1.1
  GOV-04:
    public_sale_per_wallet_cap_ttg: 25000
    public_sale_min_purchase_usdc: 100
```

---

## §4 消费方索引

| 消费方 | 路径 |
|--------|------|
| **本文件（经济模型 SSOT）** | `docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md` |
| **Final Audit Report** | [TTG-TOKENOMICS-FREEZE-V1-FINAL-AUDIT-REPORT.md](TTG-TOKENOMICS-FREEZE-V1-FINAL-AUDIT-REPORT.md) |
| **Full-System Audit（② · 真人测试前）** | [TTG-TOKENOMICS-FULL-SYSTEM-AUDIT-REPORT.md](TTG-TOKENOMICS-FULL-SYSTEM-AUDIT-REPORT.md) · `bash scripts/dev/run-ttg-tokenomics-full-system-audit.sh` |
| **GOV-04 vs Seat 准入** | [GOV-04-SEAT-STAKE-ADMISSION-AUDIT.md](GOV-04-SEAT-STAKE-ADMISSION-AUDIT.md) |
| **Gate-2.4** | [country-pool-settlement-gate2.4-prerequisites-checklist.md](country-pool-settlement-gate2.4-prerequisites-checklist.md) **G24-P-12** |
| **Whitepaper** | [01-对外白皮书-草案 §4](01-对外白皮书-草案.md) |
| **Pitch Deck** | [03-对外材料 §1](03-对外材料-PPT与白皮书数据页摘抄索引.md) |
| **08-4** | [08-4 §9-c](../08-4-对外口径包.md) |
| **Legal** | [LEGAL-SIGNOFF-CHECKLIST.md](LEGAL-SIGNOFF-CHECKLIST.md) |
| **UI** | `/governance/params#gov-params-tokenomics-freeze` |

---

## §5 维护规则

| 变更 | 须同步 |
|------|--------|
| 任何 GOV-01～04 数值 | 本文件 · `protocol-ssot.v1.yaml` · Final Audit Report bump · `/governance/params` · 08-4 §9-c · Legal checklist |
| P1～P4 顺序 / 45/55 | `country-revenue-model` · `ttg-allocation-permissions-flows-ssot-v1` |
| Settlement ABI | **Gate-2.4 冻结面不变** — GOV 变更 **不得** breaking `splitNetProfit` |

---

## §6 已废止叙事（清理清单 · 禁止回流）

- Global Treasury 55% **自动** 按 TTG 持仓 **发现金** 给所有持有人  
- 「总池 55 按 TTG 占全供应比例切分」作为 **产品第二步**  
- `HolderDividendVault` / 自动分红 / 刚性 USDC 兑付 / Seat 退出退 USDC  
- 将 **FeeRouter 65/20/15** 与 **净利润 P4** 混为同一「分红故事」  

---

## §7 变更记录

| Version | Date | Note |
|---------|------|------|
| v1-20260616 | 2026-06-16 | 初版冻结：GOV-01～04 · Tokenomics V1 SSOT · Gate-2.4 / Sepolia 读口 |
| v1.1-gov03-20260711 | 2026-07-11 | **GOV-03 V1.1：** 移除单地址 4% 投票/持仓 cap · 保留 Seat 一国一控 + 流程保护 — [GOV-03-AMENDMENT-V1.1](GOV-03-AMENDMENT-V1.1.md) |
