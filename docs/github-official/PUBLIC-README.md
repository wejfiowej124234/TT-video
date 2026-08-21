# TravelTrust · TTG V9 (Web3 Official)

**Mainnet status:** `MAINNET_DEPLOYED_PHASE1` / `TIMELOCK_CUTOVER_PENDING`  
**Not:** `MAINNET_FULLY_ACTIVE` · **Not:** Production GO (`TT_PRODUCTION_GO = NO_GO`)  
**Design Lock:** DL_R1 · Candidate `V9_AUDIT_CANDIDATE_DESIGN_LOCK`

TravelTrust is a decentralized travel-commerce protocol: Marketplace matching, **KEEP** on-chain Escrow for user principal (USDC), and **NEW** V9 governance / fee / sale / stake modules under Design Lock **DL_R1**.

**TTG** is the governance token (25T genesis · **NO-MINT** after). It is **not** the default settlement asset for travel orders.

## Docs

Full Official documentation hub: [README.md](README.md).

| | |
|--|--|
| Whitepaper (EN) | [TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-EN-LATEST.md](../whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-EN-LATEST.md) |
| 白皮书（中文） | [TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-LATEST.md](../whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-LATEST.md) |
| Contract Registry (ACTIVE) | [en/Contract-Registry.md](en/Contract-Registry.md) |
| Legacy Policy | [en/Legacy-Policy.md](en/Legacy-Policy.md) |
| Security | [SECURITY.md](SECURITY.md) |
| License | [LICENSE.md](LICENSE.md) |

## Architecture (one glance)

```text
Order(+country) → Escrow (KEEP EF/SR)
  → platform fee 5% → NEW CountryFeeRouter
       ├─ Active steward payout[country] → 45% / 55% NEW ProjectPool
       └─ none → 100% NEW ProjectPool
Buy TTG (USDC) → NEW ProjectPool
Governor → SoloTimelock 48h (admin = Marketing Norm · no Safe as V9 Official admin)
```

## Phase1 Mainnet (chain_id=1) — deploy pending cutover

Addresses are **accurately disclosed** with status **`DEPLOYED_PENDING_CUTOVER`**. Solo timed ops and KEEP `setFeeRouter` are **pending**. See [Mainnet Deployments](en/Mainnet-Deployments.md).

| Role | Address |
|------|---------|
| TTG V9 | `0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9` |
| SoloTimelock | `0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f` |
| ProjectPool | `0x7B21b421981A3B61cc08c8E22D4fd690E457Df37` |
| CountryFeeRouter | `0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970` |
| KEEP EscrowFactory | `0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6` |
| KEEP SettlementRouter | `0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372` |

## Disclaimer

Not investment advice. Smart contracts involve risk of loss. Historical V8 / Remint / R2_FINAL paths are **LEGACY** — see Legacy Policy.

---

*Candidate public-repo root README. Private monorepo root README remains team-internal and is not replaced by this file automatically.*
