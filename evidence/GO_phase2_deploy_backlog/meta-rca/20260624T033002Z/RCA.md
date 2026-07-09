# /meta 503 Root Cause Analysis

**Recorded:** 2026-06-24T03:31:10Z

## Probes

| Endpoint | HTTP | elapsed(s) |
|----------|------|------------|
| api_health | 200 | 3.084 |
| api_meta | 408 | 44.944 |
| api_meta_build | 200 | 3.214 |
| web_meta | 503 | 11.912 |

## Root cause

- API_TIMEOUT_LAYER: GET /meta exceeds REQUEST_TIMEOUT_SECS (staging default 30)
- WEB_PROXY_DEGRADED: app/meta/route.ts maps upstream non-200 to 503 meta_unavailable
- EXEC_CHAIN_OK: /meta/build lightweight path unaffected

## Remediation (post-soak wave-0)

- **L0_API**: Set REQUEST_TIMEOUT_SECS=120 on tt-api-staging (fly.toml [env] or secret)
- **L0_WEB**: Align app/meta/route.ts fetch timeout ≥ API timeout + 10s (META_ROUTE_FETCH_TIMEOUT_MS default 130000)
- **L0_WEB**: Keep 408/502/503/504 retry (3x) before returning 503
- **acceptance**: Post-soak: p2fc-verify-staging-meta-availability.sh --strict before Graduation
