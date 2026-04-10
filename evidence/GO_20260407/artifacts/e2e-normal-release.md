# E2E：正常放款（07 §二 2.1 / evidence README）

| 字段 | 值 |
|------|-----|
| **环境** | 工程收口轮次；目标链/部署环境以 Runbook §10 与当次部署参数为准 |
| **日期** | 2026-04-07 |
| **执行人** | plant（收口确认） |
| **结论** | 可复核技术单源：`docs/verification-evidence-pack.md`、`docs/verification-evidence-sha256.txt`；链上 Escrow 事件与 01 §5 / 02 §七 对齐；**正式发版**须在目标环境补跑真实 tx / 订单 id 并更新本文件或私有制品库索引。 |
| **命令/入口** | `cargo test -p traveltrust-api`；`SKIP_FORGE_VERIFY=1 ./scripts/pre-release-automation.sh`；Indexer 对账 JSON 见同目录 `indexer-*.json`。 |
