# ops/monitoring（示例与可复制工件）

与 **Prometheus**、**内网对账探针**、**调度示例**相关的文件；叙述级 SSOT 仍以 **[RUNBOOK §2.55](../RUNBOOK.md)**（§2.55）、**[04-后端与API](../../docs/spec/04-后端与API.md)**（§7.10）、**[110](../../docs/spec/110-阶段开发链上索引器与事件同步器.md)**（§3.1.2）为准。

| 文件 | 说明 |
|------|------|
| **prometheus-alerts-indexer.example.yml** | Prometheus **`rule_files`** 告警示例（`/metrics` 索引器 gauge + 可选 **`traveltrust_api_attachments`**：`database_connected` / `chain_config_loaded`）；文件头注释说明 **RegionVaultForwarded** 行级投影无独立 gauge（与 **RUNBOOK §7.1**、**04 §7.10** 同口径）。 |
| **github-actions-indexer-probe.example.yml** | GitHub Actions：定时/手动跑 **`scripts/indexer-reconcile-probe.sh`**；**复制到 `.github/workflows/`** 后配置 **`INDEXER_PROBE_*`** secrets。 |
| **k8s-indexer-reconcile-probe.cronjob.example.yaml** | Kubernetes **CronJob** 内联探针（与仓库脚本逻辑对齐；改 jq 时双端同步）。 |
| **grafana-dashboard-traveltrust-indexer.example.json** | Grafana **Import** 用看板草稿（**`/metrics`** 索引器 gauge；Markdown 说明 DB 对账须 **internal 探针**）；导入后绑定 Prometheus **UID**。 |

对账探针脚本：**`scripts/indexer-reconcile-probe.sh`**（**`internal-indexer-ops.sh probe`**）。
