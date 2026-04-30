# GO_20260423_local_r001_close_loop_f007_f010_f032

**F-007 / F-010 / F-032** — 单轮 **API·IT（`Router::app` + `DATABASE_URL`）** + **Playwright E2E** + **R-001 `report.json`（`schema_version: "1"`）**。

## API·IT（93 / matrix）

| F | `cargo test -p traveltrust-api` 过滤子串 | 日志 |
|---|------------------------------------------|------|
| F-007 | `matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` | `api_it_f007.log` |
| F-010 | `matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` | `api_it_f010.log` |
| F-032 | `matrix_93_b_tgr_001_f032_get_trust_growth_config_autopilot_gen_matches_runtime_state_pg` | `api_it_f032.log` |

## E2E

- `cd frontend && npm run e2e:api-f007-f010-f032-local`（`e2e/f007-f010-f032-request.spec.ts`，`api-f007-f010-f032-chromium`）
- JSON：`npx playwright test … --reporter=json` → `playwright-report.json`

## 机读

```bash
python scripts/validate-regression-report.py evidence/GO_20260423_local_r001_close_loop_f007_f010_f032/report.json
```

## ISS-007

本包为 **local 双栈证据**（Rust + Playwright），**不**替代 **`.github/workflows/build.yml` · `e2e` job 成功 `run_id`** 或 **staging 全矩阵 GO**。
