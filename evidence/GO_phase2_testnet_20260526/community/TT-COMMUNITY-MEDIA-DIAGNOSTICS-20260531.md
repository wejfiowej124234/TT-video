# TT Community Media Diagnostics & P0 Fix Report

**Date:** 2026-05-31  
**Phase scope:** ① local IT + ② staging API/smokes — **NOT** ③ Production CDN/HLS GO  
**C1–C12 historical PASS:** unchanged by this maintenance slice

## Executive summary

Two P0 product defects blocked reliable community media in Feed vs Post Detail:

1. **API read path** — `primary_media_asset_id` was written on post create but omitted from `PostRow` SELECT/JSON on feed, detail, `me/posts`, and `users/:id/posts`.
2. **PostDetailDrawer** — inline media used raw `media_urls[0]` without `resolveCommunityPostPlayableVideoUrl` / `communityMediaAbsoluteUrlForRender`; no video `onError` fallback. `PostDetailDrawerMediaZone` existed but was unwired.

Both fixed in this slice. Regression: [`P0-media-read-detail/`](./P0-media-read-detail/) · `bash scripts/dev/record-community-media-p0-regression-evidence.sh`.

## Fix details

### API (Rust)

- `crates/api/src/db/community.rs` — `PostRow.primary_media_asset_id`; all list/detail SELECTs; hot-feed cursor indices adjusted
- `crates/api/src/routes/community/common.rs` — feed/me/user JSON emits field (UUID or `null`)
- `crates/api/src/routes/community/posts.rs` — detail JSON emits field
- IT: `matrix_93_d_com_primary_media_asset_id_*` — **2/2 PASS**

### Frontend

- `PostDetailDrawer.tsx` — wired `PostDetailDrawerMediaZone`; playable URL + absolute MinIO URL + `onError` fallback
- `usePostDetailDrawerModel.ts` — video uses `communityMediaAbsoluteUrlForRender` (Q-07 direct, not `/tt-community-s3`)
- `communityFeedMappers.ts` — re-export canonical `mapApiPostToCommunityPost` (includes `primaryMediaAssetId`)

## Regression evidence (2026-05-31)

| Check | Result |
|-------|--------|
| `matrix_93_d_com_primary_media_asset_id` IT | PASS |
| C2 / C4 / C5 staging smokes | PASS |
| feed/detail/me-posts/user-posts JSON key | PASS |
| media URL GET 200 | PASS |
| `communityFeedMappers.postRoleMedia` vitest | 11/11 PASS |

## C-slot boundary addendum (does NOT re-open PASS)

### C4 — Video playback (PASS `20260531T130518Z`)

P0: detail drawer shares Feed playable resolution; `primary_media_asset_id` on read paths. **Still pending:** Production HLS/CDN GO.

### C5 — Image delivery (PASS `20260531T135111Z`)

P0: detail carousel uses `communityMediaAbsoluteUrlForRender`. **Still pending:** Production CDN GO.

### C10 — Critical journey (PASS `20260531T151124Z`)

P0: Post Detail media wired to MediaZone; no C10 screenshot re-run required for API/mapper-only fix.

### C12 — DID interlink (PASS `20260531T154550Z`)

P0: orthogonal — no route changes.

## Non-claims

- Does **not** change C1–C12 PASS timestamps.
- Does **not** claim Phase ② GO, Production GO, or Production CDN/HLS GO.
