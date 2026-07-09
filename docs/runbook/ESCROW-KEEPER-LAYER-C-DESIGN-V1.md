# Escrow Keeper — Layer C Design v1

**Record:** TT-ESCROW-KEEPER-LAYER-C-001  
**Depends on:** Layer A (off-chain bilateral) · Layer B (EscrowV2 on-chain flags)  
**Policy:** Keeper is **automation executor**, **not** business authorization layer

---

## 1. Role

| Layer | Who authorizes service complete | Who executes release |
|-------|----------------------------------|----------------------|
| Layer A | Traveler + Guide via API | — |
| Layer B | Traveler + Guide via `confirmServiceComplete()` | Anyone (permissionless) |
| Layer C | — (reads A+B state) | Keeper bot submits `release()` |

Business rule: **no funds move until bilateral service completion is true** (off-chain + on-chain V2 flags).

---

## 2. Trigger conditions (V2 instance)

Keeper may call `release()` when **all** hold:

1. Escrow instance is **EscrowV2** (`escrow_version: 2` on order)  
2. On-chain: `travelerServiceConfirmed && guideServiceConfirmed`  
3. Off-chain (Layer A): order `Completed` + `service_completion_confirmed` (SSOT for product/UI)  
4. Escrow status = `Funded`  
5. No open dispute (`Disputed` blocks release path)

Negative: Keeper **must not** call `release()` on V1 instances for mainnet orders (V1 forbidden on mainnet).

---

## 3. Architecture

```text
Order API (Layer A)          EscrowV2 (Layer B)
     │                              │
     │  both service confirmed      │  confirmServiceComplete ×2
     └──────────┬───────────────────┘
                ▼
         Keeper watcher (Layer C)
         - poll chain flags + API order state
         - idempotent release tx (relayer EOA)
                ▼
         release() → Guide + FeeRouter split
```

**Relayer:** dedicated hot wallet (`ESCROW_KEEPER_RELAYER_PK` / reuse `B407_RELAYER_PK` on testnet only).  
**No custody:** relayer cannot redirect funds (immutable `guide` / `platformFeeRecipient`).

---

## 4. MVP implementation options

| Option | Scope | When |
|--------|-------|------|
| **C1 Manual** | Operator runs `b407-exec-chain-release-distribute.sh` after bilateral confirm | Sepolia / drill |
| **C2 Cron script** | `scripts/ops/escrow-v2-keeper-release.cjs` watches DB + RPC | Post Layer B deploy |
| **C3 Indexer hook** | Extend `indexer-tick` with release queue | Production |

**Recommended path:** C2 → C3 after DRILL-F12 PASS.

---

## 5. Safety

- Idempotency: skip if status != Funded or flags incomplete  
- Rate limit / gas cap per order  
- Alert on failed release after bilateral complete (Pager / evidence log)  
- **Never** auto-confirm service on behalf of users (authorization stays bilateral)

---

## 6. Evidence (Layer C closure)

- [ ] Negative: keeper blocked before on-chain bilateral flags  
- [ ] Positive: keeper release after both confirms (Sepolia V2 drill)  
- [ ] G3-02 PAY-W07 replay on V2 corridor  
- [ ] DRILL-F12 Escrow Settlement PASS
