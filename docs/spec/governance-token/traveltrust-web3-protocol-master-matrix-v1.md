# TravelTrust Web3 Protocol Master Matrix v1

**Matrix ID:** `WEB3_PROTOCOL_MASTER_MATRIX_V1`  
**Version:** 1.0.0  
**Effective:** 2026-07-09  
**Phase:** ② Sepolia ACTIVE · ③ Mainnet gated  
**Machine mirror:** [traveltrust-web3-protocol-master-matrix.v1.yaml](../../../registry/traveltrust-web3-protocol-master-matrix.v1.yaml)

---

## 0. Purpose

Enterprise **Web3 operations ledger** — not a feature spec. Answers:

- What is deployed, where, under which admin?
- Which SSOT owns numbers vs addresses?
- What is PASS vs PARTIAL vs PLANNED?
- Where is drift?

**Discipline:** Protocol development (Solidity) is **separate** from protocol operationalization (SSOT · Registry · Indexer · Dashboard).  
**Vacancy Ledger V1** is the reference module for this split.

---

## 1. SSOT hierarchy

| Priority | Domain | Write SSOT | Machine |
|----------|--------|------------|---------|
| P0 | Protocol numerics | `protocol-ssot.v1.md` | `protocol-ssot.v1.yaml` |
| P0 | Web3 version | **`WEB3_PROTOCOL_VERSION`** = yaml `version` | `registry/protocol-convergence-deployments.v1.yaml` |
| P1 | Deploy addresses | `gov_freeze_v2_clean_baseline` | `protocol-convergence-deployments.v1.yaml` |
| P1 | Proxy posture | G24-P-UPGRADE-01 | `g24-p-upgrade-01-contract-posture.v1.yaml` |
| P1 | Module readiness | M01–M14 | `web3-system-master-map.v1.yaml` |
| P2 | MTM tier counts | **`docs/master/MTM-COUNT-SSOT.md`** | `ttg-governance-mtm-counts.v1.yaml` |
| P2 | Vacancy indexer | event post-state only | `vacancy-ledger-indexer-schema-v1.json` |

**Revision rule:** bump `protocol-ssot` version → sync yaml sha256 → sync API/FE `PROTOCOL_SSOT_VERSION` → run `check-protocol-ssot-convergence.sh` + `check-web3-protocol-master-matrix-gate.sh`.

---

## 2. Layer readiness

| Layer | Core | ② Sepolia | Status |
|-------|------|-----------|--------|
| **Token** | `GovernanceVotesToken` | `0x2837ea0c…` | **PASS** · immutable |
| **Governance** | Governor · Timelock · Seat · PM | V2 proxy baseline | **PASS** |
| **Treasury** | P4Cap proxy | `0xc1de17cd…` | **IN_PROGRESS** · Cert #8 |
| **Payment** | EscrowFactory V1 · FeeRouter | Fund stack | **PASS** · V2 pending |
| **Staking** | Guide · Provider · Steward | Fund stack + proxy | **IN_PROGRESS** |
| **Settlement** | D-4555-B triplet | **DE pilot only** | **PARTIAL** |
| **Vacancy** | Ledger V1 | S1–S3 ✅ · S4a | **PROTOCOL COMPLETE** |
| **Indexer** | tick + projections | Vacancy S4a | **IN_PROGRESS** |
| **Dashboard** | read-only | S4b planned | **PLANNED** |

---

## 3. Token layer

| Module | Contract | Supply / params | Status |
|--------|----------|-----------------|--------|
| TTG | `GovernanceVotesToken` | 10M · 18 dec | deployed · verified |
| Allocation | SSOT §1 | 25/20/15/15/5/20 bps | **SSOT** |
| Public sale cap | GOV-04 | 25k TTG/wallet | frozen |

---

## 4. Governance layer

```
TTG Holder → Governor.propose → castVote → queue → Timelock (48h) → execute
```

| Module | Contract | Proxy | Sepolia | Status |
|--------|----------|-------|---------|--------|
| Governor | `TravelTrustGovernor` | Yes | `0x847b00dd…` | deployed |
| Timelock | `GovernanceTimelock` | No | `0x904a6c4c…` | controller |
| Treasury P4Cap | `GovernanceTreasuryP4Cap` | Yes | `0xc1de17cd…` | deployed |
| Primary Market | `TtgPrimaryMarketV1` | Yes | `0x7af15f98…` | UI defer |
| Seat Registry | `TtgSeatConcentrationRegistry` | Yes | `0xc99776e9…` | deployed |

**Params (GOV-02):** quorum 400 bps · approval 5000 bps · delay 48h immutable.

---

## 5. Treasury layer

| Treasury | Role | Address env | Status |
|----------|------|-------------|--------|
| **Governance P4Cap (ACTIVE)** | DAO spend · GOV-01 cap | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` | **ACTIVE** |
| **Legacy FundStack Treasury** | FeeRouter globalOps leg | `LEGACY_TREASURY_ADDRESS` | **deprecated** · still on-chain |
| **Jurisdiction Reserve** | Vacancy reserve · DAO disburse | vault `reserve` | S3c ✅ |
| **Global Reserve Vault** | FeeRouter 20% leg | `RESERVE_VAULT_ADDRESS` | deployed |

**P0 resolved naming:** Do **not** use bare `TREASURY_ADDRESS=` without documenting which treasury. See registry `treasury_semantics`.

---

## 6. Payment layer

```
Traveler USDC → EscrowFactory → Escrow → FeeRouter → RegionVault / global legs
```

| Module | Sepolia | Mainnet path | Status |
|--------|---------|--------------|--------|
| EscrowFactory V1 | `0xbf746B6a…` | forbidden | ACTIVE ② |
| EscrowFactory V2 | PENDING | REQUIRED | code ready |
| FeeRouter | `0x81A80092…` | — | deployed |

---

## 7. Pool layer

| Pool | Contract | Proxy | Status |
|------|----------|-------|--------|
| Guide stake | `GuideIdentityStakingPool` | No | deployed |
| Provider stake | `ProviderIdentityStakingPool` | No | deployed |
| Steward stake | `RegionStewardStakePool` | Yes | deployed |
| Net profit ledger | `CountryPoolNetProfitLedger` | **immutable** | DE |
| Steward path vault | `StewardPathVault` | **immutable** | DE |
| Vacancy vault | `UnallocatedStewardPathVault` | **immutable** | DE · S3 ✅ |

---

## 8. Settlement & Vacancy

### D-4555-B (DE pilot)

| Capability | Status |
|------------|--------|
| Epoch · splitNetProfit | IMPLEMENTED · tested |
| Steward qualification | IMPLEMENTED |
| Governance payloads | ABI frozen |

### Vacancy Ledger V1

| Sprint | Status |
|--------|--------|
| S1 Core | ✅ COMPLETE |
| S2 Invariant | ✅ COMPLETE |
| S3a Settlement | ✅ COMPLETE |
| S3b Epoch Gate | ✅ COMPLETE |
| S3c Reserve DAO | ✅ COMPLETE |
| S4a Indexer | ✅ COMPLETE (W3) |
| S4b Dashboard | PLANNED (W4) |

**Gate:** `VACANCY_LEDGER_V1_PROTOCOL_COMPLETE` — protocol done **without** Dashboard.

**Runtime status:** `VACANCY_DEPLOYMENT_READINESS` — separates protocol PASS from Sepolia DE runtime **PENDING** (Q-F01 legacy). SSOT: `registry/vacancy-v1-runtime-deployment-status.v1.yaml`.

**Indexer discipline:** event post-state only — never `reserve = principal - swept - disbursed`.

---

## 9. Upgrade matrix

| Surface | Posture | Upgrade admin |
|---------|---------|---------------|
| Governor | PROXY_REQUIRED | Timelock |
| Treasury P4Cap | PROXY_REQUIRED | Timelock |
| Primary Market | PROXY_REQUIRED | Timelock |
| Seat Registry | PROXY_REQUIRED | Timelock |
| Steward Pool | PROXY_REQUIRED | Timelock |
| Timelock | CONTROLLER | fresh deploy only |
| Net profit / vacancy vaults | IMMUTABLE_EXEMPT | forbidden |

Implementation addresses: registry `proxy_implementations` (populate via on-chain EIP-1967 read).

---

## 10. Permission matrix (summary)

| Operation | User | Timelock | Auto |
|-----------|------|----------|------|
| Proxy upgrade | ❌ | ✅ | ❌ |
| Vote | ✅ | ❌ | ❌ |
| splitNetProfit | ❌ | ✅ | ❌ |
| Vacancy sweep | ❌ | ❌ | ✅ (settlement chain) |
| Reserve disburse | ❌ | ✅ | ❌ |

---

## 11. Frontend / API mapping

| Route | API | Chain module |
|-------|-----|--------------|
| `/governance/params` | `protocol-reference` | doc SSOT |
| `/governance/proposals` | proposals + wallet | Governor |
| `/governance/vacancy-ledger` | TBD S4b | indexer snapshot |
| `/admin/vacancy-ledger/:j` | `GET /admin/vacancy-ledger/:j` | indexer |
| `/pay` · `/escrow` | orders + wallet | EscrowFactory |
| `/staking` | stake API | identity pools |

---

## 12. Evidence & gates

| Gate | Script | Scope |
|------|--------|-------|
| Vacancy protocol | `vacancy-ledger-v1-protocol-complete-gate.sh` | S1–S3 |
| SSOT convergence | `check-protocol-ssot-convergence.sh` | version parity |
| Web3 matrix | `check-web3-protocol-master-matrix-gate.sh` | registry + matrix |
| G24 proxy | `check-g24-p-upgrade-01-proxy-architecture.sh` | posture |

---

## 13. Risk register (condensed)

| Pri | Issue | Resolution |
|-----|-------|------------|
| P0 | SSOT version drift | **W1** — registry + API/FE 1.0.3 |
| P0 | Treasury dual address | **W1** — explicit env keys |
| P0 | MTM count drift | **W1** — `MTM-COUNT-SSOT.md` |
| P1 | DE triplet not in registry | **W2** — baseline block |
| P1 | Proxy impl not registered | **W2** — `proxy_implementations` |
| P2 | Escrow V2 pending | broadcast when gated |
| P2 | S4a reconcile | **W3** |
| P3 | S4b Dashboard | **W4** · governance view first |

---

## 14. Sprint map (agreed)

| Sprint | Focus |
|--------|-------|
| **W1** | Master Matrix + P0 SSOT/treasury/MTM | **COMPLETE** |
| **W2** | Registry · proxy impl · env truth gate | **COMPLETE** |
| **W3** | S4a reconcile · event tests · health | **NEXT** |
| **W4** | S4b `/governance/vacancy-ledger` | PLANNED |

**W2 gate:** `bash scripts/gates/check-web3-deployment-truth-gate.sh` → `WEB3_REGISTRY_CONVERGENCE: PASS`  
**Report:** [WEB3-DEPLOYMENT-TRUTH-GATE-REPORT-v1.md](WEB3-DEPLOYMENT-TRUTH-GATE-REPORT-v1.md)

---

## Changelog

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-09 | Initial enterprise ops ledger · W1 |
