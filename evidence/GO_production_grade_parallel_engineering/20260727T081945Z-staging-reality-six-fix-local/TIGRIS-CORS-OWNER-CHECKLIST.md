# #1 Tigris interim · Owner CORS checklist (Agent align only)

**Status:** Owner ops · **≠** B-MEDIA CLOSED · **≠** Acceptance PASS  
**Interim host:** `traveltrust-community-media.fly.storage.tigris.dev`  
**Target:** R2 + `cdn.traveltrust.app` via TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST

## Required CORS (multipart browser PUT)

| Field | Value |
|-------|-------|
| AllowedMethods | GET, PUT, HEAD |
| AllowedHeaders | * (or Content-Type · Content-Length · x-amz-*) |
| ExposeHeaders | **ETag** (required for multipart complete) |
| AllowedOrigins | Staging web + local localhost:3012 |

## Script alignment

- R2 provision CORS: `scripts/dev/provision-staging-media-r2-cdn.sh`
- Acceptance (Owner READY only): `scripts/dev/run-media-cdn-production-acceptance-gate.sh --with-c4 --with-playwright`

## Agent MUST NOT

- Re-run CDN Acceptance while HARD STOP
- Docs-only flip WAITING_OWNER_CF → CLOSED
- Claim Tigris CORS alone clears B-MEDIA-001
