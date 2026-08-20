# TT · Wait Window · B10 Guides Depth · Runtime Verify（LATEST）

**Batch:** `B10-GUIDES-DEPTH`  
**Stamp:** `2026-08-10T13:20:00Z`  
**Official Runtime verify:** **PASS**  
**Batch:** **CLOSED**  
**`TT_PRODUCTION_GO`:** `NO_GO` · **≠** Reality Seal  

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Deploy

| Surface | Result |
|---------|--------|
| `tt-web-prod` | **OK** · tip bake `git_sha=c3eeaf10…` · hydrate + EN display + search + UAT detail gate |
| `tt-api-prod` | **Native G-001 blocked** · migration `20260708120000` checksum drift → crash → **rolled back** to `deployment-01KZBCCCCXMM9RT04P0Z074XG4` |

**G-001 closure path:** FE `hydrateGuideDetailMarketing`（list → detail）直到 migration 卫生允许 API 再发。

---

## Runtime checks

| ID | Result | Evidence |
|----|--------|----------|
| **B10-G-001** | **PASS**（FE hydrate） | Omar detail：`Omar` · `85/hr` · avatar path from list |
| **B10-G-002** | **PASS** | `/guides` cards `Omar`/`Dubai`；detail `Omar` · `Dubai · AE` |
| **B10-G-003** | **PASS** | Search UI；无匹配 → Clear search |
| **B10-G-004** | **PASS** | 列表无 UAT；UAT id → **Guide not found** |
| **B10-G-005** | **CLOSED** | Book guide → BookGuideModal |
| **B10-G-006** | **DEFER** | bio 中文 · 分页/排序 · 移动端细 · `guides_newItineraryDraft` 缺键 |

---

## Honesty

`B10 CLOSED ≠ Seal ≠ Production GO`  
Next：**B11 Governance Public Surface** → 等待窗产品面收口 → ETA → Track1 Finalize  

**Frozen untouched:** Money Path / Mainnet / FTB / Registry / Wired / Track1
