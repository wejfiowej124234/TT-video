# Genesis Governance Phase（治理启动阶段 · 解释性 SSOT）

**Document ID:** `GENESIS-GOVERNANCE-PHASE`  
**Version:** v1-20260711  
**Status:** **ACTIVE（① 解释层 · 不改 Tokenomics 冻结数字）**  
**Phase boundary:** ① 文档 → ② Sepolia Governor 对齐 → ③ 主网另闸  

> **5 分钟总图：** [TTG-GOVERNANCE-LIFECYCLE.md](TTG-GOVERNANCE-LIFECYCLE.md) · **框架冻结：** [TTG-GOVERNANCE-FREEZE-CERTIFICATE.md](TTG-GOVERNANCE-FREEZE-CERTIFICATE.md)  
> **本文件职责：** 回答投资人/社区/审计常问的问题——**为何启动期团队能发起并通过第一批治理提案？** 后续如何自动稀释？
> **禁止：** 在本文件 **另造** 供应比例、Quorum、GOV 参数；数值 **只读** 冻结 SSOT。

**数值真源（FROZEN · 不得改）：**

| 层 | SSOT |
|----|------|
| 供应六桶 · 10M | [protocol-ssot.v1 §1](protocol-ssot.v1.md) |
| GOV-01～04 | [TTG-TOKENOMICS-FREEZE-V1](TTG-TOKENOMICS-FREEZE-V1.md) |
| 分配 · 权限 · 流程图 | [ttg-allocation-permissions-flows-ssot-v1](ttg-allocation-permissions-flows-ssot-v1.md) |
| 公众三轮 · P4 · Seat 退出 | [ttg-primary-market-and-exit-policy-v1-draft](ttg-primary-market-and-exit-policy-v1-draft.md) |
| Governor · Timelock · Safe | [TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC](../TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC.md)（若路径存在则 02 §4.6） |

**阶段边界：** ① 本文 + `/governance/params` 公示 **≠** ② 链上 Governor 全路径验收 **≠** ③ Production GO / 法务对外定稿。

---

## §0 文档栈位置（写死）

```text
Tokenomics（FROZEN · TTG-TOKENOMICS-FREEZE-V1）
        ↓
Allocation / 四轨 / 两轨收益（FROZEN · protocol-ssot + allocation SSOT）
        ↓
Governor / Timelock / Safe（工程 + ② 部署）
        ↓
Genesis Governance Phase（本文件 · 解释启动期）
        ↓
Public Governance Phase（[PUBLIC-GOVERNANCE-PHASE.md](PUBLIC-GOVERNANCE-PHASE.md)）
        ↓
Community Governance / 成熟 DAO
```

---

## §1 核心结论（给审计/投资人一页话）

1. **团队不拥有「永久 100% 治理权」。** 启动期若 **有效投票快照** 内只有 **已解锁/已委托** 的 **team 桶 + 已完成的 early 公募** 参与，则 **team 占比高是数学结果**，不是额外特权。  
2. **稀释是设计内建的：** 随 **公众三轮**（500K + 500K + 1M）、**国家承销桶**、**生态/DAO Treasury** 等按 SSOT 释放，**team 占 Active Voting Supply 比例自然下降**，长期 **team 桶仍 ≈ 总供应 15%**（非 100%）。  
3. **Quorum / Approval 不按本文另设** — **GOV-02 已冻结**：quorum **≥ 4.00% 总供应（10M）** · 赞成 **≥ 50% 已投权重** · Timelock **48h**。  
4. **GOV-03（V1.1）** — **Seat 一国一控** · **无单地址 TTG 持仓/投票 cap** · 流程保护见 [GOV-03-AMENDMENT-V1.1](GOV-03-AMENDMENT-V1.1.md)。

---

## §2 供应与托管结构（与冻结 SSOT 对齐）

**总供应（FROZEN）：** **10,000,000 TTG**（**不是** 1,000,000,000）

| 桶 | 占比 | TTG |
|----|------|-----|
| 国家承销 | 25% | 2,500,000 |
| 公众发行 | 20% | 2,000,000 |
| 生态激励 | 15% | 1,500,000 |
| **初创团队** | **15%** | **1,500,000** |
| 顾问 | 5% | 500,000 |
| DAO Treasury | 20% | 2,000,000 |

**托管路径（Target · ②）：**

```text
TTG Token Contract
        ↓
Treasury Safe / Timelock 治理边界
        ↓
Allocation Pool / Vesting（team · advisors · public rounds · …）
```

**读法：** Token **不** 由单一 EOA 长期裸控；**team 15%** 走 **vesting + multisig/Timelock**（commercial 参数 **Owner Input** · [ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml)）。

---

## §3 何谓「Active Voting Supply」（投票快照口径）

**Governor 投票权（概念 · 与 OpenZeppelin Governor 一致）：**

```text
Voting Power @ snapshot =
  该地址在 snapshot block 的 TTG 余额（含委托）
  （须满足 Governor 合约的 vote 扩展规则 · ② 以链上为准）
```

**Active Voting Supply @ snapshot：**

```text
所有参与该次 snapshot 的地址 Voting Power 之和
（通常 ≤ 10M 总供应；未解锁/未委托/未参与快照的 TTG 不计入分子分母）
```

**投票占比：**

```text
Vote Weight % = 某地址 Voting Power / 该提案 snapshot 下已统计的总 Voting Power
```

**Quorum（GOV-02 · FROZEN · 与「Active Supply」不同）：**

```text
参与投票的 TTG 权重之和 ≥ 4.00% × TTG_TOTAL_SUPPLY（= 400,000 TTG @ 10M）
```

> **诚实边界：** 早期若流通/委托量小，**400,000 TTG quorum** 仍按 **总供应 10M** 计算 — 这是 **GOV-02 冻结值**（优于按 Active Supply 的 20% 示例，避免后期流通扩大后 quorum  unreachable）。

**Approval（GOV-02 · FROZEN）：** `Yes / (Yes + No) ≥ 50%`（Abstain 按 Governor 实现计入规则 · ② 以合约为准）。

---

## §4 Genesis 阶段：为何团队能「启动」治理

### §4.1 治理权来源（非永久特权）

Genesis Phase 指：

- **Governor + Timelock 已部署**（②）  
- **公众三轮尚未全部开启**，且 **team/advisors 仍处 cliff/vest 早期**  
- **国家承销 / 生态 / DAO 等大桶多数仍锁定**

在此窗口：

- **有效 snapshot** 内可投票的 TTG **主要来自**：已解锁的 **team**（及少量 **Round 1 Early** 若已发生）  
- 因此 **team 相关地址合计** 可能占 **该 snapshot Active Voting Supply 的多数甚至 100%**

**这不是「团队 forever 100%」**，而是：

> **在 Genesis 窗口，除 team 外尚无足够已解锁/已委托 TTG 进入同一 snapshot。**

### §4.2 随释放自动稀释（示例 · 数字来自冻结 SSOT）

下列为 **披露用简化模型**（假设：team 桶 **1.5M** 在 Genesis 窗口 **已全部可投票**；公募按三轮 **全部售完** 且 **购买者均参与投票**；**忽略** vesting 锁、委托率、国家/生态桶 — **实际 snapshot 以链上为准**）。**Round 3 后 Active 3.5M 示例** 与 Registry 默认 `active_voting_supply_min_bps: 3500` **一致** — **非 Genesis Exit 硬编码**（Exit 见 §7.1 AND + Registry）。

| 阶段 | Team 可投票 | Public 可投票 | Active Voting Supply（示例） | Team 占 Active % |
|------|-------------|---------------|------------------------------|------------------|
| **Genesis** | 1.5M | 0 | 1.5M | **100%** |
| **Round 1 后** | 1.5M | 0.5M | 2.0M | **75%** |
| **Round 2 后** | 1.5M | 1.0M | 2.5M | **60%** |
| **Round 3 后** | 1.5M | 2.0M | 3.5M | **≈42.9%** |

**公众三轮硬顶（FROZEN）：** R1 **500K** · R2 **500K** · R3 **1M**（见 [ttg-primary-market §3.1](ttg-primary-market-and-exit-policy-v1-draft.md)）。

**再往后（叙事 · 非精确演算）：** 国家承销 Seat 质押、生态激励、DAO Treasury 按 SSOT 解锁/治理释放 → **team 占全供应长期 ≈15%**，**占 Active Voting Supply 持续下降** → **Community Governance**。

### §4.3 第一批提案为何合法

Genesis 期 **允许** team multisig / Timelock **发起**：

- Governor 参数公示  
- Round 2/3 开启  
- Treasury P4 动用程序  
- 生态/国家池 **框架性** 提案  

**须同时满足（FROZEN 程序 · 非默认绕过）：**

```text
Proposal 创建
  → 链上投票（GOV-02 quorum + approval）
  → Timelock 48h
  → Execute
  → 链上事件 / 披露留痕
```

**冲突披露（GOV-02 · FROZEN）：** team / advisors / 初创 multisig **须** 披露利益 · **禁止** 未披露投票。

---

## §5 GOV-03 · Seat 一国一控（V1.1 · 无单地址持仓 cap）

**GOV-03（V1.1 · [GOV-03-AMENDMENT-V1.1](GOV-03-AMENDMENT-V1.1.md)）：**

| 参数 | 值 |
|------|-----|
| 单控制主体 Active Seat | ≤ **1**（**一国一控**） |
| 单地址治理 / 持仓权重 | **无上限**（`max_voting_power_per_address_bps` = **0**） |
| 同一控制主体 Seat 质押合计 | ≤ **4.00%** 总供应（**仅 Seat 路径**） |

**team 15% 与 GOV-03 不再冲突：** team 桶可经 **单一 vesting 合约 / Safe** 持有，**无需** 拆成多个 ≤4% 钱包。安全边界由 **Vesting · Safe · GOV-02 投票 · 48h Timelock · 利益披露** 承担（见 §4）。

**Genesis → Public 过渡：** 仍指 **更多 TTG 进入 snapshot / 公众轮次开放** — **不再** 包含「team 地址拆 ≤4%」里程碑。

> **② 工程注记：** 已部署 Sepolia Governor 在 **Timelock 升级 V1.1** 前链上 `maxVotingPowerPerAddressBps` 仍可能为 **400**（legacy）；SSOT 以 **0** 为准。

---

## §6 资金池与提案（与冻结 SSOT 一致）

**任何 Treasury / 池资金动用（含 P4）：**

```text
Proposal → Vote（GOV-02）→ Quorum → Approval ≥50% → Timelock 48h → Treasury Execute → 链上记录
```

**池用途边界（名称对照 · 非另造比例）：**

| 用户叙事 | SSOT 桶 / 模块 |
|----------|----------------|
| Regional / 国家 | `country_pool_shelf` 25% · Seat/Steward 路径 |
| Ecosystem | `ecosystem` 15% |
| DAO / Reserve | `treasury_dao` 20% · P4 Reserve（[country-revenue-model §2.1](country-revenue-model-v1-draft.md)） |
| Public | `public_global` 20% · 三轮 |

---

## §7 阶段过渡一览

```text
Genesis Governance Phase
  · 少量 TTG 进入 snapshot
  · team 启动提案 + 披露
  · GOV-03：Seat 一国一控 · cap_disabled=true（无单地址权重上限）
        ↓
Public Governance Phase（见 §7.1 · [PUBLIC-GOVERNANCE-PHASE.md](PUBLIC-GOVERNANCE-PHASE.md)）
  · G-END-01 AND G-END-02（Registry 阈值）
  · quorum 仍 = 4% × 10M total supply
        ↓
Community Governance / 成熟 DAO（见 PUBLIC-GOVERNANCE-PHASE §4）
```

### §7.1 Genesis Governance Phase 结束条件（AND · 阈值读 Registry）

**机读 SSOT：** [registry/governance-phase-transition.v1.yaml](../../../registry/governance-phase-transition.v1.yaml)

**Genesis 结束 → 进入 [Public Governance Phase](PUBLIC-GOVERNANCE-PHASE.md)** 当 **同时满足（AND）**：

| Gate | 规则 | 可验证信号（②） |
|------|------|-----------------|
| **G-END-01** | **Round 3 公募链上关闭**（公众 20% 桶内 R1+R2+R3 全部 `closed`） | `TtgPrimaryMarketV1` round 状态 · 链上 event · `/governance/params` 披露 |
| **G-END-02** | **`public_governance_threshold` 达成**（Registry · 非本文硬编码 TTG 绝对值） | Governor `getPastVotes` snapshot 汇总 · 公募披露 |

**Registry 键（默认 v1）：**

| 键 | 语义 |
|----|------|
| `public_governance_threshold.active_voting_supply_min_bps` | Active Voting Supply ≥ bps × **总供应** |
| `public_governance_threshold.public_bucket_votable_min_bps` | Public 桶可投票 TTG ≥ bps × **`public_global` 桶** |

**禁止：**

- **G-END-01 满足但 G-END-02 未满足** → 不得宣称 Genesis 已结束（例：Round 3 已关但 Voting Supply 仅 ~18%）  
- **G-END-02 满足但 G-END-01 未满足** → 不得宣称 Genesis 已结束（例：Supply 已分散但 Round 3 未闭）  
- 在本文写死「1.5M TTG」「35%」等 **替代 Registry** — §4.2 稀释表仅为 **当前 Registry 默认值下的披露示例**

> **Quorum 不变：** 仍按 **GOV-02 总供应 4%** — 与 Active Voting Supply 阈值 **独立**。

### §7.2 投票权资格矩阵（Treasury · DAO · Vesting · Public）

**Governor 权重来源（② · `GovernanceVotesToken.getPastVotes`）：** 地址在 snapshot block 的 TTG 余额（含委托）。**未部署 Vesting 合约前，链上无自动 cliff 锁投票** — cliff/线性释放在 **Owner Input + Step 7 合约** 落地后生效。

| ID | 实体 | TTG 持仓 | 是否 Vote | Delegate | Timelock / 控制 | 禁止 |
|----|------|----------|-----------|----------|-----------------|------|
| **G-VOTE-01** | **Team Vesting** | `team` 15% | **已解锁部分** 可 Vote · **未解锁** 无 Vote（② 合约） | 受益人可 `delegate` | Vesting 合约 + Timelock | 未解锁部分投票 |
| **G-VOTE-02** | **Advisors Vesting** | `advisors` 5% | 同 G-VOTE-01 | 同左 | 同左 | 同左 |
| **G-VOTE-03** | **DAO Treasury（TTG 桶 20%）** | `treasury_dao` | **默认不 Vote** | **不对外委托** | **Timelock / Safe** | **不能自己投自己** — 动用须 **Proposal → Vote → Execute** |
| **G-VOTE-04** | **Global Treasury USDC（P4 等）** | 无 TTG 投票权 | **N/A** | **N/A** | **GovernanceTreasuryP4Cap + Timelock** | 不经 Governor 直提 |
| **G-VOTE-05** | **Public Round 1/2/3 购买者** | 购入 TTG | **可 Vote**（购入即流通） | 可 `delegate` | 个人钱包 | GOV-04 规避拆分 |
| **G-VOTE-06** | **Seat 质押** | 锁定于 StakePool | **Stake 期间** 通常 **不可转移** · Vote 权随 token  custody（② 以合约为准） | 视 custody | StakePool | 一国多 Seat（GOV-03） |

**Team Vesting 商业参数（③ 前须 Owner 填）：** [registry/ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml) v3 — **`team` 1,500,000 TTG（FROZEN）** · **`advisors` 500,000（FROZEN）** · commercial **OWNER_INPUT** · **`public_global` 2M = Primary Market R1/R2/R3（500K+500K+1M）** · **`ecosystem` = 治理批准释放** · 无独立 investor 池。

**Voting Supply 计算（Public Round 结束后 · 与 §3 一致）：**

```text
Active Voting Supply @ snapshot =
  Σ getPastVotes(holder, snapshotBlock)
  （含 team 已解锁 + public 已购 + 生态/国家等已进入流通并委托的 TTG）

Quorum（GOV-02 · 不变）=
  参与投票权重之和 ≥ 4% × TTG_TOTAL_SUPPLY（400,000 TTG @ 10M）
  （分母 = 总供应 · 非 Active Voting Supply）
```

---

## §8 维护规则

| 变更 | 须同步 |
|------|--------|
| 改 **任何 bps/供应/quorum** | **禁止在本文件改** → 走 [TTG-TOKENOMICS-FREEZE-V1](TTG-TOKENOMICS-FREEZE-V1.md) 治理修订程序 |
| 改 Genesis/Public **定义或过渡条件** | Registry `governance-phase-transition.v1.yaml` + 本文件 + [PUBLIC-GOVERNANCE-PHASE.md](PUBLIC-GOVERNANCE-PHASE.md) + [82-治理币-文档总览](../82-治理币-文档总览.md) + `bash scripts/gates/run-governance-consistency-audit.sh` |
| 改 GOV-03 分阶段叙述 | 本文件 + [08-4 §9-c](../08-4-对外口径包.md) 交叉审阅 |

---

## §9 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1-20260711 | 2026-07-11 | 初版：Genesis 解释层 · GOV-03 分阶段 · 稀释表 · **零数字变更** |
| v1.1-20260711 | 2026-07-11 | 对齐 **GOV-03-AMENDMENT-V1.1** · 移除单地址 4% cap 叙述 |
| v1.2-20260712 | 2026-07-12 | **G-END-01/02** Genesis 结束条件 · **G-VOTE-01～06** 投票权矩阵 · Voting Supply 口径 |
| v1.3-20260712 | 2026-07-12 | Genesis Exit **OR→AND** · 阈值改读 **Registry** · 链至 **PUBLIC-GOVERNANCE-PHASE** |
