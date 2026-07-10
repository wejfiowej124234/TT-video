# WEB3 Deployment Truth Gate Report v1

**Generated:** 2026-07-10T00:06:25Z
**Gate:** `bash scripts/gates/check-web3-deployment-truth-gate.sh`
**Result:** `WEB3_REGISTRY_CONVERGENCE: PASS`

## Proxy Implementation Matrix (Sepolia on-chain verified)

| Contract | Proxy | Implementation | Codehash | Upgrade Admin | Status |
|----------|-------|----------------|----------|---------------|--------|
| Governor | `0x847b00ddb6ffed71812abc358a407dad4b099fcb` | `0x91C479a93dA2B4D78C03EeE03Db9A5AD65d09968` | `0x161ed77be8a8fa8701a385ea36ca2a547d0563e3b78eadfca81f17773eb26fe9` | `0x904a6C4c6Aab698AfBF08EC6151D317c393520cC` | ✅ |
| TreasuryP4Cap | `0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2` | `0xeb2542f912215d1cA46394360a854b32586b8303` | `0x84d2b5dd2fae145c1823d7d0f17ffce6b17ff3f385159b5086a38296deb7fe24` | `0x904a6C4c6Aab698AfBF08EC6151D317c393520cC` | ✅ |
| PrimaryMarket | `0x7af15f98622b9282298ca3070a698ca4a96a4016` | `0x94F23511fe808efdc2DDA5b98dCE34c513644F12` | `0x6c121d6f2a53188e0092ea132945acb571e4304acc5e4ad15c1d78834ce5b9a9` | `0x904a6C4c6Aab698AfBF08EC6151D317c393520cC` | ✅ |
| SeatRegistry | `0xc99776e980d33f1857d5bb9a57b35ab7669aad1f` | `0xa6326194358C0D8dd22950Ffe8071C7BE1d21e9D` | `0x3b87c97ee0457cf0e435da71f60c8d1ab8b7accfc76037623539ae0459c42be1` | `0x904a6C4c6Aab698AfBF08EC6151D317c393520cC` | ✅ |
| StewardPool | `0x3a89378bfad12d1028707dd37055294854c8784e` | `0x7e9B940302E3aEf8e880F49BDe88247A2721ac2f` | `0xef2101114610e8250467852b4833dc9521a1a72b9e3406385a909a4779a10814` | `0x904a6C4c6Aab698AfBF08EC6151D317c393520cC` | ✅ |

## Treasury semantics

| Role | Env | Address | Status |
|------|-----|---------|--------|
| DAO P4Cap (ACTIVE) | GOVERNANCE_TREASURY_P4CAP_ADDRESS | 0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2 | ACTIVE |
| FeeRouter ops (legacy) | LEGACY_TREASURY_ADDRESS | 0x6a8323fb2394A1e9655F7132F4E4B8222d2898be | DEPRECATED |

## DE D-4555-B + Vacancy V1

| Contract | Address | Owner (on-chain) | Notes |
|----------|---------|------------------|-------|
| CountryPoolNetProfitLedger | 0x738D2c133d5F90c13eE9907386136471E1f330f5 | 0x904a6C4c6Aab698AfBF08EC6151D317c393520cC | legacy timelock owner |
| UnallocatedStewardPathVault | 0xb7d0Ea9579F80B2090195d49a44941d5546554E9 | 0x904a6C4c6Aab698AfBF08EC6151D317c393520cC | Vacancy V1 · gate PASS |

## Checks passed: 9

## Upgrade path

Governor.propose → Timelock.schedule (48h) → Timelock.execute → TimelockUpgradeableProxy.upgradeTo
