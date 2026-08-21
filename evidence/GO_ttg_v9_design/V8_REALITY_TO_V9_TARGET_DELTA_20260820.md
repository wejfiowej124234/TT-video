# V8_REALITY → V9_TARGET_DELTA

**Status:** `DELTA_LOCKED` · evidence `V8_REALITY_READONLY_20260820.json`  
**Writes:** none · **Production GO:** unchanged `NO_GO`

## Reality snapshot (mainnet)

| Fact | V8 live |
|------|---------|
| `totalSupply` | **25T** (18 decimals) |
| Quote | **1 USDC = 100,000 TTG** |
| Ops split 3/5/7 | **Already on-chain** at Owner wallets |
| DAO 35% | Timelock `0x50F0…` |
| Public 50% | **Inside OLD PM** `0x882Ad…` (12.5T) · sold **0/0/0** |
| USDC sink | P4Cap `0xfB90…` · USDC bal **10** · **30% / 90d** |
| Timelock | delay **48h** · governor NEW · admin Safe `0x9649…` |

## Delta

| ID | V8 | V9 target | Later ③ action |
|----|----|-----------|----------------|
| Q01 | 100k TTG/USDC | Batch 1/3/5/7/9 µUSDC · batch1 **1M**/USDC | New Batch PM |
| Q02 | 2T/3T/7.5T rounds | Five absolute amountCaps | New schedule |
| Q03 | Inventory **in** PM | `TtgPublicSaleVault` | Migrate 12.5T PM→Vault |
| Q04 | Flat quote | Freeze price after open | New code |
| Q05 | No window | Current batch only | New code |
| Q06 | Stuck unsold | Close → RETURN default | New code |
| Q07 | WWW V9 / chain V8 | Align on cutover | Disclosure until then |
| Q08 | 15% split | **DONE** | Optional vesting only |
| Q09 | P4Cap sink | **KEEP** | Wire new PM → P4Cap |
| Q10 | Token 0.8.26 | KEEP token · PM ≥0.8.36 | No remint |

Checksum: 0.75+1.25+1.75+8.75+12.5 = **25T** ✓
