# CountryPool Audit (D-4555-B)

**Recorded:** 2026-07-08T11:53:53.324Z

| Step | Contract | Math | Verified |
|------|----------|------|----------|
| CP-01 | CountryPoolNetProfitLedger | sum(R100+R110+R120 lines) | PARTIAL |
| CP-02 | — | netProfit = gross - allowableExpense - carriedLoss | PARTIAL |
| CP-03 | — | stewardAmount + globalAmount + unallocated = netProfitPrime | PARTIAL |
| CP-04 | — | steward eligibility boolean | PARTIAL |
| CP-05 | StewardPathVault | StewardPathVault deposit | PARTIAL |
| CP-06 | RegionDistributionClaim | Claim → Wallet | TARGET |

**Mainnet blocker:** GAP-99-03
