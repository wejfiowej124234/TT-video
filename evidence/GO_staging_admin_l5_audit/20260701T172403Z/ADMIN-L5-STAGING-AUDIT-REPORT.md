# Admin L5 Staging Audit

- stamp: 20260701T172403Z
- git: 987bc260cd4c4d409c317ddbf3c70d4c3d212a70
- web: https://tt-web-staging.fly.dev
- audit_email: tourist@test.com
- login_role: super_admin
- browser: FAIL
- verdict: **FAIL_P0**

## P0 blockers
- browser_probe — Playwright admin-l5-staging-closure failed

## Core API
- capabilities: HTTP 200
- orders_list: HTTP 200
- approvals_list: HTTP 200

## Middleware
- fe_middleware_no_cookie: HTTP 307 → https://tt-web-staging.fly.dev/auth/login?returnUrl=%2Fadmin
- fe_middleware_uid_only: HTTP 307 → https://tt-web-staging.fly.dev/auth/login?returnUrl=%2Fadmin
- fe_middleware_uid_and_ok: HTTP 200 → —