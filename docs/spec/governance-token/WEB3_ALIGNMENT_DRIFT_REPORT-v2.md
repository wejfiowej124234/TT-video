# WEB3 Alignment Drift Report v2

**Audit ID:** `WEB3_FULL_ALIGNMENT_AUDIT_V2`  
**SSOT:** `registry/web3-final-alignment-matrix.v2.yaml`  
**Gate:** `bash scripts/gates/check-web3-full-alignment-gate.sh`

---

## Summary

| Severity | Open | Resolved (W7 / Phase② / PR-1 / PR-2) |
|----------|-----:|--------------------------------------|
| CRITICAL | 0 | — |
| HIGH | 0 | ABI-001 · API-001..003 · W3-AUDIT-005 · W7-CLEANUP-01..03 |
| MEDIUM | 1 | DEP-001 (PR-2) |
| LOW | 0 | ABI-003 · DOC-001 (PR-2) |
| INFO | 2 | TOKEN-001 PASS · GOV-001 documented |

**Gate at Phase②.5 PR-2 exit:** `WEB3_FULL_ALIGNMENT_GATE: PASS` · only ABI-002 (Escrow V2) deferred

---

## Drift register

| ID | Sev | Domain | Status | Issue |
|----|-----|--------|--------|-------|
| **ABI-001** | HIGH | B | **RESOLVED** (PR-1) | Vacancy V1 ABI re-exported — `vacancyLedger()` 4-field + V1 views |
| **ABI-002** | MED | B | OPEN | `EscrowV2.sol` — no checked-in ABI (FUTURE_MAINNET_REQUIRED) |
| **ABI-003** | LOW | B | **RESOLVED** (PR-2) | Legacy balance audit gate — 4-tuple `vacancyLedger` cast |
| **API-001** | HIGH | D | **RESOLVED** (PR-1) | `chain/mod.rs` — P4Cap-only treasury source |
| **API-002** | HIGH | D | **RESOLVED** (PR-1) | `governance_pool.rs` — uses `ChainConfig.treasury_address` |
| **API-003** | HIGH | D | **RESOLVED** (PR-1) | Fundstack verify — P4Cap vs `LEGACY_TREASURY_ADDRESS` explicit |
| **DEP-001** | MED | C | **RESOLVED** (PR-2) | Env catalog v2 SSOT + `check-web3-env-catalog-gate.sh` |
| **DOC-001** | LOW | J | **RESOLVED** (PR-2) | Operator guide + master map / spine treasury key alignment |
| **GOV-001** | INFO | H | DOCUMENTED | Dual timelock history — intentional post-W7 |
| **TOKEN-001** | INFO | F | PASS | TTG 10M aligned — SSOT · frontend · tests |

---

## Domain A · Contract inventory v2 (baseline)

| Metric | Count |
|--------|------:|
| `contracts/src/*.sol` | 45 |
| `contracts/script/*.sol` | 25 |
| `contracts/abi/*.json` | 30 |
| Vacancy V1 Sepolia ACTIVE triplet | 3 |

**Active Vacancy V1 (Sepolia DE)**

| Contract | Address | Status |
|----------|---------|--------|
| CountryPoolNetProfitLedger | `0x738D2c133d5F90c13eE9907386136471E1f330f5` | ACTIVE |
| StewardPathVault | `0xaB6c15Ebcae78606E0AE5663d831E09e05af32FA` | ACTIVE |
| UnallocatedStewardPathVault | `0xb7d0Ea9579F80B2090195d49a44941d5546554E9` | ACTIVE |
| Owner | V2 Timelock `0x904a6c4c6aab698afbf08ec6151d317c393520cc` | ACTIVE |

**Legacy Q-F01** — `LEGACY_READ_ONLY` · retained for audit trail only.

Per-contract rows (Purpose · Proxy · Codehash · Owner) — refresh via deployment truth gate + on-chain `cast` during Phase②.5.

---

## Remediation priority (Phase②.5)

1. **P0** — ABI-001 re-export Vacancy V1 ABIs  
2. **P1** — API-001..003 treasury key unification  
3. **P2** — DEP-001 env catalog · DOC-001 runbook refresh  
4. **P3** — ABI-003 legacy gate cast cleanup  

**Not blockers:** ABI-002 (Escrow V2 mainnet wave) · GOV-001 (documented dual timelock)

---

## Excluded from FAIL

| Item | Reason |
|------|--------|
| EscrowFactory V2 absent on Sepolia | `FUTURE_MAINNET_REQUIRED` by design |
| Vacancy runtime | **PASS** — W7 complete |
| TTG supply | **PASS** — 10M aligned |

## Latest gate run

**Generated:** 2026-07-09T07:07:14Z
**Result:** `WEB3_FULL_ALIGNMENT_GATE: WARN`

| Severity | Open (this run) |
|----------|-----------------|
| CRITICAL | 0 |
| HIGH | 4 |
| MEDIUM | 1 |
| LOW | 1 |

### Automated findings

- [HIGH] ABI-001: UnallocatedStewardPathVault.json missing vacancyLedger() — stale Q-F01 ABI
- [MEDIUM] ABI-002: EscrowV2.sol without checked-in ABI (FUTURE_MAINNET_REQUIRED)
- [LOW] ABI-003: legacy balance audit gate uses stale 5-tuple vacancyLedger cast
- [HIGH] API-001: chain/mod.rs treasury fallback chain includes REGION_VAULT / TREASURY_ADDRESS
- [HIGH] API-002: governance_pool.rs reads GOVERNANCE_TREASURY_ADDRESS
- [HIGH] API-003: fundstack verify uses deprecated treasury env keys

## Latest gate run

**Generated:** 2026-07-09T07:23:17Z
**Result:** `WEB3_FULL_ALIGNMENT_GATE: WARN`

| Severity | Open (this run) |
|----------|-----------------|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 1 |
| LOW | 1 |

### Automated findings

- [MEDIUM] ABI-002: EscrowV2.sol without checked-in ABI (FUTURE_MAINNET_REQUIRED)
- [LOW] ABI-003: legacy balance audit gate uses stale 5-tuple vacancyLedger cast
- [HIGH] API-003: fundstack verify uses deprecated treasury env keys

## Latest gate run

**Generated:** 2026-07-09T07:26:21Z
**Result:** `WEB3_FULL_ALIGNMENT_GATE: WARN`

| Severity | Open (this run) |
|----------|-----------------|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 1 |
| LOW | 1 |

### Automated findings

- [MEDIUM] ABI-002: EscrowV2.sol without checked-in ABI (FUTURE_MAINNET_REQUIRED)
- [LOW] ABI-003: legacy balance audit gate uses stale 5-tuple vacancyLedger cast
- [HIGH] API-003: fundstack verify uses deprecated treasury env keys

## Latest gate run

**Generated:** 2026-07-09T07:29:20Z
**Result:** `WEB3_FULL_ALIGNMENT_GATE: PASS`

| Severity | Open (this run) |
|----------|-----------------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 1 |

### Automated findings

- [MEDIUM] ABI-002: EscrowV2.sol without checked-in ABI (FUTURE_MAINNET_REQUIRED)
- [LOW] ABI-003: legacy balance audit gate uses stale 5-tuple vacancyLedger cast

## Latest gate run

**Generated:** 2026-07-09T07:43:13Z
**Result:** `WEB3_FULL_ALIGNMENT_GATE: PASS`

| Severity | Open (this run) |
|----------|-----------------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 0 |

### Automated findings

- [MEDIUM] ABI-002: EscrowV2.sol without checked-in ABI (FUTURE_MAINNET_REQUIRED)

## Latest gate run

**Generated:** 2026-07-09T08:08:16Z
**Result:** `WEB3_FULL_ALIGNMENT_GATE: PASS`

| Severity | Open (this run) |
|----------|-----------------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 0 |

### Automated findings

- [MEDIUM] ABI-002: EscrowV2.sol without checked-in ABI (FUTURE_MAINNET_REQUIRED)

## Latest gate run

**Generated:** 2026-07-09T08:12:01Z
**Result:** `WEB3_FULL_ALIGNMENT_GATE: PASS`

| Severity | Open (this run) |
|----------|-----------------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 0 |

### Automated findings

- [MEDIUM] ABI-002: EscrowV2.sol without checked-in ABI (FUTURE_MAINNET_REQUIRED)

## Latest gate run

**Generated:** 2026-07-09T14:18:53Z
**Result:** `WEB3_FULL_ALIGNMENT_GATE: PASS`

| Severity | Open (this run) |
|----------|-----------------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 0 |


## Latest gate run

**Generated:** 2026-07-10T00:04:00Z
**Result:** `WEB3_FULL_ALIGNMENT_GATE: PASS`

| Severity | Open (this run) |
|----------|-----------------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 0 |


## Latest gate run

**Generated:** 2026-07-10T00:06:26Z
**Result:** `WEB3_FULL_ALIGNMENT_GATE: PASS`

| Severity | Open (this run) |
|----------|-----------------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 0 |

