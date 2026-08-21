# TT · TTG V9 Monetary Invariant (FROZEN)

**STATUS:** `MONETARY_INVARIANT_FROZEN` · binds all future V10/V11/V12 product upgrades  
**NOT** Production GO · **NOT** a requirement that `totalSupply` forever equals 25T  
**Companions:** [Final Norm G1–G7](TT-TTG-V9-REMINT-FINAL-NORM-G1-G7-LATEST.md) · [Full Remint Design](TT-TTG-V9-FULL-25T-REMINT-DESIGN-LATEST.md)

---

## Canonical statement (English · Official)

> **Genesis Supply: 25,000,000,000,000 TTG. No additional TTG may ever be minted after genesis. Protocol, governance, treasury, distribution, primary-market, pricing, vesting, burn and operational rules may evolve through authorized governance and upgrade mechanisms, provided no upgrade can create TTG beyond the original genesis supply.**

**Machine form:** `MAX_SUPPLY = 25T` · **`NO_FURTHER_MINT`**  
**Not:** “circulating supply always equals 25T” (burns may lower `totalSupply`).

---

## Architecture: coin fixed · system evolves

| Layer | What | Upgrade? |
|-------|------|----------|
| **Immutable monetary core** | Token contract · genesis mint · `MAX_SUPPLY` · no mint path · no token proxy | **Never upgrade the Token** |
| **Upgradeable business layer** | Vault · Batch PM · sale windows · pause/rescue · Governor wiring · Indexer/API · UI · risk · Money Path (independent) | **Yes**, via Timelock / Governor as designed |

**V9 goal:** end the remint cycle. Future economic/product changes do **not** require a new TTG.

---

## Must never change via any upgrade (hard forbidden)

| Invariant | Binding |
|-----------|---------|
| Genesis / `MAX_SUPPLY` | **25,000,000,000,000** TTG |
| Further mint | **Forever forbidden** (no owner/admin/minter/backdoor) |
| Genesis economic credit | Initial 50/35/3/5/7 **as executed on-chain at genesis** (history immutable) |
| Public ceiling | Upgrades **must not** create TTG beyond genesis · **must not** invent a new Public allocation of freshly minted TTG |
| Settled sale history | Opened/completed batch fills, sold amounts, execution prices — **immutable history** |
| Public sale cap from mint | Sales may only draw from **existing** Public custody (originally 12.5T genesis to Vault, less sold/burned/returned accounting) — **no mint to enlarge Public float** |
| Burn authority | **No** admin/Guardian/PM path that bypasses Governor→Timelock for **protocol** inventory burn |
| Token upgradeability | Token remains **non-proxy** |

---

## May evolve under governance / Timelock (allowed)

| Surface | Allowed |
|---------|---------|
| PM / Vault bugfix, gas, events, Indexer hooks | Yes (UUPS · Timelock) |
| Unopened batch schedule / price params | Yes · Timelock / governance rules already Norm’d |
| New Public **batches** | Yes · **only** from remaining Public vault inventory (no new mint) |
| Pause / Guardian / rescue (non-TTG) safety logic | Yes |
| Governor replace / quorum / thresholds | Yes · via Timelock cutover |
| Ops redistribution of **already-held** balances (Team/Marketing/Treasury/DAO) | Yes · ordinary transfers / vesting / Safe · **not** mint |
| Burn policy refinements | Yes · still no unauthorized protocol burn |
| Money Path / FeeRouter / Settlement | Yes · independent KEEP/upgrade tracks |
| Frontend / API / `/meta` | Yes |

**Not “primary market frozen forever”:** unopened windows remain governable; **opened/settled** economics are history.

---

## Permanent hard constraint (one sentence)

**Any future upgrade must not increase TTG max supply, must not create new Public allocation via mint, must not rewrite settled primary-market history, and must not bypass Governor/Timelock to gain mint or protocol-inventory burn power.**

---

## Lifecycle math

```text
genesis:     totalSupply = MAX_SUPPLY = 25T
thereafter:  totalSupply never increases
             totalSupply may decrease only via authorized protocolBurn
V10…Vn:      business rules may change; Token stays the Official asset
```
