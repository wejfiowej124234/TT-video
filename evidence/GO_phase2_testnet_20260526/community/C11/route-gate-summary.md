# C11 · Community Route Gate (04 / Staging)

**Generated:** `20260606T001039Z` (UTC)
**Phase:** ② testnet · **C11 slot only** — NOT Phase ② GO
**API:** `https://tt-api-staging.fly.dev`

## Verdict

| Item | Result |
|------|--------|
| **C11 slot verdict** | **PASS** |
| `run-check-04-routes.sh` | OK |
| Static doc/code/api.ts | OK |
| Staging API probes | 24/24 OK |
| Browser route probes | 18/18 |

## Static inventory

- **04 §3.4 community paths:** 42
- **Axum mounted:** 42
- **frontend/lib/api.ts:** 29
- **frontend/app/community pages:** 18

## Staging API sample

| Method | Path | Status | OK |
|--------|------|--------|-----|
| GET | `/api/v1/community/feed` | 200 | PASS |
| GET | `/api/v1/community/media/capabilities` | 200 | PASS |
| GET | `/api/v1/community/stats/posts-by-tag?tag=travel` | 200 | PASS |
| GET | `/api/v1/community/feedback` | 200 | PASS |
| GET | `/api/v1/community/me/posts` | 401 | PASS |
| GET | `/api/v1/community/conversations` | 200 | PASS |
| GET | `/api/v1/community/me/following` | 401 | PASS |
| GET | `/api/v1/community/posts/00000000-0000-4000-8000-000000000099` | 200 | PASS |
| GET | `/api/v1/community/users/de8a6cd1-d251-426b-ac3c-85c7a98816f1/posts` | 200 | PASS |
| GET | `/api/v1/uploads/community-posts/00000000-0000-4000-8000-000000000099.png` | 404 | PASS |
| GET | `/api/v1/uploads/profile-avatars/de8a6cd1-d251-426b-ac3c-85c7a98816f1.jpg` | 404 | PASS |
| GET | `/api/v1/community/me/posts` | 200 | PASS |
| GET | `/api/v1/community/conversations` | 200 | PASS |
| GET | `/api/v1/community/me/following` | 200 | PASS |
| GET | `/api/v1/community/me/followers` | 200 | PASS |
| GET | `/api/v1/community/me/collects` | 200 | PASS |
| GET | `/api/v1/community/me/likes-received` | 200 | PASS |
| GET | `/api/v1/community/me/reports` | 200 | PASS |
| GET | `/api/v1/community/friends/list` | 200 | PASS |
| GET | `/api/v1/community/friends/requests` | 200 | PASS |
| GET | `/api/v1/community/conversations/00000000-0000-4000-8000-000000000088/messages` | 200 | PASS |
| GET | `/api/v1/community/reports/00000000-0000-4000-8000-000000000099` | 200 | PASS |
| POST | `/api/v1/me/profile-avatar/presign` | 415 | PASS |
| POST | `/api/v1/me/profile-avatar/commit` | 415 | PASS |

## Boundaries

- **C11 PASS** ≠ Phase ② GO ≠ C12 GO
- Validates community route registration + staging reachability; not full-site 93 matrix

## Re-run

```bash
API_BASE=http://127.0.0.1:8080 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012 \
  bash scripts/dev/record-community-c11-evidence.sh
```
