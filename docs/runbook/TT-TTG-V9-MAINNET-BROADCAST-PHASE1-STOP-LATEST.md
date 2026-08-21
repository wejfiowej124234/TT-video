# TT · TTG V9 Mainnet Design Lock Broadcast — Phase1 STOP

**STATUS:** `V9_MAINNET_BROADCAST_PHASE1_DEPLOYED_SCHEDULED` · successor **`V9_MAINNET_DL_R1_PHASE2_FREEZE_WAIT`**  
**NOT:** `V9_MAINNET_DEPLOYMENT_VERIFIED_STOP` (Solo 48h execute + KEEP SR.setFeeRouter still open)  
**NOT:** `TT_PRODUCTION_GO` (unchanged · not authorized)  
**Freeze:** Candidate + Phase1 addresses locked — see [Phase2 Freeze Wait](TT-TTG-V9-MAINNET-DL-R1-PHASE2-FREEZE-WAIT-LATEST.md)

**Candidate:** `V9_AUDIT_CANDIDATE_DESIGN_LOCK` · **DL_R1**  
**Auth:** `V9_OWNER_MAINNET_BROADCAST_AUTHORIZATION_RECORDED`  
**Pin:** `V9_MAINNET_DL_R1_BROADCAST_ARTIFACT_PIN.json`

## Deployed (chain_id=1)

| Role | Address |
|------|---------|
| SoloTimelock | `0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f` |
| ProjectPool | `0x7B21b421981A3B61cc08c8E22D4fd690E457Df37` |
| CountryFeeRouter | `0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970` |
| TTG V9 | `0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9` |
| Vault (proxy) | `0xe87378e49Ead2E1a422B8cae118d3C905Ee45B6C` |
| Market (proxy) | `0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b` |
| Governor | `0xA0DfC4C5C544488AfEfE696AfB8e5823911e5A9c` |
| RoleStake (proxy) | `0xf6A1Fb4435E463117a666818611F49D03F91E7A7` |
| FeeIngress | **none** (`address(0)`) |

## Immediate verify

- Creation Exact Match vs Artifact Pin: **PASS**
- Norm Timelock admin / 48h / Guardian / USDC→NEW Pool / 25T genesis: **PASS**
- FeeRouter callers / SR.setFeeRouter: **pending** (by design)

## Remaining before `V9_MAINNET_DEPLOYMENT_VERIFIED_STOP`

1. After SoloTimelock **48h** ETA: execute `idBind` · `idSeed` · `idCallerSr` · `idCallerEf`
2. KEEP SettlementRouter `setFeeRouter(NEW)` via **KEEP Timelock** (owner=`0x50F0…`, admin=Safe) — separate Safe ops; does not make Safe V9 Official ACTIVE Timelock
3. Re-verify FeeRouter callers + SR.feeRouter == NEW FeeRouter
4. Only then stamp `V9_MAINNET_DEPLOYMENT_VERIFIED_STOP` and stop

Addresses SSOT: `evidence/GO_ttg_v9_mainnet_dl_r1/addresses.env`  
Verify stamp: `evidence/GO_ttg_v9_audit/V9_MAINNET_BROADCAST_PHASE1_DEPLOYED_SCHEDULED.json`
