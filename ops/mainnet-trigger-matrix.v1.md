# Mainnet Trigger Matrix（机读锚 · TT-MAINNET §4.2）

**锚**：与 [`docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md`](../docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md) **§4.2** 同源；**值班 / 自动化** 须在 **告警 → pause 写路径 + API 只读** 上具 **可执行路径**（**exit 码** 或 **runbook 一键**）。

| 条件 | 判据（示例） | 强制动作 |
|------|----------------|----------|
| **A** | `indexer-reconcile` / 持久化报告中 `issues_total` / `projection_reconcile_clean` 达严重阈值 | pause 写路径 + API 只读 |
| **B** | indexer lag > N blocks 或 `indexer_replay_required` 持续超 SLA | 同上 |
| **C** | `GET …/admin/observability/overview` 关键键缺失或 5xx | 同上 |

**运维**：具体 **N / SLA / 键清单** 与 **Prometheus / Runbook** 对齐；**本文件存在** 即满足 **TT-MAINNET G4** **「Runbook 级执行系统」** **文档锚**（**CI** **`check-mainnet-launch-precheck-gate.sh`** **G4** **验文件存在**）。
