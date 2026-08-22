# TT · TTG V9 Release Security Gates — Periphery Governance Upgrade

**STATUS:** `ACTIVE` · gates **NOT_RUN** for periphery Candidate until **Audit #2 PASS**  
**Token evidence (TTG body · read-only):** [`TT-TTG-TOKEN-SCANNER-EVIDENCE-CLOSURE-LATEST`](TT-TTG-TOKEN-SCANNER-EVIDENCE-CLOSURE-LATEST.md) · **PASS** (`2026-08-22`)  
**Candidate bind:** `b19b85810c22677d243a82d06ebec8ebcb4d4b47` unless superseded by re-Audit #1  
**Position in ladder:** **Audit #2 PASS** → **this document** → **Exact-Match Freeze** → Audit #3  

Parent: [Periphery Governance Upgrade FREEZE](TT-TTG-V9-PERIPHERY-GOVERNANCE-UPGRADE-FREEZE-LATEST.md) · [Security Audit Ladder](TT-TTG-V9-SECURITY-AUDIT-LADDER-LATEST.md)

---

## Ladder insertion (binding)

```text
Sepolia Reality PASS
  → Audit #2 PASS
  → V9_TOKEN_RELEASE_SECURITY_GATE          ← TTG body (this doc §A)
  → V9_PERIPHERY_RELEASE_SECURITY_GATE      ← Governor/Timelock/PoolV2/FeeRouterV2/PM (§B)
  → Compiler Known-Bug Check
  → English Comments / NatSpec Check
  → Exact-Match Freeze
  → Audit #3
  → Owner Mainnet Authorization
```

**Both gates PASS** required before Exact-Match Freeze.  
**Forbidden:** changing frozen 25T economics to improve scanner scores · touching Candidate contracts during WAITING_ETA to “green” scanners.

---

## §A · `V9_TOKEN_RELEASE_SECURITY_GATE` (TTG body only)

**Scope:** `TravelTrustGovernanceTokenV9` · mainnet `0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9`  
**Entry:** `python scripts/dev/run-ttg-token-scanner-evidence-closure.py`  
**Policy:** read-only · no Solidity edits · no redeploy/broadcast  

| Gate | Required | Evidence |
|------|----------|----------|
| `ERC20_CONFORMANCE` | **PASS** | Static + on-chain surface |
| `POST_GENESIS_MINT_PATHS` | **0** | No mint after constructor |
| `ARBITRARY_BALANCE_WRITE_PATHS` | **0** | No admin setBalance |
| `HOLDER_DISTRIBUTION_RECONCILED` | **PASS** | Genesis 50/35/3/5/7 on-chain |
| `PUBLIC_SALE_VAULT_BALANCE_RECONCILED` | **PASS** | 12.5T / 5000 bps |
| `BURN_WARNING` | **DESIGN_INTENT_ACCEPTED** | `protocolBurn` vault/timelock only |
| `SUPPLY_WARNING` | **EXPLAINED_ACCEPT** | MAX 25T; supply may decrease, never increase |
| `HONEYPOT` | **NO** | |
| `BLACKLIST_BACKDOOR` | **0** | |
| `WALLET_SCANNER_CRITICAL_FINDINGS` | **0** | |
| `WALLET_SCANNER_HIGH_FINDINGS` | **0** | |
| `UNRESOLVED_REAL_SECURITY_FINDINGS` | **0** | Any >0 → **STOP** |

**SolidityScan notes (adjudicated, not ignored):**

- `IS ERC-20 TOKEN = No Impact` → **false-positive** (custom impl, full ERC-20 surface)
- `PRESENCE_OF_BURN_FUNCTION` → **DESIGN_INTENT_ACCEPTED**
- `TOKEN_SUPPLY_NOT_FIXED` → **EXPLAINED_ACCEPT** (25T cap; burn reduces `totalSupply` only)
- Wallet “insider 50%” → **EXPLAINED_ACCEPT** (PublicSaleVault custody, not team EOA)

**Latest machine artifact:** `evidence/GO_ttg_v9_audit/TTG_TOKEN_SCANNER_EVIDENCE_CLOSURE_LATEST.json`

---

## §B · `V9_PERIPHERY_RELEASE_SECURITY_GATE` (Candidate periphery)

**Scope:** Governor V9 · NEW 12h Timelock · ProjectPoolV2 · CountryFeeRouterV2 · PM hardening — **Candidate `b19b85810…` only**  
**Does NOT re-audit TTG body** (§A covers token).  
**Status:** **NOT_RUN** (opens after Audit #2 PASS)

| Gate | Required |
|------|----------|
| ACL / UUPS / init / reentrancy (Audit #1 carry-forward) | no regressions |
| Economic red-team blockers (Audit #2) | **0** unresolved Critical/High |
| `UNRESOLVED_COMPILER_KNOWN_BUG_APPLICABILITY` | **0** |
| `NON_ENGLISH_SOURCE_COMMENTS` | **0** |
| Periphery wallet scanner Critical | **0** |
| Periphery wallet scanner High | **0** |
| `NO_SAFE_CRITICAL_ROLES` | **0** |
| `NO_OWNER_ECONOMIC_OR_AUTHORITY_DRIFT` | **PASS** |
| `DEPLOY_SCRIPT_NEW_TTG_GENESIS` | **FAIL-CLOSED** |

Compiler pin: solc **0.8.36** · via_IR · optimizer 200 · paris — see [Pre-Deploy Compiler & Wallet Scan](TT-TTG-V9-PRE-DEPLOY-COMPILER-AND-WALLET-SCAN-LATEST.md).

---

## Owner 3-question check (TTG only)

1. **ERC-20 = PASS?** → must be **PASS**
2. **25T can increase post-genesis?** → must be **No** (`POST_GENESIS_MINT_PATHS=0`)
3. **Genesis wallets reconcile on-chain?** → must be **PASS**

All three **PASS** → SolidityScan score (e.g. 67/100) is **not** a reason to change economics.

---

## STOP conditions (either gate)

- `ERC20_CONFORMANCE = FAIL`
- `POST_GENESIS_MINT_PATHS > 0`
- Holder distribution ≠ frozen Genesis Allocation
- Any real Critical/High unresolved security finding
- Attempt to modify TTG tokenomics / remove burn solely for scanner score

`TT_PRODUCTION_GO` = **NO_GO** · Mainnet broadcast = **NOT_AUTHORIZED** until Audit #3 + Owner auth after Exact-Match.
