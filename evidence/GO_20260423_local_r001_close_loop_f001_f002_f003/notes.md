# GO_20260423_local_r001_close_loop_f001_f002_f003

**F-001 / F-002 / F-003** — **A 域认证**：**API·IT**（`router::app` + `DATABASE_URL`）+ **Playwright**（仅三条用例）+ **R-001 `report.json`**。

## API·IT（93 / matrix）

| F | `cargo test -p traveltrust-api` 过滤子串 | 日志 |
|---|------------------------------------------|------|
| F-001 | `matrix_93_a_reg_001b_f001_register_success_pg_users_row_app_stack_ok_pg` | `api_it_f001.log` |
| F-002 | `matrix_93_a_log_001b_f002_login_then_get_me_200_app_stack_ok_pg` | `api_it_f002.log` |
| F-003 | `matrix_93_a_log_003b_f003_logout_then_get_me_unauthorized_app_stack_ok_pg` | `api_it_f003.log` |

## E2E

- 全文件：`npm run e2e:api-auth-local`（**6** 条，含 F-004～006）。
- **本包仅 F-001～003**：`npx playwright test e2e/auth-login-logout-me.spec.ts --project=api-auth-chromium --grep 'F-001 ·|F-002 ·|F-003 ·'`
- 须 **`SEED_TEST_ACCOUNTS=1`**（**`tourist@test.com`**）以便 **F-002 / F-003**；**`PLAYWRIGHT_API_HEALTH_URL`** 可达。

## 机读

```bash
python scripts/validate-regression-report.py evidence/GO_20260423_local_r001_close_loop_f001_f002_f003/report.json
```

## ISS-007

**A 域注册/登录/登出** 与 **CI `e2e`** 同文件 **`auth-login-logout-me.spec.ts`** 主干对齐；本包 **不**替代 **`build.yml`·`e2e` `run_id`**。
