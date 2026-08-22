# TT · TTG V9 Periphery Governance Upgrade — FREEZE

**STATUS:** `DESIGN_FREEZE` · **`LOCKED`** · design-phase **CLOSED**  
**Machine:** `V9_PERIPHERY_GOVERNANCE_UPGRADE_FREEZE`  
**Recorded:** 2026-08-22  
**Next phase:** Engineering from **Clean worktree** (not further scheme debate)  
**`TT_PRODUCTION_GO`:** NO_GO · independent · not flipped by this freeze  

| Machine flag | Value |
|--------------|-------|
| `DESIGN_FREEZE` | **LOCKED** |
| `AUDIT_LADDER` | **#1 → #2 → #3** |
| `OLD_AUDIT_INHERITANCE` | **FORBIDDEN** |
| `MAINNET_BROADCAST` | **NOT_AUTHORIZED** |
| `TT_PRODUCTION_GO` | **NO_GO** |  

**Parents:** [Security Audit Ladder](TT-TTG-V9-SECURITY-AUDIT-LADDER-LATEST.md) · Owner Design Lock · Monetary Invariant  
**Registry:** [`registry/ttg-v9-periphery-governance-upgrade-freeze.v1.yaml`](../../registry/ttg-v9-periphery-governance-upgrade-freeze.v1.yaml)

---

## 0 · Freeze statement

This document freezes the **V9 periphery governance upgrade** design and execution ladder.

**Do not** reopen for general “security optimization” that would change:

- economic rules  
- wallet / authority roles  
- governance targets (e.g. claiming 12h before cutover)  
- other already-locked V9 facts  

**If a security issue is found:** prefer fixing the **implementation** (code path, checks, wiring, evidence).  
**Do not** change the **final purpose** without new Owner written approval.

### `AUDIT_PASS_IS_CANDIDATE_SCOPED` (hard)

Any Audit PASS is valid **only** for the explicitly bound:

- source SHA  
- artifact hash(es)  
- compiler profile  
- storage layout  
- deployment topology  
- this Design Freeze  

This upgrade changes Fee governance, Active Split governance, ProjectPoolV2, NEW 12h Timelock, and related attack surface.  
**Prior Candidate triad PASS (e.g. DL_R1) MUST NOT be inherited as PASS for this Candidate.**  
After any **security-relevant** code change: re-audit by impact scope + **re Exact-Match Freeze**.

---

## 1 · Approved scope (only)

| Approved | Rule |
|----------|------|
| Periphery migration | Triage → NEW and/or in-place UUPS · **no Safe** |
| `platformFeeBps` | Default 500 · Governor→Timelock governable · `≤ 10000` · **no auto commercial caps** |
| Active-Steward fee split | Default 4500/5500 · governable · **hard bound only `sum == 10000`** · no auto 60%/70% caps |
| No-steward path | **Fixed** 100% platform-fee → ProjectPool · **independent Router branch** · must not be indirectly changed by governable split |
| ProjectPool `capBps` | Default 3000 · governable **0…10000** · cap change does not reset spent/period · spend separate proposal |
| NEW Timelock | Target default **12h** · no Safe · suggested bounds **[12h, 7d]** · ban 0s |
| PM necessary hardening | `setUsdcTreasury` · buy slippage · batch Σ ≤ public inventory · **no five-batch semantic redesign** |
| Release gates | Wallet scanner · compiler banner table · English-only source comments · Exact-Match |

Fee split and platform fee apply only to the **platform fee bucket**, never to the rest of the order principal path.

---

## 2 · `NO_OWNER_ECONOMIC_OR_AUTHORITY_DRIFT`

Except the approved scope above, **implementation, audit remediation, deploy scripts, and security hardening MUST NOT change**:

- TTG **25T / no-mint**  
- **Genesis allocation** (including PublicSaleVault 50%)  
- **No-steward 100% → ProjectPool**  
- Owner-approved **wallet roles**  
- Locked **steward stake** rules  
- **Order / Escrow fund semantics**  
- Other **already-locked V9 facts**  

**Redeploy periphery ≠ remint TTG.**  
Any deploy script that prepares a **new TTG Genesis / new 25T mint** MUST **FAIL closed**.

---

## 3 · Timelock truth reporting

- **12h** = **new-stack target state** only.  
- Until Governor (and execution paths) actually cut over to **NEW Timelock**, **`/meta` · Registry · Official www** MUST continue to report the **old ACTIVE Timelock’s real delay** (e.g. 48h).  
- **Forbidden:** claiming mainnet is already 12h before cutover.

---

## 4 · Migration Rule (per-contract triage)

```text
UPGRADEABLE
  → in-place UUPS (obey on-chain auth)

NON_UPGRADEABLE
  → deploy NEW V2/V3; legacy later

UPGRADE_REQUIRES_LEGACY_TIMELOCK
  → prefer NEW stack; do not wait on old 48h root merely to keep old addresses
```

After funding / Governor / Registry / Indexer / API / `/meta` / www point to new ACTIVE and **`OLD_ACTIVE_REFS = 0`**, mark old contracts **LEGACY**.

---

## 5 · Frozen execution ladder (hard order)

**Compact (Owner canonical):**

```text
Clean
  → Triage
  → Local
  → Audit #1
  → Sepolia Reality
  → Audit #2
  → Scanner / Compiler / English
  → Exact-Match Freeze
  → Audit #3
  → Owner Mainnet Authorization
  → Mainnet Migration
  → OLD_ACTIVE_REFS = 0
  → LEGACY
  → Mainnet Reality
  → STOP
```

**Expanded (binding detail):**

```text
Design Lock (this freeze · LOCKED)
  → Clean worktree
  → Per-contract triage (3-state)
  → Local implementation + Local full tests

  → Audit #1
       Smart Contract / ACL / UUPS / Storage / Init / Reentrancy /
       Upgrade / Timelock / Governance / Source Hygiene
       (Does the code itself have vulnerabilities?)

  → Sepolia Reality

  → Audit #2
       Economic Red Team / Treasury / Fee / Split / PM /
       Governance Combination / Timelock Bypass / Routing Attack
       (Can combinations steal funds, bypass governance, or break economics?)

  → Remediate blockers
       ├─ Implementation-only fix → retest affected surface + regression
       └─ If frozen 25T / economic-ratio semantics / wallet roles /
          governance targets / authority model would change → STOP;
          Owner must re-approve Design Lock
          (Do not relabel purpose changes as “security”)

  → Wallet Scanner
  → Compiler Known-Bug Applicability
  → English Comments / NatSpec
  → Exact-Match Candidate Freeze

  → Audit #3
       Mainnet Release / Exact-Match / Deployment Artifact /
       Governance Topology / Monetary Invariant / Migration /
       OLD→NEW Cutover / Legacy Isolation
       (Is the broadcast artifact the frozen audited Candidate,
        and is Mainnet wiring correct?)

  → Owner Mainnet Authorization

  → Mainnet Migration (NEW / Upgrade)
  → Governor → NEW Timelock 12h
  → PM / Fee / ProjectPool fund-routing cutover
  → OLD_ACTIVE_REFS = 0
  → LEGACY
  → Mainnet Reality
  → STOP

TT_PRODUCTION_GO = NO_GO
MAINNET_BROADCAST = NOT_AUTHORIZED
OLD_AUDIT_INHERITANCE = FORBIDDEN
```

**No skip. No merge of Audit #1/#2/#3 checklists. No docs-only LEGACY.**  
**No Mainnet broadcast without Owner written auth after Audit #3 + Exact-Match Freeze.**  
**No inheriting old Candidate Audit PASS** (`AUDIT_PASS_IS_CANDIDATE_SCOPED`).  
**Design debate is CLOSED** — next work is engineering + evidence from **Clean worktree**.

### Triad roles (must stay separate)

| # | Role | Decides |
|---|------|---------|
| **#1** | Smart Contract Auditor | Code / ACL / UUPS / storage / init / reentrancy / upgrade / Timelock / governance / source hygiene — **bugs in the code itself** |
| **#2** | Economic Red Team | Treasury / Fee / Split / PM / governance combinations / Timelock bypass / routing — **can the system be drained or rules broken in combination** |
| **#3** | Mainnet Release Auditor | Exact-Match · deploy artifact · topology · monetary invariant · migration · cutover · legacy isolation — **are we shipping the frozen Candidate and wiring it correctly** |

Binding process parent: [TT-TTG-V9-SECURITY-AUDIT-LADDER-LATEST](TT-TTG-V9-SECURITY-AUDIT-LADDER-LATEST.md).

---

## 6 · Release gates (machine intent)

```text
TTG_KEEP_NO_REMINT = PASS
DEPLOY_SCRIPT_NEW_TTG_GENESIS = FAIL-CLOSED
NO_SAFE_CRITICAL_ROLES = 0
NO_OWNER_ECONOMIC_OR_AUTHORITY_DRIFT = PASS
PLATFORM_FEE_GOVERNABLE = PASS
FEE_SPLIT_ACTIVE_STEWARD_SUM_ONLY = 10000
FEE_SPLIT_NO_COMMERCIAL_CAPS_AUTO_INSERTED = PASS
NO_STEWARD_100_TO_POOL_FIXED_INDEPENDENT_BRANCH = PASS
FEE_SPLIT_APPLIES_ONLY_TO_PLATFORM_FEE_BUCKET = PASS
POOL_CAP_BPS_RANGE = 0..10000
TIMELOCK_TARGET_DEFAULT = 12h (new stack only)
TRUTH_REPORTING_OLD_DELAY_UNTIL_GOVERNOR_CUTOVER = PASS
OLD_ACTIVE_REFS = 0 before LEGACY
NON_ENGLISH_SOURCE_COMMENTS = 0
UNRESOLVED_COMPILER_KNOWN_BUG_APPLICABILITY = 0
WALLET_SCANNER_CRITICAL_FINDINGS = 0
PUBLIC_VAULT_50_PERCENT = EXPLAINED_ACCEPT
EXACT_MATCH = Local = Sepolia = Mainnet artifact
DIRTY_WORKTREE = 0
AUDIT_PASS_IS_CANDIDATE_SCOPED = PASS
PRIOR_CANDIDATE_TRIAD_NOT_INHERITED = PASS
TT_PRODUCTION_GO = NO_GO
```

### Compiler banners (evidence required)

Pin: solc **0.8.36** · via_IR · optimizer 200 · paris.  
Per bug: `NOT_AFFECTED` / `MITIGATED` — do not downgrade solc or change economics to silence explorers:

- `UnsoundSpillInMutualRecursion`  
- `LostStorageArrayWriteOnSlotOverflow`  
- `VerbatimInvalidDeduplication`  
- `FullInlinerNonExpressionSplitArgumentEvaluationOrder`  
- `MissingSideEffectsOnSelectorAccess`  

### Wallet scanner

- Critical findings = **0**  
- ~50% PublicSaleVault concentration = **EXPLAINED_ACCEPT** (custody for public sale, not team insider) — **do not** break genesis to greenwash scanners  

### Source language

ACTIVE Solidity / NatSpec / formal deploy script comments: **English only**.  
Comment-only fixes still require rebuild → ladder → Exact-Match re-freeze.

---

## 7 · One-line freeze

> Periphery may be redeployed; platform fee and Active 45/55 may be voted later (split hard-bound only `sum=10000`); Pool cap may be 0–100%; governance may move to a no-Safe 12h Timelock after real cutover; wallet/compiler/English gates + **Audit #1→#2→#3 (candidate-scoped)** apply — **without redesigning locked V9 economics or authority. Security bugs → fix implementation first; purpose changes require new Owner approval. Old triad PASS does not transfer.**

---

## STOP

This freeze does **not** authorize Mainnet broadcast, does **not** flip `TT_PRODUCTION_GO`, and does **not** claim live delay is already 12h.
