# Escrow Settlement — Business Logic Gap Report

**Recorded:** 2026-07-08T11:23:53.606Z
**Target model:** Bilateral Confirmation Settlement Model
**Verdict:** `ESCROW_SETTLEMENT_MODEL_ALIGNED`

## Determined business model (audit recommendation)

**Bilateral Confirmation Settlement Model** — parties confirm **business service completion** off-chain (or via dedicated on-chain flags); **release()** is a **permissionless settlement execution** step that only moves funds to immutable destinations once business rules are satisfied.

```text
Traveler creates order → USDC Deposit → Escrow locked
  → Guide provides service → Trip ends
  → Guide Confirm Complete + Traveler Confirm Complete
  → Order business state = ServiceCompleted (≠ chain Released)
  → release() allowed (Keeper/automation OK)
  → Guide USDC + FeeRouter platform fee → Ledger
```

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 2 |
| P2 | 0 |

## P1

### ESC-GAP-001 — V1 Escrow has no on-chain bilateral flags — legacy testnet only

- **Layer:** Contract-V1-Legacy
- **Fix:** Do not deploy V1 to mainnet; use EscrowV2 + FactoryV2 (B3)
- **Refs:** contracts/src/Escrow.sol, registry/escrow-bilateral-mainnet-policy.v1.yaml

### ESC-GAP-030 — Product docs (53/01) describe dual-sign completion — API/contract do not implement

- **Layer:** Docs vs Implementation
- **Fix:** Close doc↔code gap via Bilateral Settlement Model rollout
- **Refs:** docs/spec/53-阶段开发技术文档.md, crates/api/src/chain_off/orders_flow/accept_cancel_pay_complete.rs

