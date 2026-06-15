# Country Pool 净利润 45/55 结算 · Phase ② 链上设计（DESIGN ONLY）

**Version:** v1-design-20260615  
**Status:** **Gate-2.1 Closeout ✅ · Gate-2.2 ✅ · Gate-2.3 EXIT ✅ · Gate-2.4 Ready Candidate（①）**  
**Companion 叙事：** [country-revenue-model-v1-draft.md](country-revenue-model-v1-draft.md) §2  
**互斥真源（勿混读）：** [83 §3](../83-区域治理与收益分配-协议白皮书.md) / [84 §一](../84-第一阶段10国Country-Pool发行参数总表.md) / `FeeRouter.sol` = **可分配平台手续费** 第一层 **45/55**（**D-4555-A**）

**阶段边界：** 本文 **仅设计**；**禁止** 在 ① 宣称已部署或已 GO。**②** 须专项 Runbook · 合约 · 索引 · API · 法务签字后单独验收。

---

## 1. 设计目标

| 项 | 规则 |
|----|------|
| **对象** | 单 jurisdiction **Country Pool** 在结算周期内的 **净利润**（科目定义见 §3） |
| **拆分** | **45%** → 该国 Seat 主理人及治理分配路径 · **55%** → TravelTrust Global Treasury |
| **周期** | 季度或年度（治理参数 · **Phase ② 产品固定默认：QUARTER · UTC · closeDelayDays=15** — 见 [accounting-spec §4](country-pool-net-profit-accounting-spec-v1.md) **PR-01**） |
| **禁止** | 全球国家池混合后再按国切回；与 **Fee Points** / **募资目标** / **Seat 质押 TTG** **无自动换算** |

---

## 2. 与 FeeRouter 45/55 的分轨（读前必知）

| ID | 路径 | 分母 | 链上 ① |
|----|------|------|--------|
| **D-4555-A** | Escrow 可分配平台费 → `FeeRouter.distribute` | 单笔/累计 **platform fee** | **Partial/MVP**（`_bpsCountry=4500`） |
| **D-4555-B（本文）** | 国家池 **净利润** 结算 | 该国池 **P&L 净利润** | **① Gate-2.4 Ready Candidate** · **② NOT STARTED** |

**② 实施须：** 新合约或扩展现有 `CountryPool*` 模块 · 独立事件 · 独立 API 读面 · **不** 修改 FeeRouter 第一层语义冒充「净利润结算」。

---

## 3. 净利润科目（Gate-0 冻结 · SSOT）

**写入口：** **[country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md)**（§1 定义 · §2 收入科目 · §3 成本科目 · §4 周期 · §5 亏损 · §6 45/55 · §7 主理人资格 · §10 签字）

**Gate-0：** **Exit ✅** · **Gate-2.1：** [country-pool-settlement-architecture-package-v1.md](country-pool-settlement-architecture-package-v1.md)

**历史草案示例（已被 accounting-spec 取代）：** ~~In/Out 示例列表~~ — 仅以 **R-xxx / E-xxx 科目表** 为准。
---

## 4. 提议链上模块（设计 sketch · Gate-2.1 详设见架构包）

**Gate-2.1：** **Closeout ✅** · [country-pool-settlement-architecture-package-v1.md](country-pool-settlement-architecture-package-v1.md) **v1-final**  
**Gate-2.2：** [country-pool-settlement-gate2.2-implementation-readiness-checklist.md](country-pool-settlement-gate2.2-implementation-readiness-checklist.md) **全绿 → 可开 Solidity 分支**

```
CountryPoolNetProfitLedger (per jurisdiction)
  ├─ accrue(revenue/expense refs)     // 索引 + 治理入账
  ├─ closeEpoch(epochId)              // 冻结 P&L
  ├─ splitNetProfit(epochId)        // 45% steward path / 55% global treasury
  └─ events: EpochClosed, NetProfitSplit

StewardPathVault / UnallocatedStewardPathVault / GlobalTreasury   // 收款地址 SSOT · Timelock owner
// Q-F01：无 Active Steward 时 45% → UnallocatedStewardPathVault（禁止 Global/burn/静默改分 · accounting-spec PR-02/PR-03）
```

**治理：** 参数变更（比例、周期、科目白名单）经 **Governor + Timelock**；与 [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md) **分提案**。

---

## 5. API / 索引 / UI（② backlog）

| 面 | 草案 |
|----|------|
| **索引** | `country_pool_net_profit_epochs` 投影表 · 链上事件驱动 |
| **API** | `GET /api/v1/governance/country-pool/{jurisdiction}/net-profit-epochs`（**②** 新建 · 非 ① protocol-reference） |
| **UI** | `/governance/params` 国家收益模型 bullet 链到 **②** 读数（**①** 保持 doc-mirror 文案） |

---

## 6. 验收门禁（②）

**Gate-0（先于合约）：** [country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md) **§10～§11** 全绿

- [ ] 产品确认「一国一池净利润」与结算周期（**accounting-spec §4**）
- [ ] 财务确认 **§2/§3 科目表** 与 **§5 亏损** 规则
- [ ] 法务确认 **§9** 45/55 对外表述与 08-4 证券隔离
- [ ] 工程：Gate-0 完成前 **零** Settlement 合约 PR
- [ ] 工程 Gate-2+：合约 + 索引 + API + Runbook 与 **accounting-spec** + **country-revenue-model §2** 一致
- [ ] **显式** 回归：`FeeRouter` 第一层测试 **不变**；净利润结算 **独立** test suite
**登记：** [THREE-TRACK-INDEPENDENT-PARAMS-CONSISTENCY-AUDIT-20260615.md](THREE-TRACK-INDEPENDENT-PARAMS-CONSISTENCY-AUDIT-20260615.md) · **C-02～04** · **D-4555-B** · **链上对齐审计** [PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md](PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md)

**不替代：** [LEGAL-SIGNOFF-CHECKLIST](LEGAL-SIGNOFF-CHECKLIST.md)
