# Onboarding webhook 告警 · Prometheus `rule_files` 合入勾选（批次 N）

**用途：** 将仓库内 **`prometheus-alerts-onboarding-webhook-queue.example.yml`** 合入**各环境** Prometheus 时的运维清单；**不**替代 **on-call Owner 书面签字** 与 **120** 级 **SLO** 误差预算（见 **[120 §2.1.1](../../docs/spec/120-阶段开发观测告警日志与审计链路.md)**）。

**SSOT 叙述与工单模板：** **[TT-9618 §3.6.3](../../docs/runbook/TT-9618-onboarding-local-testnet.md#tt-9618-prometheus-onboarding-rules-merge)**（`#tt-9618-onboarding-on-call-template`）。

## 合入前

- [ ] API 已 scrape **`GET /metrics`**，且存在 **`traveltrust_onboarding_webhook_*`** / **`traveltrust_onboarding_http_*`**（与 **`matrix_93_d_onb_011_*`** 对拍）。
- [ ] 已用 **`bash scripts/gates/check-ops-monitoring-prometheus-examples.sh`**（或 **`promtool check rules`**）校验**副本** YAML 语法。
- [ ] 阈值按环境调参（示例中的 `for:` / 数字为**草稿**）。

## 合入

- [ ] 将规则文件路径加入该环境 **`prometheus.yml`**（或等价配置）的 **`rule_files:`** 列表；**reload** / 滚动重启按你们平台规范执行。
- [ ] 告警路由（Alertmanager **`receiver`** / **`routes`**）已指向值班表；**与 §3.6.3 on-call 表对拍**。

## 合入后

- [ ] Grafana 看板草稿 **`grafana-dashboard-onboarding-http.example.json`** 已 Import 并绑定正确 **Prometheus data source UID**（见本目录 **`README.md`** 表行）。
- [ ] 人为注入一条测试 **firing**（或 staging 压测）验证通知可达；记录 **UTC** 与 **Owner**（留痕 **96-15** / **GO_96_15_deep_*** 可选）。

**相关文件：** `prometheus-alerts-onboarding-webhook-queue.example.yml`、`scripts/gates/tt-9618-onboarding-pg-evidence.sh`（**§3.1 步 7** **`017`/`014`/`016`** **Stripe** **退款·拒付** **PG·IT** **与** **§3.6** **`009`–`012`**；可选 **`CHECK_FRONTEND_NPM_BUILD`** 与 **`promtool`** 段）。
