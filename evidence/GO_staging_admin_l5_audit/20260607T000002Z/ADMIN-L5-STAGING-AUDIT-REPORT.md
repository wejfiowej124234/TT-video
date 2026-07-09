# Admin L5 Staging Audit

- stamp: 20260607T000002Z
- git: 7b86e58b04eb45b18e9528f63dfefb3efeabba70
- web: https://tt-web-staging.fly.dev
- audit_email: tourist@test.com
- login_role: super_admin
- browser: PASS
- verdict: **PASS**

## P0 blockers
- (none)

## Core API
- capabilities: HTTP 200
- orders_list: HTTP 200
- approvals_list: HTTP 200

## Middleware
- fe_middleware_no_cookie: HTTP 307 → https://tt-web-staging.fly.dev/auth/login?returnUrl=%2Fadmin
- fe_middleware_uid_only: HTTP 307 → https://tt-web-staging.fly.dev/auth/login?returnUrl=%2Fadmin
- fe_middleware_uid_and_ok: HTTP 200 → —