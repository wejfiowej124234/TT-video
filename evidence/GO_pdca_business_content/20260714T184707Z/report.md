# PDCA · Business Content Snapshot Report

- **Environment:** staging
- **API:** https://tt-api-staging.fly.dev
- **Web:** https://tt-web-staging.fly.dev
- **Captured:** 2026-07-14T18:47:51.406Z
- **Diff verdict:** PASS
- **Integrity verdict:** WARN
- **Evidence dir:** `evidence\GO_pdca_business_content\20260714T184707Z`

## Diff

| Surface | Yesterday | Today | Verdict |
|---------|-----------|-------|---------|
| community (count.total) | 10 | 10 | PASS |
| guide (count.total) | 10 | 10 | PASS |
| destination (count.total) | 10 | 10 | PASS |
| campaign (count.total) | 10 | 10 | PASS |

## Destination · triangle matrix (Admin/CMS · Public API · Page visible)

| Leg | Admin/CMS | Public API | Page visible |
|-----|-----------|------------|--------------|
| count.total | UNKNOWN | 10 | 10 |
- **Admin probe:** unknown — SuperAdmin/content.read actor receives empty HTTP 404 — admin_content_http router not mounted when TRAVELTRUST_COMPLEXITY_CONVERGENCE_FREEZE active (code gate; not RBAC 403)
- **Admin leg diagnosis:** `STAGING_ROUTE_NOT_DEPLOYED`
- **Admin leg judgment:** **ADMIN_LEG_UNRESOLVED** — SuperAdmin/content.read actor receives empty HTTP 404 — admin_content_http router not mounted when TRAVELTRUST_COMPLEXITY_CONVERGENCE_FREEZE active (code gate; not RBAC 403)
- **Admin content.read:** true
- **Staging SHA:** 3c0d7ad57f08bfb4ceb4dfa956afbbe184db7d0d
- **API↔Page CSR aligned:** true
- **Public catalog countries:** 10
- **Public explore catalog:** api-aggregate-v1
- **Page probe mode:** playwright_csr
- **Page explore_dest_catalog:** api-aggregate-v1
- **Content judgment:** **content_exists** — Public API (10) and CSR page DOM (10) aligned

**FILTER_HIDE / probe reasons:**
- `ADMIN_CMS_UNREACHABLE`: Admin/CMS leg UNKNOWN — cannot compare publish filters

## Campaign · triangle matrix (Admin/CMS · Public API · Page visible)

| Leg | Admin/CMS | Public API | Page visible |
|-----|-----------|------------|--------------|
| items.total (3 surfaces) | 10 | 10 | 10 |
- **Deployed surfaces (public):** 3
- **Binding gaps (resolved missing):** 0
- **Page probe mode:** playwright_csr
- **API↔Page CSR aligned:** true
- **Content judgment:** **content_exists** — Public API (10) and CSR page DOM (10) aligned

**Per-surface public API:**
- home_hero: HTTP 200 · items 2 · campaign abf2ec26-9158-4fbb-95a7-6595567da3a4
- market_feed: HTTP 200 · items 3 · campaign 98ee6ab0-7197-4493-b3b4-761c782f6bcb
- community_feed: HTTP 200 · items 5 · campaign 2b15b465-f107-46fe-a904-48adb7fbbcac

**Per-surface API↔Page CSR:**
- home_hero: public=2 page=2 aligned=true
- market_feed: public=3 page=3 aligned=true
- community_feed: public=5 page=5 aligned=true

**Per-surface page CSR:**
- home_hero (/): ready=1 items_attr=2 loading=0 empty=0
- market_feed (/market): ready=1 items_attr=3 loading=0 empty=0
- community_feed (/community): ready=1 items_attr=5 loading=0 empty=0

## Community feed · read-only audit

- **HTTP:** 200
- **items_count:** 10
- **identity:** {"official":0,"campaign":0,"pinned":0,"test":0,"other":10}
- **visibility:** {"public":10}
- **data_origin:** {"not_in_payload":10}

## Root cause judgments (summary)

- **destination content:** content_exists (high) — Public API (10) and CSR page DOM (10) aligned
- **campaign content:** content_exists (high) — Public API (10) and CSR page DOM (10) aligned
- **destination admin leg:** ADMIN_LEG_UNRESOLVED (high) — diagnosis `STAGING_ROUTE_NOT_DEPLOYED` — SuperAdmin/content.read actor receives empty HTTP 404 — admin_content_http router not mounted when TRAVELTRUST_COMPLEXITY_CONVERGENCE_FREEZE active (code gate; not RBAC 403)

## Excluded from CMS/OCS root-cause analysis

- browser_extension_chext_driver
- permissions_policy_geolocation_console_violation
- unauthenticated_social_api_401_me_friends

## Integrity summary

- **community:** PASS
- **guide:** PASS
- **official_guide:** SKIP
- **destination:** WARN (admin_leg_unresolved)
- **campaign:** PASS
- **merchant:** SKIP
- **hero:** SKIP
- **cms:** SKIP

## Note

Framework uses SNAPSHOT_DIFF — no hardcoded expected counts. Triangle page leg uses initial HTML only; CSR-deferred markers are WARN/filter reasons, not forged PASS.

