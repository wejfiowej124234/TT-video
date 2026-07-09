# Escrow Bilateral Layer A Evidence

**Verdict:** `LAYER_A_EVIDENCE_PASS`  
**Stamp:** 2026-07-08T13-46-16  
**Decision path:** B3 EscrowV2 + FactoryV2  

## Checks (8/8)

- [x] **migration_service_completion_columns** — orders.service_tourist_confirmed + service_guide_confirmed
- [x] **api_confirm_service_completion_route** — POST /api/v1/orders/:id/confirm-service-completion
- [x] **api_bilateral_service_completion_impl** — Bilateral Escrowed → pending → Completed
- [x] **frontend_release_gate_service_completion** — Release gated on service completion, not rating
- [x] **frontend_api_client_service_completion** — orderConfirmServiceCompletion client
- [x] **layer_b_escrow_v2_contract** — EscrowV2.sol present
- [x] **layer_b_factory_v2_contract** — EscrowFactoryV2.sol present
- [x] **registry_mainnet_policy** — V1 mainnet forbidden SSOT

## V1 Escrow

V1 `Escrow.sol` / `EscrowFactory.sol` — **testnet legacy only**; **must not** deploy to mainnet.

## Layer B (design)

- `contracts/src/EscrowV2.sol` — `confirmServiceComplete()` + gated `release()`
- `contracts/src/EscrowFactoryV2.sol` — deploys V2 instances only
