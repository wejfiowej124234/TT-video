# TravelTrust Web3 Full Alignment Audit v2

**Audit ID:** `WEB3_FULL_ALIGNMENT_AUDIT_V2`  
**Timing:** Post Phase② Runtime Closeout · Vacancy V1 Sepolia ACTIVE  
**Machine SSOT:** `registry/web3-final-alignment-matrix.v2.yaml`  
**Drift register:** [WEB3_ALIGNMENT_DRIFT_REPORT-v2.md](./WEB3_ALIGNMENT_DRIFT_REPORT-v2.md)  
**Gate:** `bash scripts/gates/check-web3-full-alignment-gate.sh`

---

## 1. Why now

Prior audits were **module-scoped**:

| Prior work | Scope |
|------------|-------|
| Vacancy single-module audit | Protocol + PCM |
| W7 Runtime activation | Sepolia deploy + migrate |
| Deployment Truth (W2) | Registry ↔ chain |
| Master Matrix v1 (W5) | Module inventory + drift IDs |

**Today the stack is vertically integrated on Sepolia:**

```
Protocol COMPLETE
      ↓
Testnet Runtime ACTIVE (Vacancy V1)
      ↓
Indexer LIVE_READY
      ↓
Governance Transparency PASS
```

This is the correct moment for a **higher-layer alignment audit** — not bug hunting, but answering:

> Do protocol, contracts, chain, API, ABI, registry, frontend, and docs still describe **one system**?

---

## 2. Alignment model

```
                    SSOT (protocol-ssot.v1.yaml)
                           |
        -----------------------------------------
        |              |              |
   Contracts        Registry          Docs
        |              |              |
      ABI             API          Frontend
        |              |              |
   Deployment       Indexer         UI/UX
        |
   Runtime Chain (Sepolia)
```

**Audit domains:** A–J (contracts · ABI · deployment · API · frontend · tokenomics · treasury flow · governance permissions · settlement · documentation).

---

## 3. Executive verdict

| Track | Verdict |
|-------|---------|
| **Vacancy V1 full loop** | **PASS** — testnet maturity standard met |
| **Tokenomics (10M TTG)** | **PASS** — SSOT · frontend · tests aligned |
| **On-chain treasury sink** | **PASS** — Primary Market → P4Cap |
| **Settlement / Vacancy runtime** | **PASS** — single active ledger on Sepolia DE |
| **ABI layer** | **WARN** — stale `UnallocatedStewardPathVault.json` |
| **API / env naming** | **WARN** — W3-AUDIT-001..003 open |
| **Escrow V2 on Sepolia** | **N/A** — `FUTURE_MAINNET_REQUIRED` |

```
WEB3_FULL_ALIGNMENT_GATE: WARN   (expected at Phase②.5 entry)
```

**Interpretation:** The system is **release-engineering ready**, not **mainnet ready**. Remaining drift is **configuration governance**, not protocol incompleteness.

---

## 4. Domain findings (summary)

### A · Smart Contract inventory v2

- **70** Solidity files (45 src + 25 script)
- **30** checked-in ABIs
- Vacancy V1 triplet deployed · V2 Timelock owner verified (W7 evidence)
- Legacy Q-F01 retained `LEGACY_READ_ONLY` — intentional dual-stack

### B · ABI alignment — **HIGH drift**

| Check | Result |
|-------|--------|
| `vacancyLedger()` tuple in Solidity | 4 × `uint256` ✅ |
| Rust indexer decode | 4 × `uint256` ✅ |
| W7 orchestrator probe | 4-tuple ✅ (W7-CLEANUP-01 fixed) |
| `contracts/abi/UnallocatedStewardPathVault.json` | **Missing V1 selectors** ❌ ABI-001 |

This is the same class of issue as the W7 probe bug — but in the **checked-in ABI artifact**, not runtime code.

### C · Deployment truth

- Registry ↔ `config/jurisdiction_country_pool_net_profit.sepolia.json` ↔ phase2 env — **ACTIVE addresses aligned**
- Intentional `LEGACY_QF01_*` + `LEGACY_TREASURY_ADDRESS` — not accidental duplication
- Treasury **env key** proliferation — DEP-001 (MEDIUM)

### D · API backend — **HIGH drift**

| ID | Location | Issue |
|----|----------|-------|
| API-001 | `chain/mod.rs` | Fallback to `REGION_VAULT_ADDRESS` as treasury |
| API-002 | `governance_pool.rs` | Reads `GOVERNANCE_TREASURY_ADDRESS` |
| API-003 | fundstack verify | Deprecated `TREASURY_ADDRESS` keys |

Funds on-chain are safe; risk is **display / ops inconsistency** if env misconfigured.

### E · Frontend Web3 UX

- Governance params · Vacancy transparency — **indexer/API-first** (no direct RPC) ✅
- Treasury display follows API `/meta` — will inherit API-001 until fixed
- TTG supply UI — **10M** consistent with SSOT ✅

### F · Tokenomics — **PASS**

Four-way check: SSOT · `GovernanceVotesToken` · frontend models · governance params — **10M aligned** (TOKEN-001).

### G · Treasury flow

On-chain path verified:

```
User USDC → Primary Market / Escrow → FeeRouter → Country Pool
                                              → P4Cap (gov treasury)
```

No double-custody on active addresses. Naming drift only.

### H · Governance permissions

- V2 stack: proxy admin = V2 Timelock ✅
- Vacancy V1 triplet owner = V2 Timelock ✅
- Legacy Q-F01 timelock history — documented (GOV-001)

### I · Settlement / accounting

- Single active Country Pool + Vacancy ledger on Sepolia DE ✅
- Case B migration complete (495000 raw) ✅
- Live reconcile LIVE_V1 ✅

### J · Documentation

- PCM · W7 evidence · Phase② closeout — current ✅
- Some runbooks still map `TREASURY_ADDRESS` → legacy treasury — DOC-001 (LOW)

---

## 5. Recommended path (frozen)

```
Full Alignment Audit v2          ← YOU ARE HERE (WARN)
        ↓
Phase②.5 Web3 Hardening
  ① Treasury drift zero-out
  ② Master Matrix v2 freeze
        ↓
Phase③ Mainnet Preparation
        ↓
Mainnet Dry Run
        ↓
Production deploy
```

**Do not** continue feature development or rush mainnet until HIGH drift is cleared or explicitly accepted.

---

## 6. Artifacts

| Artifact | Path |
|----------|------|
| Human audit (this doc) | `docs/spec/governance-token/TRAVELTRUST-WEB3-FULL-ALIGNMENT-AUDIT-v2.md` |
| Machine matrix | `registry/web3-final-alignment-matrix.v2.yaml` |
| Drift report | `docs/spec/governance-token/WEB3_ALIGNMENT_DRIFT_REPORT-v2.md` |
| Gate | `scripts/gates/check-web3-full-alignment-gate.sh` |
| Phase②.5 plan | `docs/spec/governance-token/PHASE2.5-WEB3-HARDENING-PLAN-v1.md` |

---

## 7. Gate certificate

Run:

```bash
bash scripts/gates/check-web3-full-alignment-gate.sh
```

Expected at this milestone:

```
WEB3_FULL_ALIGNMENT_GATE: WARN
  high=4 (ABI-001, API-001..003)
  critical=0
```

Target after Phase②.5:

```
WEB3_FULL_ALIGNMENT_GATE: PASS
```
