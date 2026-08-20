# TT-V65 Production Runtime Reality Verification · LATEST

**Phase:** ③ Runtime Reality check · **NOT** Production GO  
**Verdict:** `V65_OPEX_BAKED_IN_PRODUCTION_WEB_RUNTIME_VERIFIED`  
**TT_PRODUCTION_GO:** `NO_GO`  
**Stamp:** `evidence/GO_v65_production_runtime_reality_verification/20260803T023036Z/`  
**Pre-redeploy stamp (root cause):** `20260803T020818Z`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Bottom line

Cause **① confirmed then closed:** V65 OPEX was Audit/WT-only; Production Web pin `075a295f…` never had the bytes.  
After commit `7a37d10e…` + minimal Web redeploy, **www Runtime now embeds OPEX** (chunk proof PASS). Web3 pin / Sidebar IA untouched. **Still `NO_GO`.**

| Truth | Pre | Post |
|-------|-----|------|
| A Audit | After 96.7 PASS | unchanged |
| B Git | pin `075a295f` = stubs | tip `7a37d10e` = OPEX committed |
| C Runtime | stubs in `39847-18c0…` | OPEX in `39847-0ec0…` · old chunk **404** |

## Live Production Web identity

**OPEX bake identity（历史闭因 · stamp `20260803T023036Z`）**

| Field | Value |
|-------|--------|
| Host | `https://www.web3-ttg.com` |
| git_sha / artifact_sha | `7a37d10efa66630aba686e569227a3b244ed41f9` |
| build_time | `2026-08-03T02:17:31Z` |
| identity_source | `docker-bake` |
| Web3 | `PSG-REL-20260720-WEB3-CAND-V2` LOCKED |

### Tip advance（Batch Closure 生效前末次碎片上线）

| Field | Value |
|-------|--------|
| Current tip | `87a5686f7a6f77e94075d25a5f4bc036ef3a71d9` |
| build_time | `2026-08-03T03:27:00Z` |
| Cause | Workbench polish（modules fold / Domain Health truncate / CN ops copy） |
| Boundary | **末次碎片 Deploy** · 自 Batch Release Closure `ACTIVE` 起 Admin UX **禁止**再单问题上线 |
| OPEX bake | 仍有效（tip 前进不否决 OPEX 入 Runtime） |
| Process | [`TT-V65-BATCH-RELEASE-CLOSURE-LATEST.md`](./TT-V65-BATCH-RELEASE-CLOSURE-LATEST.md) · Batch **V65.1** `INVENTORY_OPEN` |

## Chunk OPEX proof

| Needle | Result |
|--------|--------|
| `Ops Leaf Data Source Title` | MISS |
| `admin_orders_op_more` | HIT |
| `已连接真实数据库` | HIT |
| `Connected to real database` | HIT |

CDN: new chunk `cache-control: public, max-age=31536000, immutable` · LM `2026-08-03T02:20:36Z`.

## Cause rank (closed)

1. **Fixes never in Production Web build (Git)** — CONFIRMED → **FIXED** by commit + redeploy  
2. tip≠bytes / no bake — CONFIRMED_VARIANT → **FIXED** (new tip baked)  
3. CDN/browser cache — SECONDARY; old hash 404 proves rotation  
4. UI vs locale data — locale keys now in Runtime chunk

## Honest boundary

Runtime OPEX bake **≠** Production GO · **≠** logged-in Admin screenshot UAT (still AUTH_GATED).  
Do not treat Audit After 96.7 alone as www proof.
