# Escrow Settlement Authorization — Cross-Validation Matrix

**Recorded:** 2026-07-08T12:23:00.998Z

| Layer | Check | Expected | Actual | PASS |
|-------|-------|----------|--------|------|
| Contract-V1-Legacy | deposit caller | traveler only | restricted | ✅ |
| Contract-V1-Legacy | refund caller | traveler only | restricted | ✅ |
| Contract-V1-Legacy | release @ Funded (no bilateral) | LEGACY — Sepolia/testnet only · mainnet FORBIDDEN | undefined | ✅ |
| Contract-V1-Legacy | bilateral flags | absent (expected on V1) | absent | ✅ |
| Contract-V2-Mainnet | EscrowV2 + FactoryV2 files | present | present | ✅ |
| Contract-V2-Mainnet | bilateral service flags | traveler + guide | present | ✅ |
| Contract-V2-Mainnet | release gated post-bilateral | ServiceNotComplete revert | yes | ✅ |
| Contract-V2-Mainnet | confirmServiceComplete | traveler or guide | present | ✅ |
| Contract-V2-Mainnet | deploy script | DeployEscrowFactoryV2.s.sol | present | ✅ |
| Contract-V2-Mainnet | forge tests | EscrowV2.t.sol | present | ✅ |
| Policy | V1 mainnet forbidden SSOT | FORBIDDEN | documented | ✅ |
| Policy | V2 mainnet path required | REQUIRED | documented | ✅ |
| Policy | Owner ODR B3 selected | EscrowV2 + FactoryV2 | yes | ✅ |
| API/DB | confirm-service-completion bilateral | both parties before Completed | bilateral | ✅ |
| API/DB | service_* DB fields | service_tourist_confirmed + service_guide_confirmed | present | ✅ |
| API/DB | Escrowed→Completed transition | after bilateral service confirm | bilateral gate | ✅ |
| API/DB | pre-pay bilateral (itinerary) | confirm-bilateral fields | present | ✅ |
| Frontend | release gate | after bilateral SERVICE complete | service completion | ✅ |
| Frontend | rating does not sole-gate release | service completion SSOT | aligned | ✅ |
| Frontend | confirm-service-completion API client | orderConfirmServiceCompletion | present | ✅ |
| Docs | bilateral service complete in 53/01 | documented | yes | ✅ |
| Docs | release separate from completion confirm | documented | yes | ✅ |
| Registry/MasterMap | Escrow module M10 | present | yes | ✅ |
