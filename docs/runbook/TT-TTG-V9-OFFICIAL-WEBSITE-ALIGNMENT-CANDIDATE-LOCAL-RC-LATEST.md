# TTG V9 Official Website Alignment · Local Release Candidate

**Status:** `V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_PASS` · **STOP**  
**Base:** `OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE` · SHA `92cc3057a22e919bb52dde0425e23487677da1be`  
**Scope:** Owner Checklist **P0+P1 only** (P2 not approved)  
**`TT_PRODUCTION_GO`:** `NO_GO` (unchanged)

## Gate metrics (required = 0)

| Metric | Value |
|--------|------:|
| OUT_OF_SCOPE_CHANGED_FILES | 0 |
| UNAUTHORIZED_PAGE_DIFF | 0 |
| UI_UX_STRUCTURAL_DIFF | 0 |
| WEBSITE_V9_TRUTH_CONFLICTS | 0 |
| LEGACY_ACTIVE_LEAKS | 0 |
| WRONG_CONTRACT_ADDRESSES | 0 |
| P0_OPEN | 0 |
| P1_OPEN | 0 |

**Stamp:** `evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_PASS.json`  
**Gate:** `python scripts/dev/run-ttg-v9-official-website-alignment-gate.py`

## What changed (allowlist)

- Tokenomics model → **25T · 50/35/3/5/7**; Norm five-batch nested table
- Protocol mirror → CountryFeeRouter / ProjectPool; `ttg_stakers=0` EXIT
- `v9PublicContractRegistry.ts` + Primary Market / Protocol Directory wired to Phase1 ACTIVE addresses
- Unlock focus forced **upcoming** (never date-driven `open`)
- Legacy three-round ACTIVE list disabled (`listTraveltrustTtgPublicRounds() = []`)
- Reference price marked **LEGACY_DO_NOT_USE_AS_ACTIVE**
- en/zh copy for settlement, fee-routes, staking ≠ RoleStake, roles DISABLED, FAQ closed-window

## Explicitly NOT done

- Staging / Production deploy  
- `/meta` or Indexer cutover  
- DL_R1 / Mainnet Phase1 on-chain mutation  
- Flip `TT_PRODUCTION_GO`  
- FIVE-MAIN layout / CSS / visual / Header / deps  
- P2 polish

**Mother plate:** Production Official visual/layout (OPS-2026.08.20-v9) remains non-drifting.
