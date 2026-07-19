# TT · PSG Production Completion Definition

**Machine:** `TT_PSG_PRODUCTION_COMPLETION_DEFINITION`  
**Status:** **ACTIVE_SSOT · FRAMEWORK_FROZEN** · `2026-07-19`  
**机读：** [`registry/psg-production-completion-definition.v1.yaml`](../../registry/psg-production-completion-definition.v1.yaml)  
**统一终局矩阵（唯一裁决）：** [`TT_PSG_PRODUCTION_COMPLETION_MATRIX`](./TT-PSG-PRODUCTION-COMPLETION-MATRIX-LATEST.md) · [`registry/psg-production-completion-matrix.v1.yaml`](../../registry/psg-production-completion-matrix.v1.yaml)  
**Constitution 绑定：** [V3.1.1 Final · PSG Production Completion](../spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md#psg-production-completion)  
**Coverage / Capability / FG Cases：** **只读输入**（**禁止**再增 Coverage 维 · **禁止**分散矩阵冒充完成）  
**Exit Criteria：** [TT-V311-PRODUCTION-EXIT-CRITERIA-V1-LATEST](./TT-V311-PRODUCTION-EXIT-CRITERIA-V1-LATEST.md) · [PSG Release Exit](./TT-PSG-RELEASE-EXIT-CRITERIA-AND-CHECKLIST-LATEST.md)

```text
PSG Complete = Layer1 Product ∧ Layer2 Data ∧ Layer3 Security
             ∧ Layer4 Operations ∧ Layer5 Financial-Grade Web3

方向: 金融协议验收 · 不再「补测试扩维」
禁止: PREP_READY / Case staged / Web2 PASS = FG-Web3 PASS / PSG Complete
```

**唯一真实阻塞：** G-RC ETA → CLOSED → Clean Deploy `fcg_full_capability_v2_sepolia` → FG-Web3 实证。

---

## 0 · 五层（统一矩阵 · 全部必须 PASS）

以后「PSG 是否完成」**只**看 [Production Completion Matrix](./TT-PSG-PRODUCTION-COMPLETION-MATRIX-LATEST.md)：

| Layer | 名称 | 可选项？ |
|-------|------|:--------:|
| **L1** | Product（Journey · Market · Provider · Order · CMS · Admin） | ❌ |
| **L2** | Data（DB · API · UI · Consistency） | ❌ |
| **L3** | Security（RBAC · Wallet · Auth · Permission） | ❌ |
| **L4** | Operations（Monitoring · Incident · CMS Ops · Recovery） | ❌ |
| **L5** | Financial-Grade Web3（Money Path…48H） | ❌ · **强制** |

**写死：** L5 **不是**独立可选项 · **不是**旁路认证 · **不是** Web2 Coverage 加分项。  
**禁止：** PREP_READY · Case staged · Web2 Measurement PASS · Track A / Bar-1 冒充 L5 或 PSG Complete。

## 1 · Financial-Grade Web3（15 面 · 缺一不可）

| ID | 面 | 说明 |
|----|-----|------|
| FG-01 | **Money-Path** | 真实资金路径 · 平台费/分配/账本 |
| FG-02 | **Escrow State Machine** | Created→Funded→Locked→Completed→Released + 异常态 |
| FG-03 | **SettlementRouter** | Escrow→Settlement→Distributable 入口（非 LEGACY 直付 SSOT） |
| FG-04 | **FeeRouter** | 宪章路由 · 与 Distributable 对齐 |
| FG-05 | **Distributable** | PENDING→LOCKED→SETTLEMENT_READY→DISTRIBUTABLE→DISTRIBUTED |
| FG-06 | **Steward Revenue** | 主理人收益 entitlement / 45·55 或 100% PRP |
| FG-07 | **Treasury** | DAO / Governance Treasury 可验证 |
| FG-08 | **TTG Governance** | Proposal→Vote→Queue |
| FG-09 | **Timelock Execute** | Timelock→Execute 真链收据 |
| FG-10 | **Wallet Security** | Extension · WC · Mobile · QR · wrong network · disconnect |
| FG-11 | **RBAC** | 权限矩阵 Full Gate 条（非 60/96 假 PASS） |
| FG-12 | **Indexer** | 事件投影 · 与链上一致 |
| FG-13 | **On-chain / DB / UI 一致性** | 链上金额 = 账本 = 用户展示 |
| FG-14 | **Audit Evidence** | Gate 可引用证据包 · 禁止 docs-only |
| FG-15 | **48H Observation** | 合约·支付·Event·Indexer·API·Error 观察窗 |

**Gate 别名：** `TT_FINANCIAL_GRADE_WEB3_PROTOCOL_READINESS`  
**执行载体：** `TT_PRODUCTION_FULL_CAPABILITY_GATE`（Bar-2）· Gap Closure 主轨

---

## 2 · 判断纪律（以后默认）

| 问「PSG 是否完成？」 | 必须 |
|----------------------|------|
| 默认包含金融级 Web3 Gate？ | **是** |
| Web2 Coverage PASS 是否足够？ | **否** |
| Bar-1 CONDITIONAL_GO / Track A FROZEN？ | **≠ PSG 完成** |
| `MAINNET_COMMERCIAL_FULL`？ | 五柱全 PASS 才可谈 Production GO |

---

## 3 · 当前诚实态（不因本定义自动 PASS）

| 柱 | 诚实态 |
|----|--------|
| Product | PARTIAL |
| Data | PARTIAL / PASS_SLICE |
| Security | NEED_FIX |
| Operations | PARTIAL |
| Financial-Grade Web3 | **NOT_READY** |
| **PSG 全部完成** | **否** |

---

## 4 · 与既有轨关系

| 轨 | 关系 |
|----|------|
| Coverage Measurement（Journey/Data/UI/RBAC） | **必要但不充分** · 属 Product/Data/Security 输入 |
| Full Capability Gate A–L | **金融级 Web3 的执行矩阵** |
| Exit Criteria Dual-RC / X-GO | **必须**引用本定义 · FG-Web3 PASS 为 X-GO 前置 |
| Track A FROZEN | **不变** · 不得冒充五柱完成 |
