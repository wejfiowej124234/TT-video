# Frontend ↔ API Consistency Audit Sign-off

**UTC:** 20260702T021250Z

## Result

| Layer | Env | Blocking | Warnings | PASS |
|-------|-----|----------|----------|------|
| API (strict) | Staging | 0 | 0 | YES |
| Browser (Playwright) | Staging | 0 | 0 | YES |
| API (strict) | Local | 0 | 0 | YES (prior `local_20260702T014247Z`) |

## Staging web deploy

| Item | Value |
|------|-------|
| App | `tt-web-staging` |
| Image | `deployment-01KWG89JAX6V7C37NHRVJT1TXF` |
| Fix | `marketMediaFallback` guide.id 24-portrait pool · C3/C1 `avatar_url` · showcase seed avatars |

## Browser checks (6 PASS · 2 skip)

- V-MARKET: distinct guide cards — unique img src per guide id
- V-MARKET-C3: canonical bio `测试向导账号，用于联调`
- V-MARKET-SHOWCASE: homepage cold-start — no duplicate showcase avatars
- V-MARKET-CAMPAIGN: market official surfaces — no mock leak
- V-COMMUNITY: feed count sanity
- V-GOVERNANCE: skipped (no `STAGING_AUDIT_EMAIL` in CI run)

## Evidence

| Artifact | Path |
|----------|------|
| API + browser bundle | `evidence/GO_frontend_api_consistency_audit/staging_browser_20260702T021003Z/` |
| Screenshots | `…/screenshots/market-guides-view.png` · `homepage-cold-start.png` · `market-campaign-surface.png` · `community-feed.png` |
| Record script | `scripts/dev/record-frontend-api-consistency-audit-staging.sh` |

## Machine keys

```text
TT_FRONTEND_API_CONSISTENCY_AUDIT: PASS
TT_FRONTEND_API_CONSISTENCY_STRICT: PASS
TT_FRONTEND_API_CONSISTENCY_BROWSER_STAGING: PASS
```
