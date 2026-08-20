# B3-R006 Reality Audit · LATEST

**Stamp:** `20260804T084343Z` · **`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Verdict

**Case 2 (dual store / dual status) proven.** Case 1 (CMS list vs DB detail) and Case 3 (CMS drives review) **ruled out**.

Admin Guide/Provider list·detail·decide are **business DB** paths. CMS/COS may keep display/ops content only — **must not** drive review status, approve/reject, or RBAC.

## Root cause (① code)

| Domain | Bug | Fix |
|--------|-----|-----|
| Provider | `users.role=provider` synthetic `approved` hid decide while RA still `submitted` | RA-first admin detail |
| Guide | List=RA; detail/review required `guides` row → orphan empty | Orphan RA detail + ensure guides before review |

## Status

`CODE_PATCHED_PENDING_DEPLOY` — patch ≠ live PASS. Failed tip `56220d78` must not be promoted.

**Next:** Owner commit → new tip → Single Cut → PRV-3b re-UAT.

Evidence: `evidence/GO_v65_prod_003_b3_r006_reality_audit/20260804T084343Z/`
