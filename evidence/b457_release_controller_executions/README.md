# B-457 · release controller 执行回执（`execution_receipt.json`）

每次运行 **`scripts/ops/release-adapter-layer-b457-review-json-contract.py`** 会在 **`--evidence-dir`** 下生成 **`execution_receipt.json`**（**`receipt_schema`: `b457_execution_receipt_v1`**），作为 **Feature Flag / 部署 Webhook / ChatOps** 适配器调用的**可审计归档**。

- **默认** **`--dry-run`**（不传 **`--execute`**）：仅记录 **`dry_run`** / **`skipped_missing_env`**（不发起外呼）。
- **`--execute`**：在对应环境变量已配置时发起 HTTP；缺失变量仍写入回执，状态为 **`skipped_missing_env`**。

人读：**[TT-B457](../../docs/runbook/TT-B457-REVIEW-JSON-CONTRACT-RELEASE-ADAPTER-EXECUTION-001.md)**。
