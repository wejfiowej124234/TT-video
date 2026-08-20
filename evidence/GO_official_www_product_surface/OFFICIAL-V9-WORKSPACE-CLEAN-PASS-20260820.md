# Official V9 · Workspace Clean PASS

**Machine key:** `OFFICIAL_V9_WORKSPACE_CLEAN_PASS`  
**Phase:** ① Local workspace hygiene · **≠** ② Staging GO · **≠** ③ Production GO · **≠** Official bake

## Recovery master

| Field | Value |
|-------|-------|
| Name | TravelTrust Official · OPS-2026.08.20-v9 |
| Identity `git_sha` | `3e356617a498b0faac42e4ae457343d36294a770` |
| Image | `hybrid-live-auth-pin-nontarget-v9-20260820` |
| Digest | `sha256:b80bccb5f5c8c0e2b6e854c49f83fbbeb2ecefad70290339a8db6105eb608b16` |
| Bootstrap | v8 |
| Restore | `TT_OFFICIAL_WWW_RESTORE_PIN=1 bash scripts/dev/restore-tt-web-production-product-pin.sh` |
| `TT_PRODUCTION_GO` | **NO_GO** (unchanged) |

## Topology kept

| Role | Path | Ref |
|------|------|-----|
| Clean main | `D:/TravelTrust-V1.1` | `release/inbox-focus-product-truth-1ff71858` @ `f73e40c1` |
| Feature | _(none)_ | — |
| Unique Release WT | `D:/TravelTrust-official-ops-v9-release` | cite `3e356617` |

## Archive

- `archive/dirty-wip-pre-official-v9-workspace-clean` (`e7da7bf5`)
- `archive/pre-official-v9-workspace-clean-f73e40c1`

Identity SHA ≠ checkout product bytes. Local/Staging reverse-align from Official V9 only.
