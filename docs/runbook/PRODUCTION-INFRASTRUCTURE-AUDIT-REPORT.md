# Production Infrastructure Audit Report

**程序：** Production Infrastructure Audit（**ACTIVE**）  
**纪律：** 业务开发 **FROZEN** · 功能/系统审计 **FROZEN** · 基线 `FINAL_SYSTEM_AUDIT: PASS`  
**优先闭合：** **PI3-001**（B-475 / Fly PG Backup）· **PI3-002**（域名 / CDN / CORS / TLS / DNS）  
**机读入口：** `bash scripts/dev/run-production-infrastructure-audit.sh`

---

## 0 · 机读键

```text
BUSINESS_DEVELOPMENT: FROZEN
SYSTEM_AUDIT_SCOPE: FROZEN
PRODUCTION_INFRASTRUCTURE_AUDIT: ACTIVE
FINAL_SYSTEM_AUDIT_BASELINE: PASS
```

---

## 1 · Executive Summary

| 维度 | 裁定 |
|------|------|
| **Staging 边缘（代理）** | TLS/CORS/health **PASS** — `*.fly.dev` |
| **B-475（PI3-001）** | **`PLANNED`** — prod backup **未启用** |
| **生产域名（PI3-002）** | **NOT_CONFIGURED** — 无专用 `app.` / `api.` 域 |
| **CDN / HLS** | **NOT_STARTED**（P1 · PI3-007 defer） |
| **Prod 部署模板** | **READY** — `deploy/fly/tt-api-prod` · `frontend/fly.production.toml` |
| **Prod secrets 清单** | **READY** — `scripts/dev/.env.production.example` |
| **Staging DR 演练** | **PASS** — rollback + db drill 2026-06-07 |
| **Prod DR 演练** | **NOT_RUN** — 待 prod apps 存在 |
| **Infrastructure GO** | **NO_GO** |

---

## 2 · Infrastructure Matrix

| ID | 组件 | Staging | Production | 裁定 | PI3 |
|----|------|---------|------------|------|-----|
| I-01 | API 边缘 HTTPS | `tt-api-staging.fly.dev` · `/health` 200 | **未部署** | STAGING_PASS / PROD_MISSING | PI3-002 |
| I-02 | Web 边缘 HTTPS | `tt-web-staging.fly.dev` · 200 | **未部署** | STAGING_PASS / PROD_MISSING | PI3-002 |
| I-03 | TLS 证书 | `*.fly.dev` · 至 2026-07-21 | **无专用域** | STAGING_PASS / PROD_MISSING | PI3-002 |
| I-04 | DNS | Fly 托管 `*.fly.dev` | **Owner 未注册** | PROD_BLOCKER | PI3-002 |
| I-05 | CORS | staging FE origin 反射 | **未配置** | STAGING_PASS / PROD_BLOCKER | PI3-002 |
| I-06 | CDN / 静态加速 | Fly 直连 | **NOT_STARTED** | P1_OPEN | PI3-007 |
| I-07 | Fly API app | `tt-api-staging` | `tt-api-prod` 模板就绪 | PROD_TEMPLATE_READY | PI3-002 |
| I-08 | Fly Web app | `tt-web-staging` | `tt-web-prod` 模板就绪 | PROD_TEMPLATE_READY | PI3-002 |
| I-09 | Secrets 分离 | staging env 文件 | `.env.production.example` | CHECKLIST_READY | PI3-002 |
| I-10 | env 硬闸 | seed=1 允许 | SEED=0 · no P3_CHAIN_OFF | SCRIPT_ENFORCED | PI3-002 |

**机读 JSON：** `evidence/.../infra-audit-<UTC>/infrastructure_matrix.json`

---

## 3 · Backup Matrix

| ID | 层级 | Staging | Production | 裁定 | PI3 |
|----|------|---------|------------|------|-----|
| B-01 | Fly 托管备份 | **not enabled** | **未验证 / 无 app** | FAIL | PI3-001 |
| B-02 | 逻辑 `pg_dump` | drill OK 2026-06-07 | **NOT_RUN** | STAGING_PARTIAL | PI3-001 |
| B-03 | B-475 机读 | `status=PLANNED` | 须升 **`PASS`** | BLOCKER | PI3-001 |
| B-04 | `last_restore_drill_utc` | `2026-06-07T03:51:45Z` | 须 prod UTC | STAGING_ONLY | PI3-001 |
| B-05 | WAL / PITR 描述 | staging 文字登记 | 须填 prod Fly WAL | INCOMPLETE | PI3-001 |

**闭合路径：**

```bash
# Owner · fly 可达时
bash scripts/dev/run-phase3-db-restore-drill-prod.sh
python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py
```

**机读 JSON：** `evidence/.../backup_matrix.json`

---

## 4 · Disaster Recovery Matrix

| ID | 场景 | Staging 证据 | Production | 裁定 |
|----|------|--------------|------------|------|
| DR-01 | Fly 镜像回滚 | `rollback-drill-20260607T035153Z` READY | `run-phase3-fly-release-rollback-drill-prod.sh` NOT_RUN | STAGING_PASS |
| DR-02 | DB 恢复演练 | `db-restore-drill-20260607T035120Z` READY | prod drill NOT_RUN | STAGING_PASS |
| DR-03 | PG 从备份恢复 | 文档化 · 无 full PITR | 须 Fly backup + 演练 | OPEN |
| DR-04 | API 健康探测 | `/health` 200 | 待 prod 部署 | OPEN |
| DR-05 | CORS 回滚后可用 | N/A | 与 DR-01 并联 | OPEN |
| DR-06 | 事故响应 Runbook | [PRODUCTION-INCIDENT-RESPONSE](./PRODUCTION-INCIDENT-RESPONSE.md) | 文档 READY | PASS |
| DR-07 | 迁移回滚指针 | [TT-B324](./TT-B324-DB-MIGRATION-ROLLFORWARD-RUNBOOK-POINTER.md) | 文档 READY | PASS |

**机读 JSON：** `evidence/.../disaster_recovery_matrix.json`

---

## 5 · P0 / P1 / P2 问题清单

**SSOT 机读生成：** `evidence/GO_phase2_testnet_20260526/phase3-production-prep/latest-infra-audit/issues-production-infrastructure.md`

### P0（挡 Production GO · 基础设施）

| ID | 域 | 说明 | 闭合动作 |
|----|-----|------|----------|
| INF-P0-001 | Fly CLI | fly auth 不可达则无法验 PG/apps | `fly auth login` + 网络 |
| INF-P0-002 | B-475 / PI3-001 | `status=PLANNED` | `run-phase3-db-restore-drill-prod.sh` → PASS |
| INF-P0-003 | Fly PG prod backup | prod PG backup 未启用 | `fly postgres backup create -a tt-traveltrust-prod` |
| INF-P0-004 | Prod domain / PI3-002 | 无专用生产域 | 注册域 → `fly certs` → 设 `PROD_*_BASE` |

### P1（不单独挡 M-00 · 须登记）

| ID | 域 | 说明 |
|----|-----|------|
| INF-P1-001 | Staging PG backup | staging 亦未开托管备份 |
| INF-P1-002 | CDN / HLS | P3-COM-1 NOT STARTED |
| INF-P1-003 | Secrets template | 已提供 `.env.production.example` |
| INF-P1-004 | Prod rollback drill | staging PASS · prod NOT_RUN |
| INF-P1-005 | Prod DB restore drill | staging PASS · prod NOT_RUN |

### P2

*本 Sprint 无 P2 登记。*

---

## 6 · Owner 闭合序（PI3-001 + PI3-002）

| 步 | 动作 | 脚本 / 路径 |
|----|------|-------------|
| 1 | 注册 `app.` + `api.` 域名 · DNS → Fly | Fly dashboard / `fly certs add` |
| 2 | 创建 `tt-traveltrust-prod` · 启用 backup plan | Fly Postgres |
| 3 | 填 `scripts/dev/.env.production.local` | 自 `.env.production.example` |
| 4 | 部署 API secrets + 镜像 | `phase3-production-fly-deploy-and-sync.sh` |
| 5 | 锁定 CORS | `patch-tt-api-prod-cors.sh` |
| 6 | 部署 Web | `deploy-tt-web-production.sh` |
| 7 | Prod DB 演练 → B-475 PASS | `run-phase3-db-restore-drill-prod.sh` |
| 8 | Prod 回滚演练 | `run-phase3-fly-release-rollback-drill-prod.sh` |
| 9 | 复审计 | `run-production-infrastructure-audit.sh` + `run-phase3-production-go-audit.sh` |

---

## 7 · 诚实边界

- 本审计 **仅** 生产基础设施 · **不** 修改业务代码  
- Staging `*.fly.dev` **≠** Production 专用域 GO  
- CDN/HLS **P1** — 十日首发可按 TT-MASTER §0.3 迭代  
- `FINAL_SYSTEM_AUDIT: PASS` **≠** Infrastructure GO

---

**维护者：** Sebastian Ward · 2026-06-07  
**关联：** [PRODUCTION-OPS-RUNBOOK](./PRODUCTION-OPS-RUNBOOK.md) · [PHASE3-PRODUCTION-PREPARATION](./PHASE3-PRODUCTION-PREPARATION.md)
