# B-405 · `b405-run-manifest.jsonl` 留证目录

**脚本**：[scripts/ops/b405-revenue-e2e-order-driven-runner.sh](../../scripts/ops/b405-revenue-e2e-order-driven-runner.sh)

**默认产物**：`b405-run-manifest.jsonl`（**NDJSON**；含 **`b405_session_start`**、每轮 **`b405_round`**（**`order_id`**、**`run_id`**、**`indexer_tick_http`**、**`b402_*`**、**`order_phase_*`**）、**`b405_session_ok`**）。

**与 B-403**：**B-403** 使用 **`evidence/b403_revenue_e2e_runs/b403-run-manifest.jsonl`**（无 **`order_id`**）；**本目录** 专供 **L2** **订单锚** **跑流**，**勿** **混写** **两** **份** **manifest** **除非** **清楚** **`GET …/revenue-e2e-run-status`** **解析** **顺序**（**先** **b403** **文件** **再** **b405** **文件**）。

**L1 聚合**：**`GET /api/v1/internal/revenue-e2e-run-status?run_id=<uuid>`**（见 **[spec/04 §3.4](../../docs/spec/04-后端与API.md)**、**[TT-B405](../../docs/runbook/TT-B405-REAL-ORDER-DRIVEN-REVENUE-E2E-L2-001.md)**）。

**B-406**：**自举** **建单** **后** **仍** **写入** **本** **manifest** **（** **[`scripts/ops/b406-revenue-e2e-bootstrap-and-runner.sh`](../../scripts/ops/b406-revenue-e2e-bootstrap-and-runner.sh)** **→** **b405** **）** **，** **见** **[TT-B406](../../docs/runbook/TT-B406-REVENUE-E2E-BOOTSTRAP-ORDER-001.md)** **。**

**B-407**：**真实** **链** **`release`/`distribute`** **编排** **后** **仍** **写入** **本** **manifest** **（** **[`scripts/ops/b407-revenue-e2e-real-chain-runner.sh`](../../scripts/ops/b407-revenue-e2e-real-chain-runner.sh)** **→** **b405** **）** **，** **见** **[TT-B407](../../docs/runbook/TT-B407-REAL-CHAIN-REVENUE-E2E-001.md)** **。**
