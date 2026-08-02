# Production Deploy Failure Recovery (RI)

## Symptom A — sqlx: migration previously applied but missing

Cause: DB ledger has version V; tip/image lacks `crates/api/migrations/V_*.sql`.

Recovery:
1. Restore the exact migration file into tip (prefer original bytes).
2. RI-01 accept LF **or** CRLF checksum match (`sha384_lf` / `sha384_crlf`).
3. Redeploy **API first** (`phase3-production-fly-deploy-and-sync.sh`).
4. Wait `/health=200`.
5. Then deploy FE.

## Symptom B — sqlx: migration previously applied but has been modified

Cause: checksum mismatch (often CRLF vs LF).

Recovery:
1. Compute disk `sha384_lf` and `sha384_crlf`.
2. Compare to `encode(checksum,'hex')` in `_sqlx_migrations`.
3. If CRLF match: keep file content; prefer Linux LF in git + accept CRLF in RI-01.
4. Do **not** DELETE ledger rows. Schema already applied.
5. Optional Owner-only: UPDATE checksum to LF after confirming schema noop — staging pattern `run-fpc-b40-migration-ledger-reconcile-staging.cjs`.

## Symptom C — FE build/deploy while API down

Forbidden by RI-02. FE deploy must see API `/health=200` first.

## Rollback

`fly releases -a tt-api-prod` → rollback to last complete release **only if** that image still contains every DB-applied migration version.
