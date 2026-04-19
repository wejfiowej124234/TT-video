# B-403 · `b403-run-manifest.jsonl` 留证目录

**脚本**：[scripts/ops/b403-revenue-e2e-repeatable-runner.sh](../../scripts/ops/b403-revenue-e2e-repeatable-runner.sh)

**默认产物**：`b403-run-manifest.jsonl`（**NDJSON**，每行一条 JSON；**含** **`session_id`**、每轮 **`run_id`**、**`indexer_tick_http`**、**`b402_exit`**、**`b402_last_line`**）。

**说明**：运行 runner 后生成/追加；是否提交到 git 由值班按证据策略决定（**勿**提交含密钥的日志）。

**互证**：Runbook [TT-B403-REVENUE-E2E-REPEATABLE-RUNNER-L0-001.md](../../docs/runbook/TT-B403-REVENUE-E2E-REPEATABLE-RUNNER-L0-001.md)
