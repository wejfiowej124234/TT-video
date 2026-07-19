# TT · FCG-PAY-01 Step 2.5 · Protocol Ambiguity Closure

**Machine:** `TT_FCG_PAY01_STEP25_AMBIGUITY_CLOSURE`  
**Status:** **PAPER_CLOSED_OA_PAY_01_TO_05** · `2026-07-19`  
**机读：** [`registry/psg-fcg-pay01-step25-ambiguity-closure.v1.yaml`](../../registry/psg-fcg-pay01-step25-ambiguity-closure.v1.yaml)  
**证据：** [`FCG-PAY-01-STEP25-AMBIGUITY-CLOSURE-LATEST.json`](../../evidence/GO_pre_eta_production_prep/full-capability-gap-closure-20260719/FCG-PAY-01-STEP25-AMBIGUITY-CLOSURE-LATEST.json)  
**父冻结：** [Protocol Freeze Steps 1–2](./TT-FCG-PAY-01-PROTOCOL-FREEZE-LATEST.md)

```text
本窗:     Step 2.5 · 关闭 OA-PAY-01～05（纸面）
禁止:     支付编码 · 部署 · Production GO · M-RC PASS 宣称
Track A:  FROZEN · 不回写
下一闸:   Governance RC CLOSED → M-RC-00 → TRE/REG → Step 3
```

---

## 0 · 结论一行

| 项 | 结论 |
|----|------|
| OA-PAY-01～05 | **CLOSED_ON_PAPER** |
| 等于 M-RC / Money-Path PASS？ | **否** |
| 等于 Production GO？ | **否** |
| 可进 Step 3？ | **否**（须先 Governance RC CLOSED + M-RC-00） |

---

## 1 · OA-PAY-01 · Release / Dispute 演员模型（锁定）

### 1.1 Release

| 路径 | 谁触发 | 签名 / 闸 | 仲裁？ |
|------|--------|-----------|--------|
| **双确认后 release** | 双方链下 `confirm-completion`（+ 产品评分步骤）满足后，**优先 Protocol Executor** 提交 `Escrow.release`；允许任一方钱包在闸通过后代发 | 链下双确认 / EIP-712；链上钱包签 tx | **否** |
| **超时自动 release** | **仅 Protocol Executor** 在 `autoCompleteAt` 且无争议冻结时触发 | 执行器权限 + 时间条件 | **否** |

**禁止：** 无双确认/超时闸直接 release · `Disputed`/`isFrozen` 时 release · 把 `confirm-completion` API 文案写成「即放款」。

**AS_IS：** 合约 `release()` 无角色 modifier → 实施窗必须用链下闸和/或链上闸补齐（本窗只锁定策略，不改代码）。

### 1.2 Dispute 闭环

```text
Dispute Open (Traveler|Guide · wallet)
      ↓
Evidence Submit (off-chain API/DB · 链上仅 open 时 reasonHash)
      ↓
Arbitration Decision (Escrow.arbitrator 签发 decisionHash + 守恒三腿金额)
      ↓
Resolution Execute (Protocol Executor 调 executeResolution)
```

| 问题 | 锁定答案 |
|------|----------|
| 仲裁员是谁？ | 订单创建时封存的 **`Escrow.arbitrator`** |
| 裁决如何产生？ | 仲裁员产出 **decisionHash** + 守恒金额（非默认「每单 DAO 投票」） |
| 谁调 `executeResolution`？ | **Protocol Executor**（多签/授权 relayer），绑定 arbitrator 裁决；TARGET 链上闸 = `onlyArbitrator` **或** `onlyExecutor`+裁决证明 |

→ **争议有闭环**（纸面）；AS_IS 缺 modifier = 实施债，不阻塞本窗闭合宣称「策略已锁」。

---

## 2 · OA-PAY-02 · 直付路径 = LEGACY 非 SSOT

| 路径 | 分类 |
|------|------|
| `Escrow.release` → Guide + **`platformFeeRecipient` 直付**（同 tx 推到 DISTRIBUTED） | **LEGACY_NON_SSOT** |
| 可作宪章 / TRE-02 / REG-01 / 上线经济证明？ | **禁止** |

旧图 `Escrow → Platform Wallet` **不得**再当真源。

---

## 3 · OA-PAY-03 · 目标架构（唯一 SSOT）

```text
Escrow (Order Escrow 锁本金)
   ↓
SettlementRouter   ← TARGET 模块名锁定 · 实施延期至 Money-Path RC
   ↓
FeeRouter          ← V3.1.1 Distributable 路由（LEGACY 四桶比例 ≠ SSOT）
   ↓
Distributable SM
   ↓
Distribution
   ├ Guide（本金净额）
   ├ Steward（Distributable × 45% · ACTIVE）
   ├ Project Revenue Pool（55% 或 100%）
   └ Founder / P4Cap（正交轨 · 非订单本金）
```

四轨隔离不变：Order Escrow · GovernanceTreasuryP4Cap · Project Revenue Pool · Founder Bootstrap。

---

## 4 · OA-PAY-04 / 05 · Distributable 不可跳跃 + SettlementReady

### 4.1 状态（SSOT + SettlementReady）

```text
PENDING
  → LOCKED                 (deposit)
  → SETTLEMENT_READY       (双确认/超时/裁决金额终局 · 独立可审计态)
  → DISTRIBUTABLE          (SettlementRouter 接受净服务费腿)
  → DISTRIBUTED            (45/55 或 100% PRP 执行完成)
```

| 边 | 谁触发 | 链上事件（目标） | DB | 可逆？ |
|----|--------|------------------|-----|--------|
| PENDING→LOCKED | `deposit` | `Deposited` + `ServiceFeeStateChanged` | LOCKED | 否 |
| LOCKED→SETTLEMENT_READY | 双确认/超时闸或裁决终局 | `SettlementReady` / SF 变更 | SETTLEMENT_READY | 否（争议冻结可阻断前进） |
| SETTLEMENT_READY→DISTRIBUTABLE | SettlementRouter | SF→DISTRIBUTABLE | DISTRIBUTABLE | 否 |
| DISTRIBUTABLE→DISTRIBUTED | FeeRouter / split 执行 | FeeRouted/SplitApplied + SF | DISTRIBUTED | 否 |

**非法：** `LOCKED→DISTRIBUTED` · 跳过 `SETTLEMENT_READY` · 跳过 `DISTRIBUTABLE` · 终态回退。

**同 tx LOCKED→DISTRIBUTED** = **LEGACY_ANTI_PATTERN**（审计中间态缺失）。

`SETTLEMENT_READY`：宪章四态之间的**强制协议闸**；实施可选显式枚举或「强制 Indexer 行 + 事件」——**M-RC 偏好可观测中间态**。

---

## 5 · Governance RC Closure 前置清单

当前：`FROZEN_WAITING_EXECUTE` — **不绕过**。

| Gate | Owner 动作 | 证据 |
|------|------------|------|
| **G-RC-01** | ETA 后 Sepolia Execute Proposal #1 | execute tx + F-02 |
| **G-RC-02** | Function Cert **54/0/0** | `VERDICT-LATEST.json` |
| **G-RC-03** | Product Full Cert | `P6-PRODUCT-CERT-LATEST.json` |
| **G-RC-04** | UI Full Cert | `P5-UI-UX-CERT-LATEST.json` |
| **G-RC-05** | `stamp-v311-governance-rc-close.py` | `GOVERNANCE-RC-CLOSE-LATEST.json` |

**G-RC-05 必须书面带上：**

1. `DEFERRED_TO_MONEY_PATH_RC=[TRE-02,REG-01,REG-04]`  
2. 确认 Step 2.5 歧义已闭  
3. 确认 LEGACY 直付非 SSOT  
4. 确认 SettlementRouter 目标架构  

然后才：

```text
Governance RC CLOSED
        ↓
M-RC-00 Open (+ OPT-A/B)
        ↓
TRE-02 / REG-01 / REG-04
        ↓
Step 3 Happy Path Implementation
```

---

## 6 · 纪律

| 规则 | |
|------|--|
| 支付代码 / 部署 | **禁止** |
| Track A | **FROZEN** |
| PASS / GO | **禁止** |
| Step 3 | **禁止**直至上表解锁 |
