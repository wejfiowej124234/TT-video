# Mainnet Address Planning v1 (P3-03)

**Planning ID:** `MAINNET_ADDRESS_PLANNING_V1`  
**Entry item:** P3-03  
**Date:** 2026-07-09  
**Gate:** `MAINNET_ADDRESS_PLANNING_READY = PASS`  
**Machine SSOT:** [`registry/mainnet-address-registry.v1.yaml`](../../../registry/mainnet-address-registry.v1.yaml)

---

## Purpose

Establish the **planning SSOT** for future Ethereum mainnet deployment — answering before broadcast:

- Where will each critical contract live?
- Who controls each address?
- How do upgrades work?
- How will we verify correctness?

**P3-03 is not mainnet deployment.** All TravelTrust-deployed mainnet slots are **`TBD`** until broadcast evidence (P3-04+) fills them.

```
Phase②.5 Hardening     CLOSED
P3-01 Baseline         FROZEN
P3-02 Runtime Evidence PASS
        ↓
P3-03 Address Planning (this doc)  ← planning SSOT
        ↓
P3-04 Deployment Plan              ← next
```

---

## 1 · Mainnet Address Registry

**Machine-readable SSOT:** `registry/mainnet-address-registry.v1.yaml`

| Field | Value |
|-------|-------|
| Network | `ethereum_mainnet` · chain_id `1` |
| Deploy status | `NOT_STARTED` |
| Broadcast authorized | `false` |
| Verdict | `MAINNET_ADDRESS_PLANNING_READY: PASS` |

Every TravelTrust contract slot uses `address_status: TBD` or `PLANNED` — **no placeholder mainnet addresses**.

**Sepolia lineage** (GovFreeze V2 + Vacancy V1 DE) is recorded only under `sepolia_lineage_reference` for planning traceability. **RULE-DEPLOY-001** forbids copying Sepolia addresses to mainnet ([`registry/mainnet-deployment-package.v1.yaml`](../../../registry/mainnet-deployment-package.v1.yaml)).

---

## 2 · Address classification

| Category | Examples | Upgrade surface |
|----------|----------|-----------------|
| **Governance controlled** | Governor, Timelock, Treasury P4Cap, Primary Market, Seat Registry, Stake Pool, FeeRouter | Proxy (`upgradeTo`) or Timelock `owner` |
| **Immutable / Deployment** | CountryPoolNetProfitLedger, StewardPathVault, UnallocatedStewardPathVault | **Forbidden** (G23-04 ABI freeze) |
| **Operational** | Timelock admin multisig, deployer EOA, indexer, relayer, monitoring | N/A — wallet/key custody |
| **User-facing** | EscrowFactoryV2, Escrow instances | Factory guardian → Timelock; instances immutable per order |
| **External reference** | USDC (`0xA0b8…eB48`) | Third-party — not TravelTrust deploy |
| **Forbidden mainnet** | EscrowFactory V1 | Policy: [`registry/escrow-bilateral-mainnet-policy.v1.yaml`](../../../registry/escrow-bilateral-mainnet-policy.v1.yaml) |

### 2.1 Governance stack (planned slots)

| Contract | Posture | Mainnet proxy | Mainnet impl | Env key |
|----------|---------|---------------|--------------|---------|
| GovernanceVotesToken | PARAMETER_OWNER | — | TBD | `GOVERNANCE_TOKEN_ADDRESS` |
| GovernanceTimelock | CONTROLLER | TBD (controller) | — | `TIMELOCK_ADDRESS` |
| TravelTrustGovernor | PROXY_REQUIRED | TBD | TBD | `GOVERNOR_ADDRESS` |
| GovernanceTreasuryP4Cap | PROXY_REQUIRED | TBD | TBD | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` |
| TtgPrimaryMarketV1 | PROXY_REQUIRED | TBD | TBD | `PRIMARY_MARKET_ADDRESS` |
| TtgSeatConcentrationRegistry | PROXY_REQUIRED | TBD | TBD | `SEAT_REGISTRY_ADDRESS` |
| RegionStewardStakePool | PROXY_REQUIRED | TBD | TBD | `REGION_STEWARD_STAKE_POOL_ADDRESS` |

Posture matrix SSOT: [`registry/g24-p-upgrade-01-contract-posture.v1.yaml`](../../../registry/g24-p-upgrade-01-contract-posture.v1.yaml) · [`G24-P-UPGRADE-01-proxy-architecture-gate.md`](./G24-P-UPGRADE-01-proxy-architecture-gate.md)

### 2.2 Vacancy / Country Pool (immutable core · per jurisdiction)

Pilot jurisdiction on Sepolia: **DE**. Mainnet rolls out **per jurisdiction** with fresh immutable instances.

| Contract | Posture | Mainnet address | Env key |
|----------|---------|-----------------|---------|
| CountryPoolNetProfitLedger | IMMUTABLE_EXEMPT | TBD | `COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS` |
| StewardPathVault | IMMUTABLE_EXEMPT | TBD | `COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS` |
| UnallocatedStewardPathVault | IMMUTABLE_EXEMPT | TBD | `UNALLOCATED_STEWARD_PATH_VAULT_ADDRESS` |

Sepolia V1 runtime validated under P3-02 — mainnet instances are **new deploys**, not address copies.

### 2.3 Escrow (user-facing · mainnet path)

| Contract | Mainnet | Notes |
|----------|---------|-------|
| EscrowFactory V1 | **FORBIDDEN** | Testnet legacy only |
| EscrowFactoryV2 | **REQUIRED · TBD** | Bilateral Confirmation Model · deferred ABI-002 → P3-04 |
| Escrow instances | Per-order deploy | Created by FactoryV2 |

Policy: [`registry/escrow-bilateral-mainnet-policy.v1.yaml`](../../../registry/escrow-bilateral-mainnet-policy.v1.yaml)

### 2.4 Operational wallets (planned · not created in P3-03)

| Role | Planned holder | Created in |
|------|----------------|------------|
| `TIMELOCK_ADMIN_ADDRESS` | Gnosis Safe multisig | P3-06 ops runbook |
| Broadcast deployer EOA | Ephemeral · ownership renounced | Deploy wave |
| Indexer funding wallet | Ops custody | P3-06 |
| Relayer wallet | Ops custody | P3-06 |
| Monitoring wallet | Ops custody | P3-06 |

---

## 3 · Permission model

```
TIMELOCK_ADMIN (multisig · TBD)
        │
        │ schedule / cancel / execute (admin ops)
        ▼
GovernanceTimelock (TBD)
        │
        ├── proxy.admin → upgradeTo (Governor, Treasury, Market, Seat, StakePool)
        ├── FeeRouter.owner → setRoutingConfig · setDistributePaused
        ├── EscrowFactoryV2.guardian → transferGuardianship
        └── immutable.owner → jurisdiction config (ledger/vault triplet)
        │
        ▼
TravelTrustGovernor (TBD)
        │
        └── propose → vote → queue → execute (via Timelock delay)
                │
                ▼
           TTG holders / delegates
```

### Emergency scope (narrow)

| Role | Actor | Scope | Not allowed |
|------|-------|-------|-------------|
| Fee pause | `FeeRouter.owner` (= Timelock) | `distributePaused = true` | Withdraw funds · upgrade logic |
| Factory guardian | `EscrowFactoryV2.guardian` (= Timelock) | Guardianship transfer · factory admin | Release user escrow funds |

**Forbidden:** deployer EOA retaining proxy admin; bare implementation as user-facing address; Escrow V1 on mainnet.

Control plane env resolution: `contracts/script/Phase2ControlPlane.sol` (same semantics on mainnet with mainnet env).

---

## 4 · Upgrade plan

| Item | Planned value |
|------|---------------|
| Proxy pattern | `TimelockUpgradeableProxy` |
| Upgrade authority | `GovernanceTimelock` |
| Upgrade path | Governor proposal → 48h Timelock delay → `upgradeTo` |
| Timelock itself | **Non-upgradeable** — fresh deploy only if controller replacement needed |
| Immutable exempt | Ledger + both vaults — **no proxy** |

Governable shells (must be proxy on mainnet):

1. TravelTrustGovernor  
2. GovernanceTreasuryP4Cap  
3. TtgPrimaryMarketV1  
4. TtgSeatConcentrationRegistry  
5. RegionStewardStakePool  

FeeRouter: **owner-configurable** routing (not implementation swap) — owner = Timelock.

Tokenomics parameters: frozen per [`TTG-TOKENOMICS-FREEZE-V1.md`](./TTG-TOKENOMICS-FREEZE-V1.md) — P3-03 does not reopen allocation.

---

## 5 · Deployment sequence (planning)

Execution belongs to **P3-04+** and **`registry/mainnet-deployment-package.v1.yaml`** generator — this section records the intended order only.

| Step | Action | Status |
|------|--------|--------|
| 1 | Deploy implementations | NOT_STARTED |
| 2 | Deploy proxies (`TimelockUpgradeableProxy`) | NOT_STARTED |
| 3 | Initialize proxy storage + tokenomics params | NOT_STARTED |
| 4 | Transfer ownership / proxy admin → Timelock | NOT_STARTED |
| 5 | Configure roles (FeeRouter, jurisdictions, EscrowFactoryV2 guardian) | NOT_STARTED |
| 6 | Verify (explorer, bytecode hashes, `cast admin/implementation`) | NOT_STARTED |
| 7 | Enable production (registry, env, API `/meta`, indexer) | NOT_STARTED |

**Step 7 blockers (unchanged):** P3-04..P3-08 · `WEB3_FREEZE_PASS` · Owner mainnet cutover authorization.

---

## 6 · What P3-03 explicitly does NOT do

| Action | Phase |
|--------|-------|
| Deploy mainnet contracts | P3-04+ |
| Purchase gas | P3-06 |
| Create real multisig | P3-06 |
| Change contract source | Change Request |
| Change tokenomics | Frozen — v2 cycle only |

---

## 7 · P3-03 exit criteria

P3-03 is **COMPLETE** when:

1. This doc + `registry/mainnet-address-registry.v1.yaml` exist and cross-reference.
2. All TravelTrust mainnet deploy slots are `TBD` / `PLANNED` / `FORBIDDEN` — no fake addresses.
3. Permission model + upgrade plan + deployment sequence documented.
4. `bash scripts/gates/check-mainnet-address-planning-gate.sh` → `MAINNET_ADDRESS_PLANNING_READY: PASS`.
5. Closeout archived: `evidence/phase3-production-entry-baseline/P3-03-MAINNET-ADDRESS-PLANNING-CLOSEOUT.md`.

**Next:** P3-04 Escrow V2 mainnet prep (`ABI-002` → planned deploy script readiness).

---

## Related

- P3-01 baseline: [`PHASE3-PRODUCTION-ENTRY-BASELINE-v1.md`](./PHASE3-PRODUCTION-ENTRY-BASELINE-v1.md)
- P3-02 evidence: [`evidence/phase3-production-entry-baseline/P3-02-CLOSEOUT.md`](./evidence/phase3-production-entry-baseline/P3-02-CLOSEOUT.md)
- Web3 master map: [`registry/web3-system-master-map.v1.yaml`](../../../registry/web3-system-master-map.v1.yaml)
- Deployment package (post-freeze): [`registry/mainnet-deployment-package.v1.yaml`](../../../registry/mainnet-deployment-package.v1.yaml)
