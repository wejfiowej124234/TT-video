# /meta 503 Root Cause Analysis

**Recorded:** 2026-06-24T02:24:21Z

## Probes

| Endpoint | HTTP | elapsed(s) |
|----------|------|------------|
| api_health | 0 | 5.076 |
| api_meta | 0 | 5.069 |
| api_meta_build | 0 | 5.073 |
| web_meta | 0 | 5.132 |

## Root cause


## Remediation (post-soak wave-0)

- **L0_API**: Set REQUEST_TIMEOUT_SECS=120 on tt-api-staging (fly.toml [env] or secret)
- **L0_WEB**: Align app/meta/route.ts fetch timeout ≥ API timeout + 10s (META_ROUTE_FETCH_TIMEOUT_MS default 130000)
- **L0_WEB**: Keep 408/502/503/504 retry (3x) before returning 503
- **acceptance**: Post-soak: p2fc-verify-staging-meta-availability.sh --strict before Graduation
