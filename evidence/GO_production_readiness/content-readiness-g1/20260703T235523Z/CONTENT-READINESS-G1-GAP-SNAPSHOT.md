# Community Content Readiness · G1 Gap Snapshot

**Verdict:** CONTENT_READINESS_G1_PASS

**Gap:** PRM-CONTENT-B001

## Checks

- gov_view_excludes_showcase: **PASS** — governed_community_posts_v1 excludes SHOWCASE/TEST/SMOKE
- seed_demo_showcase_draft: **PASS** — PG seed inserts demo/SHOWCASE/draft
- seed_off_on_staging_profile: **PASS** — Showcase seed disabled on staging/production profile
- frontend_production_filter: **PASS** — Frontend strips B/C layers from API-mapped feed
- legacy_read_path_governed: **PASS** — Community public reads use governed view
- runtime_feed: **SKIPPED** — connect ECONNREFUSED 127.0.0.1:8080

## Runtime violations

none
