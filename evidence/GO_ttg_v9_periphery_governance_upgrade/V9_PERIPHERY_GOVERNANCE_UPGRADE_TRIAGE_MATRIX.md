# V9 Periphery Governance Upgrade — Triage Matrix

**STATUS:** `TRIAGE_STOP_OWNER_CONFIRM` · read-only · no deploy/broadcast

| Component | Address | Upgrade state | Triage | Migration |
|---|---|---|---|---|
| TTG_V9_Token | `0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9` | NON_UPGRADEABLE | **KEEP_IMMUTABLE** | KEEP; deploy scripts MUST FAIL on new Genesis |
| SoloTimelock_ACTIVE | `0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f` | NON_UPGRADEABLE | **NON_UPGRADEABLE** | NEW Timelock 12h no Safe; old LEGACY after OLD_ACTIVE_REFS=0 |
| Governor_V9 | `0xA0DfC4C5C544488AfEfE696AfB8e5823911e5A9c` | NON_UPGRADEABLE | **NON_UPGRADEABLE_FOR_ROOT_CUTOVER** | OWNER_CONFIRM_REQUIRED: NEW Governor with NEW 12h Timelock |
| ProjectPool_Phase1 | `0x7B21b421981A3B61cc08c8E22D4fd690E457Df37` | NON_UPGRADEABLE | **NON_UPGRADEABLE** | NEW ProjectPoolV2; cutover sinks; LEGACY label |
| CountryFeeRouter_Phase1 | `0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970` | NON_UPGRADEABLE | **NON_UPGRADEABLE** | NEW FeeRouter governable fee+Active split; no-steward fixed branch |
| BatchPrimaryMarket_V9 | `0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b` | UPGRADEABLE | **UPGRADE_REQUIRES_LEGACY_TIMELOCK** | After NEW root: UUPS upgrade treasury+slippage; avoid kneeling old 48h solely to keep address |
| PublicSaleVault_V9 | `0xe87378e49Ead2E1a422B8cae118d3C905Ee45B6C` | UPGRADEABLE | **UPGRADE_REQUIRES_LEGACY_TIMELOCK** | KEEP unless required; upgrade under NEW root if needed |
| RoleStakePool_V9 | `0xf6A1Fb4435E463117a666818611F49D03F91E7A7` | UPGRADEABLE | **UPGRADE_REQUIRES_LEGACY_TIMELOCK** | KEEP this wave; transfer ownership to NEW Timelock after root cutover |
| Escrow_Settlement_MoneyPath | `KEEP_OFFICIAL_MONEY_PATH` | N/A_THIS_WAVE | **KEEP_REWIRE_ONLY** | Rewire to NEW FeeRouter; no remint; no principal-path redesign |
| Legacy_Safe_GovernanceTimelock | `0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7` | N/A | **LEGACY_NOT_V9_ACTIVE_ROOT** | Remain LEGACY for V9 Official; isolate |

## Design conflict (STOP)

- **ID:** `GOVERNOR_TIMELOCK_IMMUTABLE_BLOCKS_REBIND`
- **Fact:** Governor.timelock immutable; SoloTimelock.delay immutable at 48h
- **Tension:** Freeze allowed Governor KEEP or rebind to NEW 12h Timelock; rebind impossible on-chain
- **Owner choice A:** NEW Governor + NEW 12h Timelock
- **Owner choice B:** Keep 48h SoloTimelock; revise Design Lock
