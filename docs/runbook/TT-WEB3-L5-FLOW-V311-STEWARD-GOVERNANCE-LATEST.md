# TravelTrust Web3 · 中文分步流程图 L5（V3.1.1）

> **Official Product Truth（活面）：** TravelTrust Official · **OPS-2026.08.20-v9** (`3e356617` / `2026-08-20T00:51:57Z` / `hybrid-…-v9`) · API `8df2ab21…` · historical `daa5ae87` SUPERSEDED · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)


**Machine:** `TT_WEB3_L5_FLOW_V311`  
**SSOT 宪章:** [TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md](../spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md) · **LOCKED**  
**Visual:** `assets/traveltrust-web3-l5-flow-v311.png`（相对仓库：可复制至 `docs/spec/governance-token/` 存档）  
**Recorded:** 2026-07-18  
**Status:** L5 · 机读 + 图面双真源

> **读图纪律：** Genesis V2 = **供应结构 LEGACY 对照**（10M 一次铸造仍同构）；**经济目标 / 主理人 / 投票 / 退出** 一律以 **V3.1.1** 为准。  
> 公募 USDC → **P4Cap**（≠ Safe）。Safe = Timelock **admin**。  
> FeeRouter 平台费 45/55 与主理人 Distributable 45/55 **正交**。

---

## 0 · 总览（五段）

```mermaid
flowchart LR
  A["① 创世铸造 TTG"] --> B["② 一级市场购买"]
  B --> C["③ 主理人申请·质押·退出"]
  B --> D["④ 治理投票·Timelock"]
  C --> D
  B --> E["⑤ 订单·可分配服务费"]
  C --> E
```

---

## ① 创世铸造（一次 10M · 禁增发）

```mermaid
flowchart TB
  M["一次性铸造 10,000,000 TTG"] --> T["Team 15% · 1.5M · 锁仓/归属"]
  M --> C["Community 5% · 0.5M · Programs"]
  M --> D["DAO Treasury 30% · 3M · 禁再铸"]
  M --> P["Public Sale 50% · 5M · 进入一级市场库存"]
```

---

## ② 一级市场（USDC→TTG）

```mermaid
flowchart TB
  U["用户持 USDC"] --> Q["②a 额度校验<br/>轮次 800k / 1.2M / 3M（合计 5M）<br/>最低购买 · 钱包上限"]
  Q -->|通过| X["②b 交割"]
  X --> P4["USDC → GovernanceTreasuryP4Cap"]
  X --> H["TTG → 用户钱包"]
  H --> V["同币同权：投票 · 提案 · Stake · 申请主理人"]
```

---

## ③ 国家区域主理人（申请 = 质押 + Access Fee）

```mermaid
flowchart TB
  subgraph APPLY["申请 ACTIVE"]
    A1["选 Country"] --> A2["Stake TTG ≥ 该国 Stake Minimum<br/>（Registry · bps×供应）"]
    A2 --> A3["支付 Platform Access Fee<br/>300,000 USDC → Founder 指定钱包"]
    A3 --> A4["审核"]
    A4 -->|失败| R1["Access Fee 100% 退还"]
    A4 -->|通过| ACT["ACTIVE 主理人 · Fee 不可退"]
  end

  subgraph EXIT["退出 / 撤销 / Inactive"]
    ACT --> E1["最低任期 24 月"]
    E1 --> E2["退出通知 180 天"]
    E2 --> E3{"优先市场承接？"}
    E3 -->|是| E4["新主理人 Stake+Fee+审核接管"]
    E3 -->|否| E5["正式质押 → Treasury Recovery<br/>受 Recovery Budget 约束"]
    ACT --> RM["DAO REMOVE COUNTRY STEWARD<br/>（核心级门槛）"]
    RM --> E5
    ACT --> IN["Inactive：连续 180 天无履职"]
    IN --> RE["开放重申 · 新申请人重走申请链"]
    RE --> A1
  end
```

| Access Fee 退款 | |
|----------------|--|
| 审核失败 | **100% 退** |
| 通过 / 退出 / REMOVE / Inactive 重申 | **不可退** |

---

## ④ 治理投票（按持有治理币票权比例）

```mermaid
flowchart TB
  H["持有 TTG（含委托 votes）"] --> S["Proposal Snapshot<br/>getPastVotes / getPastTotalSupply"]
  S --> TH{"提案门槛（流通供应比例）"}
  TH --> O["普通 0.5%<br/>min 5k · max 50k TTG"]
  TH --> I["重要 1% · max 100k"]
  TH --> C["核心 2% · max 200k<br/>含 REMOVE 主理人"]
  O --> V["投票权重 = 快照票权占比"]
  I --> V
  C --> V
  V --> Q["Quorum + 计票"]
  Q --> TL["Succeeded → Timelock schedule"]
  TL --> W["delay 172800s（48h）"]
  W --> EX["Execute"]
  EX --> SAFE["Safe = Timelock admin<br/>（非公募收款方）"]
```

**纪律：** 同币同权；票权 = Snapshot 时持仓/委托比例，**不是**身份特权。主理人有提案权，通过与否由 DAO 决定。

---

## ⑤ 订单与可分配服务费

```mermaid
flowchart TB
  O["旅行下单 · Order.destination_country SSOT"] --> E["Escrow 本金+服务费"]
  E --> D["Distributable Platform Service Fee"]
  D --> A{"该国 ACTIVE 主理人？"}
  A -->|是| S45["45% → 主理人路径"]
  A -->|是| P55["55% → Project Revenue Pool"]
  A -->|否| P100["100% → Project Revenue Pool"]
```

**正交：** FeeRouter 平台费分账（历史 45/55 国池叙事）≠ 本章 Distributable 主理人分成。

---

## L5 相对旧图新增点

| 主题 | L5 表现 |
|------|---------|
| 申请主理人 | Stake Minimum + 30万 Access Fee + 审核退款表 |
| 退出 | 24月 · 180天通知 · 市场承接优先 · Recovery Budget |
| REMOVE / Inactive | DAO 核心提案 · 180天失联重开 |
| 投票 | 快照票权比例 + 三级门槛钳制 |
| 公募收款 | 明确 P4Cap ≠ Safe |
| 归因 | `Order.destination_country` |

---

## 相关实现（① 本地已对齐 · 非冒充 ③ GO）

- Stake：`RegionStewardStakePool.stakeMinimumTtg` · `registry/v311-stake-minimum-by-country.v1.yaml`
- 门槛：`V311DaoProposalThresholds` · `TravelTrustGovernor.propose(tier)`
- 退出语义：`V311StewardLifecycle` · `registry/v311-steward-lifecycle.v1.yaml`
- Access Fee：`registry/v311-platform-access-fee.v1.yaml` · `access_fee_refund_v311`
- 分成：`V311DistributableSplit` 45/55 · 100% Pool
