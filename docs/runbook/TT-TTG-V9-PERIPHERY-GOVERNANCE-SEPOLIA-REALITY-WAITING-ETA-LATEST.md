# TT · TTG V9 Sepolia Reality — Periphery Governance Upgrade (WAITING_ETA)

**STATUS:** `SEPOLIA_REALITY = IN_PROGRESS`  
**AUDIT_1_CANDIDATE_SHA:** `b19b85810c22677d243a82d06ebec8ebcb4d4b47` (Solidity binding unchanged)  
**Chain:** Sepolia `11155111` · deploy receipts **29/29**  
**Timelock cert (this round):** **SINGLE_12H** — TooEarly → real 12h → Executable **once**; fee/split/cap/P4/unpause = **same-ETA pre-scheduled batch** (no per-param extra 12h)  
**READY_AT:** `1787408352` (~2026-08-22 14:19:12 UTC)  
**NEXT_AFTER_PASS:** **AUDIT_2 only**  

| Flag | Value |
|------|-------|
| `EXACT_MATCH` | **NOT_ISSUED** |
| `OLD_AUDIT_INHERITANCE` | **FORBIDDEN** |
| `MAINNET_BROADCAST` | **NOT_AUTHORIZED** |
| `TT_PRODUCTION_GO` | **NO_GO** |

## Key addresses (29/29 deploy)

| Role | Address |
|------|---------|
| Timelock (12h) | `0x81D480D0f94359ac8e6ed4a92f1a08aa75374a5a` |
| Governor | `0x8E20f2892772e02e36aed9c86c4250493ffC7EF2` |
| FeeRouterV2 | `0xd31AD3e01aC3346414d75011a4544ff0654102f0` |
| ProjectPoolV2 | `0xb93F096C95eC23e5Dc3571afD874A1769DA01Cea` |
| Market | `0x93d718CAc198a5CAf2B8b0DF8545E88310145800` |
| Vault | `0xf769e3634bd4E8c168EDb3C81F68BAeeC9825123` |
| TTG | `0xADBf44AaC18016bD662D4DA5957Cf2a018001903` |
| USDC (mock) | `0xF61EC8EAd1f1A362F4Ac97cC0f5002F4FE17B6BD` |
| FeeIngressV2 | `0x340461F7558D9f8172AA9c0Ec5f8bd730c003e07` |
| RoleStake | `0x87b84a59Ed894B51F693aD259075F07ab556bEE6` |

Full machine env: `evidence/GO_ttg_v9_periphery_governance_upgrade/sepolia-reality.addresses.env`  
Runner: `scripts/dev/run-ttg-v9-periphery-governance-sepolia-reality.sh` (`resume`)  
Forge script: `contracts/src/ttg-v9/TtgV9PeripheryGovernanceSepoliaRehearsal.s.sol`

## Cross-refs

- Freeze: [TT-TTG-V9-PERIPHERY-GOVERNANCE-UPGRADE-FREEZE-LATEST](TT-TTG-V9-PERIPHERY-GOVERNANCE-UPGRADE-FREEZE-LATEST.md)  
- Audit #1: [TT-TTG-V9-AI-AUDIT1-PERIPHERY-GOVERNANCE-UPGRADE-LATEST](TT-TTG-V9-AI-AUDIT1-PERIPHERY-GOVERNANCE-UPGRADE-LATEST.md)  
- Audit #2 prep (NOT PASS): [TT-TTG-V9-AI-AUDIT2-PERIPHERY-GOVERNANCE-UPGRADE-PREP-LATEST](TT-TTG-V9-AI-AUDIT2-PERIPHERY-GOVERNANCE-UPGRADE-PREP-LATEST.md)  

**STOP:** do not claim Sepolia PASS until ETA lifecycle completes.
