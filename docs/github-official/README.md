# TravelTrust Web3 · Official GitHub Documentation Hub

**Pack:** `V9_GITHUB_OFFICIAL_REPOSITORY_ALIGNMENT`  
**STATUS:** Official **public-facing** Web3 docs surface (repository-local; **not** auto-published)  
**Upstream (sole):**  
- [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](../runbook/TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md)  
- `V9_DOCUMENTATION_FULL_CONVERGENCE_PASS`  
- `TTG_V9_MAINNET_EDITION_WHITEPAPER_PASS`  
**Design Lock:** **DL_R1** · Candidate `V9_AUDIT_CANDIDATE_DESIGN_LOCK`  
**Mainnet status:** `MAINNET_DEPLOYED_PHASE1` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`  
**Gate:** `python scripts/dev/run-ttg-v9-github-official-alignment-gate.py --require-zero`  
**Machine:** [`registry/ttg-v9-github-official-alignment.v1.yaml`](../../registry/ttg-v9-github-official-alignment.v1.yaml)

> General information only. Not an offer of securities or virtual assets. Not investment, tax, or legal advice.  
> This pack is prepared for a future Official public repository / Docs site. **This wave does not push, publicize, or cut over** Production `/meta`, Indexer, or Official www.

---

## Languages

| | |
|--|--|
| **English hub** | [en/README.md](en/README.md) |
| **中文入口** | [zh/README.md](zh/README.md) |
| **Public README candidate** | [PUBLIC-README.md](PUBLIC-README.md) (copy target for a public Web3 repo root — **do not** overwrite the private monorepo root README without Owner action) |

---

## Document map

| Topic | EN | ZH |
|-------|----|----|
| Architecture | [en/Architecture.md](en/Architecture.md) | [zh/Architecture.md](zh/Architecture.md) |
| TTG V9 | [en/TTG-V9.md](en/TTG-V9.md) | [zh/TTG-V9.md](zh/TTG-V9.md) |
| Tokenomics | [en/Tokenomics.md](en/Tokenomics.md) | [zh/Tokenomics.md](zh/Tokenomics.md) |
| Governance | [en/Governance.md](en/Governance.md) | [zh/Governance.md](zh/Governance.md) |
| Primary Market | [en/Primary-Market.md](en/Primary-Market.md) | [zh/Primary-Market.md](zh/Primary-Market.md) |
| ProjectPool | [en/ProjectPool.md](en/ProjectPool.md) | [zh/ProjectPool.md](zh/ProjectPool.md) |
| CountryFeeRouter | [en/CountryFeeRouter.md](en/CountryFeeRouter.md) | [zh/CountryFeeRouter.md](zh/CountryFeeRouter.md) |
| Role Stake | [en/Role-Stake.md](en/Role-Stake.md) | [zh/Role-Stake.md](zh/Role-Stake.md) |
| Security | [en/Security.md](en/Security.md) | [zh/Security.md](zh/Security.md) |
| Mainnet Deployments | [en/Mainnet-Deployments.md](en/Mainnet-Deployments.md) | [zh/Mainnet-Deployments.md](zh/Mainnet-Deployments.md) |
| Contract Registry (ACTIVE) | [en/Contract-Registry.md](en/Contract-Registry.md) | [zh/Contract-Registry.md](zh/Contract-Registry.md) |
| Verification | [en/Verification.md](en/Verification.md) | [zh/Verification.md](zh/Verification.md) |
| Legacy Policy | [en/Legacy-Policy.md](en/Legacy-Policy.md) | [zh/Legacy-Policy.md](zh/Legacy-Policy.md) |
| Whitepaper | [en/Whitepaper.md](en/Whitepaper.md) | [zh/Whitepaper.md](zh/Whitepaper.md) |

## Meta

| Doc | Path |
|-----|------|
| License | [LICENSE.md](LICENSE.md) → root [LICENSE](../../LICENSE) |
| Contributing (public) | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Security disclosure | [SECURITY.md](SECURITY.md) · root [SECURITY.md](../../SECURITY.md) |
| Official contact email | `traveltrust.ir@gmail.com` · [TT-OFFICIAL-CONTACT-EMAIL-POLICY-LATEST](../runbook/TT-OFFICIAL-CONTACT-EMAIL-POLICY-LATEST.md) · system mail: `noreply@web3-ttg.com` (Resend) |

---

## Hard rules (public surface)

1. Facts derive **only** from Documentation Truth Baseline + Design Lock DL_R1 + Mainnet Edition Whitepaper.  
2. Mainnet contracts: disclose Phase1 addresses accurately with status **`DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING`** — never claim Fully Active.  
3. ACTIVE Contract Registry = **NEW + KEEP only**. V8 / Remint / R2_FINAL / Safe / old P4Cap = **LEGACY** (Legacy Policy page only).  
4. No secrets, private keys, `.env`, deploy credentials, internal evidence packs, or PII in this tree.  
5. Do **not** mutate DL_R1 sources, bytecode, Phase1 addresses, or live chain params for GitHub cosmetics.  
6. `TT_PRODUCTION_GO` remains **NO_GO** until independent Owner written GO.
