# V65 Batch3 W2 Runtime Parity Gate · LATEST

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

- **Claim:** `W2_RUNTIME_PARITY_PASS`
- **Probed:** 2026-08-05T05:28:04.501Z
- **Tip:** `16f29c7ea78b3a718e6b3763513932a8ea32b9d5`
- **require_idempotency_key:** `true` (via `fly secrets set REQUIRE_IDEMPOTENCY_KEY=1 -a tt-api-staging`)
- **Critical-write fail-closed:** 10/10
- **RBAC tourist denied:** PASS
- **Smoke unlocked:** true
- **TT_PRODUCTION_GO:** NO_GO

## Config fix

| Before | After |
|--------|-------|
| `strict_mode.require_idempotency_key=false` | `true` |

Mechanism: Staging secret `REQUIRE_IDEMPOTENCY_KEY=1` (not yet in `deploy/fly/tt-api-staging/fly.toml` `[env]`).

## Honesty · R061 tip

Fail-closed 10/10 is **global** Idempotency strict mode, not proof that dirty working-tree R061 Critical Write Registry expansion is on tip. Tip remains `16f29c7e`. Residual Close for R061 still needs honest tip/classifier story if Design Confirm requires registry code on tip (not only global flag).

## Next

1. Targeted W2 Staging smoke (new stamp) — unlocked.
2. Stamp Runtime Evidence only on smoke PASS.
3. Residual Close R059–R062 only on smoke PASS · keep `TT_PRODUCTION_GO=NO_GO`.

Machine-readable: `TT-V65-PROD-003-BATCH3-W2-RUNTIME-PARITY-GATE-LATEST.json`
