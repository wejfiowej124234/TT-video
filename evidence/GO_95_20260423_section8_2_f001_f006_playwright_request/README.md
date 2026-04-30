# GO_95 · §8.2 · F-001～F-006 · Playwright request

**95 v1.4.216** · 2026-04-23

## 复跑

```bash
cd frontend && npm run e2e:api-auth-local
```

## 结果

`6 passed`（`api-auth-chromium`；约 6s）。

**Spec:** `frontend/e2e/auth-login-logout-me.spec.ts`

**CI:** `.github/workflows/build.yml` `e2e` job → `npm run e2e -- --project=chromium` 含本文件。


## F 映射（摘录）

| F | HTTP |
|---|------|
| F-001 | POST /auth/register |
| F-002 | POST /auth/login + GET /api/v1/me |
| F-003 | POST /auth/logout + GET /api/v1/me → 401 |
| F-004 | GET /api/v1/me `user.email` |
| F-005 | PUT /api/v1/me nickname + GET |
| F-006 | PUT /api/v1/me/password + POST /auth/login |
