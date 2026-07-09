# Economic Model Audit

**Recorded:** 2026-07-08T10:08:31.231Z

## Supply invariants

| ID | Check | Status | Issues |
|----|-------|--------|--------|
| ECO-01 | TTG total supply cap | PASS | — |
| ECO-02 | USDC Escrow conservation | PASS | — |
| ECO-03 | FeeRouter BPS sum | PASS | — |

## Flow graph (cycle / arbitrage)

| From | To | Cycle risk |
|------|-----|------------|
| TTG Treasury mint | Primary Market TARGET | LOW if mint cap enforced |
| Primary Market | TTG Holder wallets | MEDIUM — market price vs NAV disclosure |
| Escrow fees | FeeRouter → CountryPool D-4555-A | LOW — orthogonal to D-4555-B |
| Net profit | CountryPoolNetProfitLedger → Steward + Global | MEDIUM — double-count if mixed with D-4555-A |

## Arbitrage checks

- **ECO-ARB-01** stake vote then unstake same block: getPastVotes + release delay — `REQUIRES_CERT_EVIDENCE`
- **ECO-ARB-02** fee route vs net profit double dip: orthogonal accounting tracks — `REQUIRES_OPS_TRAINING`
