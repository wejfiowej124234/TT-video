# TT · Wait Window · R-PUBLIC-COLD-START-GOVERNED-1 · CLOSED（LATEST）

**STATUS:** `CLOSED`（产品）· **≠** Seal · **≠** GO  
**Stamp:** `2026-08-11T08:02:00Z`  
**Parent:** [`R-PUBLIC-DATA-ISOLATION-1`](./TT-WAIT-WINDOW-R-PUBLIC-DATA-ISOLATION-1-LOCAL-PREP-LATEST.md)

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

| 项 | 结果 |
|----|------|
| GAP | consumer 读基表 `ops_cold_start_campaigns` 缺 `publish_status='published'` |
| FIX | `governed_campaign_surfaces_v1` + `governed_campaign_items_v1` |
| Official | 同 tip `deployment-01KZQX0AK0QW5A92JBB7B00N8E` |
| RV | `GET …/cold-start/surfaces/home` **200** · campaign=null（无已部署 published 活动 · **PROBE_CLEAN ≠ 有活动 CLOSED 证伪**） |
| Track1 | undisturbed |

*Sebastian Ward · Solo*
