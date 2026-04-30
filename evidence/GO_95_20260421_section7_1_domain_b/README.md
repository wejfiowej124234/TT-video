# GO_95 · §7.1 域 B（认证）审计证据 · 2026-04-21

## 页面路由（Next `app/auth/**/page.tsx`）

| 路径 | 文件 |
|------|------|
| `/auth/login` | `frontend/app/auth/login/page.tsx` |
| `/auth/register` | `frontend/app/auth/register/page.tsx` |
| `/auth/forgot-password` | `frontend/app/auth/forgot-password/page.tsx` |
| `/auth/reset-password` | `frontend/app/auth/reset-password/page.tsx` |
| `/auth/verify-email` | `frontend/app/auth/verify-email/page.tsx` |

## 契约对齐（抽检）

- **04 §3.4** 前端路由表：**`/auth/*`** 行登记 **`login` / `register` / `forgot-password` / `reset-password` / `verify-email`**，与上表一致。
- **`frontend/lib/api.ts`** **`routes.auth`**：`login`、`register`、`verifyEmail`、`forgotPassword`、`resetPassword` 等路径与 **04** **`POST /auth/*`** 表同源。
- **登录错误映射**：`frontend/lib/mapAuthLoginSubmitError.ts`（**`invalid_credentials`**、**`login_required`**、**`auth_db_persist_failed`**）与 **`apiClient`** 抛出的 **`Error.message`** 对齐；**04** 登录/严格门叙述对读。
- **验证邮箱页**：`verify-email/page.tsx` 注释指向 **POST `/auth/verify-email`**；**`token`/`code`** query 与 **04** 验证流一致。

## 命令（仓库根）

```bash
bash scripts/run-check-04-routes.sh
# exit 0（含 check-04-frontend-routes-vs-app）
```

## 边界

本证据为 **域级横切**（路由存在 + **api.ts** + 客户端错误映射抽检），**不**等价 **§8.2** **F-001～003** 行完成或全量 **API·IT** 负例矩阵。
