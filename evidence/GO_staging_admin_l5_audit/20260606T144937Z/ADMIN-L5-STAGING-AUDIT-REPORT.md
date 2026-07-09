# Admin L5 Staging Audit

- stamp: 20260606T144937Z
- git: c1a38d5422ccf44647e54a1142cca7e53556e906
- web: https://tt-web-staging.fly.dev
- audit_email: tourist@test.com
- login_role: super_admin
- browser: FAIL
- verdict: **FAIL_P0**

## P0 blockers
- capabilities HTTP 404
- fe_proxy_capabilities HTTP 429
- browser_probe — Playwright admin-l5-staging-closure failed

## Core API
- capabilities: HTTP 404
- orders_list: HTTP 200
- approvals_list: HTTP 200

## Middleware
- fe_middleware_no_cookie: HTTP 307 → https://tt-web-staging.fly.dev/auth/login?returnUrl=%2Fadmin
- fe_middleware_uid_only: HTTP 307 → https://tt-web-staging.fly.dev/auth/login?returnUrl=%2Fadmin
- fe_middleware_uid_and_ok: HTTP 200 → —