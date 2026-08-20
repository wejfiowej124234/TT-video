# TT · Wait Window · R-MEDIA-DURABILITY-1（LATEST）

**STATUS:** `CLOSED`  
**Stamp:** `2026-08-12T03:06:00Z`  
**Machine:** [`TT-WAIT-WINDOW-R-MEDIA-DURABILITY-1-LOCAL-PREP-LATEST.json`](./TT-WAIT-WINDOW-R-MEDIA-DURABILITY-1-LOCAL-PREP-LATEST.json)  
**Opens after:** [`R-MEDIA-1`](./TT-WAIT-WINDOW-R-MEDIA-1-LOCAL-PREP-LATEST.md) **CLOSED**

**`TT_PRODUCTION_GO`:** `NO_GO` · Hard Gate **REFUSED** · FeeRouter/Track2/83 **unauthorized** · Mainnet/FTB **untouched**

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Reality CHECK → FIX → Cut → RV

| Step | Result |
|------|--------|
| CHECK | Official feed **13** · legacy `/uploads` **3** (R-MEDIA-1 JPG) · CDN/object **23** · FS UUID keepers **3** |
| FIX (code) | Still `upload-media` → S3 when configured · **no FS fallback** · local FS only `cfg(test)` / `TRAVELTRUST_ALLOW_LOCAL_COMMUNITY_POST_MEDIA` · internal `promote-local-still` · DB rewrite helper |
| FIX (data) | Put 3 JPGs → `community-media/v1/legacy-covers/<file>` · rewrite `cover_url` only (3 rows) |
| Official API Cut | `deployment-01KZSY5156YAYSJ6D5YT15QY6W` · Public Gates + OCS 10×4 **PASS** |
| RV | Feed legacy **0** · CDN HEAD **200** ×3 · Detail covers CDN · Machine restart + FS delete → legacy GET **404** · CDN still **200** |
| Gate | `bash scripts/gates/check-r-media-durability-1-regression.sh` **PASS** (pre + post restart) |

**CDN URLs**

- `https://cdn.web3-ttg.com/community-media/v1/legacy-covers/ca438fb3-ea0b-4bde-8fcc-a5d25a947e5a.jpg`
- `https://cdn.web3-ttg.com/community-media/v1/legacy-covers/16e8fc19-f0c7-4d80-a3e9-a51e12722c25.jpg`
- `https://cdn.web3-ttg.com/community-media/v1/legacy-covers/2441880f-d4dc-485f-9b99-f15625dbce10.jpg`

**Ops note:** Earlier SSH probe printed AWS credential **values** into agent logs — **rotate** `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` for the community media bucket after this pack (do not paste secrets into chat).

---

## Honest boundary

Official durability CLOSED **≠** `TT_PRODUCTION_GO` · Hard Gate stays **REFUSED**. Next PRE_GO packs (Admin→Public / Indexer / Cert/WC/Legal) may proceed serially.

---

*Sebastian Ward · Solo · R-MEDIA-DURABILITY-1 CLOSED · AFTER_SEAL PRE_GO*
