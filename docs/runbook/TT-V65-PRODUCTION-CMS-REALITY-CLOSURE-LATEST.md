# Production CMS Reality Closure Evidence

**Stamp:** 20260802T131931Z  
**Verdict:** `PASS`  
**Key:** `V65_PRODUCTION_CMS_REALITY_CLOSURE`  
**V65 composition baseline (Non-Web3):** `0e5d4389…`  
**API tip deployed:** `6e76a299dfbeac8f412923533d56e00efaae0893`  
**Web tip deployed:** `075a295fbf5138777dd957feea4d885004a6a953`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Scope

Close confirmed **L2/L3 Production Drift** only:

1. Deploy API + migration so `GET /api/v1/public/announcements?for_home=1` returns CMS governed payload (`for_home`, window, sort, audit-related timestamps).
2. Deploy `tt-web-prod` so homepage consumes `HomeCmsAnnouncementStrip` (CMS-only, no static fallback).
3. Four-layer verify · no Web3 / Admin IA redesign · do not flip `TT_PRODUCTION_GO`.

## Four-layer

| Layer | Status | Fact |
|-------|--------|------|
| Admin Content | PASS_CODE_WIRED | Admin Content announcements remain traveltrust-api RBAC + audit; no Admin IA/UI redesign. Homepage now consumes CMS. |
| L2 API | PASS | for_home=True source=cms items=3 cache=`public, max-age=60, stale-while-revalidate=120` |
| Database | PASS | API boot: database connected and migrations applied; governed_home_announcements_v1 consumed (for_home=true, items<=3) |
| L3 Homepage | PASS | chunk has `tt-home-cms-announcements` + `for_home` |
| Public Runtime / SEO | PASS | robots Disallow /admin · sitemap urlset |

## Honesty

- CMS Reality Closure **≠** Production GO
- Live PSP commercial **not in scope**
- Web3 tip / Admin IA·UI Freeze **unchanged**
- `TT_PRODUCTION_GO` remains **NO_GO**

## Incident note (deploy)

Transient API outage during tip cleanup: prod DB had applied `20260802120000` while tip briefly lacked matching migration bytes/checksum. Restored migration file (CRLF checksum parity) and redeployed; API returned to listening before FE deploy.
