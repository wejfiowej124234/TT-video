# V65-PROD-003 · B3-R006 Reality Audit

**Stamp:** `20260804T084343Z`
**Phase:** ① Local code SSOT audit + patch
**`TT_PRODUCTION_GO`:** `NO_GO`

## Owner symptoms (live tip `56220d78`)

| Surface | List | Detail | Decide |
|---------|------|--------|--------|
| Provider | `?status=submitted` | 已通过 | `decideButtons: []` |
| Guide | `?status=submitted` / inbox pending | 「该用户暂无向导申请记录。」 | `decideButtons: []` |

## Layer separation

| Layer | Source | Allowed for |
|-------|--------|-------------|
| CMS / COS | Catalog / ops | Display & marketing only |
| Application review | Business DB | Status, approve/reject, audit |
| Roles / permissions | DB | Identity & RBAC |

**CMS/COS must not drive review status, decide actions, or permissions.**

## Hypothesis results

| Case | Verdict |
|------|---------|
| 1 · CMS list vs DB detail | **RULED OUT** |
| 2 · Dual store / dual status | **PROVEN · primary root cause** |
| 3 · CMS drives review | **RULED OUT** |

## Fixes (working tree · pending deploy)

1. **Provider** — `provider_application.rs`: RA-first admin detail; no synthetic `approved` while RA exists.
2. **Guide** — `role_identity/mod.rs` + `guide_profile.rs`: orphan RA detail + ensure guides row before review; display `pending` for FE `pendingLike`.

## Honesty

- Code patch ≠ live PASS
- Failed tip `56220d78` ≠ closed loop
- Next: commit (Owner) → new tip → Single Cut → PRV-3b re-UAT

See `REALITY-AUDIT.json`.
