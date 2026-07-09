# 122 · PI3-001 Production Database Backup Readiness Report

> **Sprint**：PI3 Closure Sprint · **Phase 2 · PI3-001**  
> **审计 SSOT**：[PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md) · [121-PI3-002](./121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md) · [TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001](../../runbook/TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001.md)  
> **日期**：2026-06-07  
> **纪律**：**仅审计与方案确认** · **不修改生产配置** · **禁止** 前端/后端业务逻辑、支付、Catalog、Admin、Catalog S6+  
> **结论**：**PI3-001 HOLD**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **PI3-001 审计 Sprint（122 交付）** | **COMPLETE** — 备份/恢复/RPO/RTO/演练/监控/证据链审计 |
| **B-475 机读基线** | **`status=PLANNED`** — 形状 **PASS** · **非** Production PASS |
| **Staging PG（`tt-traveltrust-staging`）** | **PARTIAL** — 读连演练 OK · **Fly 托管备份未启用** · **`pg_dump` 失败** |
| **Production PG（`tt-traveltrust-prod`）** | **NOT_VERIFIED** — app/backup plan 未在本轮 fly 可达时确认 |
| **Prod 恢复演练** | **NOT_RUN** — `run-phase3-db-restore-drill-prod.sh` 未执行 |
| **RPO / RTO 书面基线** | **DRAFT** — 三字段已登记 · 保留 7d 为 Owner 待确认目标 |
| **监控告警（DB 连通）** | **TEMPLATE_READY** — `traveltrust_database_connected` 示例规则 |
| **监控告警（备份失败）** | **GAP** — 仓库无 Fly backup 专用 Prometheus 规则 |
| **Catalog / 121 PI3-002** | **UNCHANGED** — `CATALOG_RELEASE_FREEZE_GO` · **PI3-002 HOLD** |

**PI3-001 正式裁定：** **HOLD** — Fly 生产 PG 托管备份未启用、B-475 未升格 `PASS`、生产恢复演练未跑；**禁止** 以当前证据链宣称 Production DB 就绪。

**与 Phase ③ Entry：** `PHASE3_ENTRY_GO` **不** 覆盖 PI3-001；[PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX §4](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md) 仍将 PI3-001 列为 Production GO P0。

---

## 2. 审计范围与方法

| 项 | 说明 |
|----|------|
| **扫描** | B-475 JSON · 恢复 drill 脚本 · staging 证据包 · infra audit · Runbook · go-live §2.3 · Prometheus 示例 |
| **未执行** | `fly pg backup enable` · prod PG 创建 · 真实 PITR restore · 修改 `baseline_record.v1.json` → PASS |
| **Fly CLI（2026-06-07）** | **不可达**（`api.fly.io` 连接超时）— 托管备份列表 **未能** 在线复验 |
| **机读 gate** | `bash scripts/check-pi3-001-production-database-backup-readiness.sh` |
| **B-475 形状 gate** | `python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py` → **OK · status=PLANNED** |

---

## 3. PostgreSQL 拓扑

| 环境 | Fly App | API 消费 | 备份状态（审计时） |
|------|---------|----------|-------------------|
| **Staging ②** | `tt-traveltrust-staging` | `tt-api-staging` · DSN 见 `.env.staging-onboarding.local` | **Fly backup NOT enabled**（证据见 §5） |
| **Production ③** | `tt-traveltrust-prod`（规划） | `tt-api-prod` · `scripts/dev/.env.production.local` | **未验证 / 未启用** |
| **Local ①** | Docker / 本机 PG | dev `.env` | 不适用 B-475 PASS |

**迁移 SSOT：** `crates/api/migrations/` · 回滚指针 [TT-B324](../../runbook/TT-B324-DB-MIGRATION-ROLLFORWARD-RUNBOOK-POINTER.md) · cutover 前须 go-live §2.2 全量应用。

---

## 4. B-475 机读基线（当前快照）

**路径：** `evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json`

| 字段 | 当前值 | Production PASS 要求 |
|------|--------|----------------------|
| `schema` | `traveltrust_pg_backup_pitr_baseline.v1` | 不变 |
| `status` | **`PLANNED`** | **`PASS`**（或书面 `WAIVED` + notes） |
| `wal_archive_destination_desc` | Fly WAL staging/prod TBD 描述 | **非空 · prod 填实** |
| `logical_backup_schedule_desc` | staging drill + prod 7d 目标（Owner confirm） | **非空 · prod 节奏确认** |
| `last_restore_drill_utc` | `2026-06-07T03:51:45Z` | **须为 production 演练 UTC** |
| `notes` | staging drill · prod must enable backup | 保留历史 |

**形状验收：** `check-b475-pg-backup-pitr-baseline-record.py` 对 `PLANNED` 仅校验 JSON/schema — **通过**；**升格 PASS** 须三字段非空 + prod 演练 UTC。

---

## 5. Staging 恢复演练证据（2026-06-07）

**证据目录：** `evidence/GO_phase2_testnet_20260526/phase3-production-prep/db-restore-drill-20260607T035120Z/`  
**脚本：** `bash scripts/dev/run-phase3-db-restore-drill-staging.sh`  
**末行：** `TT_PHASE3_DB_RESTORE_DRILL: OK` · `STATUS.txt` = **READY**

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `fly postgres backup list` | **FAIL** | `backups are not enabled. Run fly pg backup enable -a tt-traveltrust-staging` |
| `fly postgres backup create` | **FAIL** | 同上 |
| `pg_dump` schema head | **FAIL** | `schema-head.sql` **0 bytes** · `pg_dump_ok: 0` |
| `psql` 读连 + `users` 计数 | **PASS** | `users_count=213` · DB `tt_api_staging` |
| 更新 `last_restore_drill_utc` | **PASS** | → `2026-06-07T03:51:45Z` |
| B-475 → PASS | **NO** | 脚本 **不** 升格 staging 为 PASS（by design） |

**裁定：** Staging 演练 = **连通性 + 流程 rehearsal**；**不能** 替代 prod Fly backup enable + prod drill + B-475 PASS。

**Staging Owner 补动作（P1 · 不挡 122 交付）：**

```bash
fly pg backup enable -a tt-traveltrust-staging
fly postgres backup create -a tt-traveltrust-staging
bash scripts/dev/run-phase3-db-restore-drill-staging.sh   # 期望 pg_dump_ok=1
```

---

## 6. Production 备份 / 恢复（目标 vs 现状）

### 6.1 Fly 托管备份

| 项 | Production 目标 | 现状 |
|----|-----------------|------|
| PG App | `tt-traveltrust-prod` | **未在本轮审计中确认存在** |
| 托管 backup plan | **enabled** | **NOT_ENABLED** |
| 按需快照 | `fly postgres backup create -a tt-traveltrust-prod` | **未执行** |
| 保留策略 | Fly plan 默认 + Owner 书面 **7d**（baseline 草案） | **未确认** |

### 6.2 逻辑备份（`pg_dump`）

| 项 | 目标 | 脚本 |
|----|------|------|
| 频率 | **日级**（cron / Fly 外调度 · Owner 选型） | prod drill 含 schema head |
| 存储 | 加密对象存储 · **不入 git** | `run-phase3-db-restore-drill-prod.sh` |
| 恢复演练 | cutover 前 **至少一次** prod drill | 同上 → 升格 B-475 |

### 6.3 PITR / WAL

| 项 | 说明 |
|----|------|
| **Fly Managed Postgres** | WAL 由 Fly 托管；`wal_archive_destination_desc` 须写清 app 名 |
| **Full PITR restore** | 仓库 **无** 自动化脚本 — Owner 按 Fly 文档 + [PRODUCTION-OPS-RUNBOOK §2](../../runbook/PRODUCTION-OPS-RUNBOOK.md) 执行 |
| **go-live §2.3** | 备份 + PITR **或等价** + **一次恢复演练** — **未勾** |

---

## 7. RPO / RTO（书面基线 · Owner 确认）

> 本 Sprint **不** 改 SLA 数值；以下为 baseline + Runbook 对齐的 **审计登记**。

| 指标 | 登记目标（草案） | 依据 | 现状 |
|------|------------------|------|------|
| **RPO** | **≤ 24h**（日级逻辑备份）+ Fly 托管快照（plan 依赖） | `logical_backup_schedule_desc` · L0 roadmap | **未启用 backup → RPO 未满足** |
| **RTO** | **SEV-2：30 min 首响**；PG 全挂 **4h 内** 恢复或 failover 决策 | [PRODUCTION-INCIDENT-RESPONSE §1](../../runbook/PRODUCTION-INCIDENT-RESPONSE.md) | 流程 **READY** · prod 演练 **未验** |
| **保留期** | Fly 托管 **7d**（Owner confirm）+ 逻辑备份 **30d**（建议） | baseline notes | **未书面签字** |
| **演练 cadence** | **季度** full restore 或 PITR 演练（prod） | PRODUCTION-OPS-RUNBOOK §2 | **0 次 prod** |

**风险 R-DB-01（P0）：** 无托管备份 ⇒ 单点数据丢失窗口 **无界**（相对 RPO 目标）。

**风险 R-DB-02（P0）：** `last_restore_drill_utc` 来自 **staging** — 不能用于 prod GO 签字。

---

## 8. 恢复演练流程（脚本 SSOT）

### 8.1 Staging（已跑 · 见 §5）

```bash
bash scripts/dev/run-phase3-db-restore-drill-staging.sh
# 期望：TT_PHASE3_DB_RESTORE_DRILL: OK
# 不升格 B-475 PASS
```

### 8.2 Production（未跑 · PI3-001 闭合路径）

```bash
# 前置：tt-traveltrust-prod 存在 · fly pg backup enable · .env.production.local 含 DATABASE_URL
fly pg backup enable -a tt-traveltrust-prod
bash scripts/dev/run-phase3-db-restore-drill-prod.sh
python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py   # 期望 status=PASS
```

**prod 脚本硬闸：**

- `fly postgres backup list` 不得含 `not enabled` / `no backups`
- `pg_dump` schema head **必须成功**（与 staging 不同）
- 成功时 **自动** 写 `baseline_record.v1.json` → **`status=PASS`**

### 8.3 Cutover 并联（DB 故障）

| 场景 | Runbook | 动作 |
|------|---------|------|
| PG 连接耗尽 / 不可用 | [PRODUCTION-INCIDENT-RESPONSE §2.2](../../runbook/PRODUCTION-INCIDENT-RESPONSE.md) | 限流 · 扩容 · **restore from backup** |
| 迁移失败 | go-live §8.3 · TT-B324 | 前滚修复 / **备份还原** |
| API 回滚 | `run-phase3-fly-release-rollback-drill-prod.sh` | 镜像回滚 **不** 替代 DB restore |

---

## 9. 监控与告警

| 信号 | 来源 | 仓库资产 | Production 状态 |
|------|------|----------|-----------------|
| DB 池连通 | `GET /meta.database_connected` · `traveltrust_database_connected` | `ops/monitoring/prometheus-alerts-indexer.example.yml` · `TravelTrustDatabaseNotConnected` | **模板** — 须 scrape prod API |
| Indexer / 投影 | `/metrics` + reconcile probe | 同上 · RUNBOOK §2.55 | staging 有 smoke · prod 待部署 |
| **Fly backup 失败 / 过期** | Fly 平台 | **无** 专用规则 | **GAP R-MON-01** |
| **备份 job 未跑** | cron / CI | **无** 登记 | **GAP R-MON-02** |

**建议 Owner 动作（执行期 · 非本 Sprint 代码）：**

1. Fly dashboard 备份告警或 weekly `fly postgres backup list` cron + 失败页  
2. 逻辑备份 cron 成功/失败 webhook  
3. 将 `TravelTrustDatabaseNotConnected` 合并进 prod Prometheus（`for: 10m` 已示例）

---

## 10. 证据链索引

| 路径 | 含义 |
|------|------|
| `evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json` | B-475 **机读主记录** |
| `evidence/b475_pg_backup_pitr_baseline/README.md` | 人读索引 |
| `.../db-restore-drill-20260607T035120Z/` | Staging 演练 **READY**（§5） |
| `.../infra-audit-20260607T145846Z/` | INF-P0-002/003 PI3-001 blockers |
| `scripts/dev/run-phase3-db-restore-drill-prod.sh` | Prod 演练 + PASS 升格 |
| `scripts/gates/check-b475-pg-backup-pitr-baseline-record.py` | 形状 / PASS 字段 gate |
| `docs/runbook/PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md` | 备份矩阵 B-01～B-05 |

---

## 11. 风险项汇总

| ID | 优先级 | 说明 | 闭合 |
|----|--------|------|------|
| R-DB-01 | **P0** | Prod Fly backup 未启用 | Owner · PI3-001 |
| R-DB-02 | **P0** | B-475 `PLANNED` · prod drill UTC 缺失 | `run-phase3-db-restore-drill-prod.sh` |
| R-DB-03 | **P0** | Staging 亦未 enable backup · pg_dump 失败 | staging enable（P1 对齐） |
| R-FLY-01 | **P0** | fly CLI 不可达时无法验 backup list | proxy + `fly auth login` |
| R-MON-01 | P1 | 无 backup 专用告警 | Owner 监控 |
| R-MON-02 | P1 | 无逻辑备份 cron 证据 | Owner cron + 证据目录 |
| R-PI3-002 | **P0** | 无 prod 域（121 HOLD） | 并联 PI3-002 · 不阻塞 B-475 脚本本身 |

---

## 12. 剩余 Owner 动作与复验命令

### 12.1 Owner 动作（按序）

| # | 动作 |
|---|------|
| 1 | 网络 + `fly auth login`（必要时 `HTTPS_PROXY` 见 PHASE2 deep gate） |
| 2 | 创建 / 确认 **`tt-traveltrust-prod`** Fly Postgres |
| 3 | **`fly pg backup enable -a tt-traveltrust-prod`** |
| 4 | **`fly postgres backup create -a tt-traveltrust-prod`** · 保留 `fly-backup-list.txt` 证据 |
| 5 | 填 **`scripts/dev/.env.production.local`**（`DATABASE_URL` · 勿提交） |
| 6 | **`bash scripts/dev/run-phase3-db-restore-drill-prod.sh`** |
| 7 | 确认 **`baseline_record.v1.json`** → **`status=PASS`** + 三字段 |
| 8 | （建议）staging **`fly pg backup enable`** + 复跑 staging drill |
| 9 | 登记 backup 监控 + 逻辑备份 cron |
| 10 | **`bash scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh`** → **PI3-001 GO**（152） |
| 11 | 并联 **`bash scripts/dev/run-production-infrastructure-audit.sh`** · go-live §2.3 勾选 |

### 12.2 复验命令（审计员 / Owner）

```bash
# PI3-001 只读 gate（本报告 SSOT）
bash scripts/check-pi3-001-production-database-backup-readiness.sh

# B-475 形状 / PASS 字段
python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py

# Staging 基线（不应 regress）
bash scripts/dev/run-phase3-db-restore-drill-staging.sh

# Production 闭合（Owner · 会改 baseline → PASS）
bash scripts/dev/run-phase3-db-restore-drill-prod.sh

# 基础设施矩阵
bash scripts/dev/run-production-infrastructure-audit.sh
```

---

## 13. GO / HOLD 判定表

| 条件 | 状态 |
|------|------|
| B-475 gate 形状 OK | **PASS** |
| `status=PASS` + prod 三字段 | **FAIL** |
| Fly prod backup enabled | **FAIL**（未验） |
| Prod restore drill | **NOT_RUN** |
| Staging Fly backup | **FAIL**（not enabled） |
| Staging pg_dump | **FAIL**（0 byte） |
| 监控 backup 专用规则 | **GAP**（P1） |
| 本 Sprint 改 prod / 业务代码 | **NONE** ✓ |

**最终结论：PI3-001 HOLD**

**升格 PI3-001 GO：** `run-phase3-db-restore-drill-prod.sh` 成功 · `check-b475` 打印 **`status=PASS`** · gate 输出 **`PI3-001_GO`** · go-live §2.3 可勾选。

---

## 14. 交叉引用

| 文档 | 关系 |
|------|------|
| [121-PI3-002](./121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md) | PI3-002 HOLD · prod PG 与 prod API 并联 |
| [120-S5](./120-S5-Catalog-Release-Freeze-Report.md) | Catalog 默认 flag 冻结 |
| [PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT](../../runbook/PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md) | B-01～B-05 |
| [postgresql-layered-evolution-roadmap L0](../../architecture/postgresql-layered-evolution-roadmap.md) | 单库生产级基线 |

---

**维护者：** PI3-001 Audit Sprint · 2026-06-07  
**下一 Sprint：** Owner §12.1 → 复验 gate → 并联 PI3-002 域名 cutover
