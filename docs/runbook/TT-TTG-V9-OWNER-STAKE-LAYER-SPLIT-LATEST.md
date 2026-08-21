# TT · TTG V9 — Owner Lock: Stake Layer Split (Steward TTG ≠ Guide Bond ≠ Escrow)

**STATUS:** `V9_OWNER_STAKE_LAYER_SPLIT_LOCKED` · Owner 2026-08-21 · **Guide bond semantics corrected** same day  
**Upstream:** [Documentation Truth Baseline](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · [Fee vs Role Stake](TT-TTG-V9-OWNER-ECONOMIC-MODEL-FEE-VS-STAKE-LATEST.md) · [Design Lock](TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md)  
**Guide bond SSOT:** [Guide Per-Order Performance Bond](TT-TTG-V9-GUIDE-PER-ORDER-PERFORMANCE-BOND-LATEST.md)  
**Machine:** [`V9_OWNER_STAKE_LAYER_SPLIT_LOCKED.json`](../../evidence/GO_ttg_v9_audit/V9_OWNER_STAKE_LAYER_SPLIT_LOCKED.json)

**Does not:** redeploy Phase1 · enable Merchant/Guide RoleStake · flip `TT_PRODUCTION_GO` · mutate Official www this turn

---

## Locked layers（写死）

| Layer | Asset | Who | Purpose |
|-------|-------|-----|---------|
| **A · TTG Seat / Role Stake** | **TTG** | **区域主理人 only** | 区域席位责任 · 十国 bps × live `totalSupply()` |
| **B · Guide per-order Performance Bond** | **USDC** | **向导** | 确认订单后、履约前按 **orderId** 锁押 · 完成全额返还 · 仅 Dispute 裁决后可罚没 |
| **C · Escrow** | 订单结算币 | 旅行者↔供给方 | **游客订单本金**与争议结算 · 与 A/B **正交** |
| **D · Access Fee** | 300k USDC | 主理人准入 | ≠ bond ≠ Seat |
| **E · Platform fee** | USDC fee split | FeeRouter | 45/55 or 100% Pool · ≠ bond |

**SUPERSEDED as ACTIVE:** 「Guide/Merchant 履约 = USDC 81 Identity Stake」· 「长期身份质押 = 订单履约押金」

**Forbidden mix:** 主理人 TTG ↔ 向导履约押；FeeRouter `globalStakers` ↔ 供给侧质押；订单违约默认 slash TTG；把 81 身份池冒充逐订单 Bond。

---

## Merchant / Guide TTG RoleStake

| 项 | Lock |
|----|------|
| Status | **`NOT_REQUIRED` / `DISABLED`** |
| Default backlog | **否** |
| Re-open | **仅** Owner 另开治理升级 |
| Phase1 | **不必**为开启 M/G TTG 而重部署 |

## Guide performance（ACTIVE）

见 [Guide Per-Order Bond](TT-TTG-V9-GUIDE-PER-ORDER-PERFORMANCE-BOND-LATEST.md) · 实现审计：**`NEW_ORDER_BOND_MODULE_REQUIRED`**

## Merchant performance（ACTIVE boundary）

**不自动继承** Guide 逐订单 Bond · **未确认前独立 / OPEN**

---

## Steward（不变）

TTG Seat ACTIVE · protocol-ssot 退出日历 · 300k Access Fee 正交
