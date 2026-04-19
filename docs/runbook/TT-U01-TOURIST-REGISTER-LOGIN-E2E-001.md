# TT-U01-TOURIST-REGISTER-LOGIN-E2E-001 · **旅行者** **注册** **/** **登录** **E2E** **（** **真** **API** **）**

**母表**：[B-458](../任务母表.md) **（** **上序** **行** **为** **[B-457](TT-B457-REVIEW-JSON-CONTRACT-RELEASE-ADAPTER-EXECUTION-001.md)** **，** **仅** **同** **表** **连续** **登记** **，** **无** **实现** **阻塞** **）**

**全局执行顺序（与 [B-459](TT-U02-TOURIST-PLACE-ORDER-E2E-001.md)…[B-462](TT-A02-FRONTEND-API-DB-ALIGN-ORDERS-001.md) 同读）**：**TT-U01** **→** **TT-A01** **→** **TT-U02** **→** **TT-A02** **→** **TT-U03** **。** **本卡** **为** **首卡** **：** **先** **保证** **注册** **/** **登录** **/** **`GET /api/v1/me`** **真通** **，** **再** **做** **下单** **与** **状态** **/** **评价** **。**

**前置**：**[04 §二/三](../spec/04-后端与API.md)** **用户** **与** **账号** **；** **页面** **`/auth/register`** **、** **`/auth/login`** **（** **见** **04** **注册** **段** **）** **。** **互证** **会话** **hydrate** **：** **[TT-B446](./TT-B446-SESSION-TOKENS-DB-POOL-HYDRATE-LOGIN-001.md)** **（** **B-446** **）** **。**

---

## §1 · 最小验收（封口前必产出）

### §1.1 · 一条后端机读命令（exit 0 = 绿）

```bash
DATABASE_URL="${DATABASE_URL:-}" cargo test -p traveltrust-api register_me_logout_me -- --nocapture
```

**说明**：**依赖** **`DATABASE_URL`** **时** **跑** **`auth_logout_api_tests`** **注册** **→** **登出** **/** **`401`** **路径** **；** **无库** **时** **若** **测试** **skip** **，** **须** **在** **证据** **`pass_fail.md`** **注明** **并** **改** **用** **本机** **有** **`DATABASE_URL`** **重跑** **。**

### §1.2 · 一条前端 / E2E 命令（exit 0 = 绿）

```bash
cd frontend && npm run e2e:auth-chain
```

**说明**：**等价** **`playwright test e2e/auth-register-login-market-chain.spec.ts`** **；** **须** **本机** **API** **与** **`NEXT_PUBLIC_API_BASE_URL`** **（** **或** **Next** **rewrite** **）** **可用** **，** **见** **该** **spec** **头注释** **。** **硬** **封口** **：** **登录** **进入** **`/market`** **后** **`page.reload()`** **，** **须** **再** **出现** **`GET /api/v1/me`** **→** **200** **（** **`status: ok`** **）** **，** **不得** **以** **「** **仅** **导航** **中** **多次** **`/me`** **」** **替代** **。** **强** **封口** **（** **PostgreSQL** **真值** **）** **：** **`PLAYWRIGHT_VERIFY_PG=1`** **且** **环境** **含** **`DATABASE_URL`** **（** **本机** **`psql`** **或** **Docker** **`traveltrust-postgres`** **可** **执行** **SQL** **）** **：**

```bash
cd frontend && PLAYWRIGHT_VERIFY_PG=1 npm run e2e:auth-chain
```

### §1.3 · PASS / FAIL 表（执行后手填）

| 项 | PASS | FAIL 时记录 |
|----|------|-------------|
| **`POST /auth/register`** **成功** **且** **DB** **`users`** **有** **行** | ☐ | 邮箱**/**约束**/**503 |
| **`POST /auth/login`** **成功** **；** **`GET /api/v1/me`** **200** | ☐ | token**/**401 |
| **整页** **`reload`** **后** **仍** **`GET /api/v1/me`** **→** **200** **（** **新** **请求** **）** | ☐ | **未** **复现** **reload** **后** **`/me`** **；** **cookie** **/** **storage** |
| **E2E** **`e2e:auth-chain`** **exit** **0** | ☐ | trace**/**截图路径 |

### §1.4 · 证据落点（仓库内）

**目录**：**`evidence/b458_tt_u01_tourist_register_login_e2e/`**

**须** **含** **：** **`pass_fail.md`** **（** **§1.3** **勾选** **+** **命令** **exit** **码** **）** **；** **可选** **`network_trace.zip`** **/** **`screenshots/`** **/** **`psql_users_snippet.txt`** **（** **脱敏** **）** **。**

---

## §2 · 范围与真值

| 柱 | 真值来源 |
|----|----------|
| **页面** | **`frontend/app/auth/register`** **、** **`frontend/app/auth/login`** **、** **`frontend/app/me`** |
| **API** | **`POST /auth/register`** **、** **`POST /auth/login`** **、** **`GET /api/v1/me`** **（** **04** **）** |
| **DB** | **`users`** **、** **session** **相关** **（** **41** **/** **DDL** **）** |
| **文档** | **[04](../spec/04-后端与API.md)** **、** **[14](../spec/14-合约-API-ABI-前后端对齐.md)** |

---

## §3 · 非目标

- **不** **在本卡** **单独** **收口** **向导** **/** **商家** **注册** **（** **见** **TT-U04** **/** **U05** **第二批** **）** **。**
- **不** **替代** **邮件** **服务商** **接入** **审计** **；** **邮箱** **验证** **若** **阻塞** **，** **在** **`pass_fail.md`** **写明** **环境** **策略** **。**

---

**文档版本**：1.0 · 2026-04-17
