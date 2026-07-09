# Community G1 Staging Alignment · PRM-CONTENT-B002

**Gap:** PRM-CONTENT-B002 · **G1 · Phase ② Staging**  
**Purpose:** Apply Community Content/Media G1 remediation to staging — **independent evidence only**

---

## Policy

- **不得** 复用 `evidence/GO_production_readiness/community-production-ready/20260704T*` 或 `community-media-runtime-ready/20260704T*` 冒充 ② PASS
- Local G1 PASS **≠** Staging aligned
- Matrix 登记 → deploy → migrate → validate → evidence → CLOSED

---

## Execute

```bash
# Full: deploy API + Web + migrate + validate
bash scripts/dev/run-community-g1-staging-alignment-closure.sh

# Validate only (API already deployed + migrations applied)
SKIP_STAGING_DEPLOY=1 bash scripts/dev/run-community-g1-staging-alignment-closure.sh
```

**Freeze active时：** `TESTNET_FREEZE_OVERRIDE=1`（closure 内已设）

**Evidence：** `evidence/GO_production_readiness/community-g1-staging-alignment/<stamp>/`

---

## Scope

| Step | Action |
|------|--------|
| Deploy | `tt-api-staging` + `tt-web-staging` latest |
| Migrations | `20260704130000` · `20260704140000` (+ pending) |
| Surfaces | Feed · Detail · Profile · Explore · Hot · Search · Campaign |
| Leak check | No Legacy/Demo/Showcase/old media URLs |
| Ops | Publish · Unpublish · Surface · Priority · Schedule |

**playback_network：** ② staging 默认 `SKIP_MEDIA_HEAD_PROBE=1`（CDN/HLS pending · 与 C4 一致）— **不** 用本地 HEAD 探针冒充 ② CDN GO。

---

## CLOSED · 2026-07-04

**Evidence：** `evidence/GO_production_readiness/community-g1-staging-alignment/20260704T005621Z/`  
**Verdict：** `TT_COMMUNITY_G1_STAGING_ALIGNMENT: PASS` · L5 17/17 · Media runtime PASS · legacy=0

---

## Related

- [COMMUNITY-PLATFORM-MAINTENANCE.md](COMMUNITY-PLATFORM-MAINTENANCE.md)
- PRM-CONTENT-B001 / PRM-MEDIA-B001 — local G1 CLOSED · do not reopen
