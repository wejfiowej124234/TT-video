# A-LOG-003

- **期望**：`POST /auth/logout` 后，带原 token 的 `GET /api/v1/me` → 401。
- **证据**：`request-response.redacted.json`（`me_after_logout_http`: 401）。
- **依赖**：服务端须包含会话删除实现（内存 + `sessions` 表）；见本 commit `auth_logout` / `delete_session`。
