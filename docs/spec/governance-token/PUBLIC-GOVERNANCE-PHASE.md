# Public Governance Phase（公众治理阶段 · 解释性 SSOT）

**Document ID:** `PUBLIC-GOVERNANCE-PHASE`  
**Version:** v1-20260712  
**Status:** **ACTIVE（① 解释层 · 阈值读 Registry · 不改 Tokenomics 冻结数字）**  
**Phase boundary:** ① 文档 → ② 链上验收 → ③ Production GO 另闸  

> **本文件职责：** 解释 **Genesis 结束之后** 进入 Public Governance Phase **意味着什么**、与 Genesis / Community 的差异、以及 **进入条件**（机读阈值见 Registry）。  
> **禁止：** 在本文件硬编码 TTG 绝对数量阈值 — 读 **[registry/governance-phase-transition.v1.yaml](../../../registry/governance-phase-transition.v1.yaml)**。

**Companion：** [TTG-GOVERNANCE-LIFECYCLE.md](TTG-GOVERNANCE-LIFECYCLE.md) · [GENESIS-GOVERNANCE-PHASE.md](GENESIS-GOVERNANCE-PHASE.md) · [TTG-GOVERNANCE-FREEZE-CERTIFICATE.md](TTG-GOVERNANCE-FREEZE-CERTIFICATE.md)

---

## §0 治理生命周期（完整栈）

```text
Tokenomics（FROZEN · 10M · 六桶 · GOV-01～04）
        ↓
Genesis Governance Phase
  · team 启动 · 少量 TTG 进入 snapshot · 披露 + 流程保护
        ↓
Public Governance Phase（本文件）
  · 公众三轮完成 + 投票供应达阈 · 社区持有人实质参与
        ↓
Community Governance（成熟 DAO 叙事）
  · 国家承销 / 生态 / DAO Treasury 按 SSOT 释放
  · team 占全供应长期 ≈15% · Active Voting Supply 持续分散
```

**阶段口径：** ① 本地文档收口 **≠** ② Sepolia 全路径 **≠** ③ 法务对外 GO。

---

## §1 核心结论（一页话）

1. **Public 不是「又一个 cap 故事」** — 进入 Public 表示 **公募程序闭合** 且 **可投票 TTG 供应已达 Registry 阈值**，社区可 **实质** 参与 GOV-02 流程。  
2. **GOV-02 不变** — quorum **≥ 4% 总供应** · approval **≥ 50%** · Timelock **48h**。  
3. **GOV-03 V1.1 不变** — Seat **一国一控** · `max_voting_power_cap_disabled: true` · 流程保护（Vesting · Safe · Proposal · Vote · Timelock）。  
4. **Public 之后的主要变化** 是 **持有人结构** 与 **提案议题类型**（Round 2/3 已闭 · 更多 Treasury / 生态 / 国家池框架提案），**不是** 另造一套 quorum 或钱包 cap。

---

## §2 进入条件（Genesis Exit · AND 逻辑）

**机读 SSOT：** [registry/governance-phase-transition.v1.yaml](../../../registry/governance-phase-transition.v1.yaml)

**Genesis 结束 → 进入 Public Governance Phase** 当 **同时满足**：

| Gate | 规则 | 可验证信号（②） |
|------|------|-----------------|
| **G-END-01** | **Round 3 公募链上关闭**（公众桶 R1+R2+R3 全部 `closed`） | `TtgPrimaryMarketV1` · event · `/governance/params` |
| **G-END-02** | **`public_governance_threshold` 达成**（见 Registry） | Governor snapshot · 公募披露 |

**Registry 键（默认 v1 · 修订须 GOV-02 + registry bump）：**

| 键 | 含义 |
|----|------|
| `public_governance_threshold.active_voting_supply_min_bps` | Active Voting Supply **≥** 该 bps × **总供应** |
| `public_governance_threshold.public_bucket_votable_min_bps` | Public 桶内 **已进入可投票流通** 的 TTG **≥** 该 bps × **`public_global` 桶** |

**禁止：**

- 仅 Round 3 关闭但 Voting Supply 不足 → **不得** 宣称 Public 已开始  
- 仅 Voting Supply 达标但 Round 3 未关闭 → **不得** 宣称 Public 已开始  
- 在文档中写死「1.5M TTG」等绝对值替代 Registry

---

## §3 Public 阶段：发生什么

### §3.1 持有人与投票权

- **Public 购买者**（G-VOTE-05）持有并已流通的 TTG **可 Vote / Delegate**  
- **Team / Advisors**（G-VOTE-01/02）：仅 **已解锁** 部分可 Vote（vesting 合约落地后）  
- **DAO Treasury TTG 桶**（G-VOTE-03）：**默认不 Vote** · 不能自己投自己  
- **Active Voting Supply** 按 [GENESIS §3](GENESIS-GOVERNANCE-PHASE.md) 快照公式重算 — **随真实流通变化**

### §3.2 典型提案类型（非 exhaustive）

| 类型 | 说明 |
|------|------|
| Treasury P4 动用 | GOV-01 cap · GOV-02 投票 · 48h Timelock |
| 生态 / 国家池框架 | 按 allocation SSOT · 须披露 |
| 参数修订 | GOV-01～04 · `governance-phase-transition` 阈值修订亦须 GOV-02 |
| Seat / 国家承销 | GOV-03 一国一控 · 质押路径 cap |

### §3.3 与 Genesis 的差异

| 维度 | Genesis | Public（本阶段） |
|------|---------|------------------|
| 主要投票 TTG 来源 | team 已解锁 + 早期 public | team + **实质 public 社区** |
| 公募轮次 | R1 可能开放 · R2/R3 待治理 | **R1+R2+R3 均已关闭**（G-END-01） |
| 对外叙事 | 启动期 · 高披露 | 社区参与 · 同上流程保护 |
| Exit | 见 §2 AND 门 | 渐进进入 Community（§4） |

---

## §4 退出 Public → Community Governance（成熟 DAO）

**v1 无单一硬闸数值** — Community 为 **渐进态**（Registry `community_governance.no_single_hard_gate_in_v1: true`）：

```text
国家承销 Seat 质押 ↑
生态激励释放 ↑
DAO Treasury 按治理释放 ↑
        ↓
team 占 Active Voting Supply 持续下降
team 占全供应长期 ≈ 15%（桶比例不变）
        ↓
Community Governance / 成熟 DAO
```

**诚实边界：** 「成熟 DAO」**≠** ③ Production GO · **≠** 主网去中心化终局证明 — 以链上披露与 GOV-02 程序为准。

---

## §5 维护规则

| 变更 | 须同步 |
|------|--------|
| 改 **Genesis/Public 阈值** | **`registry/governance-phase-transition.v1.yaml`** + GOV-02 提案 · 本文件 + [GENESIS-GOVERNANCE-PHASE.md](GENESIS-GOVERNANCE-PHASE.md) · `bash scripts/gates/run-governance-consistency-audit.sh` |
| 改 **供应 / GOV bps** | [TTG-TOKENOMICS-FREEZE-V1](TTG-TOKENOMICS-FREEZE-V1.md) 修订程序 · **禁止** 在本文件另造 |
| Team vesting 商业参数 | [registry/ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml) · **OWNER_INPUT** 直至 Owner 决策 |

---

## §6 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1-20260712 | 2026-07-12 | 初版：Public 定义 · Registry 阈值读口 · Genesis AND exit · Community 渐进叙事 |
