# TravelTrust Web3 Protocol Drift Report v1

**Drift ID:** `WEB3_PROTOCOL_DRIFT_V1`  
**Parent audit:** [traveltrust-web3-protocol-master-audit-report-v1.md](./traveltrust-web3-protocol-master-audit-report-v1.md)  
**Sprint:** W5 · read-only · generated 2026-07-09  
**Machine index:** `registry/traveltrust-web3-protocol-master-matrix.v1.yaml` → `drift_issues`

---

## Drift taxonomy

| Type | Description |
|------|-------------|
| **Address drift** | Registry vs env vs `/meta` disagree |
| **Version drift** | Repo protocol ≠ chain bytecode generation |
| **Permission drift** | Owner/admin/env keys point at wrong role |
| **Tokenomics drift** | Doc vs contract vs FE constants |
| **Treasury duplicate definition** | Multiple env keys for same semantic role |
| **Settlement duplicate ledger** | Two writers for same jurisdiction balance |

---

## Runtime drift (protocol ≠ chain)

| Module | Repo protocol | Chain runtime | Three-status | Issue |
|--------|---------------|---------------|--------------|-------|
| Country Pool DE stack | D-4555-B + Vacancy V1 | Q-F01 legacy | P/C/V: COMPLETE / VERIFIED / **LEGACY** | W3-AUDIT-005 |
| Vacancy Ledger | V1 (PCM complete) | Q-F01 (no V1 view selectors) | COMPLETE / DEPLOYED / **LEGACY** | W3-AUDIT-005 |
| Escrow | V2 required mainnet | V1 only on Sepolia | COMPLETE / V1 VERIFIED / V2 **NOT_DEPLOYED** | W3-AUDIT-007 |

**Conclusion:** Vacancy is the **clearest** runtime drift; Country Pool DE shares the **same** Q-F01 stack. Governance V2 proxies are **aligned** (no runtime drift on gov stack).

---

## Treasury duplicate-definition drift

| Era | Key | Semantic | Sepolia address | Status |
|-----|-----|----------|-----------------|--------|
| Legacy | `TREASURY_ADDRESS` | Ambiguous | — | **DEPRECATED** |
| W2 active | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` | DAO P4Cap | `0xc1de17cd…` | **ACTIVE** |
| W2 legacy leg | `LEGACY_TREASURY_ADDRESS` | FeeRouter 15% | `0x6a8323fb…` | **LEGACY** |
| Uncatalogued | `GOVERNANCE_TREASURY_ADDRESS` | Intended P4Cap? | unset in phase2 env | **DRIFT** |

**On-chain fund flow:** No evidence both treasuries receive the **same** payment rail. **Off-chain:** API and scripts still reference deprecated keys.

---

## Full issue register

| Issue ID | Severity | Type | Location | Current | Expected | Action (W6+) |
|----------|----------|------|----------|---------|----------|--------------|
| W3-AUDIT-001 | HIGH | Treasury / address | `crates/api/src/chain/mod.rs` | `treasury_address` → `REGION_VAULT_ADDRESS` fallback | P4Cap only | Fix API `/meta` resolution |
| W3-AUDIT-002 | HIGH | Treasury duplicate key | `governance_pool.rs` | `GOVERNANCE_TREASURY_ADDRESS` | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` | Alias or migrate |
| W3-AUDIT-003 | HIGH | Treasury duplicate key | `phase2-sepolia-fundstack-verify-bindings.sh` | `TREASURY_ADDRESS` for globalOps | `LEGACY_TREASURY_ADDRESS` | Fix verify script |
| W3-AUDIT-004 | MEDIUM | Version (doc) | `traveltrust-web3-protocol-master-matrix-v1.md` | W3 NEXT · dashboard PLANNED | Match YAML W4 complete | Refresh human matrix |
| W3-AUDIT-005 | MEDIUM | Version (runtime) | DE Unallocated Vault | Q-F01 bytecode | Vacancy V1 selectors | W7 deploy/migrate |
| W3-AUDIT-006 | MEDIUM | Version (matrix) | `layers.vacancy` in old matrix reads | S4b PLANNED | S4b COMPLETE | Synced in audit YAML |
| W3-AUDIT-007 | MEDIUM | Deployment | `escrow_factory_v2_address` | null | Sepolia + mainnet address | W7 broadcast V2 |
| W3-AUDIT-008 | MEDIUM | Permission | DE settlement owner | legacy Timelock `0x0359d4fB…` | W6 documents V2 vs legacy split | Runbook in W6 |
| W3-AUDIT-009 | MEDIUM | Address alias | `chain/mod.rs` ledger alias | `COUNTRY_POOL_LEDGER_ADDRESS` → net-profit | Separate pilot vs net-profit keys | Env cleanup |
| W3-AUDIT-010 | MEDIUM | Address | prod API env | missing `SETTLEMENT_TOKEN` | `0x241948bE…` | Add to env templates |
| W3-AUDIT-011 | LOW | Tokenomics | `governanceParamsTokenomicsModel.ts` | doc version 1.0.2 | 1.0.3 | Bump string |
| W3-AUDIT-012 | LOW | Address default | `chainEnv.ts` / API | default chain 137 | 11155111 for phase2 | Dev default fix |
| W3-AUDIT-013 | LOW | Address doc | GOV-FREEZE-V2 doc | omits P4Cap in freeze table | include `0xc1de17cd…` | Doc patch |
| W3-AUDIT-014 | LOW | ABI | `contracts/abi/` | missing EscrowV2 / proxy ABI | export after deploy | Post-W7 |
| W3-AUDIT-015 | LOW | ABI | `frontend/dapp/abis/` | 11 vs 30 canonical | policy or sync | Optional |
| W3-AUDIT-016 | INFO | Build | API bin compile | ~46 errors | isolated `API_BUILD_HEALTH` | Separate gate |
| W3-AUDIT-017 | MEDIUM | Semantic | D-4555-A vs B docs | both say 45/55 | label FeeRouter vs net profit | Doc headers |
| W3-AUDIT-018 | LOW | Treasury key | env examples | `TREASURY_ADDRESS` placeholder | W2 keys | Example cleanup |
| W3-AUDIT-019 | LOW | Address | prod local env | empty `REGION_VAULT_ADDRESS` | `0x2Ea061d5…` | Fill spine |
| W3-AUDIT-020 | LOW | Address | fly prod example | empty staking provider | `0xa90cA237…` | Fill template |

---

## Settlement duplicate ledger check

| Check | Result |
|-------|--------|
| Two on-chain ledgers writing DE net profit | **None found** |
| Indexer projection vs on-chain ledger | **Complementary** (read model · event SSOT) |
| CN pilot ledger vs DE net-profit ledger | **Separate** jurisdictions/products |
| Claim contracts vs ledger | Claims **not deployed** on spine — no collision |

---

## W6 input (from drift)

Priority order for Runtime Activation Plan:

1. **DE Country Pool + Vacancy** — Q-F01 → Vacancy V1 bytecode · capability probe · live reconcile  
2. **Treasury env unification** — W3-AUDIT-001～003 before ops rely on `/meta`  
3. **EscrowFactory V2** — Sepolia broadcast · mainnet path  
4. **Dual Timelock** — document migration or owner alignment for DE triplet  
5. **Human matrix doc** — sync sprint status with machine YAML  

**W7 guard:** No item above executes on-chain until W6 plan is explicitly approved.
