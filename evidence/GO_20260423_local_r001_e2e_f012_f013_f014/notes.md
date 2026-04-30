# GO_20260423_local_r001_e2e_f012_f013_f014

- **F-012** → R-001 `D-ITN-001` · Playwright `e2e/f012-f013-f014-request.spec.ts` · `api-itin-feed-chromium`
- **F-013** → R-001 `B-ORD-005`
- **F-014** → R-001 `D-COM-001`（spec 内 2 条用例合并为一条机读 case）

**命令**

- E2E：`cd frontend && npm run e2e:api-itin-feed-local`（需本机 API + `DATABASE_URL` + `SEED_TEST_ACCOUNTS=1` 等，见 95 §6 / 既有 runbook）
- JSON：`npx playwright test e2e/f012-f013-f014-request.spec.ts --project=api-itin-feed-chromium --reporter=json`

**机读**

- `python scripts/validate-regression-report.py evidence/GO_20260423_local_r001_e2e_f012_f013_f014/report.json` → **OK**（`schema_version: "1"`，`release_gate: PARTIAL_GO`）

**与 ISS-007**：本包为 **local 切片 + `report.json`**，**不**替代 CI `build.yml`·`e2e` 成功 `run_id` / staging 全矩阵 **GO**。
