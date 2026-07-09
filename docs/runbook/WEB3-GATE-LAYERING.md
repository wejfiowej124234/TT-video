# Web3 Gate Layering · Payment Rail vs Entire Web3 System

**Machine SSOT:** [`registry/web3-gate-layering.v1.yaml`](../../registry/web3-gate-layering.v1.yaml)

---

## 问题（2026-07-08 治理纠正）

`TT_PRODUCTION_WEB3_READY=PASS` 曾仅反映 **G3-02 Payment Rail**（PAY-W01..W16），但 Four-Gate L2 scope 声明包含 Treasury · Governance · Indexer · 全 Web3 栈 — **造成 Gate 误判**。

---

## 拆分后的 Machine Keys

| Key | 证明范围 | 当前 |
|-----|----------|------|
| **`TT_WEB3_PAYMENT_PRODUCTION_READY`** | Payment Rail · M25 · USDC Escrow 走廊 | `WEB3_PAYMENT_PRODUCTION_PASS` |
| **`TT_WEB3_SYSTEM_PRODUCTION_READY`** | Entire Web3 System · M01–M24 | `WEB3_SYSTEM_PRODUCTION_IN_PROGRESS` |
| **`TT_PRODUCTION_WEB3_READY`** | Four-Gate L2 **聚合**（两者皆 PASS 才 PASS） | `IN_PROGRESS` |

别名：`TT_WEB3_PAYMENT_PRODUCTION_READINESS` = 旧名，与 `TT_WEB3_PAYMENT_PRODUCTION_READY` 同源。

---

## 推导规则

```text
IF TT_WEB3_PAYMENT_PRODUCTION_READY != PASS
  → TT_PRODUCTION_WEB3_READY = NOT_STARTED | IN_PROGRESS

IF TT_WEB3_PAYMENT_PRODUCTION_READY == PASS
   AND TT_WEB3_SYSTEM_PRODUCTION_READY != PASS
  → TT_PRODUCTION_WEB3_READY = IN_PROGRESS   ← 当前状态

IF both PASS
  → TT_PRODUCTION_WEB3_READY = PASS
```

---

## 审计入口

| 审计 | 脚本 | Evidence |
|------|------|----------|
| Payment Rail | `scripts/dev/run-payment-usdc-web3-deep-audit.cjs` | `payment-deep-audit/` |
| Entire Web3 System | `scripts/dev/run-web3-system-deep-audit.cjs` | `web3-system-audit/` |

---

## Production GO 关系

- Payment PASS **不阻断** Business / Infrastructure 并行推进  
- **Production GO** 要求 `TT_PRODUCTION_WEB3_READY=PASS` → 必须 **System** 门关闭  
- Stripe 仍不在 L2 Web3 门内（P1 optional onboarding）

---

*Restored gate layering 2026-07-08 · no business logic change*
