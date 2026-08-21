# TT · TTG V9 Mainnet Release Audit #3 — Findings


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**Role:** Mainnet Release Auditor (exact-bytes / cutover readiness — **not** product redesign)  
**Exact Candidate:** `evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_R1_FINAL_MANIFEST.json`  
(`candidate_id` = `V9_AUDIT_CANDIDATE_R1_FINAL` · `status` = `FROZEN_R1_FINAL_FOR_AUDIT3` · also mirrored at `V9_AUDIT_CANDIDATE_MANIFEST.json`)  
**Date:** 2026-08-21  
**Phase:** ② Mainnet-readiness review surface · **≠** ③ Mainnet broadcast · **≠** Production GO  

**Companions:** [Audit Ladder](TT-TTG-V9-SECURITY-AUDIT-LADDER-LATEST.md) · [Audit #1](TT-TTG-V9-INTERNAL-AUDIT-WAVE-FINDINGS-LATEST.md) · [Audit #2](TT-TTG-V9-RED-TEAM-AUDIT2-FINDINGS-LATEST.md) · [Monetary Invariant](TT-TTG-V9-MONETARY-INVARIANT-LATEST.md) · [G1–G7 Norm](TT-TTG-V9-REMINT-FINAL-NORM-G1-G7-LATEST.md)

**Scope (read):** `contracts/src/ttg-v9` core (non-mocks) · Constants · GovernanceParams · AtomicDeployer · DeployTopology · Token · Vault · Batch PM · Governor · UUPS · ERC1967 Proxy · KEEP Timelock / P4Cap registry cites  

**Forbidden this wave:** Solidity edits · Mainnet broadcast · `TT_PRODUCTION_GO` claim  

---

## Executive verdict

| Metric | Value |
|--------|-------|
| **OPEN_CRITICAL** | **0** |
| **OPEN_HIGH** | **0** (was 1 · A3-OPEN-01 → **REMEDIATED** via `TtgV9AtomicDeployerMainnet`) |
| Exact Source + Bytecode identity vs workspace (`FOUNDRY_PROFILE=ttg_v9` / `out-ttg-v9`) | **MATCH** (re-freeze **R2_FINAL** after Mainnet deployer) |
| Monetary core (25T · no further mint · 50/35/3/5/7) | **PASS** |
| Official same-tx proxy init (`TtgV9AtomicDeployer` / Mainnet variant) | **PASS** |
| Mainnet Official Governor params | **PASS** — `TtgV9AtomicDeployerMainnet` enforces ≥7200 / ≥50400 blocks |
| KEEP Timelock 48h vs Mock | **PASS if wired to live KEEP** · Mock **out of scope** |
| Full topology (KEEP + Money Path + V8 isolation) | See [Topology Audit](TT-TTG-V9-OFFICIAL-FULL-TOPOLOGY-AUDIT-LATEST.md) — stamp not yet |
| Regression #2 | **REQUIRED** before `V9_MAINNET_READY_STOP` |
| Production GO | **NOT claimed** |

**Verdict:** Exact Candidate monetary + atomic init PASS. **A3-OPEN-01 closed:** Official Mainnet entry is `TtgV9AtomicDeployerMainnet` (rejects LOCAL windows). ①/② keep `TtgV9AtomicDeployer` (LOCAL). Core change after Audit #3 ⇒ **R2_FINAL re-freeze** (old R1_FINAL report not sufficient alone for Mainnet claim). Full Topology stamp still needs KEEP Reality + V8 isolation checklist + Reg #2.

```text
OPEN_CRITICAL = 0
OPEN_HIGH     = 0
```
---

## Exact Candidate pin (identity)

| Field | Value |
|-------|-------|
| Manifest | `evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_R1_FINAL_MANIFEST.json` |
| Frozen at (UTC) | `2026-08-21T03:39:41Z` |
| Tooling git HEAD at freeze | `1826010bb9093e3d991a1de8ecf29467eb56cbd6` |
| Compiler | solc **0.8.36** · profile **`ttg_v9`** · via_ir **true** · optimizer **200** · evm **paris** |
| Workspace re-hash this audit | **15/15 sources MATCH** · **11/11 artifacts MATCH** (UUPS abstract null OK) |

### Core deploy bytecode (Exact Candidate)

| Contract | bytecode_sha256 | deployedBytecode_sha256 |
|----------|-----------------|-------------------------|
| TravelTrustGovernanceTokenV9 | `sha256:35fa85101c761e626a0ee1d102dccce0a7ea575a2a583a7a0e715c4a070be32d` | `sha256:1617d2bdb8c5ff26751212d20cb79f8d01413bc62f4f66cd9cb5e0d3f05471f6` |
| TtgPublicSaleVault | `sha256:484a39528ceb020cc4fc68e0b74bd4dd0cd74e1d0c38121f84adaf6eade5a004` | `sha256:eafd76ccb0e4dfde9d7def3dd9ef5aabf567fefefe025d2d1be495ed18ef5099` |
| TtgBatchPrimaryMarket | `sha256:6c9169e28e7e72161ebb79edb652d5bb036a60714f5deeabfdae254e424780c8` | `sha256:6522990ca50e9de79d85b13c03992019eb1e67631a68d6f2e090a825dea7dbc2` |
| TravelTrustGovernorV9 | `sha256:679064b0f147a380f7b84966ba1bb14f2a868c4e8ecbbc579e003d7550e7cca3` | `sha256:b002e0b6af91db50de33d1afb82a7fdeb8a1ab4ba5dff2ae2e527d8e1ee027e5` |
| TtgV9ERC1967Proxy | `sha256:fb20b48237bbfc9b0c2a460eaf52713c4b255d8f19363db24c38feed0ccd5944` | `sha256:4da5bb158b9197e44be6e723c5aa0ebd5cbf58f22b4925186ca407dfb8c1a596` |
| TtgV9AtomicDeployer | `sha256:9ddb14c07a8d1008b245cda8ac00bd32bcdda6bbbc32b1ebf0b731adde4d291b` | `sha256:82003e86e0ca5fc794611b37a5824d0ce5dab795a67bc9e67f7761f0d95c01ea` |

**Out of scope for Mainnet bytecode (manifest):** `MockV9Timelock` · `MockV9Erc20` · `*V2Harness` · Sepolia rehearsal scripts.

---

## Q1 — Are Exact Source + Bytecode hashes the set that will be deployed?

| Check | Result |
|-------|--------|
| Manifest sources re-hash vs disk | **YES — MATCH** |
| Manifest artifacts vs `contracts/out-ttg-v9` | **YES — MATCH** |
| Official entry that embeds those artifacts | **`TtgV9AtomicDeployer` constructor → `TtgV9DeployTopology.deploy`** |
| Anything else may be deployed by mistake | Manual multi-tx Topology / wrong profile / Mock Timelock / non-`ttg_v9` rebuild |

**Release answer:** **Yes**, for Official Mainnet V9 Token / Vault impl+proxy / PM impl+proxy / Governor **bytecode identity**, **if and only if**:

1. Build with **`FOUNDRY_PROFILE=ttg_v9`** (solc 0.8.36 · via_ir · optimizer 200 · paris), and  
2. Deploy via **`TtgV9AtomicDeployer`** (or a single-tx Topology call equivalent), and  
3. Constructor args are **KEEP** Timelock · **KEEP** P4Cap · Mainnet USDC · intended Guardian / Team / Marketing / Treasury.

Constructor addresses are **not** in bytecode hashes — wrong KEEP/P4Cap/USDC is a **wiring** failure, not a hash mismatch.

**Stamp:** Exact Candidate **is** the deploy identity. Do not Mainnet-broadcast from a dirty rebuild without re-freeze + re-Audit #3.

---

## Q2 — Is 25T `MAX_SUPPLY` / NO further mint real?

| Evidence | Result |
|----------|--------|
| `TravelTrustGovernanceTokenV9.MAX_SUPPLY = 25_000_000_000_000 ether` | **YES** |
| Constructor credits sum checked `== MAX_SUPPLY` else `GenesisSumMismatch` | **YES** |
| `totalSupply` only decreases via `_burn` / `protocolBurn` | **YES** |
| ABI functions named mint / mint selectors in deployedBytecode | **ABSENT** |
| Token non-proxy (no UUPS on Token) | **YES** |
| Monetary Invariant companion | Aligns · burns may lower supply; **no increase** |

**Release answer:** **YES — real in Exact Candidate Token bytecode.** No further mint path for strangers, Timelock, Guardian, Vault, or PM.

---

## Q3 — Are genesis splits 50 / 35 / 3 / 5 / 7 exact in code?

| Bucket | BPS (Constants) | Absolute wei (Token constructor) | % of 25T |
|--------|-----------------|----------------------------------|----------|
| PublicSaleVault | 5000 | `12_500_000_000_000 ether` | 50% |
| daoTimelock | 3500 | `8_750_000_000_000 ether` | 35% |
| Team | 300 | `750_000_000_000 ether` | 3% |
| Marketing | 500 | `1_250_000_000_000 ether` | 5% |
| Treasury | 700 | `1_750_000_000_000 ether` | 7% |
| **Sum** | **10000** | **`MAX_SUPPLY`** | **100%** |

Constants BPS amounts equal absolute Token credits (`MAX * bps / 10000`). Public batch caps sum to 12.5T Public inventory (pinned absolute wei in Constants — not derived at runtime from bps).

**Release answer:** **YES — exact.**

---

## Q4 — Proxy implementation / admin wiring: AtomicDeployer + topology same-tx init?

| Step (Topology order) | Same AtomicDeployer tx? | Admin / authority |
|-----------------------|-------------------------|-------------------|
| Vault impl + ERC1967 proxy (`initData=""`) | **YES** | Implementation slot set; not initialized yet |
| Token constructor credits Vault proxy 12.5T | **YES** | Token immutable |
| `vault.initialize(token, timelock)` | **YES — same call** | `admin = KEEP timelock` |
| PM impl + proxy **with** `initialize(...)` | **YES** | `timelock` · `guardian` · `usdcTreasury=P4Cap` · vault bound in PM storage |
| Governor constructed | **YES** | Votes = Token · Timelock = KEEP · **LOCAL** on ①/② `AtomicDeployer` · **MAINNET floors** on `AtomicDeployerMainnet` |

`TtgV9AtomicDeployer` NatSpec: closes RT2-OPEN-01 (empty-init front-run across txs). Topology NatSpec: empty initData safe **only** inside this same call.

Vault `_authorizeUpgrade` = `onlyAdmin` (Timelock). PM `_authorizeUpgrade` = `onlyTimelock`. UUPS `upgradeToAndCall` rejects implementation-context (`UUPSUnauthorizedCallContext`). Proxy has **no** separate ProxyAdmin — upgrade authority lives in impl storage.

**Not inside AtomicDeployer (post-tx Timelock ops):** `vault.bindMarket(pm)` · `seedBatchesFromNorm` · `Timelock.setGovernor` · `setAllowedExecutionTarget` for vault/pm/governor.

**Release answer:** **YES for Official atomic path** — proxy create → credit → initialize are same-transaction. Manual split-tx empty-init remains **forbidden** (operator misuse · not Official Exact Candidate path).

---

## Q5 — Governor / Timelock / Guardian / P4Cap wiring risks (KEEP 48h vs Mock)?

| Surface | Exact Candidate / Norm | Mainnet risk |
|---------|------------------------|--------------|
| **Timelock** | KEEP `GovernanceTimelock` `0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7` · registry `delay_hours_planned: 48` · admin Safe | **PASS if this address is passed into AtomicDeployer** · delay is constructor-immutable on KEEP — **preflight `delay() == 172800`** before cutover |
| **MockV9Timelock** | Manifest **out of scope** · `bootstrapCall` instant admin exec | **FORBIDDEN on Mainnet** · would collapse delay + enable bootstrap rug |
| **Governor** | ①/② LOCAL via `AtomicDeployer` · Mainnet via `AtomicDeployerMainnet` (≥7200/50400) | **PASS** if Mainnet uses Mainnet factory |
| **Guardian** | PM `pause` only · `unpause` Timelock-only | Grief sale until Timelock unpauses · inventory recoverable via `closeBatchReturn` |
| **P4Cap** | PM `usdcTreasury` = constructor arg · KEEP `0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF` | Wrong sink = permanent USDC mis-route · **wiring hard gate** |
| **USDC** | Mainnet Circle USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | Must not pass Mock ERC20 |
| **Timelock admin `schedule`** | Dual path with Governor `scheduleByGovernor` · delay still applies | Trusted democratic bypass · not delay bypass (Audit #2 PARTIAL) |
| **`setGovernor` / allow-list** | KEEP Timelock **admin immediate** (no delay) | Fast cutover possible · also fast mis-bind if Safe compromised |

**Release answer:** **KEEP Timelock 48h is the correct companion** (not Mock). Exact Candidate does **not** embed Timelock bytecode — wiring must pin live KEEP + verify delay on-chain. Official Mainnet Governor windows come from **`TtgV9AtomicDeployerMainnet`** (A3-OPEN-01 remediated).

---

## Q6 — Deploy order takeover windows?

| Window | External steal of 12.5T? | Notes |
|--------|--------------------------|-------|
| Official AtomicDeployer single tx (proxy → token → initialize) | **CLOSED** | RT2-OPEN-01 remediated |
| Manual multi-tx `Proxy(impl,"")` then later `initialize` | **OPEN if misused** | Runbook forbid · not Official path · residual Info vs Exact Candidate |
| After AtomicDeployer, before `bindMarket` | **No stranger pull** | `market == 0` · `onlyMarket` pull blocked · admin=Timelock only |
| `bindMarket` / `seedBatchesFromNorm` on KEEP | Requires Timelock **schedule → delay → execute** | ~48h latency · Timelock can bind attacker market only if admin/gov schedules it (**trusted**) |
| Before allow-list vault/pm | Schedule to those targets reverts `TargetNotAllowed` | Reduces accidental Timelock surface |
| Governor LOCAL left Official | Mitigated | Use `AtomicDeployerMainnet` on Mainnet (A3-OPEN-01 closed) |

**Release answer:** Official atomic path **closes** the empty-init takeover. Residual windows are **Timelock/ops trust** and **forbidden manual multi-tx**, not stranger race on Exact Candidate Official entry.

---

## Q7 — Critical / High blockers on Exact Candidate?

### CRITICAL — none

No Critical monetary, mint, or Official-path empty-init front-run remains on Exact Candidate.

### HIGH — open

#### A3-OPEN-01 — Official AtomicDeployer hard-bakes LOCAL Governor voting windows · **REMEDIATED**

| Field | Value |
|-------|-------|
| **Severity** | was High → **closed** |
| **Fix** | `TtgV9AtomicDeployerMainnet` + `deployWithGovernorParams` · floors `VOTING_DELAY_BLOCKS_MAINNET=7200` · `VOTING_PERIOD_BLOCKS_MAINNET=50400` · rejects LOCAL |
| **①/②** | `TtgV9AtomicDeployer` may still use LOCAL (rehearsal only) |
| **Freeze** | Core change ⇒ **`V9_AUDIT_CANDIDATE_R2_FINAL`** (do not Mainnet-claim on R1_FINAL alone) |

### CONDITIONAL / RELEASE GATES (not extra OPEN_HIGH counts)

| ID | Item | Disposition |
|----|------|-------------|
| A3-G-01 | Regression #2 Sepolia full lifecycle | **REQUIRED** per manifest `sepolia_regression2` before `V9_MAINNET_READY_STOP` |
| A3-G-02 | Preflight KEEP `delay() == 172800` | **REQUIRED** cast on Mainnet Timelock |
| A3-G-03 | Constructor args = KEEP Timelock · KEEP P4Cap · Mainnet USDC · real Guardian/ops | **REQUIRED** wiring checklist |
| A3-G-04 | Post-atomic: allow-list · `bindMarket` · `seedBatchesFromNorm` (not rehearsal) | **REQUIRED** Timelock ops · no Mock bootstrap |
| A3-G-05 | Manual multi-tx empty-init | **FORBIDDEN** |
| A3-G-06 | Owner written Mainnet auth | **REQUIRED** · auto Production GO **FORBIDDEN** |

### Trusted / design residuals (not OPEN Critical/High)

| Item | Severity |
|------|----------|
| Compromised Timelock admin upgrades Vault/PM or rebinds market | Trusted High (Audit #2 PARTIAL) |
| Timelock admin `schedule` without Governor PASS (delay remains) | Medium design |
| Guardian pause grief | Medium design |
| Ops 15% concentration vs 1% quorum | Accept / policy |

---

## Counts roll-up

```text
OPEN_CRITICAL = 0
OPEN_HIGH     = 0   # A3-OPEN-01 REMEDIATED (TtgV9AtomicDeployerMainnet) · re-freeze R2_FINAL
OPEN_MEDIUM   = 0
RELEASE_GATES = A3-G-01…G-06 (ladder / wiring / Owner auth) + Full Topology matrix
MATCH         = Exact Source + Bytecode vs workspace ttg_v9 (R2_FINAL)
MONETARY      = PASS (25T · NO_MINT · 50/35/3/5/7)
ATOMIC_INIT   = PASS (Official path)
MAINNET_GOV   = PASS (Mainnet factory floors)
```

---

## Mainnet Release Auditor conclusion

**R2_FINAL** closes A3-OPEN-01 with a dedicated Mainnet atomic factory. Do **not** treat this as Production GO or Mainnet broadcast auth. Complete Regression #2 · KEEP/V8 **Full Topology** matrix · optional external firm on **same** frozen bytes · Owner written auth before Mainnet.

**Stamp:** `TTG_V9_MAINNET_RELEASE_AUDIT3` · `OPEN_CRITICAL=0` · `OPEN_HIGH=0` · candidate **`V9_AUDIT_CANDIDATE_R2_FINAL`**  
**≠** `V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS` until KEEP + Money Path + V8 isolation gates close.
