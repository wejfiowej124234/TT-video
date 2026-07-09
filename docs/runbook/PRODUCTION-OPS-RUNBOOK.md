# Production Ops Runbook（Phase ③ · 准备轨）

**Version:** 1.0.1 · **2026-06-07**  
**阶段：** **③ 公网/生产准备** — **非** Production GO · **非** M-00 签字  
**SSOT 互指：** [PHASE3-PRODUCTION-PREPARATION](./PHASE3-PRODUCTION-PREPARATION.md) · [PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT](./PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md) · [go-live-checklist](../go-live-checklist.md) · [ops/RUNBOOK.md](../../ops/RUNBOOK.md) · [COMMUNITY-STAGING-OPS-RUNBOOK](./COMMUNITY-STAGING-OPS-RUNBOOK.md)（② 对照）

---

## 0 · 范围与边界

| 项 | 说明 |
|----|------|
| **本 Runbook 覆盖** | 生产 Fly 拓扑、部署/回滚、DB 备份恢复、监控探针、域名/TLS、env 审计、cutover smoke |
| **不覆盖** | 产品功能变更 · UI 结构 · 新 migration · Mainnet 资金敞口扩大 |
| **PASS 含义** | 文档 + 脚本可执行 + staging 代理演练证据 — **仍须** go-live §0–§11 + PI-3 闭卷 + M-00 |

**目标拓扑（规划 · 待 Owner 填实）：**

| 组件 | 规划名 | 当前 staging 代理 |
|------|--------|-------------------|
| API | `tt-api-prod`（Fly） | `tt-api-staging.fly.dev` |
| Web | `tt-web-prod`（Fly） | `tt-web-staging.fly.dev` |
| PostgreSQL | `tt-traveltrust-prod`（Fly PG） | `tt-traveltrust-staging` |
| 公网域名 | `app.<brand-domain>` + `api.<brand-domain>` | `*.fly.dev` only |
| 链 | Sepolia（②）→ Mainnet（③ 若 scope） | `chain_id=11155111` |

---

## 1 · 每日 / 部署后健康检查

```bash
# Production Infrastructure Audit（PI3-001/002 优先）
bash scripts/dev/run-production-infrastructure-audit.sh

# Phase ③ GO 审计（staging 代理 · 输出 go_no_go.json）
API_BASE=https://tt-api-staging.fly.dev \
WEB_BASE=https://tt-web-staging.fly.dev \
  bash scripts/dev/run-phase3-production-go-audit.sh
```

| 检查项 | 命令 | 期望 |
|--------|------|------|
| API 存活 | `curl -sS -o /dev/null -w '%{http_code}' $API/health` | **200** |
| 契约 meta | `curl -sS $API/meta` | **200** · `chain.chain_id` 符合环境 |
| internal 未裸奔 | `curl -X POST $API/api/v1/internal/indexer-tick`（无 secret） | **403/401** |
| Indexer 探针 | `bash scripts/indexer-reconcile-probe.sh`（内网 + secret） | exit **0** |
| 社区读路径 | `curl -sS "$API/api/v1/community/feed?limit=5"` | **200** |
| TLS | `openssl s_client -connect <host>:443 -servername <host>` | 证书未过期 |

**监控 smoke（② C8 同源 · staging）：**

```bash
API_BASE=https://tt-api-staging.fly.dev \
  bash scripts/dev/smoke-community-c8-staging-monitoring.sh
```

**Prometheus 规则（可选 promtool）：**

```bash
bash scripts/gates/check-ops-monitoring-prometheus-examples.sh
```

示例规则：`ops/monitoring/prometheus-alerts-indexer.example.yml` · `prometheus-alerts-onboarding-webhook-queue.example.yml`

---

## 2 · Fly PostgreSQL 备份与恢复（B-475）

**SSOT：** [TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001](./TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001.md)

| 步骤 | staging 演练 | production 必达 |
|------|--------------|-----------------|
| 启用托管备份 | `fly postgres backup list -a tt-traveltrust-staging` | **prod PG app** 开启 backup plan |
| 逻辑备份 | `pg_dump`（见 `run-phase3-db-restore-drill-staging.sh`） | 日级 cron / 托管快照 |
| 恢复演练 | 读-only + schema head 验证 | 季度 full restore 或 PITR 演练 |
| 机读记录 | `evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json` | **`status=PASS`** + 三字段非空 |

```bash
# Staging 演练
bash scripts/dev/run-phase3-db-restore-drill-staging.sh
python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py
```

**生产升格 checklist：**

- [ ] `wal_archive_destination_desc` 填实（Fly WAL / 等价）
- [ ] `logical_backup_schedule_desc` 填实（cron 频率 + 保留期）
- [ ] `last_restore_drill_utc` 为 **production** 演练 UTC
- [ ] `status` 升为 **`PASS`**（或书面 **`WAIVED`** + `notes`）

---

## 3 · 发布与回滚（Fly releases）

**Staging 演练（硬闸：仅 staging app 名）：**

```bash
bash scripts/dev/run-phase3-fly-release-rollback-drill.sh
```

**生产 cutover 顺序（书面 · 执行前双人复核）：**

1. 记录 **current** + **previous** image digest（`fly releases -a <app> --json`）
2. 预发/生产 **migrate**（`sqlx migrate run` · 见 go-live §2.2）
3. `fly deploy` API → 验 `/health` + `/meta`
4. `fly deploy` Web → 验壳路由 + CORS
5. 内网 `indexer-reconcile` → `indexer-tick`（[RUNBOOK §2.55](../../ops/RUNBOOK.md)）
6. Cutover smoke（go-live §7）
7. 异常 → §4 回滚

**回滚：**

```bash
fly deploy --image <previous-image-ref> -a tt-api-prod   # 示例
curl https://<api>/health   # 须 200
```

---

## 4 · 域名与 TLS

| 项 | staging（当前） | production（OPEN） |
|----|-----------------|---------------------|
| 前端 | `https://tt-web-staging.fly.dev` | 专用域名 + CDN |
| API | `https://tt-api-staging.fly.dev` | `api.` 子域或同域 BFF |
| 证书 | Fly `*.fly.dev` 自动 | ACM / Fly certs / CDN edge |
| CORS | staging origins | **仅** prod `CORS_ORIGINS`（go-live §3.2） |
| 混合内容 | HTTPS 全链路 | 禁止 HTTPS 页请求 `http://` API |

**检查命令：**

```bash
curl -sS -o /dev/null -w 'code=%{http_code} ssl=%{ssl_verify_result}\n' https://<host>/health
echo | openssl s_client -connect <host>:443 -servername <host> | openssl x509 -noout -dates
```

---

## 5 · 生产环境配置审计

对照 [`.env.example`](../../.env.example) 与 [go-live-checklist §3](../go-live-checklist.md)：

| 变量 / 项 | staging 允许 | production 必达 |
|-----------|--------------|-----------------|
| `SEED_TEST_ACCOUNTS` | `1`（②） | **`0` / unset** |
| `P3_CHAIN_OFF` | 可 `1`（本地联调） | **禁止** |
| `INTERNAL_API_SECRET` | 必配 | 必配 + WAF 禁公网 `/internal/*` |
| `CORS_ORIGINS` | staging FE host | **仅** prod FE origins |
| `DATABASE_URL` | staging PG | prod PG · TLS |
| `STRIPE_*` | test keys | **live** 实例隔离 |
| `CHAIN_ID` | `11155111` | 按 scope（Mainnet → §9） |
| `FINALITY_N` | 可调低 | 非调试值 **1** |

**机读审计：**

```bash
bash scripts/dev/run-phase3-production-go-audit.sh
# 产物：evidence/.../go-audit-<UTC>/env-audit-meta.txt · go_no_go.json
```

---

## 6 · Cutover 当日最小验收

并联 [go-live-checklist §7](../go-live-checklist.md)：

- `GET /health` · `GET /meta` → 200
- 订单读路径无 5xx（scope 内）
- `GET /governance/fee-pool-aggregates`（鉴权）与 DB 抽样一致
- Indexer tick 后 checkpoint 前进

---

## 7 · 相关文档

| 文档 | 关系 |
|------|------|
| [PRODUCTION-INCIDENT-RESPONSE](./PRODUCTION-INCIDENT-RESPONSE.md) | 事故分级 · 值班 · 证据 |
| [ops/RUNBOOK.md](../../ops/RUNBOOK.md) | 资损场景 ①～⑩ · P0 九项 |
| [issues-phase3-production](../../evidence/GO_phase2_testnet_20260526/phase3-production-prep/issues-phase3-production.md) | PI-3 问题清单 |
| [PRODUCTION-GO-NO-GO-AUDIT-REPORT](../../evidence/GO_phase2_testnet_20260526/phase3-production-prep/PRODUCTION-GO-NO-GO-AUDIT-REPORT.md) | 最终审核报告 |

---

*Phase ③ Production Ops Runbook · 2026-06-07*
