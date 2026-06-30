# Production Entry Review Regression — 2026-06-30

**Closed UTC:** `2026-06-30T13:01:28Z`
**Commit:** `422aadb9`
**Track:** PER Regression (NOT Configuration Sprint)

| PER ID | Status | Fix |
|--------|--------|-----|
| PER-L-01 | CLOSED | sync script extended + root .env SSOT |
| PER-L-03 | CLOSED | meta/build.deployment_profile from TRAVELTRUST_DEPLOYMENT_PROFILE |
| PER-L-05 | CLOSED | apply-per-regression-local-env.ps1 archives B407 |
| PER-L-06 | CLOSED | CORS 3012-only |
| PER-L-08 | CLOSED | SYNCED_FROM_ROOT_ENV_SHA in sync block |
| PER-L-10 | CLOSED | superseded banner |
| PER-S-01 | CLOSED | git rm --cached + .gitignore |
| PER-S-02 | CLOSED | use build.env.example only; local untracked |
| PER-S-03 | CLOSED | use build.env.example |
| PER-S-05 | VERIFIED | Fly REGISTRY_ADDRESS — doc in staging-onboarding.env.example; ② Owner action |

## Verify

```bash
powershell -File scripts/dev/apply-per-regression-local-env.ps1
cargo test -p traveltrust-api meta_build_top_keys
bash scripts/dev/verify-cfg-drift-closure.sh  # maintenance guard
```

**Note:** Restart API after pull to expose `meta/build.deployment_profile`.

## SSOT

- [TT-PRODUCTION-ENTRY-REVIEW-REGRESSION.md](../../../docs/runbook/TT-PRODUCTION-ENTRY-REVIEW-REGRESSION.md)
