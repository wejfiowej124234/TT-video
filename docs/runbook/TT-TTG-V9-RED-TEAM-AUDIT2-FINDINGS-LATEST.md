# TT · TTG V9 Red Team Audit #2 — Findings


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**Role:** Economic attacker / Red Team (not static checklist)  
**Scope:** `contracts/src/ttg-v9/` Token · Vault · Batch PM · Governor · UUPS · ERC1967 Proxy · DeployTopology · Constants · `ITtgV9Tokens`  
**Out of scope:** Mainnet execution · Solidity code changes · Indexer / FE / API  
**Companion Timelock (attack dependency only):** KEEP `GovernanceTimelock` (admin `schedule` ∥ Governor `scheduleByGovernor`)  
**Date:** 2026-08-21  
**Phase:** ① local / ② testnet review surface · **≠** ③ Production GO  

---

## Executive verdict

| Metric | Value |
|--------|-------|
| **OPEN_CRITICAL** | **0** |
| **OPEN_HIGH** | **0** (was 1 · RT2-OPEN-01 → **REMEDIATED** via `TtgV9AtomicDeployer`) |
| External steal of 12.5T Public inventory (Official atomic deploy) | **BLOCKED** |
| Flash-loan vote / propose inflation | **BLOCKED** |
| Permanent pause-trap of unsold inventory | **BLOCKED** |
| Dominant residual | Timelock / ops concentration · Guardian sale grief · manual multi-tx misuse (Info) |

**Verdict:** No Critical/High external economic exploit remains on the Official path. RT2-OPEN-01 (empty-init Vault front-run across txs) is closed by requiring `TtgV9AtomicDeployer` (constructor = one transaction). Residual High/Medium pressure is **trusted Timelock-admin** and **ops concentration** (PARTIAL by design), not stranger EOAs.

---

## Privilege model (attacker view)

| Actor | Economic power | Red-team note |
|-------|----------------|---------------|
| Stranger EOA | `buy` / `armBatch` / `closeBatchReturn` / propose-if-votes | Cannot mint, rescue TTG, upgrade, or `protocolBurn` |
| Guardian | `pause` only | Cannot `unpause`, upgrade, burn, set caps/prices, bind market |
| Timelock (Vault `admin` + PM `timelock`) | Upgrade · unpause · seed/params · rescue non-TTG · `executeGovernanceBurn` · own-balance `protocolBurn` via call | **Trusted rug surface** if admin key / Safe compromised |
| Timelock **admin** (KEEP Timelock) | `schedule` without Governor vote (delay still applies) | Democratic bypass, not delay bypass |
| Governor | Vote → `queue` → `scheduleByGovernor` | Cannot skip Timelock delay |
| Token | Non-proxy · genesis-only supply · no public burn | Immutable monetary core |

---

## Attack stories (required nine)

| # | Attack story | Status | Severity | Notes / OPEN locus |
|---|--------------|--------|----------|--------------------|
| 1 | Steal/seize 12.5T PublicSaleVault TTG (rescue, pull, upgrade rug, init front-run) | **PARTIAL** | High (conditional OPEN) | External rescue/pull/upgrade **BLOCKED**. Split-tx init front-run **OPEN** — see RT2-OPEN-01. Timelock upgrade/`bindMarket` rug **PARTIAL** (trusted). |
| 2 | Bypass Governor→Timelock to burn DAO 35% or Public inventory | **PARTIAL** | Medium | External burn **BLOCKED**. Timelock **admin** `schedule` can burn DAO balance / call Vault burn **without a Governor PASS** (delay remains). Vault burn still blocked while armed batch open. |
| 3 | Tamper five-batch caps/prices after open / wrong-batch buy / rounding steal | **BLOCKED** | — | Post-start / armed / frozen params locked. `currentBatchId` enforces current window. Floor quote favors protocol (no buyer inventory steal). |
| 4 | UUPS implementation takeover / unauthorized upgrade | **PARTIAL** | High (trusted) | Unauthorized / implementation-context upgrade **BLOCKED**. Authorized Timelock upgrade = full logic rug **PARTIAL**. Same conditional init front-run as #1. |
| 5 | Reentrancy on buy / close / returnInventory | **BLOCKED** | — | CEI on `buy`; `closed` before RETURN; Official USDC/TTG have no callbacks. Residual only if non-Official hookable USDC is wired. |
| 6 | Flash-loan voting or propose threshold bypass | **PARTIAL** | Medium | Same-block flash loan **BLOCKED** (`snapshot = block.number - 1`). Vote-cap disabled + 1% quorum + 15% ops genesis = concentration capture **PARTIAL** (not flash). |
| 7 | Skip Timelock delay / schedule as non-governor | **PARTIAL** | Medium | Delay skip **BLOCKED** (`TooEarly`). Random EOA cannot `scheduleByGovernor`. Timelock **admin** may `schedule` without Governor (**PARTIAL**). |
| 8 | Pause grief permanently trapping inventory | **PARTIAL** | Medium | Permanent trap **BLOCKED** (`closeBatchReturn` allowed while paused). Guardian can grief the live sale until Timelock `unpause`. |
| 9 | Guardian / Timelock privilege confusion | **BLOCKED** | — | Guardian cannot escalate to upgrade/burn/params/unpause. Topology pins Vault `admin` = PM `timelock`. Mis-bind of distinct admins is deploy error, not code path for Guardian. |

---

## Detailed attack narratives

### 1) Steal / seize 12.5T PublicSaleVault TTG

**Attempted paths**

| Path | Result | Evidence |
|------|--------|----------|
| `rescueForeignERC20(ttg, …)` | **BLOCKED** | `TtgPublicSaleVault.sol:90-92` · `TtgBatchPrimaryMarket.sol:308-310` (`CannotRescueTtg`) |
| Stranger `pull` | **BLOCKED** | `TtgPublicSaleVault.sol:76` `onlyMarket` |
| Stranger `upgradeToAndCall` | **BLOCKED** | Vault `_authorizeUpgrade` → `onlyAdmin` (`:113`); PM → `onlyTimelock` (`:319`); UUPS rejects impl-context (`TtgV9UUPSUpgradeable.sol:37-39`) |
| Timelock upgrades Vault to thief impl / `bindMarket(attacker)` then `pull` | **PARTIAL** | Intended Timelock custody — economic rug if Timelock admin compromised |
| Init front-run on empty-init proxy | **OPEN** (conditional) | Proxy constructed with `initData=""` (`TtgV9DeployTopology.sol:54`); `initialize` is public `initializer` (`TtgPublicSaleVault.sol:53-58`). Attacker who wins the race sets `admin=attacker`, then upgrades or binds market and drains genesis credit. Topology **must** call `initialize` in the **same transaction** (`:56-58` NatSpec). |

**Economic note:** Genesis credits 12.5T directly to the Vault address in the Token constructor (`TravelTrustGovernanceTokenV9.sol:74-85`). Between proxy create and `initialize`, balance already sits on the proxy — that is why split-tx deploy is fatal.

### 2) Bypass Governor→Timelock burn (DAO 35% / Public inventory)

| Path | Result | Evidence |
|------|--------|----------|
| User `protocolBurn` | **BLOCKED** | `TravelTrustGovernanceTokenV9.sol:119-120` `NotProtocolBurner` |
| Stranger `executeGovernanceBurn` | **BLOCKED** | `TtgPublicSaleVault.sol:101` `onlyAdmin` |
| Burn Public while batch armed | **BLOCKED** | `:104-106` + `hasOpenOrArmedUnclosedBatch` (`TtgBatchPrimaryMarket.sol:218-224`) |
| Timelock calls `token.protocolBurn` on **its own** 8.75T | **PARTIAL** | Token authorizes `daoTimelock` as burner (`:119-122`). No Vault batch gate. Matches custody design; **bypasses Governor vote** if KEEP Timelock **admin** uses `schedule` (`GovernanceTimelock.sol:111-128`) |
| Timelock `executeGovernanceBurn` after admin `schedule` | **PARTIAL** | Same: Timelock path without Governor PASS; still delayed |

**Red-team distinction:** “Bypass Governor” ≠ “bypass Timelock.” Admin schedule still waits `delay`. Monetary invariant’s “Governor→Timelock” narrative for **Public** burn is soft against Timelock-admin unilateral schedule.

### 3) Tamper caps / prices after open · wrong-batch buy · rounding steal

| Path | Result | Evidence |
|------|--------|----------|
| `setUnopenedBatchParams` after `start` / armed / frozen / closed | **BLOCKED** | `TtgBatchPrimaryMarket.sol:196-199` |
| Buy non-current overlapping window | **BLOCKED** | `:250-251` `NotCurrentBatch` + `currentBatchId` (`:208-214`) |
| Pay dust USDC, receive full cap via rounding | **BLOCKED** | `quoteTtg` floor (`:226-229`); `ttgOut == 0` rejected (`:266`); min purchase `1e6` (`TtgV9Constants.sol:18`) |
| Timelock retunes **future unopened** batch | **PARTIAL** | Allowed by design (`:188-205`) — governance surface, not post-open tamper |

Buyer cannot extract more TTG than `usdcAmount * 1e18 / price` (floor). Dust stays in market allocation and returns on `closeBatchReturn`.

### 4) UUPS implementation takeover

| Path | Result | Evidence |
|------|--------|----------|
| Call `upgradeToAndCall` on implementation | **BLOCKED** | `TtgV9UUPSUpgradeable.sol:37-39` |
| Stranger upgrade via proxy | **BLOCKED** | Vault/PM authorize hooks |
| Re-initialize implementation | **BLOCKED** | Constructor `_disableInitializers` (Vault `:49-51`, PM `:91-94`) |
| Timelock upgrade + malicious `data` delegatecall | **PARTIAL** | Full storage/logic rewrite; inventory movable in new impl |
| Empty-init proxy race | **OPEN** | Same as RT2-OPEN-01 |

Proxy itself has no admin (`TtgV9ERC1967Proxy.sol`) — upgrade authority lives only in implementation storage (`admin` / `timelock`).

### 5) Reentrancy (buy / close / returnInventory)

| Path | Result | Evidence |
|------|--------|----------|
| Reenter `buy` via USDC/TTG callback | **BLOCKED** (Official) | Effects before interactions (`TtgBatchPrimaryMarket.sol:270-275`); `sold` / wallet totals updated first; CapExceeded on double-fill |
| Reenter during `closeBatchReturn` → double RETURN | **BLOCKED** | `b.closed = true` before approve/return (`:296-303`) |
| Reenter `returnInventory` / `pull` via TTG | **BLOCKED** | Token has no hooks; fixed non-proxy ERC20 |
| Non-Official ERC777-like USDC | **PARTIAL** / Low | Out-of-norm wiring only; CEI still limits inventory theft |

`armBatch` / first-buy `vault.pull` occurs before `sold` mutation, but `pull` is a plain ERC20 `transfer` with no callback into attacker code on Official TTG.

### 6) Flash-loan voting / propose threshold bypass

| Path | Result | Evidence |
|------|--------|----------|
| Flash loan in propose block to meet threshold | **BLOCKED** | `snapshot = block.number - 1` (`TravelTrustGovernorV9.sol:149`); `getPastVotes(…, snapshot)` ignores same-block balance |
| Flash loan in vote block | **BLOCKED** | Weight from `p.snapshot`, not current block (`:208`) |
| Multi-block borrow / whale | N/A flash | Ordinary capital attack |
| Propose/quorum with ops concentration | **PARTIAL** | `MAX_VOTING_POWER_PER_ADDRESS_BPS = 0` (disabled) · quorum **1%** · floor threshold **0** (`TtgV9GovernanceParams.sol:10-12`). Genesis Team+Marketing+Treasury = **15%** if delegated — exceeds propose tiers and quorum without flash loans |

**Not OPEN Critical:** requires control of ops wallets / delegation, not a stranger flash path.

### 7) Skip Timelock delay / schedule as non-governor

| Path | Result | Evidence |
|------|--------|----------|
| `execute` before `readyAt` | **BLOCKED** | KEEP Timelock `TooEarly` (`GovernanceTimelock.sol:135`) |
| EOA `scheduleByGovernor` | **BLOCKED** | `onlyGovernor` (`:91-96`) |
| EOA `schedule` | **BLOCKED** | `onlyAdmin` (`:111-116`) |
| Timelock admin schedules burn/upgrade without Governor | **PARTIAL** | Dual path by design; delay intact |
| Mock `bootstrapCall` on Mainnet | **OPEN** if wrong Timelock | Mock only (`mocks/MockV9Timelock.sol:49-56`) — **runbook forbid**; not in production Token/Vault/PM bytecode |

Governor `queue`/`execute` cannot shorten delay (`TravelTrustGovernorV9.sol:255-270`).

### 8) Pause grief · permanent inventory trap

| Path | Result | Evidence |
|------|--------|----------|
| Pause then trap unsold forever | **BLOCKED** | `closeBatchReturn` has **no** `whenNotPaused` (`TtgBatchPrimaryMarket.sol:280-305`); NatSpec `:281` |
| Guardian pauses live sale | **PARTIAL** | `pause` Guardian∥Timelock (`:130-134`); `unpause` Timelock-only (`:136-140`) — sale grief until Timelock acts; inventory recoverable via close |
| Pause blocks `arm`/`buy` | Expected | `whenNotPaused` (`:232`, `:246`) |

### 9) Guardian / Timelock privilege confusion

| Path | Result | Evidence |
|------|--------|----------|
| Guardian → upgrade / burn / set params / bind market | **BLOCKED** | No Guardian gates on those functions |
| Guardian `unpause` | **BLOCKED** | `onlyTimelock` |
| Guardian `setGuardian` / `setTimelock` | **BLOCKED** | Timelock-only (`:118-128`) |
| Confused deputy: Vault admin ≠ PM timelock | Deploy residual | Topology sets both to `timelock` (`TtgV9DeployTopology.sol:58`, `:62-65`). If ops manually initializes with divergent admins, upgrade/burn authority splits — not Guardian-driven |

---

## OPEN findings (file:line)

### RT2-OPEN-01 — Vault empty-init front-run (conditional deploy) · **REMEDIATED**

| Field | Value |
|-------|-------|
| **Status** | **REMEDIATED** |
| **Severity** | was High → **closed** |
| **Story** | #1 / #4 |
| **Fix** | `TtgV9AtomicDeployer` — Official stack factory; constructor runs full `TtgV9DeployTopology.deploy` in **one tx**. Sepolia remint script uses AtomicDeployer. Topology NatSpec forbids empty-init across transactions. |
| **Residual** | Info — manual multi-tx `new Proxy(impl,"")` outside Official entry remains operator misuse (runbook forbid), not live Official bytecode path. |

**No OPEN Critical/High** findings against stranger EOAs on Official atomic deploy.

---

## PARTIAL findings (trusted / economic)

| ID | Severity | Summary |
|----|----------|---------|
| RT2-P-01 | High | Compromised Timelock admin upgrades Vault/PM or rebinds market → seize remaining Public inventory |
| RT2-P-02 | Medium | Timelock admin `schedule` burns DAO 35% or Public (via Vault) without Governor PASS; delay still enforced |
| RT2-P-03 | Medium | Guardian pause griefs active batch sales until Timelock unpauses (inventory not permanently trapped) |
| RT2-P-04 | Medium | Voting power cap disabled + 1% quorum + 15% ops genesis enables non-flash governance capture if ops delegate |
| RT2-P-05 | Low | Permissionless `armBatch` pulls full remaining cap into PM (grief/gas; funds return on close) |
| RT2-P-06 | Info | Floor pricing / dust favors protocol; Timelock may retune **unopened** batches only |

---

## BLOCKED summary (external attacker, healthy deploy)

- Rescue or silent transfer of Vault/PM **TTG** inventory  
- Unauthorized `pull` / `protocolBurn` / `executeGovernanceBurn`  
- Unauthorized UUPS upgrade (proxy or implementation context)  
- Post-open batch cap/price tamper; wrong-batch purchase; rounding theft of inventory  
- Same-block flash-loan propose/vote inflation  
- Timelock delay skip; stranger schedule  
- Permanent pause-trap of unsold inventory  
- Guardian privilege escalation to Timelock powers  

---

## Deploy / Mainnet footguns (not counted as extra OPEN_HIGH)

| Item | Risk | Guidance |
|------|------|----------|
| `TtgV9DeployTopology` Governor uses **LOCAL** delay/period (`TtgV9GovernanceParams`) | Fast governance if reused on Mainnet | Mainnet: KEEP Timelock; **redeploy Governor** with production params (NatSpec on Governor + Topology) |
| `MockV9Timelock.bootstrapMode` | Instant admin `bootstrapCall` | Never Mainnet Timelock |
| Token non-self-delegating at genesis | Ops/DAO votes inert until `delegate` | Operational; not a steal bug |

---

## Counts roll-up

```text
OPEN_CRITICAL = 0
OPEN_HIGH     = 0   # RT2-OPEN-01 REMEDIATED (TtgV9AtomicDeployer)
OPEN_MEDIUM   = 0   # (PARTIAL Medium items are not OPEN)
PARTIAL       = 6 tracked (RT2-P-01…P-06)
BLOCKED       = stories 3,5,9 fully; stories 1,2,4,6,7,8 external/core paths
```

---

## Red Team conclusion

Against an **Official atomic** V9 stack (`TtgV9AtomicDeployer` + KEEP Timelock as Vault admin and PM timelock), a pure economic outsider cannot seize the 12.5T Public inventory, skip Timelock delay, flash-inflate votes, or permanently freeze RETURN inventory. Remaining High/Medium pressure sits on **Timelock-admin trust**, **ops token concentration**, and **Guardian pause grief** — accept or harden ops/params before Mainnet adversarial bar. Manual multi-tx empty-init is **forbidden** (Info residual only).

**Stamp:** `TTG_V9_RED_TEAM_AUDIT2` · `OPEN_CRITICAL=0` · `OPEN_HIGH=0` · **not** Mainnet · **not** Production GO.
