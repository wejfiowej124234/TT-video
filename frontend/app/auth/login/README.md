# `/auth/login`

**UI 已冻结（2026-05-26 · ① 本地）** — 真源 **[`AUTH-LOGIN-UI-FREEZE.md`](../../evidence/GO_local_auth_l5/AUTH-LOGIN-UI-FREEZE.md)**。

## 实现索引

| 块 | 路径 |
|----|------|
| 页身 | `page.tsx` · `LoginPasswordVisibilityToggle.tsx` |
| L5 token 别名 | `lib/auth/loginL5.ts`（`TT_AUTH_LOGIN_L5`） |
| 共享表单/卡 | `lib/auth/authL5Form.ts` · `components/auth/AuthL5Card.tsx` · `AuthL5Checkbox.tsx` · `AuthL5PageBackdrop.tsx` |
| 大气 CSS | `app/globals.css` · `.auth-login-l5-card-halo` · `[data-tt-auth-visual="l5"]` |
| Loading | `LoginRouteLoading.tsx` · `loading.tsx` |
| Error | `error.tsx` → `AuthRouteErrorShell` |

## 链路（允许演进 · 不改壳）

- `postLogin` · `mapAuthLoginSubmitError` · `resolvePostAuthReturnPath`（无 `returnUrl` → **`/community` 动态**；裸 **`/community/me`** → 动态；**`?tab=`** 深链保留）· `AUTH_LOGIN_REMEMBER_EMAIL_KEY`
- 微任务封口：**B-001～B-004**（提交态 / i18n 错码 / returnUrl / 重试清错）

## 提交前

```bash
cd frontend && npm run test -- authLoginUiFreeze loginPageL5 authL5FullScore uiSystem --run
```

## 同族路由

| 路由 | UI 冻结 |
|------|---------|
| **`/auth/login`** | **是**（本页） |
| `/auth/register` 等 | **否** — 见 [`GO_local_auth_l5/README.md`](../../evidence/GO_local_auth_l5/README.md) |
