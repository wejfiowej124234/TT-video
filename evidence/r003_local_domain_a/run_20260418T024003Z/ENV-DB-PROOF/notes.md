# ENV-DB-PROOF（本地 A 域）

**与铁律 ① 对齐**：本会话鉴权依赖 PostgreSQL `sessions` 表（`tts_*` token）；登录/登出路径对 **DB + 内存** 双删（见 `delete_session` + `auth_logout`）。

**本轮**：与 **`evidence/local_clean_smoke/run_20260418T023654Z`** 同源 **`DATABASE_URL`**（脱敏见该目录 `environment.md`）；API 进程已连接同一库并完成 hydrate。

**写后读**：`A-LOG-003` 证据显示登出后 `GET /api/v1/me` → **401**（`login_required`），证明会话自 `sessions` 移除后可复现。
