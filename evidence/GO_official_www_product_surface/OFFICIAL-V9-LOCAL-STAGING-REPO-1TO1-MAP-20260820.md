# Official V9 · Local / Staging / Repo 1:1 Map

**Recorded:** 2026-08-20T11:05:00Z
**Verdict:** PASS
**Product truth:** TravelTrust Official · OPS-2026.08.20-v9
**TT_PRODUCTION_GO:** NO_GO

## Identity table

| Plane | Value |
|-------|-------|
| Pin git_sha | 3e356617a498b0faac42e4ae457343d36294a770 |
| Official live | 3e356617a498b0faac42e4ae457343d36294a770 · build_time=2026-08-20T00:51:57Z |
| Staging live | 3e356617a498b0faac42e4ae457343d36294a770 · build_time=2026-08-20T10:50:46Z |
| main | 46977bee5aa8714d64b2b41590b2fec2918a3936 |
| tip release/official-ops-v9-product-ssot | 46977bee5aa8714d64b2b41590b2fec2918a3936 |
| Release WT | 3e356617a498b0faac42e4ae457343d36294a770 |

## Pass conditions

- official_sha == staging_sha == pin
- main_sha == tip_sha
- release_wt_sha == pin

## Expected Difference

- Staging build_time may differ from Official freeze wall-clock
- Staging API / Candidate Web3 out of scope
- PAGE_SURFACE_DRIFT ambient 11!=10 = ED (not identity failure)

## Gate

bash scripts/gates/check-official-v9-local-staging-repo-1to1.sh

## Honest boundary

Product-identity 1:1 != Production GO != Web3 FTB align != Official bake.
