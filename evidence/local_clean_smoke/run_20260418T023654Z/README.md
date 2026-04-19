# Local clean-run smoke — PASS

**结论**：本轮在「本地干净口径」（PostgreSQL + `SEED_TEST_ACCOUNTS=1` + `PORT=8080`）下执行 `scripts/dev/smoke-ab-core-chain.sh`，**HTTP 主链 + 可选 DB 抽检**均通过，记为 **`local clean-run smoke PASS`**。

**证据文件**：

| 文件 | 说明 |
|------|------|
| `environment.md` | `DATABASE_URL`（脱敏）、`PORT`、`SEED_TEST_ACCOUNTS`、`API_BASE_URL` |
| `smoke.stdout.txt` | 完整 smoke 控制台输出 |
| `health.ok.txt` | `GET /health` 成功时间与响应 |
| `ENV-DB-PROOF/notes.md` | 与 smoke 第 10 步一致的 DB 核对口径（`orders` / `users` / `order_messages`） |

**说明**：本包为**本地可控环境**烟测证据，**不替代** staging **`report.json`**（见 R-003 / R-001）。
