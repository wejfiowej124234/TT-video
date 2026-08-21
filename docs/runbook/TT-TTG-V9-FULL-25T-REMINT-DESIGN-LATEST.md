# TT · TTG V9 Full 25T Remint Design (Official successor)

**STATUS:** `V9_REMINT_SEPOLIA_PASS_STOP` · **Final Norm FROZEN** ([G1–G7](TT-TTG-V9-REMINT-FINAL-NORM-G1-G7-LATEST.md)) · **[Monetary Invariant](TT-TTG-V9-MONETARY-INVARIANT-LATEST.md)** · V8 **LEGACY / NO_MIGRATION** · **NOT** Mainnet · **NOT** Production GO  
**Stamp ①:** `evidence/GO_ttg_v9_design/V9_REMINT_LOCAL_PASS.json`  
**Stamp ②:** `evidence/GO_ttg_v9_remint_sepolia/V9_REMINT_SEPOLIA_PASS_STOP.json` · entry `scripts/dev/run-ttg-v9-remint-sepolia.sh`  
**Parent:** `docs/runbook/TT-TTG-V9-UPGRADE-DESIGN-LATEST.md` · `registry/ttg-v9-upgrade-design.v1.yaml`  
**Language:** Solidity NatSpec / comments **English only**

**Monetary north star:** Token fixed (`MAX_SUPPLY=25T` · no further mint) · Vault/PM/Governor/sale/ops **may evolve** under governance — so V10+ should not need another TTG remint.

---

## 0 · Owner locks (this wave)

| Lock | Binding |
|------|---------|
| **Token** | Fixed · one-shot mint **25T** · **permanent no mint** · **no proxy / no UUPS** · **no second remint** · max supply 25T (may decrease only via governance burn) |
| **Upgradeable surface** | **Primary Market + PublicSaleVault** under **Timelock** — not the token |
| **Protocol burn** | **`BURN_GOVERNANCE_ONLY`** — see §2.3 (supersedes “Timelock-explicit BURN”) |
| **Governor** | **NEW** (binds `TTG_V9`) · **Timelock KEEP** |
| **Public 50%** | **Single address** = `TtgPublicSaleVault` (contract) · not an ops EOA |
| **Ops 3/5/7** | Genesis mint **directly** to Owner wallets below |
| **V8** | **LEGACY / NON-OFFICIAL / NO_MIGRATION** (no swap/claim/bridge) · label old addresses forever |
| **Mainnet** | **Forbidden** until ①+② PASS + Hard Gates PASS + Owner written auth |

**Ops wallets (genesis recipients · public):**

| Bucket | % | Amount (TTG) | Address |
|--------|---|--------------|---------|
| Team | 3% | 750,000,000,000 | `0x010365F0835323826569D61D0E13E6F8d25F6828` |
| Marketing | 5% | 1,250,000,000,000 | `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` |
| Treasury | 7% | 1,750,000,000,000 | `0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736` |

---

## 1 · Why remint full 25T (not +12.5T on V8)

| Option | Verdict |
|--------|---------|
| Same token + mint +12.5T | **REJECT** |
| Upgrade V8 PM + migrate | **IMPOSSIBLE** (non-upgradeable · no recovery) |
| **New token · genesis 25T · V9 economics** | **SELECTED** |

V8 TTG `0x0EC40c8a…3602` + OLD PM `0x882Ad…` → **LEGACY only**. Do not migrate inventory. Do not upgrade them.

---

## 2 · Trust model (audit / wallet scanners)

### 2.1 Token = immutable economics

- Non-proxy ERC20Votes  
- Constructor mints **exactly** `25_000_000_000_000 * 1e18` wei once  
- **No** `mint` · **no** owner mint role · **no** upgrade path that could add mint later  
- Explains “无不明增发” better than UUPS-token-without-mint-today  

### 2.2 Business contracts = upgradeable under Timelock

| Contract | Upgrade | Why |
|----------|---------|-----|
| `TtgBatchPrimaryMarket` | **UUPS · Timelock only** | Batch windows / prices may need later adjustment |
| `TtgPublicSaleVault` | **UUPS · Timelock only** | Inventory rules / market bind / rescue policy |
| `TravelTrustGovernor` (new) | Non-proxy OK (or Timelock-bound) | Binds immutable `token=TTG_V9`, `timelock=KEEP` |
| `TTG V9 Token` | **FORBIDDEN** | Fixed forever |

**Sale Norm (initial seed):** five batches · prices 1/3/5/7/9 µUSDC per 1 TTG · current-batch-only · price frozen after a batch opens · Timelock may edit **unopened** batches via upgrade or admin setters · **batch close = RETURN only (no auto / no PM / no Timelock-solo BURN)** · USDC → live P4Cap `0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF`.

### 2.3 Protocol inventory burn = GOVERNANCE_ONLY (LOCKED · Owner 5.1–5.4)

**Copy (5.1 · A):** `maxSupply = 25T` · **no mint** · **optional deflation via governance burn**  
(25T = genesis / max supply — **not** “circulating forever fixed”.)

**True burn (5.2):** Token `protocolBurn` only · **no** `0xdEaD` fallback · failure **reverts**.

**Timing (5.3):** **No burn while any batch is armed and not yet RETURN-closed** (inventory on PM). Calendar window alone does not block vault burns; burning mid-sale of an **armed** batch is forbidden until that batch ends and RETURN completes.

**Token burn ACL (5.4):** **No** public holder `burn()`. Only `protocolBurn` callable by **immutable** `publicSaleVault` or `daoTimelock` (holders of protocol inventory).

```text
Batch end → unsold ALWAYS RETURN → PublicSaleVault
                │
                ▼ (optional, later)
Governor Proposal → TTG Vote → Passed → Queue → Timelock 48h
                → executeGovernanceBurn(amount)
                → Token.protocolBurn (true burn)
                → totalSupply ↓
                → emit GovernanceBurnExecuted
```

| Actor | May decide protocol burn? |
|-------|---------------------------|
| Owner / Team / Marketing / Treasury EOAs | **No** |
| Guardian | **No** — pause only |
| Batch Primary Market | **No** — close = RETURN or **CANCELLED** (unarmed) |
| PublicSaleVault | **No decision** — execution surface only |
| Timelock admin `schedule` alone | **No (policy)** — only via `scheduleByGovernor` |
| **Governor proposal** | **Yes — sole decision entry** |
| Timelock | **Executor only** |

**Batch close events:**

| Case | Event |
|------|--------|
| Unarmed · sold=0 · after end | `BatchCancelledUnarmed` (**not** a burn-looking close) |
| Armed · unsold returned | `BatchClosedReturn` / unsold returned amount |
| Governance destroy vault inventory | `GovernanceBurnExecuted` |

**Supersedes:** Timelock-explicit batch BURN · public ERC20Burnable · dead-address fake burn.

---

## 3 · V8 → V9 final change matrix (LOCKED)

| Component | V8 | V9 | Action |
|-----------|----|----|--------|
| TTG Token | Old 25T · solc 0.8.26 | New 25T · ERC20Votes · no mint · no proxy | **NEW** |
| Public inventory | 12.5T locked in OLD PM | 12.5T in **one** PublicSaleVault | **NEW** |
| Primary Market | Three-round · fixed quote · no recovery | Five-batch · freeze-after-open · **RETURN only** · pause/rescue · **UUPS** · burn via Governor | **NEW** |
| Governor | Bound to old TTG | Bound to `TTG_V9` | **NEW** |
| Timelock | 48h | Same address | **KEEP** |
| P4Cap | USDC gov pool | Same address | **KEEP** |
| EscrowFactory / Settlement / FeeRouter | Money Path | Same logic/addresses | **KEEP** |
| DAO | 35% | 35% = 8.75T **new** TTG → Timelock | **KEEP rule / NEW balance** |
| Ops | Opaque 15% perception | 3 / 5 / 7 to named wallets at genesis | **V9 genesis split** |
| V8 Token + PM | Was Official | **LEGACY only** | No migrate · no upgrade |

---

## 4 · Genesis allocation (chain-visible · sum must equal 25T)

| Destination | Amount (whole TTG) | Wei (18 decimals) |
|-------------|--------------------|-------------------|
| PublicSaleVault | 12,500,000,000,000 | `12500000000000e18` |
| Timelock (DAO) | 8,750,000,000,000 | `8750000000000e18` |
| Team wallet | 750,000,000,000 | `750000000000e18` |
| Marketing wallet | 1,250,000,000,000 | `1250000000000e18` |
| Treasury wallet | 1,750,000,000,000 | `1750000000000e18` |
| **Total** | **25,000,000,000,000** | **`25000000000000e18`** |

**Hard check (deploy / verify):**  
At genesis: `balanceOf(Vault)+balanceOf(Timelock)+balanceOf(Team)+balanceOf(Marketing)+balanceOf(Treasury) == totalSupply() == 25T`.  
Thereafter: `totalSupply()` **never increases** (no mint). It may **decrease** only after a **GOVERNANCE_ONLY** burn execute.

---

## 5 · How “50% in one address” still clears whale / insider scanners

Public 50% **must** sit in **one** address (product requirement). That address is the **Vault contract**, not an EOA.

Block explorers / auditors / users must see:

1. `12,500,000,000,000 TTG → PublicSaleVault` (contract, verified)  
2. Vault may **only** authorize the bound **Batch PM** to pull under sale rules  
3. PM **cannot** arbitrarily transfer the full 12.5T (pull limited to open-batch need · no free `transfer` of inventory)  
4. Timelock `rescue` (if any) emits events · Timelock delay · restricted caller  
5. Team / Marketing / Treasury amounts + addresses published  
6. DAO `8.75T → Timelock` published  
7. On-chain sum **strictly** equals `25,000,000,000,000` TTG  

Label in docs / `/meta` / www: **“Public sale inventory vault (contract)”** — not “team whale wallet”.

---

## 6 · Compiler gate (not “forever 0.8.36”)

| Rule | Binding |
|------|---------|
| Floor | **`solc >= 0.8.36`** (covers screenshot-era bugs incl. `UnsoundSpillInMutualRecursion` fixed in 0.8.36; older banners already fixed earlier) |
| Deploy day | Use **latest stable patch** rechecked against Solidity **bug database** + Etherscan compiler-warning list |
| Gate | **Re-run compiler bug gate** before Mainnet · require **zero** compiler-specific warnings on verify |
| Profile | Foundry `via_ir = true` for V9 |
| Source | Same-day Exact Match · English NatSpec only · no CJK in `contracts/src/ttg-v9/**` |

Do **not** freeze “always exactly 0.8.36” in Norm.

---

## 7 · Hard Gate before Mainnet: V8 = LEGACY only (no migration)

Owner confirmation: V8 **not circulated externally** → **NO_MIGRATION**.

| Gate | Pass if |
|------|---------|
| **HG-V8-LEGACY-LABEL** | Registry + www + wallet metadata mark V8 Token/PM **LEGACY / NOT_OFFICIAL** |
| Migration / snapshot / 1:1 claim | **OUT OF SCOPE** |
| Optional read-only scan | Confirm no unexpected external V8 holders (informational; does not unlock a migrator) |

---

## 8 · Execution ladder (no skip)

| Phase | Work | Stop |
|-------|------|------|
| **①** | TokenV9 + GovernorV9 + UUPS Vault/PM · forge + English/ABI gates | **`V9_REMINT_LOCAL_PASS`** |
| **②** | Sepolia full lifecycle: genesis → allocate → delegate → buy → RETURN · plus separate Governor burn proposal → Timelock execute | `V9_REMINT_SEPOLIA_PASS_STOP` |
| **③ prep** | Mainnet **read-only**: HG-V8-HOLDERS · compiler bug gate · open-source plan · address risk scan | `V9_REMINT_MAINNET_PREGATE` |
| **③ deploy** | Owner written auth only · deploy Token/Vault/PM/Governor · Timelock `setGovernor` · `/meta`+www pin | `V9_OFFICIAL_TOKEN_PIN` |
| **GO** | Separate Owner Production GO | never auto |

**This document does not authorize Mainnet broadcast.**

---

## 9 · Explicit non-goals

- Token UUPS / second remint / any post-genesis mint  
- Migrating or unlocking V8 PM 12.5T  
- Redeploying Money Path / P4Cap / Timelock  
- Chinese NatSpec  
- Agent key custody  
- Auto Production GO  

---

## 10 · One-line Official story (English)

“TravelTrust V9 ships a non-upgradeable max-25T governance token with no mint; unsold public inventory returns to a sale vault by default; any protocol burn requires a Governor vote and Timelock execution. Prior V8 token and market remain legacy.”
