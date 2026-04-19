# 本地全链路审计：注册 / 登录 / 用户域（不含链上交易与合约调用）

**范围**：浏览器 → Next.js → `traveltrust-api`（8080）→ 内存 `chain_off` / PostgreSQL。  
**不含**：Escrow 上链、Governor 投票上链、链读 SSOT 真值验收（仅标注「依赖链配置」的接口）。

---

## 1. 运行前置条件（不满足则表现为「登录不了 / 个人中心空 / 社区无数据」）

| 条件 | 作用 | 典型症状 |
|------|------|----------|
| **`traveltrust-api` 在 `PORT`（默认 8080）监听** | 所有 `/auth/*`、`/api/v1/*`、`/health`、`/meta` | `Failed to fetch`、getMe 超时变 `null`、登录无响应 |
| **前端 `NEXT_PUBLIC_API_BASE_URL` 与 Next `rewrites` 目标一致** | 浏览器同源代理到 API，避免 CORS | 直连错端口、仅部分请求失败 |
| **`DATABASE_URL`（可选但强烈建议）** | 用户/会话持久化、社区/消息/部分统计 | 无 DB：重启 API 后仅内存用户丢失；**社区 Feed/发帖等多数直接依赖 PG** |
| **`SEED_TEST_ACCOUNTS=1`（可选）** | 注入 `tourist@test.com` / `guide@test.com` 等 | 未开时无预置测试账号（开发 `main.rs` 在空 `CORS_ORIGINS` 时会默认设 `1`，勿依赖生产） |

**一键 E2E（注册 → 登录 → `/market`，Network JSON 断言）**：在 `frontend` 执行 `npm run e2e:auth-chain`（并行起 `traveltrust-api` + Next；默认 Next 端口 **3050** 以免复用陈旧 dev）。`frontend/lib/api.ts` 中 **`/auth/*` 在浏览器侧直连 `NEXT_PUBLIC_API_BASE_URL`**（与 App Router 同路径页面并存；POST 不能仅靠 Next `rewrites` 代理）。

**登出与会话失效（须本机 API :8080 已启动）**：`npm run e2e:auth-logout-me` — 登录 → `GET /api/v1/me` → `POST /auth/logout` → 旧 token 再 `GET /me` 期望 **401**（`login_required`）。

---

## 2. 鉴权模型（前后端对齐要点）

- **前端**（`frontend/lib/apiClient/core.ts`）：优先 `Authorization: Bearer <token>`（`localStorage` 中 `traveltrust_session_token`），否则 `X-User-Id`（`traveltrust_user_id`）。
- **后端**（`crates/api/src/state.rs` `extract_user_with_session_check`）：
  - **有 `db_pool` 且请求带 Bearer**：**仅**查 **`sessions` 表**（`db::get_user_id_by_token`），**不**信任单独伪造的 `X-User-Id` 冒用他人（见源码注释）。
  - **无 DB（纯内存）**：先查内存 `sessions`，再回退 `X-User-Id` / `bearer_<uuid>` 形态（联调）。
- **结论**：本地**有 PostgreSQL 时**，登录返回的 **`token` 必须随请求发送**（前端已写入 Bearer），否则仅带 `X-User-Id` 可能被拒绝或行为不一致。**与注册/登录成功后写入逻辑一致即视为对齐。**

---

## 3. 功能矩阵（用户域）

| 能力 | 依赖 API | 依赖 DB | 后端实现要点 | 前端入口 | 缺口 / 说明 |
|------|----------|---------|--------------|----------|-------------|
| 注册（旅行者/商家/主理人） | `POST /auth/register` | 双写（若配池）；strict 失败则 503 | `chain_off::auth_register` | `/auth/register` | 无 DB 时仅进程内有效 |
| 登录 | `POST /auth/login` | 会话可落库 | 内存 users 查找 + bcrypt；`sessions` | `/auth/login` | 重启无 DB → 旧账号不可用 |
| 登出 / 刷新 | `POST /auth/logout`（删 `sessions` + 内存）、`POST /auth/refresh` | 会话表 | `chain_off::auth_logout` / `auth_refresh` | 顶栏、客户端 | 登出须带 `Authorization: Bearer` |
| 忘记密码 / 重置 / 验证邮箱 | `POST /auth/forgot-password` 等 | — | **`_*_stub`**（链下占位） | `/auth/forgot-password` 等 | **非真实邮件链路**；产品级需 51-B1 类落地 |
| `GET /api/v1/me` | 需登录头 | hydrate 用户 | `extract_user_with_session_check` + `get_me_impl` | `/me` | `chain_off` 缺失时曾占位匿名（正常启动为 Some） |
| `GET /api/v1/me/stats` | 需登录 | 用户须在 store | 聚合订单等 | `/me` | 无订单时多为 0 |
| `PUT /api/v1/me` | 需登录 | put 双写策略依 env | `put_me_impl` | 个人中心编辑 | — |
| `PUT /api/v1/me/password` | 需登录 | 密码哈希更新 | `put_me_password`（非 stub 路径） | `/me/password` | 与 stub 区分见 `chain_off` |
| 社区 Feed / 发帖 / 评论等 | 多数路由 | **`db_pool` 必填** | 无池返回占位或 error | `/community/*` | **无 PostgreSQL = 空数据或不可用** |
| 订单链下（P3） | `P3_CHAIN_OFF` 等 | 订单可双写 | 内存 + 可选 DB | `/orders` 等 | 与「用户登录」正交，需单独配置 |

---

## 4. 已识别的「不对齐」与风险

1. **`router.refresh` 后注册页表单被清空**（已修）：成功注册/登录后勿对当前 `/auth/*` 调用 `router.refresh()`，应 `await router.replace(...)`。  
2. **`postLogin` 未统一 `throwUnlessApiOk`**（已修）：与 `postRegister` 一致，避免 HTTP 200 但 envelope 异常。  
3. **登录页未校验 `applyClientSessionAfterAuth`**（已修）：无 `user_id` 时不应跳转。  
4. **有 DB 时的 Bearer 门禁**：文档与联调人员需知：**仅 Bearer 走 sessions 表**；勿用手动改 `X-User-Id` 代替正式登录。  
5. **社区 vs 无 DB**：体验上「已登录但社区全空」易被误判为未登录——实为 **PG 未配或未迁移**。  
6. **邮件类 auth**：后端仍为 **stub**，与 04/51-B1 规划一致，**不宜作为生产找回密码方案**。

---

## 5. 建议的本地验收脚本（人工 / CI 可半自动）

1. `curl -sS http://127.0.0.1:8080/health` → 200。  
2. `POST /auth/register` → body 含 `status: ok`、`user_id`、`token`。  
3. `GET /api/v1/me` 带 `Authorization: Bearer <token>` → 200，`user.email` 一致。  
4. `POST /auth/login` 同邮箱密码 → 200，新 `token`。  
5. （可选）`psql`：`SELECT count(*) FROM users;` / `FROM sessions;`  
6. 配 `DATABASE_URL` 时：重启 API 后重复步骤 3，应仍能登录（hydrate）。  

---

## 6. 优化路线图（按性价比）

| 优先级 | 项 | 说明 |
|--------|----|------|
| P0 | 本地 **一键**：同时起 **API + Next**，文档指向 `NEXT_PUBLIC_API_BASE_URL` 与 rewrites | 减少「只起了前端」类问题 |
| P0 | **无 DB 时在 `/meta` 或登录页脚提示**：社区等需 PostgreSQL | 降低误判 |
| P1 | 监控 **`GET /api/v1/me` 404/超时**（已有 dev 控制台 warn） | 与运维文档联动 |
| P1 |  forgot/verify/reset **要么隐藏入口要么显式「开发占位」** | 避免用户以为可收邮件 |
| P2 | E2E：Playwright 覆盖 register → me → logout | 回归门禁 |
| P2 | **`STRICT_SESSION_GATE`** 与生产一致时，在文档列出前端必须带 Bearer | 与安全审计对齐 |

---

## 7. 结论摘要

- **注册 / 登录主路径**：在 **API 启动 + 前端代理正确** 的前提下，后端 **`chain_off` 完整**，与前端 **`apiClient` + `applyClientSessionAfterAuth`** 设计一致；近期代码已补齐 **登录 envelope 与 session 校验**。  
- **「用户所有功能」** 在本地是否可用，**关键分叉是 `DATABASE_URL`**：无库则 **社区/DB 强依赖能力** 不可用或为空；**订单链下、个人中心基础** 仍可在内存模式下验证。  
- **链上无关的缺口** 主要集中在：**邮件类 stub**、**无 DB 时数据不持久**、**社区与统计对 PG 的硬依赖**——需在产品和文档上显式标注，避免与「登录失败」混淆。

*文档版本：与仓库当前 `chain_off` / `apiClient` 行为一致时可作为评审附件；若路由或鉴权策略变更，请同步更新 §2–§3。*
