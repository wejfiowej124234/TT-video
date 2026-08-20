# TT V65 RC-E-06 · Production Deploy + UAT · LATEST

**Verdict:** `RC_E_06_DEPLOYED_AWAITING_ZHENWANG_UAT`  
**Stamp:** `20260806T090059Z` · Prep was `20260806T083356Z`  
**`production_deployed` / `deploy_executed`:** **true**  
**`TT_PRODUCTION_GO`:** **NO_GO**

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Deploy windows

| Surface | Window | Exit |
|---------|--------|------|
| API | 084554Z → 084934Z | 0 |
| FE | end 090016Z | 0 |

FE attempt #1 failed (no `node_modules` for Admin Inbox parity). Fixed with `npm ci`; retry without skip.

## Runtime Verification (agent)

Stamp `20260806T090059Z` · `AGENT_TIP_MATCH_PASS` for FE `106feef436f205c7286d789b8ff9704c0fb28f48` + API `1915ec4da828e0139e90a85cd321415fdb6e53d9`.

## Owner Human UAT

| ID | Agent | Owner |
|----|-------|-------|
| UAT-01 Admin | HTTP smoke (admin 307 / login 200) | PENDING |
| UAT-02 Business closed-loop | — | PENDING |
| UAT-03 Data consistency | — | PENDING |
| UAT-04 UI/UX | — | PENDING |
| UAT-05 Runtime Truth | tip-match PASS (support) | PENDING |

Machine: `docs/runbook/TT-V65-RC-E-06-PRODUCTION-DEPLOY-UAT-PREPARATION-LATEST.json`
