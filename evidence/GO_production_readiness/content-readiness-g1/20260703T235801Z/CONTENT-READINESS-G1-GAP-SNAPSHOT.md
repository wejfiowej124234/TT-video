# Community Content Readiness · G1 Gap Snapshot

**Verdict:** CONTENT_READINESS_G1_STATIC_PASS

**Gap:** PRM-CONTENT-B001

## Checks

- gov_view_excludes_showcase: **PASS** — governed_community_posts_v1 excludes SHOWCASE/TEST/SMOKE
- seed_demo_showcase_draft: **PASS** — PG seed inserts demo/SHOWCASE/draft
- seed_off_on_staging_profile: **PASS** — Showcase seed disabled on staging/production profile
- frontend_production_filter: **PASS** — Frontend strips B/C layers from API-mapped feed
- api_feed_content_filter: **PASS** — API response filters legacy demo media when public catalog filter on
- promo_preview_production: **PASS** — Promo preview uses governed posts in production profile
- showcase_deep_link_production: **PASS** — Showcase deep links disabled in production profile
- legacy_read_path_governed: **PASS** — Community public reads use governed view
- runtime_feed: **SKIPPED** — connect ECONNREFUSED 127.0.0.1:8080
- runtime_feed_clean: **SKIPPED** — API not reachable — run with LOCAL_API when stack is up for full G1 PASS

## Runtime violations

none
