# TT · FCG-PAY-01 Protocol Freeze（Step 1–2 only）

**Machine:** `TT_FCG_PAY01_PROTOCOL_FREEZE`  
**Status:** **PAPER_FROZEN_STEPS_1_2** · `2026-07-19`  
**机读：** [`registry/psg-fcg-pay01-protocol-freeze.v1.yaml`](../../registry/psg-fcg-pay01-protocol-freeze.v1.yaml)  
**证据：** [`FCG-PAY-01-PROTOCOL-FREEZE-LATEST.json`](../../evidence/GO_pre_eta_production_prep/full-capability-gap-closure-20260719/FCG-PAY-01-PROTOCOL-FREEZE-LATEST.json)  
**上位：** [Gap Closure](./TT-PRODUCTION-FULL-CAPABILITY-GATE-GAP-CLOSURE-LATEST.md) · [Money-Path Plan](./TT-MONEY-PATH-TEST-PLAN-LATEST.md) · [Exit Criteria](./TT-V311-PRODUCTION-EXIT-CRITERIA-V1-LATEST.md)

```text
本窗:     Protocol Freeze · Step 1–2 ONLY
禁止:     支付/TRE/REG 编码 · Track A 回写 · PASS / GO / Money-Path Alignment 宣称
阶段:     ① 纸面冻结（≠ ② Sepolia 实施 PASS ≠ ③ Production GO）
```

---

## 0 · M-RC-00 治理约束（写死 · 编码前）

| 约束 | 要求 |
|------|------|
| **Governance RC** | 必须 **CLOSED**（当前 `FROZEN_WAITING_EXECUTE` → **阻塞编码**） |
| **Owner** | 明确 **opens Money-Path RC** |
| **设计锁** | `OPT-A` 或 `OPT-B` 锁定（计划引用 `MP-IMPL-BASELINE-20260718-OPT-A`） |
| **证据** | `MONEY-PATH-RC-CHARTER` + `MONEY-PATH-RC-DESIGN` |
| **禁止** | Governance 未关就实施 · 无设计锁实施 · 把 Money-Path P0 混进 Governance 退出 |

**本 Freeze ≠ M-RC-00 PASS。** 仅武装 Step 1–2 纸面真源。

---

## 1 · Step 1 · 资金模型冻结

### 1.1 总流（订单腿 + 宪章腿）

```text
Traveler USDC
    → Payment Entry (Escrow.deposit)
    → Escrow Lock (Order Escrow rail · Funded + SERVICE_FEE_LOCKED)
    → Completion Trigger → release / refund / dispute paths
    → platform fee leg 仅在成为 Distributable 后
         → FeeRouter 四轨隔离记账
         → 45/55（ACTIVE Steward）或 100% Project Revenue Pool
         → Steward Revenue Entitlement / Treasury(P4Cap≠PRP) Allocation
```

### 1.2 十项冻结表

| # | 项 | 冻结结论 |
|--:|----|----------|
| 1 | **Payment Entry** | Traveler · `deposit(totalAmount)` · 仅 `Created` · 入 Escrow 合约余额 |
| 2 | **Escrow Lock** | 资金在 **Order Escrow** 轨；禁止与 P4Cap / PRP / Founder 混账 |
| 3 | **Completion Trigger** | 目标：`Funded`→`release()`→`Completed`；**演员策略 = OWNER_INPUT @ M-RC-00**（AS_IS 合约无角色闸） |
| 4 | **Release Conditions** | `Funded` · 无争议 · 完成策略满足；向导 `floor(total×(10000−bps)/10000)` · 余为平台费腿 |
| 5 | **Refund Conditions** | 全额：`traveler` 调 `refund()`→`Refunded` · **Distributable=0**；部分：`releasePartialRefund`；未入账取消：仅 off-chain `Cancelled` |
| 6 | **Dispute Conditions** | `openDispute`←`Funded`→`Disputed`；`executeResolution` 守恒三腿→`Resolved`；演员/仲裁闸 **TARGET 锁定 @ M-RC-00** |
| 7 | **FeeRouter 四轨** | ① Order Escrow ② GovernanceTreasuryP4Cap ③ Project Revenue Pool ④ Founder Bootstrap · **永久隔离** |
| 8 | **Distributable 计算** | 词汇 SSOT：`PENDING→LOCKED→DISTRIBUTABLE→DISTRIBUTED`；**扣减退款/争议/Chargeback 后** 才可 45/55 |
| 9 | **Steward Revenue** | ACTIVE 主理人：Distributable **45%**；否则 **0%**（100%→PRP）· `destination_country` |
| 10 | **Treasury Allocation** | **P4Cap** = Public Sale / Recovery 再售 USDC；**≠** PRP（平台 Distributable 份额） |

### 1.3 比例常量（宪章 / `V311EconomicConstants`）

| 常量 | 值 |
|------|-----|
| 默认平台服务费 | 500 bps（5%） |
| 上限 | 1000 bps（10%） |
| Steward / PRP（有主理人） | 4500 / 5500 |
| 无主理人 | 0 / 10000 |

### 1.4 AS_IS → TARGET（诚实 · 非 PASS）

| 缺口 | AS_IS | TARGET（实施窗） |
|------|-------|------------------|
| 45/55 入轨 | `release` 把费打到 `platformFeeRecipient` 并同 tx 推到 DISTRIBUTED | 先 Distributable，再证四轨 live 分账 |
| `release` / `openDispute` 角色 | 合约侧闸不完整 | M-RC-00 锁定演员策略后实现 |
| `executeResolution` | `OnlyArbitrator` 未挂 modifier | 仲裁人硬闸 |
| Test Plan REG-04 用词 | CLAIMABLE/CLAIMED 草稿 | **收敛到** PENDING/LOCKED/DISTRIBUTABLE/DISTRIBUTED |

---

## 2 · Step 2 · 状态映射矩阵（草案）

**相等律：** `链上事件金额 == Indexer == DB == API == UI`  
**禁止：** 链上成功、页面失败（或相反）而不留证据缺口。

| Blockchain Event | Indexer | Database (`OrderState`) | API `state` | Frontend Display |
|------------------|---------|-------------------------|-------------|------------------|
| `EscrowCreated` | index Created | Created / Accepted（待付） | `created` / `accepted` | Awaiting payment |
| `Deposited` | index Deposited | **Escrowed** | `escrowed` | Funds locked / In progress |
| `Released` | index Released | **Completed** | `completed` | **Completed** |
| `Refunded` | index Refunded | **Refunded** | `refunded` | Refunded |
| `PartialRefundExecuted` | index Partial | **PartiallyRefunded** | `partially_refunded` | Partially refunded |
| `SlashedExecuted` | index Slashed | **Slashed** | `slashed` | Slashed |
| `DisputeOpened` | index Dispute | **Disputed** | `disputed` | Dispute open |
| `ResolutionExecuted` | index Resolution | 按金额 → Completed / Refunded / PartiallyRefunded | 同左 | Resolved |
| `ServiceFeeStateChanged` | index SF SM | `service_fee_state` 投影 | `service_fee_state` | 高级/只读区可选 |

Off-chain 先行（无链上资金）：`Draft`→`Created`→`Accepted`→（取消）`Cancelled`。

---

## 3 · TRE-02 / REG-01 / REG-04 / M-RC-04 映射草案

| Finding / Gate | 本 Freeze 已覆盖 | 实施后才可证（仍 OPEN） |
|----------------|------------------|-------------------------|
| **TRE-02 → M-RC-01** | 45/55 · 100% PRP · LEGACY 非 SSOT · split 库引用 | 链上/运行时分账证据 · FeeRouter 真入轨 |
| **REG-01 → M-RC-02** | 四轨 ID + 隔离 + Test Plan Track 别名映射 | live 非空地址矩阵 · 不混账证明 |
| **REG-04 → M-RC-03** | 宪章四态 SM · 禁止 DISTRIBUTABLE 前 payout | 运行时强制 + Indexer 投影证据 |
| **M-RC-04 Re-Audit** | 复审输入清单 · 四者相等律 | OPEN_BLOCKING=0 · 宪章 money-path slice PASS |

**本文件不宣称上述任一 Gate PASS。**

---

## 4 · 开放对齐项 → Step 2.5 已纸面关闭

| ID | 原项 | Step 2.5 |
|----|------|----------|
| OA-PAY-01…05 | 演员 · LEGACY · 架构 · 仲裁闸 · SM | **CLOSED_ON_PAPER** → [Step 2.5](./TT-FCG-PAY-01-STEP25-AMBIGUITY-CLOSURE-LATEST.md) |

**不等于** M-RC PASS。下一步仍是 Governance RC CLOSED → M-RC-00。

---

## 5 · 纪律

| 规则 | |
|------|--|
| Track A | **FROZEN** · 本窗 **零修改** |
| 编码 | **禁止** 直至 `GOVERNANCE_RC_CLOSED` ∧ M-RC-00 |
| PASS / GO | **禁止** |
| 下一合法窗 | Owner：关 Governance RC → 开 M-RC-00 → 再 Step 3 Happy Path 证据 |
