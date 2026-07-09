# Escrow Settlement — Business Logic Gap Report

**Recorded:** 2026-07-08T10:29:11.296Z
**Target model:** Bilateral Confirmation Settlement Model
**Verdict:** `ESCROW_SETTLEMENT_BUSINESS_LOGIC_GAP`

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
| P0 | 4 |
| P1 | 4 |
| P2 | 1 |

## P0

### ESC-GAP-001 — No on-chain bilateral service-completion flags — release() only checks Funded

- **Layer:** Contract
- **Fix:** Architecture decision: Escrow V2 / CompletionRegistry / or documented keeper+attestation model
- **Refs:** contracts/src/Escrow.sol

### ESC-GAP-002 — release() permissionless while Funded — single-party early fund movement risk

- **Layer:** Contract
- **Fix:** Align with Bilateral Confirmation Settlement Model before mainnet
- **Refs:** contracts/src/Escrow.sol, frontend/components/escrow/EscrowDetail/escrowOnChainEligibility.ts

### ESC-GAP-010 — order_confirm_completion_impl sets Completed on first participant call — not bilateral

- **Layer:** API/DB
- **Fix:** Implement per-party completion confirmation; Completed only when both true (or timeout rule)
- **Refs:** crates/api/src/chain_off/orders_flow/accept_cancel_pay_complete.rs, crates/core/src/escrow.rs

### ESC-GAP-020 — canReleaseAfterRating gates on rating bilateral — not service completion bilateral

- **Layer:** Frontend
- **Fix:** Separate service-complete bilateral from rating; release after service bilateral (+ optional rating)
- **Refs:** frontend/components/escrow/EscrowDetail/escrowOnChainEligibility.ts, frontend/components/escrow/EscrowDetail/OrderActionsBlock.tsx

## P1

### ESC-GAP-003 — executeResolution() defines OnlyArbitrator but does not enforce it

- **Layer:** Contract
- **Fix:** Add arbitrator check or document permissionless executor model
- **Refs:** contracts/src/Escrow.sol

### ESC-GAP-011 — No completion_tourist_confirmed / completion_guide_confirmed columns

- **Layer:** API/DB
- **Fix:** Add migration + API fields mirroring pre-pay bilateral pattern
- **Refs:** crates/api/src/db/migrations/

### ESC-GAP-021 — No UX for “waiting for other party to confirm trip complete”

- **Layer:** Frontend
- **Fix:** Mirror BilateralConfirmBlock for service completion
- **Refs:** frontend/components/escrow/EscrowDetail/BilateralConfirmBlock.tsx

### ESC-GAP-030 — Product docs (53/01) describe dual-sign completion — API/contract do not implement

- **Layer:** Docs vs Implementation
- **Fix:** Close doc↔code gap via Bilateral Settlement Model rollout
- **Refs:** docs/spec/53-阶段开发技术文档.md, crates/api/src/chain_off/orders_flow/accept_cancel_pay_complete.rs

## P2

### ESC-GAP-004 — openDispute() has no participant restriction

- **Layer:** Contract
- **Fix:** Restrict to traveler/guide or document intentional openness
- **Refs:** contracts/src/Escrow.sol

