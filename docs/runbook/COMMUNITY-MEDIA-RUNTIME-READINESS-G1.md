# Community Media Runtime Readiness (G1 Domain)

**Gap:** PRM-MEDIA-B001 · **CLOSED** (2026-07-04) · **G1 Domain**  
**Evidence:** `evidence/GO_production_readiness/community-media-runtime-ready/20260704T001446Z/`

---

## Problem

Public community surfaces may still reference **legacy / demo / stale** media:

| Class | Examples |
|-------|----------|
| Demo hosts | Unsplash, w3schools, samplelib, filesamples |
| Legacy upload video | `/api/v1/uploads/community-posts/*.mp4` (pre multipart) |
| Stale test CDN | `cdn.example.test/playback/…` without `community_media_assets` |
| Frontend Layer C | `tt-showcase-*` + external sample MP4 (local dev only) |

**Production Profile** must serve **Governed API + reachable object storage/CDN** only.

---

## Run

```bash
SKIP_ABI_GATE=1 bash scripts/dev/start-api-for-playwright.sh
bash scripts/dev/run-community-media-runtime-readiness-g1-closure.sh
```

**Evidence:** `evidence/GO_production_readiness/community-media-runtime-ready/<stamp>/`

---

## Remediation (automatic in closure)

1. Migration `20260704140000` — unpublish published rows with legacy/stale media  
2. API filter — `is_non_governed_community_media_url` on feed JSON  
3. Frontend — Production Profile disables showcase injection (PRM-CONTENT-E001 local only)

**Real UGC video:** re-upload via S3 multipart → `community_media_assets.state=ready` → Public Ops Publish.

---

## Community Media Guard（长期守护 · 非 Blocker）

防止 legacy 外链 / 旧 upload 视频再次进入 **published** 数据或 seed/migration。

```bash
# CI / pre-push（repo 数据层 · 无 DB）
bash scripts/gates/run-community-media-guard.sh

# 含 PG：community_posts (published) + community_media_assets
node scripts/dev/validate-community-media-guard.cjs
```

**扫描：** seed_community* · community 相关 migration INSERT · 可选 DB `media_urls` / `playback_url`  
**禁止：** w3schools · samplelib · filesamples · unsplash.com · cdn.example.test · legacy `/uploads/community-posts/*.mp4`  
**CI：** [.github/workflows/community-media-guard.yml](../../.github/workflows/community-media-guard.yml)  
**机读键：** `TT_COMMUNITY_MEDIA_GUARD: PASS`  
**归档口径：** [COMMUNITY-PLATFORM-MAINTENANCE.md](COMMUNITY-PLATFORM-MAINTENANCE.md)

---

## Related

- [COMMUNITY-MEDIA-OBJECT-STORAGE.md](COMMUNITY-MEDIA-OBJECT-STORAGE.md)
- [TT-MEDIA-THREE-TIER-ARCHITECTURE.md](TT-MEDIA-THREE-TIER-ARCHITECTURE.md)
- PRM-CONTENT-B001 **CLOSED · do not reopen**
