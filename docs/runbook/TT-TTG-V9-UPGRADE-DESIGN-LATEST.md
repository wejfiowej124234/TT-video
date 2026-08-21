# TT · TTG V9 Upgrade Design (Economics + Batch PM + Ops Split)


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**STATUS:** **`V9_REMINT_LOCAL_PASS`** · Monetary Invariant FROZEN → **[TT-TTG-V9-MONETARY-INVARIANT-LATEST](TT-TTG-V9-MONETARY-INVARIANT-LATEST.md)** · G1–G7 → **[Final Norm](TT-TTG-V9-REMINT-FINAL-NORM-G1-G7-LATEST.md)** · **NOT** Sepolia · **NOT** Mainnet · **NOT** Production GO  
**Token lock:** non-proxy · `MAX_SUPPLY` 25T · **NO_FURTHER_MINT** · coin fixed / system evolves  
**P0 LOCK (V8 inventory):** OLD PM non-recoverable · V8 **LEGACY / NO_MIGRATION** · Sepolia only after Owner auth  
**③ evidence:** `evidence/GO_ttg_v9_design/V9_REMINT_LOCAL_PASS.json`  
**Language:** All **new / changed Solidity NatSpec and inline comments MUST be English**.

---



## 0 · Hard security policy (Owner + Agent)


| Rule                                   | Binding                                                                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Private keys**                       | **Never** paste into chat · **Never** commit · **Never** hand to Agent · Agent **MUST NOT** sign / broadcast / transfer          |
| **15% ops wallet**                     | Owner signs transfers **locally** (hardware / multisig). Agent may prepare **unsigned** calldata / checklist only                |
| **Two new wallets**                    | Owner supplies **public addresses only** for Marketing (5%) and Treasury (7%); Team keeps 3% on existing or Owner-chosen address |
| **If any key ever lived in docs/repo** | Treat as **compromised candidate** → **rotate** after split · purge from git history / docs · use new custody                    |


This design **refuses** “Agent holds key and allocates.” That pattern fails industry custody standards and will fail serious audits.

---



## 1 · V9 economics lock (Owner-approved defaults)



### 1.1 Genesis disclosure (same pie, finer labels)


| Bucket          | V8                    | V9                                       | Note                                          |
| --------------- | --------------------- | ---------------------------------------- | --------------------------------------------- |
| Public sale     | 50%                   | **50%**                                  | Unchanged share                               |
| DAO treasury    | 35%                   | **35%**                                  | Unchanged share                               |
| Ops / team side | **15% single bucket** | **Team 3% + Marketing 5% + Treasury 7%** | **3+5+7=15** · disclosure split, not dilution |


**Compliance narrative (English, for auditors):**  
“The former fifteen-percent operations allocation is subdivided into three custodial wallets (team, marketing, treasury) for transparency. Public and DAO percentages are unchanged. No additional mint.”

### 1.2 Primary market


| Item             | V9 default                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Mechanism        | **Configurable batch ladder** (not V8 three-round 2T/3T/7.5T inventory)                           |
| Initial batches  | Five batches per Official unlock table (dates, % of **total supply**, unit prices)                |
| Batch-1 quote    | **1 TTG ≈ 0.000001 USDC** ⇒ **1 USDC = 1,000,000 TTG**                                            |
| Min purchase     | **1 USDC** (keep)                                                                                 |
| Price control    | Timelock may edit **unopened** batches; **price frozen after open**                               |
| Unsold at close  | **Only** `RETURN_TO_PUBLIC_VAULT` · **no** per-batch BURN · protocol burn = **GOVERNANCE_ONLY** (Governor → vote → Timelock execute) |
| Remainder of 50% | Stays in `PublicVault` (**~10.2825T** still unsold after five caps) · future `scheduleBatch` only |




### 1.2.1 Pinned five-batch table (VERIFY 2026-08-20 · do not re-derive ad hoc)

**Denominator for % copy = total supply 25T**, **not** the public 50% wallet.  
Multipliers apply to the **previous batch amount/pct**: ×3 → ×5 → ×9 → ×12.


| Batch | Start (UTC)          | Status copy       | Unit price | % of **25T** | **Pinned amount (TTG whole)** | usdc-raw per 1 TTG |
| ----- | -------------------- | ----------------- | ---------- | ------------ | ----------------------------- | ------------------ |
| 1     | 2026-10-15T09:00:00Z | upcoming          | 0.00000100 | 0.005%       | **1,250,000,000**             | **1**              |
| 2     | 2026-12-15T09:00:00Z | planned           | 0.00000300 | 0.015%       | **3,750,000,000**             | **3**              |
| 3     | 2027-02-15T09:00:00Z | planned           | 0.00000500 | 0.075%       | **18,750,000,000**            | **5**              |
| 4     | 2027-04-15T09:00:00Z | planned           | 0.00000700 | 0.675%       | **168,750,000,000**           | **7**              |
| 5     | 2027-06-15T09:00:00Z | planned / largest | 0.00000900 | 8.100%       | **2,025,000,000,000**         | **9**              |


**Checksums (must match UI + FE SSOT + Solidity constants):**


| Check                            | Value                                      | OK? |
| -------------------------------- | ------------------------------------------ | --- |
| Sum of five %                    | **8.870%** of 25T                          | yes |
| Sum of five amounts              | **2,217,500,000,000** TTG                  | yes |
| Batch5 / five-sum                | **91.319…%** (“约 91%” is marketing approx) | yes |
| Five / public 50% (12.5T)        | **17.740%** of public vault                | yes |
| Public remainder after five caps | **10,282,500,000,000** TTG                 | yes |


**Contract encoding rules (prevent wrong upgrade):**

1. **Pin absolute** `amountCap` **integers** from the table above. Do **not** compute on-chain as `totalSupply * pct` with 1e4 bps — several rows are **half-bps** (0.5 / 1.5 / 7.5 / 67.5) and will round wrong.
2. **Do not** store “TTG per USDC” as the sole price for batches 2/4/5 — those rates are **non-integers** (e.g. 1/0.000003 ≈ 333333.⅓). Store `usdcRawPerWholeTtg ∈ {1,3,5,7,9}` and use
  `ttgOut = usdcAmount * 1e18 / usdcRawPerWholeTtg` (floor). Document dust.
3. **Never** treat UI “0.005%” as percent of the **50% public bucket** (that would **2×** every cap).
4. Frontend SSOT: `frontend/lib/governance/ttgPublicUnlockScheduleLocal.ts` — keep in lockstep with this table.



### 1.3 DAO burn (separate from sales)

- DAO **35%** is **not** sold via Primary Market.
- Optional Timelock-only `burnDao(uint256 amount)` for supply policy.
- Must be disclosed separately from “unsold public can burn.”



### 1.4 Regional 45% / global 55%

- **CONFIRM_DESIGN** · **out of TTG V9 mint/PM scope**.
- No regional steward ⇒ that region’s share returns to the global project (existing money-path / 83 narrative). **Copy fix only.**



### 1.5 KEEP list (do not touch this wave)

- Money Path: EscrowFactory Wired · SettlementRouter · FeeRouter  
- Existing **V8 TTG token instance** (25T already minted) — **no remint**  
- Prefer **KEEP** Timelock; replace/upgrade **Primary Market** for batch machine

---



## 2 · Etherscan compiler warning (screenshot) — fix plan



### 2.1 What you saw

Verified `TtgMemeDenomGovernanceToken` on **solc 0.8.26** shows explorer banners:


| Bug                                   | Severity | Fixed in   |
| ------------------------------------- | -------- | ---------- |
| `UnsoundSpillInMutualRecursion`       | Medium   | **0.8.36** |
| `LostStorageArrayWriteOnSlotOverflow` | Low      | **0.8.32** |


V8 intentionally pinned **0.8.26** to avoid the older **0.8.19 CVE** banner (`VERIFY.md`). That trade-off is now obsolete for **new** bytecode.

### 2.2 Reality constraint


| Asset                           | Can we “fix compiler” on-chain?                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| **Already deployed V8 TTG**     | **No** — bytecode immutable. Banner may remain on that address forever.                       |
| **New V9 PM / Vault / helpers** | **Yes** — compile with **solc ≥ 0.8.36**, English NatSpec, re-verify on Etherscan + Sourcify. |




### 2.3 Industry-standard mitigation package

1. **New contracts (V9):** `pragma solidity 0.8.36;` (or latest stable ≥ 0.8.36) · `COMPILER_TARGET` constant updated · foundry profile dedicated.
2. **Avoid bug patterns anyway:** no mutual recursion with IR spill; no pathological storage-end arrays (already true for clean ERC20-style token / PM).
3. **Deployed V8 token:** publish short **Compiler Risk Note** for auditors: both bugs require rare patterns; token has no mutual recursion / no end-of-storage arrays; residual risk **accepted** or **monitor-only**.
4. **Do not** remint 25T solely to clear a banner (worse for users and audit story).
5. Optional later: if product requires a “clean banner token,” that is a **separate** migration program — **not** default V9 path.

---



## 3 · Additional gaps vs V8 → V9 (beyond prior list)


| ID  | Gap                                        | Risk                             | Audit / official       | Fix in V9 design                                  |
| --- | ------------------------------------------ | -------------------------------- | ---------------------- | ------------------------------------------------- |
| G01 | WWW already V9; chain still V8 quote/split | Misleading primary market        | Fail disclosure review | Same-day `/meta` + www + PM cutover               |
| G02 | Quote 10× (100k → 1M TTG/USDC)             | Breaks any off-chain integrators | High                   | New PM instance + versioned quote in `/meta`      |
| G03 | V8 three-round caps vs five-batch ladder   | Dual semantics                   | Confusion              | Mark three-round **SUPERSEDED** in Norm           |
| G04 | Five batches ≈ 8.87% of supply             | “Where is the rest of 50%?”      | FAQ fail               | Norm: remainder in PublicVault                    |
| G05 | Unsold burn without Timelock               | Centralized rug narrative        | Fail                   | Default RETURN; BURN delayed + role-gated         |
| G06 | Single EOA controls 15% then 3 wallets     | Key concentration                | Custody fail           | Multisig/hardware; Agent never holds key          |
| G07 | Keys in documentation (if any)             | Critical leak                    | Instant fail           | Rotate + purge; never Agent custody               |
| G08 | solc 0.8.26 explorer banners               | Optics / questionnaire           | Soft fail              | New code ≥ 0.8.36; note for live token            |
| G09 | Non-English comments on new code           | Process hygiene                  | Soft                   | English-only NatSpec policy                       |
| G10 | Mixing FeeRouter 45/55 into TTG PR         | Scope creep                      | Drift                  | Separate CONFIRM_DESIGN                           |
| G11 | Permissionless window open without pause   | Incident response                | Ops fail               | `pause` by Timelock/Guardian                      |
| G12 | Close batch never called                   | Inventory stuck                  | Accounting fail        | Permissionless `closeBatch` after `end`           |
| G13 | Per-wallet unlimited buys at 1 USDC min    | Dust / sybil                     | Medium                 | Optional Timelock per-wallet cap                  |
| G14 | FTB / Archive immutability                 | Process break                    | Governance fail        | New living Norm; **do not edit** frozen Archive   |
| G15 | Claiming Production GO after PM deploy     | False completion                 | Hard fail              | Explicit `TT_PRODUCTION_GO` remains Owner verdict |


---



## 4 · Target architecture (V9)

```text
[KEEP] TTG V8 token (25T) ── transfers only for ops split
                │
                ├─ Public 50% ──► PublicVault
                │                    │ allocateBatch
                │                    ▼
                │               BatchEscrow[1..N] ── buy(USDC) @ frozen price
                │                    │ close → RETURN (default) or BURN
                │                    ▼
                │               PublicVault (remainder)
                │
                ├─ DAO 35% ──► DaoTreasury (+ Timelock burnDao)
                │
                └─ Ops 15% ──► Team 3% / Marketing 5% / Treasury 7%
                               (Owner-signed transfers; three addresses)

[REPLACE or UPGRADE] PrimaryMarket → Batch ladder PM (solc ≥ 0.8.36)
[KEEP] Timelock / Money Path / (prefer) Governor binding strategy
[ALIGN] Official /meta + www unlock + allocation copy
```



### 4.1 Suggested contract set (names English)


| Contract                                     | Role                                             |
| -------------------------------------------- | ------------------------------------------------ |
| `TtgPublicSaleVault`                         | Holds unsold public inventory                    |
| `TtgBatchPrimaryMarket`                      | Batch config, buy, close policies                |
| `TtgDaoTreasury` (or extend existing holder) | DAO custody + optional burn                      |
| *(no new token by default)*                  | Keep `TtgMemeDenomGovernanceToken` live instance |


All new source: **English comments / NatSpec**.

---



## 5 · Ops 15% → 3 / 5 / 7 split procedure (Owner-signed only)

**Balances (of total 25T):**


| Wallet    | BPS  | Amount (TTG wei units conceptually) |
| --------- | ---- | ----------------------------------- |
| Team      | 300  | 3% of 25T = **0.75T**               |
| Marketing | 500  | 5% = **1.25T**                      |
| Treasury  | 700  | 7% = **1.75T**                      |
| Sum       | 1500 | **3.75T** (= former 15%)            |


**Steps (③ Mainnet):**

1. Owner publishes three **public** addresses (Team / Marketing / Treasury).
2. Owner verifies current 15% custody balance on-chain.
3. Owner signs **two transfers** (or three if re-centering Team):
  - Marketing ← 5%  
  - Treasury ← 7%  
  - Team retains 3% (or transfer 3% to new Team cold wallet).
4. Record tx hashes in evidence pack.
5. **Agent role:** checklist + amount calculator + optional **unsigned** tx template — **never** private key.

**If Owner later pastes two addresses in chat:** treat as public config inputs only.

---



## 6 · Full upgrade flow (end-to-end)



### Phase A — Freeze Norm (① docs, no chain)

- This document + machine YAML  
- Confirm defaults: RETURN close · quote table · KEEP money path  
- Owner lists three public addresses (placeholders until filled)  
- Explicit key policy signed by Owner (no Agent custody)



### Phase B — Implement (① code)

1. Add `ttg-v9/` (or evolve meme-denom PM) with **solc 0.8.36+**
2. English NatSpec throughout
3. Invariants tests: open/buy/close RETURN/close BURN/price freeze/pause/auth
4. `forge` green · Slither/mythril optional
5. Update VERIFY notes for V9 compiler target



### Phase C — Sepolia rehearsal (②)

1. Deploy Vault + Batch PM (test tokens / mock USDC)
2. Dry-run five-batch schedule
3. Dry-run ops split with **test keys Owner controls**
4. Evidence: txs · params · screenshots · Norm diff



### Phase D — Mainnet cutover (③, Owner auth env)

Order:

1. Public disclosure of Norm + addresses
2. **Owner** executes 15% split txs
3. Timelock: set PM / Vault / allowlist USDC
4. Schedule five batches (**Batch 1 not open until start**)
5. Cut Official `/meta` quote + `primary_market_address`
6. Confirm www matches chain
7. Evidence pack + Owner Self Review
8. **Stop** — Production GO is a **separate** Owner verdict



### Phase E — Post checks


| Gate       | Pass criteria                                           |
| ---------- | ------------------------------------------------------- |
| G-Alloc    | On-chain 50/35/3/5/7 within dust                        |
| G-PM       | Batch params == Norm; buys blocked before start         |
| G-Close    | RETURN proven; BURN path exists but unused unless voted |
| G-Meta     | Quote 1 USDC = 1,000,000 TTG (batch-1)                  |
| G-Compiler | New verified contracts show **no** 0.8.26 banners       |
| G-Custody  | No keys in repo; split txs Owner-signed                 |
| G-Money    | Money Path addresses unchanged                          |


---



## 7 · Audit package checklist (industry-shaped)

1. Norm + this design (immutable once Owner freezes version tag)
2. Architecture diagram + trust boundaries (Timelock / Guardian / Buyer)
3. Threat model: pause, burn, price change, stuck batches, oracle-free quotes
4. Test vectors + coverage note
5. Compiler Risk Note for legacy V8 token (0.8.26)
6. Deployment / verify scripts (Etherscan + Sourcify)
7. Ops runbook: open/close batch, incident pause
8. Disclosure: not a securities offer; window not open; allocation ≠ progress bar
9. Custody diagram for three ops wallets
10. Explicit non-goals: Money Path redeploy, Agent key custody, false GO

---



## 8 · What V9 does **not** claim

- Does **not** auto-issue `TT_PRODUCTION_GO`  
- Does **not** rewrite frozen FTB Archive bytes  
- Does **not** require reminting 25T  
- Does **not** change Escrow USDC itinerary deposits into TTG  
- Does **not** authorize Agent to move mainnet funds

---



## 9 · Owner decisions FROZEN (2026-08-20)


| #   | Decision                            | FROZEN value                                                                                     |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| D1  | Close unsold                        | **RETURN_TO_PUBLIC_VAULT only** · protocol BURN = **GOVERNANCE_ONLY** (not Timelock-solo / not batch preset) |
| D2  | PM shape                            | **New Batch PM instance** (do not upgrade OLD `0x882Ad…` in place)                               |
| D3  | Compiler (new code)                 | **solc ≥ 0.8.36**                                                                                |
| D4  | Live V8 TTG                         | **KEEP** · no remint                                                                             |
| D5  | Ops wallets                         | Team **3%** `0x010365…6828` · Marketing **5%** `0xe1e732…CdD4` · Treasury **7%** `0xF34804…2736` |
| D6  | Batch window                        | `[start_i, start_{i+1})` **UTC** · batch 5 hard end = start_5 + 60 days (Norm pin)               |
| D7  | Concurrent buys                     | **Current batch only**                                                                           |
| D8  | USDC proceeds                       | **KEEP P4Cap** `0xfB906…9BbF` (original pool)                                                    |
| D8b | Governance spend                    | **KEEP** P4 rule: **≤30% of reserve / 90-day period** via Timelock spender                       |
| D9  | OLD PM                              | Cutover: **pause/retire** + `/meta` points to new PM only                                        |
| D10 | Per-wallet buy cap                  | **0 at launch** (match V8) · Timelock may add later                                              |
| D11 | Ops vesting                         | See §9.1 · **not** naked EOA self-lock                                                           |
| D12 | Disclosure dual-track               | Until cutover: www must show **chain still V8 quote** banner                                     |
| D13 | Pause                               | **Timelock + Guardian** (pause-only)                                                             |
| D14 | Team address                        | `0x010365F0835323826569D61D0E13E6F8d25F6828`                                                     |
| D15 | Public remainder after five batches | **Timelock** `scheduleBatch` **only**                                                            |
| D16 | Mainnet Reality                     | **PASS** · `evidence/GO_ttg_v9_design/V8_REALITY_READONLY_20260820.json`                         |




### 9.1 How to lock personal wallets (D11)

**Problem:** Tokens on an EOA are **not locked** — the holder can transfer anytime. “Self-promise” is not an audit control.

**Correct pattern (industry):**

1. Deploy `TtgOpsVestingWallet` (or OZ `VestingWallet`) per bucket — **contract holds tokens**, beneficiary receives release.
2. Owner transfers TTG **from EOA → vesting contract** (Owner-signed only; Agent never holds keys).
3. Parameters (FROZEN default for Team 3% + Marketing 5%):
  - **Cliff 180 days** from vesting start  
  - then **linear unlock over 540 days** (total ~24 months)  
  - **Treasury 7%:** no forced vesting (ops liquidity); prefer move to **Safe** with Timelock spend policy when ready
4. Revocation: **none** by default (trustless vest). Optional Timelock clawback = separate governance proposal — **not** default.

**Reality note:** Mainnet already holds 3/5/7 at the three EOAs (`ops_split_already_on_chain=true`). Vesting is an **optional post-scaffold migrate**, not a re-split.

### 9.2 USDC pool + 30%/quarter

Matches live **GovernanceTreasuryP4Cap**: `TREASURY_P4_DEPLOY_CAP_BPS=3000` · `P4_ACCOUNTING_PERIOD_SECONDS=90 days`. V9 Batch PM **must** set `usdcTreasury = P4Cap`. No parallel USDC sink.

---



## 10 · Engineering status


| Gate                       | Status                                                                 |
| -------------------------- | ---------------------------------------------------------------------- |
| Design Norm                | **FROZEN** this document                                               |
| D16 / 20260821 Reality     | **PASS** (read-only)                                                   |
| ① Local scaffold + forge   | **`V9_PM_LOCAL_PASS`**                                                 |
| ② Sepolia rehearsal        | **`V9_PM_SEPOLIA_PASS_STOP`**                                          |
| ③ Cutover pre-audit        | **`V9_PM_MAINNET_CUTOVER_READY`** · broadcast **HOLD** (MIGRATE-01)    |
| Mainnet broadcast / GO     | **FORBIDDEN** until Owner migrate-path + separate broadcast auth       |


---

**Document version:** 2026-08-21 · Cutover audit READY / broadcast HOLD · Owner decisions **FROZEN**  
**Honest boundary:** LOCAL_PASS ≠ Sepolia ≠ Cutover READY ≠ broadcast auth ≠ Production GO.