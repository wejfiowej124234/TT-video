# Web3 Mainnet — Business Logic Review (Audit-Only)

**Recorded:** 2026-07-08T14:02:57.753Z

## Dual-track accounting (must not mix on mainnet)

| Track | ID | Source | Mainnet production status |
|-------|-----|--------|---------------------------|
| Platform fee country bucket | D-4555-A | Escrow → FeeRouter → RegionVault | Design OK · **mainnet unverified** |
| Net profit steward/treasury split | D-4555-B | CountryPoolNetProfitLedger | DE pilot only · **full rollout BLOCKED** |

## Lifecycle flows — mainnet evidence required

| Flow | Sepolia | Mainnet |
|------|---------|---------|
| TTG mint → delegate → vote → queue → execute | Cert #7 ✅ · #8 queued | **NO EVIDENCE** |
| Treasury spend | Cert #8 pending TL#2 | **NO EVIDENCE** |
| Steward TTG stake → unstake | Cert #9 pending | **NO EVIDENCE** |
| Traveler USDC → Escrow → release → FeeRouter | G3-02 PASS | **NO EVIDENCE** |
| Primary Market purchase | UI DEFER | **NO EVIDENCE** |
| CountryPool Snapshot/Claim/Payout | TARGET | **NO EVIDENCE** |

## Honest boundary

Sepolia Production readiness **≠** Mainnet Production readiness. Cross-validation found **no mainnet registry, no mainnet chain_id=1 evidence, scope not selected**.
