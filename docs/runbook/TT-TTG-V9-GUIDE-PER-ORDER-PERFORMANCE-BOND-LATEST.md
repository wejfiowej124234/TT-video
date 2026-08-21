# TT · TTG V9 — Guide Per-Order USDC Performance Bond（业务真源校正）

**STATUS:** `V9_GUIDE_PER_ORDER_PERFORMANCE_BOND_TRUTH_CORRECTION` · **LOCKED** · Owner 2026-08-21  
**Stamp:** [`V9_GUIDE_PER_ORDER_PERFORMANCE_BOND_TRUTH_CORRECTION.json`](../../evidence/GO_ttg_v9_audit/V9_GUIDE_PER_ORDER_PERFORMANCE_BOND_TRUTH_CORRECTION.json)  
**Parents:** [Stake Layer Split](TT-TTG-V9-OWNER-STAKE-LAYER-SPLIT-LATEST.md) · [Documentation Truth Baseline](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · [Fee vs Stake](TT-TTG-V9-OWNER-ECONOMIC-MODEL-FEE-VS-STAKE-LATEST.md)

**Does not:** Phase1 redeploy · Staging/Production mutate · `TT_PRODUCTION_GO` flip · enable Merchant/Guide TTG RoleStake · auto-apply Merchant bond = Guide bond

---

## 0 · Owner locked semantics（替换旧泛化）

**SUPERSEDED as ACTIVE（禁止再写）：**  
「Guide/Merchant 履约 = USDC 81 Identity Stake」· 「长期身份质押 = 订单履约押金」

### Guide（向导）— ACTIVE

| Item | Lock |
|------|------|
| TTG RoleStake | **`NOT_REQUIRED` / `DISABLED`** · 非默认待办 |
| Performance bond | **每订单 USDC Performance Bond**（非长期身份押） |
| When lock | 游客与向导 **确认订单后** · **履约开始前** · 向导为 **该 orderId** 单独锁入 USDC |
| Normal complete | **全额返还** 向导 |
| Breach | **仅**经 **Escrow / Dispute 裁决确认** 后，可 **部分或全部罚没** |
| Not | 申请入驻时一次锁死、与订单无关的「身份押金即履约押」 |

### Merchant（商家）— ACTIVE boundary

| Item | Lock |
|------|------|
| TTG RoleStake | **`NOT_REQUIRED` / `DISABLED`** · 非默认待办 |
| Per-order USDC Bond | **不自动继承** Guide 规则 · **未 Owner 确认前保持独立 / OPEN** |
| Forbidden | 文档把 Merchant 写成与 Guide 同一套逐订单 Bond |

### Orthogonal（不变）

| Layer | Asset | Role |
|-------|-------|------|
| Tourist order principal | Escrow | 订单本金与争议结算 |
| Region Steward seat | TTG Seat（按国 bps） | 区域席位责任 |
| Steward Access Fee | 300k USDC | 准入费 · 不可退语义不变 |
| Platform fee | 5% · 45/55 or 100% Pool | FeeRouter · ≠ bond |

```text
TTG          = 治理 / 区域主理人 Seat（向导不质押 TTG）
USDC/order   = Guide 逐订单 Performance Bond（本文件）
Escrow       = 游客订单本金
300k USDC    = 主理人 Access Fee
Fee 45/55    = 平台费分账
81 Identity  = LEGACY / 非 ACTIVE 履约真源（见 §1 审计）
```

---

## 1 · Read-only implementation audit（不得扭曲业务迁就旧合约）

### `GuideIdentityStakingPool` / `IdentityStakingPool`（81）

| Capability | Present? | Note |
|------------|----------|------|
| USDC deposit / withdraw | YES | `depositIdentity` / `withdrawIdentity` |
| Aggregate `lockedOrder` per **user** | YES | `depositOrderRisk` / `lockOrderRiskFromIdentity` |
| **`orderId` binding** | **NO** | API 无 orderId；仅用户级合计 |
| Per-order lock at confirm → release on complete | **NO** | 无法按单全额返还语义闭环 |
| Slash only after Escrow/Dispute adjudication | **PARTIAL** | `slash(user,amount)` 仅 `slasher`；**未**与 Escrow dispute 状态机硬绑定 |
| Escrow principal hooks for guide bond | **NO** | KEEP Escrow 面无 guide bond 字段/钩子（本审计） |

### Verdict

| Label | Meaning |
|-------|---------|
| **`NEW_ORDER_BOND_MODULE_REQUIRED`** | Owner ACTIVE 真源 = 逐订单 USDC Bond；现 81 池 **不符合** orderId 绑定与按单返还/裁决罚没闭环 |
| 81 Identity pool | **LEGACY / NOT_ACTIVE_PERFORMANCE_BOND** · 可作历史身份下限参考 · **禁止**再标成 ACTIVE「履约=81 Identity」 |
| Escrow | **KEEP** 游客本金轨 · **正交** · 不替代 Guide Bond 模块 |
| Future engineering | 新模块须：`orderId` · lock-before-fulfill · full refund on success · slash gated by dispute outcome · Guide-only until Merchant confirmed |

**禁止：** 为迁就 `lockedOrder` 聚合账而把业务改写成「身份池合计锁仓即逐订单押金」。

---

## 2 · Downstream cite

官网 / Admin / 白皮书 / GitHub Official：Guide 履约写 **per-order USDC Bond**；勿写「USDC 81 Identity = 履约」。  
Merchant Bond：**独立 · 未确认**。
