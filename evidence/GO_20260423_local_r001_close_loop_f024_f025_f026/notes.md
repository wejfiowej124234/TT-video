# GO_20260423_local_r001_close_loop_f024_f025_f026

**F-024 / F-025 / F-026** — **API·IT**（`Router::app` + `DATABASE_URL`）+ **Playwright E2E** + **R-001 `report.json`（`schema_version: "1"`）**。

## API·IT（93 / matrix）

| F | `cargo test -p traveltrust-api` 过滤子串 | 日志 |
|---|------------------------------------------|------|
| F-024 | `matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg` | `api_it_f024.log` |
| F-025 | `matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` | `api_it_f025.log` |
| F-026 | `matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` | `api_it_f026.log` |

## E2E

- `cd frontend && npm run e2e:api-b-gde-dsp-msg-024-026-local`
- JSON：`npx playwright test e2e/f024-f025-f026-request.spec.ts --project=api-b-gde-dsp-msg-024-026-chromium --reporter=json` → **`playwright-report.json`**（须 API **`http://127.0.0.1:8080/health`** 可达，否则 spec 会 **skip**）

## 机读

```bash
python scripts/validate-regression-report.py evidence/GO_20260423_local_r001_close_loop_f024_f025_f026/report.json
```

## ISS-007

模块头 **`guides_disputes_db_api_tests.rs`** 写明 **F-023/024/025** 与 **ISS-007 窄口径**；本包仍 **不**替代 **CI `e2e` `run_id`** / **staging 全矩阵 GO**。
