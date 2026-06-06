# Escrow 已上链壳 · `/escrow/[id]/rate` · 状态声明（非冻结）

**阶段：① 本地** · **2026-06-03**

**目的：** 诚实标注 **尚未 UI 收口 / 冻结** 的 Escrow 子面，避免与 [`ESCROW-DRAFT-EXPERIENCE-FREEZE`](../GO_local_web3_itinerary_l5/ESCROW-DRAFT-EXPERIENCE-FREEZE.md) 混淆。

---

## 状态总表

| 页面 | 触发条件 | UI 冻结 | Phase ① 收口 | 绿集 |
|------|----------|---------|--------------|------|
| **`/escrow/[id]` 协议 DID 壳** | `hasEscrow` · 已上链 | **未冻结** | 维护期（53+30-DID） | `escrowProtocolUi` · orders 绿集 |
| **`/escrow/[id]/rate`** | 可评价终态 · 53-S8 | **未收口** | 功能维护 | 无独立 freeze 闸 |

**草稿 Experience**（`experienceDraft`）→ 见 **[ESCROW-ORDER-PAGE-PHASE1-CLOSURE](../GO_local_web3_itinerary_l5/ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md)** — **已封口**。

---

## 允许的工作（①）

- bugfix · API `GET/POST .../reviews` · i18n · a11y  
- `escrowProtocolUi` 暖色 L5 与列表 → Escrow 标记对齐（[`GO_local_orders_l5`](../GO_local_orders_l5/README.md)）  
- `ReviewBlock` / `EscrowRateRouteSuspense` 数据链

## 禁止冒充

- **不得** 写「Escrow 全页已 UI 冻结」  
- **不得** 用 orders 绿集 alone 宣称 `/rate` 已封口  
- **②③** 链上 release + 评分全链 GO 须独立专项

---

## ② 建议专项（未开工）

1. **`ESCROW-ONCHAIN-PROTOCOL-FREEZE.md`** — 已上链壳 layout lock  
2. **`ESCROW-RATE-PAGE-PHASE1-CLOSURE.md`** — `/rate` 机读闸 + 53-S8 对拍  
3. 纳入 **`run-web3-itinerary-l5-green.sh`** 扩展集或独立 `run-escrow-onchain-l5-green.sh`

**开工前：** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) G-0～G-4
