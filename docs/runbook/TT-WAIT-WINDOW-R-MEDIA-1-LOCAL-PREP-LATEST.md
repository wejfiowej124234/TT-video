# TT · Wait Window · R-MEDIA-1（LATEST）

**STATUS:** `CLOSED`  
**Stamp:** `2026-08-12T02:32:00Z`  
**Machine:** [`TT-WAIT-WINDOW-R-MEDIA-1-LOCAL-PREP-LATEST.json`](./TT-WAIT-WINDOW-R-MEDIA-1-LOCAL-PREP-LATEST.json)  
**Opens after:** [`R-COMM-COMMENT-DELETE-1`](./TT-WAIT-WINDOW-R-COMM-COMMENT-DELETE-1-LOCAL-PREP-LATEST.md) **CLOSED**

**`TT_PRODUCTION_GO`:** `NO_GO` · Hard Gate **REFUSED** · FeeRouter/Track2/83 **unauthorized** · Mainnet/FTB **untouched**

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Reality CHECK → Physical FIX → RV

| Step | Result |
|------|--------|
| CHECK | Feed legacy `/uploads/community-posts/*.jpg` **3** · prior HEAD **404** |
| ROOT | DB `cover_url` intact · Official FS `data/community_post_media/` missing UUID objects |
| FIX | Extract poster frames from healthy CDN MP4s · `fly sftp put` → API media dir |
| RV | **GET 200** for all 3 keys · single `tt-api-prod` machine |

**Keys restored**

- `ca438fb3-ea0b-4bde-8fcc-a5d25a947e5a.jpg` (post `122f6e58…`)
- `16e8fc19-f0c7-4d80-a3e9-a51e12722c25.jpg` (post `43f9ed05…`)
- `2441880f-d4dc-485f-9b99-f15625dbce10.jpg` (post `001b13e2…`)

**Not used as closure:** FE video-first-frame skip (already RUNTIME_VERIFIED UX) — this pack closed **object bytes on the serve path**.

**Durability note:** `tt-api-prod` has **no Fly volume** attached — FS objects can be lost on machine rebuild. Recommended follow-on (separate): migrate these covers to Tigris/CDN + rewrite `cover_url` for durable object storage.

---

*Sebastian Ward · Solo · R-MEDIA-1 CLOSED · AFTER_SEAL serial*
