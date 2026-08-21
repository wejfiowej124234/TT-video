# TT · TTG V9 — Guide Order USDC Performance Bond · Local Candidate

**STATUS:** `V9_GUIDE_ORDER_PERFORMANCE_BOND_LOCAL_CANDIDATE_PASS`  
**Truth:** [Guide Per-Order Bond](TT-TTG-V9-GUIDE-PER-ORDER-PERFORMANCE-BOND-LATEST.md)  
**Stamp:** [`V9_GUIDE_ORDER_PERFORMANCE_BOND_LOCAL_CANDIDATE_PASS.json`](../../evidence/GO_ttg_v9_audit/V9_GUIDE_ORDER_PERFORMANCE_BOND_LOCAL_CANDIDATE_PASS.json)

**Forbidden this wave:** Phase1 address mutate · Mainnet broadcast · Staging/Production deploy · `TT_PRODUCTION_GO` flip · Merchant wiring

---

## Module

| Item | Path |
|------|------|
| Contract | `contracts/src/ttg-v9/TtgV9GuideOrderPerformanceBond.sol` |
| Lifecycle iface | `contracts/src/ttg-v9/ITtgV9GuideOrderBondLifecycle.sol` |
| Mock Escrow/order SM | `contracts/src/ttg-v9/mocks/MockGuideOrderBondLifecycle.sol` |
| Forge | `contracts/test/ttg-v9/TtgV9GuideOrderPerformanceBond.t.sol` |
| Verdict vs 81 | **`NEW_ORDER_BOND_MODULE_REQUIRED` → implemented as NEW module** (81 remains LEGACY) |

## Semantics (locked)

1. `orderId` unique bond  
2. `lockBond` after lifecycle `canLockBond` (dual confirm · not started)  
3. `completeAndRefund` / `cancelAndRefund` → original guide only  
4. `markDisputed` → blocks complete/cancel  
5. `slash` → slashOperator ∪ Timelock owner only · USDC → `slashTreasury`  
6. `settleAfterDispute` → remainder to guide  
7. Pause blocks new locks · slash still allowed  
8. `rescueERC20` rejects USDC  
9. UUPS upgrade · Timelock owner only  
10. Merchant **not** in module  

## Orthogonal

Escrow tourist principal · TTG RoleStake · Steward Seat · 300k Access Fee · FeeRouter 45/55

## Escrow wiring (Local verified via Mock)

| Escrow/order event | Bond call |
|--------------------|-----------|
| Both parties confirmed | lifecycle marks confirm → guide `lockBond` |
| Fulfillment started | `canLockBond=false` |
| Completed | lifecycle `completeAndRefund` |
| Cancelled pre-fulfill | lifecycle `cancelAndRefund` |
| Dispute opened | lifecycle `markDisputed` |
| Dispute resolved | slashOperator `slash` (0..n) → lifecycle `settleAfterDispute` |

Production Escrow/Dispute adapter = future Timelock-set `lifecycle` / `lifecycleCaller` / `slashOperator` — **not** this Local Candidate broadcast.

## Forge gate

```bash
cd contracts && FOUNDRY_PROFILE=ttg_v9 forge test --match-contract TtgV9GuideOrder -q
```

Expect: **23 passed** · C/H/M findings on this suite = **0** (auth / funds / reentrancy / replay / wrong orderId covered).

## Next

Owner re-auth → Staging Reality Regression (separate). This Candidate does **not** auto-enter Staging.
