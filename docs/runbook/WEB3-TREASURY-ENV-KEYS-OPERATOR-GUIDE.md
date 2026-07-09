# Web3 Treasury Env Keys — Operator Guide

**Guide ID:** `WEB3_TREASURY_ENV_KEYS_OPERATOR`  
**SSOT:** `registry/env-key-catalog-web3.v1.yaml`  
**Gate:** `bash scripts/gates/check-web3-env-catalog-gate.sh`  
**Phase:** ② Sepolia · ③ Mainnet prep

---

## Two-key model (ACTIVE)

TravelTrust has **two distinct on-chain treasuries**. Never use bare `TREASURY_ADDRESS` in new env files.

| Role | Env key | Contract | Sepolia |
|------|---------|----------|---------|
| **DAO / Primary Market** | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` | `GovernanceTreasuryP4Cap` | `0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2` |
| **FeeRouter globalOps (legacy leg)** | `LEGACY_TREASURY_ADDRESS` | `GovernanceTreasury` | `0x6a8323fb2394A1e9655F7132F4E4B8222d2898be` |

**API `/meta`:** `chain.contracts.treasury_address` resolves from `GOVERNANCE_TREASURY_P4CAP_ADDRESS` only.

**Alias (API internal):** `TREASURY_P4_CAP_ADDRESS` — same sink as P4Cap key.

---

## Forbidden keys (new env)

| Key | Status | Migrate to |
|-----|--------|------------|
| `TREASURY_ADDRESS` | **forbidden** | P4Cap or Legacy per context |
| `GOVERNANCE_TREASURY_ADDRESS` | **forbidden** | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` |

Comment-only references in `.env.example` and historical runbooks are allowed. Active `TREASURY_ADDRESS=0x…` lines fail deployment truth and env catalog gates.

---

## Canonical env files

| File | Purpose |
|------|---------|
| `scripts/dev/.env.phase2-chain-deploy.local` | Sepolia phase2 deploy spine |
| `scripts/dev/.env.staging-onboarding.local` | Staging onboarding |
| `scripts/dev/.env.production.local` | Production local (non-secret) |

---

## Operator checklist

1. Set `GOVERNANCE_TREASURY_P4CAP_ADDRESS` for DAO treasury / `/meta`.
2. Set `LEGACY_TREASURY_ADDRESS` for FeeRouter `globalOps()` verify scripts.
3. Do **not** set bare `TREASURY_ADDRESS` or `GOVERNANCE_TREASURY_ADDRESS`.
4. Run `bash scripts/gates/check-web3-env-catalog-gate.sh` before broadcast or release closeout.
5. Run `bash scripts/dev/phase2-sepolia-fundstack-verify-bindings.sh` to on-chain verify both legs.

---

## Related docs

- [WEB3-SYSTEM-MASTER-MAP-V1.md](./WEB3-SYSTEM-MASTER-MAP-V1.md) §6 ACTIVE Sepolia
- [WEB3-SYSTEM-PRODUCTION-RUNTIME-WIRING.md](./WEB3-SYSTEM-PRODUCTION-RUNTIME-WIRING.md)
- [Phase②.5 Hardening Plan](../spec/governance-token/PHASE2.5-WEB3-HARDENING-PLAN-v1.md)

**Legacy spine (pre–GovFreeze-V2):** [TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md](./TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md) — historical `TREASURY_ADDRESS` column retained with migration note.
