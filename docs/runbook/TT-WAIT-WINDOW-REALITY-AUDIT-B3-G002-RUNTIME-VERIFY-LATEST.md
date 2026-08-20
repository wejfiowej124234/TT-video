# TT · Wait Window · Reality Audit · B3-G-002 Guide Detail Runtime Verify（LATEST）

**STATUS:** `CLOSED` · **Verdict:** `PASS`  
**Stamp:** `2026-08-11T00:35:00Z`  
**Parent:** [`TT-WAIT-WINDOW-REALITY-AUDIT-B3-GAP-INVENTORY-LATEST`](./TT-WAIT-WINDOW-REALITY-AUDIT-B3-GAP-INVENTORY-LATEST.md)  
**Machine:** [`TT-WAIT-WINDOW-REALITY-AUDIT-B3-G002-RUNTIME-VERIFY-LATEST.json`](./TT-WAIT-WINDOW-REALITY-AUDIT-B3-G002-RUNTIME-VERIFY-LATEST.json)

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

| Check | Result | Observed |
|-------|--------|----------|
| List ↔ Detail API 字段对拍 | **PASS** | 11/11 guides · `hourly_rate` / `public_title` / `avatar_url` 键齐全且 list=detail |
| Omar detail API | **PASS** | `hourly_rate=85` · `public_title` 有值 · `avatar_url` OCS 路径非空 |
| Market List UI | **PASS** | Omar **85/hr** 与 API `hourly_rate=85` 一致（及 Carlos 170 / Mia 160 等） |

**Historical:** 首次 tip deploy smoke FAIL = **`HISTORICAL_RESOLVED`**。  
**Frozen:** Mainnet/FTB/Registry/Wired/Track1 · `TT_PRODUCTION_GO: NO_GO`
