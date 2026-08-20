# Official V9 · Local / Staging / Repo 1:1 Map

**Recorded:** 2026-08-20T11:10:00Z
**Verdict:** PASS
**Product truth:** TravelTrust Official · OPS-2026.08.20-v9
**TT_PRODUCTION_GO:** NO_GO

## Identity table

| Plane | Value |
|-------|-------|
| Pin git_sha | 3e356617a498b0faac42e4ae457343d36294a770 |
| Official live | 3e356617a498b0faac42e4ae457343d36294a770 · build_time=2026-08-20T00:51:57Z |
| Staging live | 3e356617a498b0faac42e4ae457343d36294a770 · build_time=2026-08-20T10:50:46Z |
| main | 13bf6e2c4595b43aade26e4b2c3ddce276086f2b |
| tip release/official-ops-v9-product-ssot | 13bf6e2c4595b43aade26e4b2c3ddce276086f2b |
| Release WT | 3e356617a498b0faac42e4ae457343d36294a770 |

## Hygiene (2026-08-20)

- worktrees=2 (tip + Release WT) · stash=0 · main=tip=origin
- Staging living misread 2ba08bd4 CLEARED in Ledger + Home modular LATEST
- PAGE_SURFACE ambient 11!=10 = Expected Difference · CONFIRM_DESIGN (not identity failure)

## Pass conditions

- official_sha == staging_sha == pin
- main_sha == tip_sha
- release_wt_sha == pin

## Expected Difference

- Staging build_time may differ from Official freeze wall-clock
- Staging API / Candidate Web3 out of scope
- PAGE_SURFACE_DRIFT ambient 11!=10 = ED CONFIRM_DESIGN

## Gate

bash scripts/gates/check-official-v9-local-staging-repo-1to1.sh

## Honest boundary

Product-identity 1:1 != Production GO != Web3 FTB align != Official bake.
