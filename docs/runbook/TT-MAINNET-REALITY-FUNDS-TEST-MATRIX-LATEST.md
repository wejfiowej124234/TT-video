# TT · Mainnet Reality Funds Test Matrix（LATEST）

**Machine:** [`TT-MAINNET-REALITY-FUNDS-TEST-MATRIX-LATEST.json`](./TT-MAINNET-REALITY-FUNDS-TEST-MATRIX-LATEST.json)  
**STATUS:** `PARTIAL_IN_FLIGHT_WAITING_TIMELOCK_ETA`  
**Living overlay:** Track2 1 USDC **CLOSED_REALITY** Owner A · GO remaining = Owner written verdict · do not recast historical STATUS  
**Inventory / Fill:** **PASS**  
**Budget:** **10 USDC × 1** · `TT_PRODUCTION_GO=NO_GO`

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**

## Wallets (Owner)

| Role | Address |
|------|---------|
| A · Deploy + Traveler | `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` |
| B · TTG propose + Guide | `0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736` |

---

## Stages

| ID | Stage | Status |
|----|-------|--------|
| A | Inventory read-only | **PASS** |
| B | Owner Settlement/Fee/Wired fill | **PASS** |
| C1 | Bilateral create (Wired factory) | **PASS** · escrow `0x9996FBD5…B8d6` |
| C2 | USDC Escrow deposit 10 | **PASS** |
| C3 | Dual confirm | **PASS** |
| C4 | Settlement → Fee distribute | **WAITING** setEscrow execute |
| C5 | FE / API / Indexer / Event reconcile | **PARTIAL** · API/FE baked |
| C6 | Balance table 10 USDC = net + fees | **WAITING** release |
| D | Timelock sensitive op × 1 | **SCHEDULED** · ETA `2026-08-11T23:45:35.000Z` |

**setEscrow opId:** `0xe1d51e09d8c5df11bc83330d5d6c545d3431b3107d6de7652f2c5d840890c116`  
**Evidence:** `evidence/GO_mainnet_money_path/MAINNET-REALITY-BILATERAL-LATEST.json`

---

## Hard holds

| Gate | Value |
|------|-------|
| `TT_PRODUCTION_GO` | `NO_GO` |
| Hard Gate | `REFUSED` |
| Public USER_FUNDS | `0` |
| Production Ready | `FORBIDDEN` |

After ETA: `Timelock.execute(opId)` → `Escrow.release()` → Timelock settle ops → seal full Reality → **reassess** GO only.
