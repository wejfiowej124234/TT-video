# B-458 / TT-U01 · PASS/FAIL（Runbook §1）

**执行时间**：2026-04-17（本机 Windows）

## 命令与 exit 码

| 命令 | exit |
|------|------|
| `cargo test -p traveltrust-api register_me_logout_me -- --nocapture` | **0** |
| `cd frontend && npm run e2e:auth-chain` | **0** |
| `cd frontend && PLAYWRIGHT_VERIFY_PG=1 npm run e2e:auth-chain` | **0** |

**说明**：**`PLAYWRIGHT_VERIFY_PG=1`** **须** **根** **`.env`** **或** **环境** **提供** **`DATABASE_URL`** **，** **且** **本机** **`psql`** **或** **Docker** **`traveltrust-postgres`** **可** **连库** **（** **见** **`frontend/e2e/auth-register-login-market-chain.spec.ts`** **）** **。**

## §1.3 表（逐项）

| 项 | 结果 | 说明 |
|----|------|------|
| `POST /auth/register` 成功且 DB `users` 有行 | **PASS**（强封口） | **`PLAYWRIGHT_VERIFY_PG=1`** **E2E** **内** **`SELECT count(*) … users`** **=** **1** **（** **邮箱** **）** **。**
| `POST /auth/login` 成功；`GET /api/v1/me` 200 | **PASS** | **E2E** **捕获** **`captured.login`** **/** **`captured.me`** **与** **`user_id`** **一致** **；** **日志** **多次** **`/api/v1/me`** **200** **。**
| **`reload`** **后会话** **成立** **`GET /api/v1/me`** **→** **200** | **PASS** | **`auth-register-login-market-chain.spec.ts`** **`page.reload()`** **后** **`captured.me`** **新增** **条目** **`status: ok`** **且** **`user.id`** **与** **注册** **一致** **（** **非** **仅** **导航** **链** **上** **多次** **`/me`** **）** **。**
| **`sessions`** **与** **login** **token** **对齐**（若有） | **PASS**（强封口） | **`PLAYWRIGHT_VERIFY_PG=1`** **下** **`sessions` JOIN `users`** **=** **1** **。**
| E2E `e2e:auth-chain` | **PASS** | **`1 passed`** **，** **exit** **0** **。**

---

## 实现与 Runbook 对齐

- **Spec**：[`frontend/e2e/auth-register-login-market-chain.spec.ts`](../../frontend/e2e/auth-register-login-market-chain.spec.ts) **`data-testid="market-page"`** **→** **`reload`** **→** **轮询** **新** **`/me`** **ok** **。**
- **Runbook**：[`docs/runbook/TT-U01-TOURIST-REGISTER-LOGIN-E2E-001.md`](../../docs/runbook/TT-U01-TOURIST-REGISTER-LOGIN-E2E-001.md) **§1.2～§1.3** **。**
