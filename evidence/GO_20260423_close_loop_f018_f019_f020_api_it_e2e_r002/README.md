# GO_20260423 · close-loop · F-018 / F-019 / F-020（API·IT + E2E + `report.json`）

## 本轮机读链

| 层 | 命令 |
|---|------|
| **API·IT** | `DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust` **`cargo test -p traveltrust-api`** **`matrix_93_d_com_010_f018_post_report_persists_pg_row_app_stack_ok_pg`** + **`matrix_93_d_com_009_f019_get_me_posts_lists_own_post_app_stack_ok_pg`** + **`matrix_93_b_mkt_004_f020_post_get_market_bookmarks_app_stack_ok_pg`** → **各 1 passed** |
| **E2E** | `cd frontend && SEED_TEST_ACCOUNTS=1 PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:api-d-com-018-020-local` → **`7 passed`**（`e2e/f018-f019-f020-request.spec.ts` · **`api-d-com-018-020-chromium`**） |

## commit

`48acbd10c6fbcf1aca4c84e867264fbbe1c1e3d5`

## 93 ↔ F

| F | 93 |
|---|-----|
| **F-018** | **D-COM-010** |
| **F-019** | **D-COM-009** |
| **F-020** | **B-MKT-004**（星标 **order**；**`004i`** 扇面在 E2E 子用例） |

## 诚实边界

- **`report.json`**：**`local`** · **`PARTIAL_GO`**；**不**闭 **ISS-007** 主干（staging 全矩阵 / CI **`e2e` `run_id`**）。
