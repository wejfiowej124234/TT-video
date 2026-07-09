# Escrow Bilateral Layer B Evidence (PG-P0-ESC)

**Verdict:** `LAYER_B_EVIDENCE_PASS`  
**Stamp:** 2026-07-08T11-23-09

## Checks (8/8)

- [x] **escrow_v2_contract** — EscrowV2.sol
- [x] **escrow_v2_bilateral_release_gate** — release() requires both service flags
- [x] **escrow_factory_v2_contract** — EscrowFactoryV2.sol
- [x] **deploy_script_v2** — DeployEscrowFactoryV2.s.sol
- [x] **broadcast_shell_v2** — phase2-sepolia-broadcast-escrow-factory-v2.sh
- [x] **registry_mainnet_policy** — V1 mainnet forbidden in policy SSOT
- [x] **keeper_layer_c_design** — Keeper Layer C design doc
- [x] **forge_escrow_v2_tests** — PASS

## V1 Legacy

**Mainnet deploy: FORBIDDEN** — see `registry/escrow-bilateral-mainnet-policy.v1.yaml`

## Next (Owner)

1. Sepolia broadcast: `TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 bash scripts/dev/phase2-sepolia-broadcast-escrow-factory-v2.sh`
2. Registry `escrow_factory_v2_address` + mainnet env manifest
3. Cert #8–12 · R-01 · Shadow Launch · G6
