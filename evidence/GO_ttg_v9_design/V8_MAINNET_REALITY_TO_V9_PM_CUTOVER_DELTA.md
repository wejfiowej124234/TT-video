# V8 Mainnet Reality → V9 PM Cutover DELTA

**Stamp class:** READ-ONLY audit · **NOT** broadcast · **NOT** `TT_PRODUCTION_GO`  
**Reality:** [`V8_MAINNET_REALITY_READONLY_20260821.json`](./V8_MAINNET_REALITY_READONLY_20260821.json)  
**Candidate:** V9 Batch PM + PublicSaleVault after `V9_PM_LOCAL_PASS` + `V9_PM_SEPOLIA_PASS_STOP`  
**Keep:** live TTG · Governor · Timelock · P4Cap · Money Path · Region-83

## 1 · Unchanged (KEEP)

| Surface | Live | V9 target |
|---------|------|-----------|
| TTG 25T | `0x0EC40c8a…3602` | KEEP · no remint |
| Ops 3/5/7 | already on three EOAs | KEEP balances |
| DAO 35% | Timelock `0x50F0…22f7` | KEEP |
| P4Cap USDC sink | `0xfB906…9BbF` · Timelock owner/spender · 3000 bps / 90d | V9 `usdcTreasury` MUST = P4Cap |
| Governor | `0xD581…787F` · proposalCount=0 | KEEP |
| Timelock | delay 172800 · admin Safe `0x9649…40e7` | KEEP |
| Money Path | Wired factory / FeeRouter / SR-FT · Timelock owner/guardian | KEEP |
| USDC | `0xA0b8…eB48` | KEEP |

## 2 · Must change at cutover

| Item | V8 Reality | V9 Target |
|------|------------|-----------|
| Public inventory | 12.5T **inside OLD PM** `0x882Ad…` | `TtgPublicSaleVault` + Batch PM |
| Quote | 1 USDC = 100,000 TTG | 1/3/5/7/9 µUSDC per TTG (batch1 ⇒ 1 USDC = 1,000,000 TTG) |
| PM instance | fusion_v8 | **New** Batch PM (D2) |
| Windows | 3 rounds | Five caps · current-batch-only |
| Close unsold | N/A | RETURN default · BURN Timelock-only |
| Pause | none on OLD PM | Timelock + Guardian |
| `/meta` primary_market | `0x882Ad…` | New V9 PM · same-day www |

## 3 · P0 · MIGRATE-01 (blocks broadcast)

OLD PM source (`TtgMemeDenomPrimaryMarket`) and live eth_call show **no** owner/pause/withdraw/rescue; EIP-1967 slots empty. Inventory exit = **`purchase` only**. Timelock cannot pull 12.5T into Vault under current Norm.

Owner options before broadcast auth: **A** prove upgrade+rescue · **B** Norm amendment (e.g. DAO fund Vault) · **C** parallel/remint (remint forbidden) · **D** STOP.

## 4 · Verdict

| Gate | Result |
|------|--------|
| Reality read-only | PASS |
| `/meta` vs L7 V8 addresses | PASS |
| V9 local+Sepolia candidate | PASS |
| Inventory migrate executable | HOLD · MIGRATE-01 |
| Broadcast | HOLD |

`V9_PM_MAINNET_CUTOVER_READY` = audit pack complete · **≠** deploy authorization.
