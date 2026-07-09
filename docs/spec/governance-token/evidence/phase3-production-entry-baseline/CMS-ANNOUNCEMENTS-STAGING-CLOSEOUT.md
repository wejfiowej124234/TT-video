# CMS Announcements · ② Staging Readiness Closeout

**Item:** CMS S0 announcements · Admin → publish → public `/traveltrust/announcements` + Home Pulse  
**Phase:** **② Staging readiness · UAT sprint** — **not** ③ Production GO  
**Effective UTC:** 2026-07-09  
**Gate:** `bash scripts/gates/check-cms-announcements-gate.sh`  
**UAT runner:** `node scripts/dev/run-cms-announcements-staging-uat.cjs`  
**Lane governance:** `bash scripts/gates/check-announcement-lane-governance-gate.sh`

## Phase status

| Phase | Verdict |
|-------|---------|
| ① Local CMS Engineering | **CLOSED** |
| ② Staging CMS Readiness | **CLOSED** — `tt-api-staging` + `tt-web-staging` deployed · UAT **PASS** · browser sign-off **2026-07-09** |
| ③ Production GO | **NOT STARTED** |

## ② UAT results (machine)

| Checklist | Local `127.0.0.1:8080` | `tt-api-staging.fly.dev` |
|-----------|------------------------|---------------------------|
| A Admin publish flow | ✅ PASS | ✅ PASS |
| B Public hygiene + admin published | ✅ PASS | ✅ PASS (`cms-uat-*` excluded from public by design) |
| C Pulse product-only | ✅ PASS | ✅ PASS (4 product rows) |
| D Ops governance 403 | ✅ PASS | ⏭ SKIP (needs `STAGING_DATABASE_URL` for Ops console role seed) |
| E Audit publish | ✅ PASS | ✅ PASS |
| Roadmap UAT (independent) | ✅ PASS | ✅ PASS |

**Evidence:** `CMS-ANNOUNCEMENTS-STAGING-UAT-LATEST.json` · `CMS-ROADMAP-STAGING-UAT-LATEST.json` · both `verdict: PASS` on staging host **2026-07-09**

**Deploy fix (2026-07-09):** `TRAVELTRUST_COMPLEXITY_CONVERGENCE_FREEZE=1` on staging previously unmounted Admin CMS HTTP; `admin/content/announcements` + `admin/content/roadmap` now mount under freeze (same exception class as ADM-U01 / PD-009).

**Browser sign-off (② · staging):**

| URL | Result |
|-----|--------|
| `/traveltrust/announcements` | ✅ CMS product / TTG·治理 / 协议 / 路线图分轨 |
| `/traveltrust` | ✅ Pulse ticker reads CMS product lane |
| `/admin/content/announcements` | ✅ SuperAdmin list + create form |
| `/admin/content/roadmap` | ✅ Section `product-roadmap` + milestone editor |

## Known gaps (P1 · post-UAT sign-off)

- `published_by` column **not** in `cms_public_announcements` — audit log covers publish actor; revision/rollback track is next P1
- Independent detail URL `/traveltrust/announcements/[slug]` — deferred
- Content QA forbidden-words gate — deferred

## Sprint deliverables (closed)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Workspace Rust compile (`traveltrust-api`) | ✅ | `cargo check -p traveltrust-api` exit 0 |
| 2 | Lane → audience → permission RBAC (server) | ✅ | `cms_announcement_lane_rbac.rs` + HTTP enforcement |
| 3 | Next.js API shim removed (Rust SSOT) | ✅ | prior sprint · re-verified by gate |
| 4 | Admin workflow routes | ✅ | create · patch · submit-review · publish · unpublish · archive |
| 5 | Public + Pulse consumer | ✅ | `GET /api/v1/public/announcements*` via Rust |
| 6 | Frontend Admin lane button gating | ✅ | `cmsAnnouncementLanePermissions.ts` |

## Lane → permission map (immutable audience)

| Lane | Registry audience | Permission id | SuperAdmin | Ops |
|------|-------------------|---------------|------------|-----|
| `product` | `public_user` | `admin.content.announcement.audience.public_user` | ✅ | ✅ |
| `governance` | `token_holder` | `admin.content.announcement.audience.token_holder` | ✅ | ❌ |
| `protocol_status` | `technical_public` | `admin.content.announcement.audience.technical_public` | ✅ | ✅ |

Base mutations still require `admin.content.write`; publish requires `admin.content.publish` **and** lane audience permission.

## ② Staging UAT script (operator)

```bash
# Local ① stack (full checklist — PASS 2026-07-09)
API=http://127.0.0.1:8080 node scripts/dev/run-cms-announcements-staging-uat.cjs

# Staging ② host (after deploy)
API=https://tt-api-staging.fly.dev node scripts/dev/run-cms-announcements-staging-uat.cjs
```

## Machine verification (① local · sprint sign-off)

```bash
cargo check -p traveltrust-api
bash scripts/gates/check-cms-announcements-gate.sh
bash scripts/gates/check-announcement-lane-governance-gate.sh
node scripts/dev/run-cms-roadmap-staging-uat.cjs   # staging: API=https://tt-api-staging.fly.dev
```

Evidence artifacts: `CMS-ANNOUNCEMENTS-STAGING-UAT-LATEST.json` · `CMS-ROADMAP-STAGING-UAT-LATEST.json` (same directory).

## Product Roadmap CMS (A · independent · 2026-07-09)

**Scope:** Section config + milestones · **not** in announcements list or Pulse.

| Check | Local | Staging |
|-------|-------|---------|
| `GET /api/v1/public/roadmap` (no auth) | ✅ PASS | ✅ PASS |
| Pulse / product announcements exclude roadmap | ✅ PASS | ✅ PASS |
| Admin section + milestone publish | ✅ PASS | ✅ PASS |
| Frontend CMS consumer + static fallback | ✅ PASS | ✅ PASS |

**UAT:** `node scripts/dev/run-cms-roadmap-staging-uat.cjs`  
**Evidence:** `CMS-ROADMAP-STAGING-UAT-LATEST.json`  
**Admin:** `/admin/content/roadmap` · **Public anchor:** `#product-roadmap` · **Period:** CMS `period_label` (default `2026`)

## Honest boundary

① local gate green + ② CMS S0 staging closed **≠** ② staging full-matrix GO **≠** ③ Production GO.  
Announcements UAT **D_ops** / **A_db_published** may SKIP on staging without `STAGING_DATABASE_URL`; re-run with staging PG URL for full matrix.  
G-1/G-2 per `PHASE2-START-CHECKLIST` still apply before broader Phase ② GO claims.

## Next

- Optional: re-run announcements UAT with `STAGING_DATABASE_URL` for D_ops + A_db
- P3-05 security review before expanding CMS scope
- ③ Production Entry Review — separate gate; **not** started by this closeout
