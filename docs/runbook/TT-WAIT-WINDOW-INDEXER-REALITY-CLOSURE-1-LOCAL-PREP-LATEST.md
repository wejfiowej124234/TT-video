# TT · Wait Window · INDEXER-REALITY-CLOSURE-1（LATEST）

**STATUS:** `INDEXER_REALITY_CLOSED` · **Stamp:** `2026-08-12T06:05:21Z`  
**Machine:** [`TT-WAIT-WINDOW-INDEXER-REALITY-CLOSURE-1-LOCAL-PREP-LATEST.json`](./TT-WAIT-WINDOW-INDEXER-REALITY-CLOSURE-1-LOCAL-PREP-LATEST.json)  
**Evidence:** [`evidence/GO_indexer_reality_closure/IRC1-CLOSED-LATEST.json`](../../evidence/GO_indexer_reality_closure/IRC1-CLOSED-LATEST.json)

**`TT_PRODUCTION_GO`:** `NO_GO` · Hard Gate **REFUSED** · **≠ Production GO**

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Verdict

| Gate | Result |
|------|--------|
| Archive RPC `chainId=1` + Track1 `eth_getLogs` | **PASS** |
| Official Wired Factory `0xEE0B…` + bootstrap `25735000` | **PASS** |
| Continuous tick (no gap) covering execute/release + confirm | **PASS** |
| Real ingest EscrowAllowlisted + **Released** + **FeeLegReceived** | **PASS**（events_cached=4） |
| Chain Completed(3) · isEscrow=true · USDC=0 | **PASS** |
| Restart persistence (Fly volume `/app/data`) | **PASS**（last_block=25735299 重启后仍在） |
| Idempotent tick/replay | **PASS**（events 保持 4） |
| RPC fail-closed | **PASS_OBSERVED**（无自动 failover 实现；错误 fail-closed） |
| Public gates regression | **PASS** |

## Config retained（env · 非写死）

- `INDEXER_ETH_GET_LOGS_MAX_BLOCK_SPAN=10`（Alchemy Free 适配）
- `INDEXER_TICK_MAX_BLOCKS_PER_SCAN=50`
- `INDEXER_EXTRA_ESCROW_ADDRESSES=0x9996…`（Track1 Reality escrow supplemental）
- Volume `tt_api_prod_data` → `/app/data`

## Owner 下一步（串行 · 禁止跳）

1. **轮换**截图暴露的 Alchemy API key → 更新 Fly `CHAIN_RPC_URL`
2. Cert / Owner UAT → WC 真机 → Legal/支付 PRE_GO → Final Regression/Soak → fresh Hard Gate  
3. **禁止** FeeRouter / Track2 / 83 · **禁止**改写 FTB/Mainnet · **禁止**自动翻 GO

---

*Sebastian Ward · Solo · INDEXER_REALITY_CLOSED · NO_GO*
