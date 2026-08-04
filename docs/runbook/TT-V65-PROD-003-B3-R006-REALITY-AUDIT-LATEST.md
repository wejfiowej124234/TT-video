# B3-R006 Reality Audit · LATEST

**Stamp:** `20260804T084343Z` · **`TT_PRODUCTION_GO`:** `NO_GO`

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
