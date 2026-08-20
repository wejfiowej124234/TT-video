# Wave-0→D1/D2 · OPS-v9 convergence closure

**STATUS:** `WAVE_0_FULLY_CLOSED`  
**Stamp:** `2026-08-20T06:35:00Z`  
**Baseline:** `TT-OFFICIAL-OPS-20260820-V9`  
**Index:** [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md`](../../docs/runbook/TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Wave-0 tech probes

| Probe | Result |
|-------|--------|
| `GET /api/release-identity` | `3e356617…` / `2026-08-20T00:51:57Z` |
| Fly image | `hybrid-live-auth-pin-nontarget-v9-20260820` |
| Public bootstrap | **v8** |
| Machine `d8d0d71ce67718` | started · bootstrap v8 |
| Machine `683d613c295458` | was stopped → **started** in Wave-0 |
| `/` · `/auth/login` | HTTP 200 |
| Owner Header login | **OWNER_CONFIRMED** (C2 hard refresh · Header user menu OK) |

## Wave-A living docs

Updated Product Truth cites to OPS-v9: `AGENTS.md` · FTB LATEST md/json · Master Map · Living Pin Index · Freeze observe · cursor master-map rule.

## Wave-B matrix

- `registry/release-runtime-evidence-matrix.v1.yaml` Official www row → OPS-v9  
- `registry/traveltrust-home-module-registry.v1.yaml` production + staging observations  
- `registry/ttg-v8-official-quote-surface-allowlist.v1.yaml` pin + forbid misnamed v8  
- Gate: `bash scripts/gates/check-official-living-pin-citations.sh`

## Wave-C

Inventory only: [`WAVE-C-WORKSPACE-INVENTORY-20260820.md`](./WAVE-C-WORKSPACE-INVENTORY-20260820.md)  
No prune / no discard / no Official bake from dirty tip.

## Wave-D1 / D2 Staging

| Item | Value |
|------|-------|
| Official contrast | OPS-v9 |
| Staging identity | `2ba08bd4…` / `2026-08-15T12:30:19Z` / Candidate v2 |
| Staging home/traveltrust | 200 |
| Staging bootstrap | **not** v8 (Expected Difference) |
| Isomorphic deploy | **NOT done** (needs Owner D4) |

Ledger banner updated: [`TT-STAGING-PATCH-LEDGER-LATEST.md`](../../docs/runbook/TT-STAGING-PATCH-LEDGER-LATEST.md)

## Explicitly NOT done

- M07「TTG 公开窗口」Official bake  
- Staging ↔ V9 image isomorphic deploy  
- Production GO  
- Dirty-tree cleanup commits / worktree prune  

## Wave-0 Owner closure

- Owner C2 hard-refresh login on Official V9 → Header hydrate + user menu **CONFIRMED**
- Freeze `last_live_observe.header_login` = `OWNER_CONFIRMED`
- Stamp: **`WAVE_0_FULLY_CLOSED`**

## Next (NOT this stamp)

Only after separate Owner auth: plan M07 scoped release with hydrate probe + non-target 0-drift.  
Still forbidden here: Staging isomorphic deploy · Production GO · dirty-tree/worktree prune · M07 bake.
