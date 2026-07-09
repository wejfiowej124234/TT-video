# C10 · Community Staging Critical User Journey

**Generated:** `20260605T235244Z` (UTC)
**Phase:** ② testnet · **C10 slot only** — NOT Phase ② GO · NOT Production GO
**API:** `https://tt-api-staging.fly.dev` · **Frontend:** `http://127.0.0.1:3012`
**Hero:** `c10-hero-1780703661@example.com` · **Target:** `/community/user/0064a74d-3a78-4fdb-807f-ff8b0bf0cc4f`

## 1. Verdict

| Item | Result |
|------|--------|
| **C10 slot verdict** | **PASS** |
| API chain smoke | OK |
| Browser wide-path E2E | OK |
| Screenshots | 11 files |

## 2. Journey steps (user perspective)

| Step | Route / action | Status | Screenshot |
|------|----------------|--------|------------|
| 1 | Guest → `/community` Feed | PASS | `c10-01-guest-feed.png` |
| 2 | Login → `/community/me` Profile | PASS | `c10-02-profile-me.png` |
| 3 | Browse `/community/explore` | PASS | `c10-03-explore.png` |
| 4 | Follow target → `/community/user/{id}` | PASS | `c10-04-target-profile.png` |
| 5 | Feed text/photo/video posts visible | PASS | `c10-05-feed-posts.png` |
| 6 | Video post playback (canplay) | PASS | `c10-06-video-post.png` |
| 7 | Comment on target post | PASS | `c10-07-comment-visible.png` |
| 8 | Like + DM thread | PASS | `c10-08-dm-thread.png` |
| 9 | Activity notifications shell | PASS | `c10-09-activity.png` |
| 10 | Report spam post (browser) | PASS | `c10-10-report-submitted.png` |
| 11 | Revisit Feed + `/community/me/posts` | PASS | `c10-11-revisit-me-posts.png` |

## 3. API chain (staging smoke)

- Register hero + target + spam user
- Follow · text/photo/video posts · comment · like · DM
- Feed / explore / me/posts surfaces
- Report deferred to browser (abuse-policy safe)

## 4. Boundaries

- **C10 PASS** ≠ Phase ② GO ≠ C11–C12 GO
- Production CDN/HLS · full 93 matrix · persistent staging URL → later slots

## 5. Re-run

```bash
API_BASE=http://127.0.0.1:8080 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012 \
  bash scripts/dev/record-community-c10-evidence.sh
```
