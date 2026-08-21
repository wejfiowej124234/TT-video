# EscrowV2 + EscrowFactoryV2 — Design Spec v1 (Layer B)

**Status:** DESIGN · pre-implementation  
**Owner Decision:** [ESCROW-BILATERAL-SETTLEMENT-OWNER-DECISION-RECORD-V1.md](../runbook/ESCROW-BILATERAL-SETTLEMENT-OWNER-DECISION-RECORD-V1.md)  
**Companion:** `contracts/src/EscrowV2.sol` · `contracts/src/EscrowFactoryV2.sol`

---

## 1. Design intent (D16)

| Function | Behavior | Why |
|----------|----------|-----|
| `confirmServiceComplete()` | Traveler **or** Guide · once each | Business authorization on-chain |
| `release()` | **Anyone** · requires both flags + Funded | Immutable destinations · Keeper automation · no caller profit |
| `deposit()` | Traveler only | Payer authorization |
| `refund()` | Traveler only | Pre-settlement exit |

---

## 2. State machine (on-chain)

```text
None → Created → Funded → [both confirmServiceComplete] → release() → Completed
                  ↘ Disputed → Resolved
                  ↘ Refunded / Partial / Slashed (V1 parity)
```

**New flags (immutable per instance after init):**

- `travelerServiceConfirmed`
- `guideServiceConfirmed`

**`release()` guard:**

```solidity
require(status == Status.Funded);
require(travelerServiceConfirmed && guideServiceConfirmed);
// then split funds — same math as V1
```

---

## 3. FactoryV2

- `EscrowFactoryV2.createEscrow(params)` → new `EscrowV2` instance  
- `escrowOf[orderId]` one-to-one  
- `factoryPaused` guardian control (same as V1)  
- **Mainnet registry key:** `escrow_factory_v2_address`  
- **Sepolia:** deploy V2 alongside V1; new orders after cutover date use V2 only

---

## 4. Migration

| Item | Policy |
|------|--------|
| Existing V1 instances | Run to completion on testnet; **no mainnet V1** |
| In-flight V1 on Sepolia | Complete or manual governance refund |
| Backend `escrow_version` | Order metadata `escrow_version: 1 \| 2` |
| API | Route create-escrow to FactoryV2 when `PRODUCTION_SCOPE_MAINNET` |

---

## 5. Dispute / timeout (Layer B+)

- `executeResolution()` — enforce `msg.sender == arbitrator` (fix V1 gap)  
- Timeout auto-confirm — **off-chain cron** sets flags via **dispute resolution** or future **Timelock extension** (not in V2 MVP)

---

## 6. Verification

- Forge: `EscrowV2.t.sol` — cannot release with one confirm; third party can release after both  
- G3-02 PAY-W07 replay on V2  
- Cert evidence: bilateral → release tx

---

## 7. Deployment checklist (mainnet)

1. Deploy `EscrowFactoryV2` with guardian = Timelock/Safe  
2. Wire `platformFeeRecipient` = FeeRouter  
3. G1 bytecode manifest `chain_id=1`  
4. Registry populate · disable V1 factory pointer  
5. Shadow drill DRILL-F12 Escrow Settlement
