# V9 ProjectPool Governance Cap V2

**Wave:** `V9_PROJECT_POOL_GOVERNANCE_CAP_V2`  
**Sepolia rehearsal + security:** **PASS** · `OPEN_C/H/M=0` · Exact-Match frozen  
**Mainnet Cutover:** **STOP** · `PM_USDC_TREASURY_IMMUTABLE` · Owner auth recorded · **no Mainnet V2 broadcast**  
**Guide Bond / Staging continuation:** **PAUSED**  
**`TT_PRODUCTION_GO`:** NO_GO · independent  

Evidence: [`evidence/GO_ttg_v9_project_pool_v2_mainnet/`](../../evidence/GO_ttg_v9_project_pool_v2_mainnet/) · `V9_PROJECT_POOL_V2_MAINNET_CUTOVER_STOP`

## Mainnet adjudication (read-only · FINAL)

| Field | Value |
|-------|-------|
| Address | `0x7B21b421981A3B61cc08c8E22D4fd690E457Df37` |
| Verdict | **`NON_UPGRADEABLE`** |
| Evidence | EIP-1967 impl/admin/beacon slots = `0x0` · `proxiableUUID`/`implementation` revert · source is plain constructor contract (no UUPS) · runtime size 1867 |
| owner / spender | SoloTimelock `0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f` |
| USDC balance | **0** (clean LEGACY cutover candidate) |
| Do not infer from | old `GovernanceTreasuryP4Cap` Proxy |

Machine: [`V9_PROJECT_POOL_UPGRADEABILITY_ADJUDICATION.json`](../../evidence/GO_ttg_v9_audit/V9_PROJECT_POOL_UPGRADEABILITY_ADJUDICATION.json)

## Owner economic lock (this wave)

| Item | Rule |
|------|------|
| Accounting window | **90 days** FROZEN (not governance-tunable this wave) |
| Default `capBps` | **3000** (30%) |
| Governance range | **0 … 10000** bps (0% … 100%) |
| Who may `setCapBps` | **Only** Governor → vote → **SoloTimelock 48h** → execute |
| EOA / Guardian / Admin | **MUST revert** |
| Cap change effect | Affects **subsequent** `spend` only |
| `p4SpentInPeriod` / period start | **NOT reset** by `setCapBps` |
| If new cap &lt; already spent | Further spend in period **reverts**; historical spends not clawed back |

KEEP unchanged: TTG 25T / no-mint · five-batch PM · Fee 5% · 45/55 · RoleStake · Governor/Timelock bodies · Vault.

## Path (because NON_UPGRADEABLE)

```
NEW TtgV9ProjectPoolV2 (UUPS · Timelock owner)
   ↓ Local Forge PASS
   ↓ Sepolia rehearsal (Owner auth)
   ↓ AI / security regression
   ↓ Owner Mainnet auth → deploy V2 + cutover sinks
LEGACY Phase1 ProjectPool 0x7B21… (label only; balance 0)
```

V2 is **UUPS** so future pool logic need not repeat a LEGACY redeploy. Cap tuning itself is `setCapBps`, not an upgrade.

## Local Candidate

| Artifact | Path |
|----------|------|
| Contract | `contracts/src/ttg-v9/TtgV9ProjectPoolV2.sol` |
| Tests | `contracts/test/ttg-v9/TtgV9ProjectPoolV2.t.sol` |
| Forge | `FOUNDRY_PROFILE=ttg_v9 forge test --match-contract TtgV9ProjectPoolV2` |

## Cutover (Mainnet · Owner auth recorded · STOP)

Owner authorized `V9_PROJECT_POOL_V2_MAINNET_CUTOVER`. Preflight Exact-Match bytecode **MATCH**; Timelock admin key **MATCH**; legacy USDC **0**.

**STOP before broadcast:** live `TtgBatchPrimaryMarket` (`0xc714…`) has **no** `setUsdcTreasury` — `usdcTreasury` is initialize-only and still `0x7B21…`. FeeRouter `setProjectPool` exists (Timelock 48h). Authorized wording requires PM + FeeRouter both point to V2 without ad-hoc source change → **funds-routing mismatch**.

| Path | Status |
|------|--------|
| Deploy Exact-Match V2 | Ready · held |
| FeeRouter → V2 via SoloTimelock | Possible after V2 deploy |
| PM USDC sink → V2 | **BLOCKED** without separate Exact-Match PM UUPS patch (`setUsdcTreasury` only) or Owner written FeeRouter-only carve-out |

## Forbidden now

Mainnet V2 broadcast until Owner resolves PM path · Production GO · mutating Phase1 / PM bytecode in place mid-cutover · EOA-settable cap · resetting spent on cap change · resuming Guide Bond as blocking this track.
