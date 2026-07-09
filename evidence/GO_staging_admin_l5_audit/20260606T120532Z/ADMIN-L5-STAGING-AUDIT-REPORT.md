# Admin L5 Staging Audit

- stamp: 20260606T120532Z
- git: 4a9ab0db8de399868f14e12b5eaf72b4b5f5ace1
- web: https://tt-web-staging.fly.dev
- audit_email: tourist@test.com
- login_role: super_admin
- browser: SKIP
- verdict: **FAIL_P0**

## P0 blockers
- capabilities HTTP 401
- orders_list HTTP 401
- approvals_list HTTP 401
- fe_proxy_capabilities HTTP 401

## Core API
- capabilities: HTTP 401
- orders_list: HTTP 401
- approvals_list: HTTP 401

## Middleware
- fe_middleware_no_cookie: HTTP 307 → https://tt-web-staging.fly.dev/auth/login?returnUrl=%2Fadmin
- fe_middleware_uid_only: HTTP 307 → https://tt-web-staging.fly.dev/auth/login?returnUrl=%2Fadmin
- fe_middleware_uid_and_ok: HTTP 200 → —