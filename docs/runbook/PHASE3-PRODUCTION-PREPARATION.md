# Phase ③ · Production Preparation（准备轨 · 非 Production GO）

**生效：** 2026-06-07 · **SSOT 更新：** 2026-07-02  
**前置：** ② `TT_TESTNET_SIGNOFF: CLOSED` · `TT_TESTNET_GRADUATION: CLOSED` · Phase 1 Ops Validation **CLOSED**  
**状态：** **ACTIVE** — Production Readiness Review 轨（Convergence **CLOSED** 2026-07-01）  
**纪律：** Production GO **仍为 NO_GO** 直至 PI3 生产专属项关闭 · **真问题（Defect/Drift/Conflict/Risk）全部修复** · **Expected Difference 仅确认设计、禁止修成一致** · 见 [对齐审计长期规则](./TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md) · **核心业务链不修改** · PES 叠加层 **FROZEN**

> **≠ Production GO** · **≠ ③ 公网真链 / live PSP** — 见 [go-live-checklist](../go-live-checklist.md) · [TT-MASTER-PUBLISH-GO-CHECKLIST-001](./TT-MASTER-PUBLISH-GO-CHECKLIST-001.md)

---

## 0 · 机读键

```text
PHASE3_ENTRY_GATE: READY
PHASE3_ENTRY_REVIEW: READY
PHASE3_PRODUCTION_PREP: ACTIVE
PHASE3_OPS_VALIDATION: CLOSED
PHASE3_PRODUCTION_CONVERGENCE: CLOSED
PHASE3_PRODUCTION_GO: NO_GO
PHASE3_PRODUCTION_READINESS_REVIEW: PENDING
ADM_U01_STAGING_RBAC: GO
ADM_U01_EVIDENCE_LATEST: evidence/GO_staging_admin_rbac_matrix/latest
ADM_U02_STAGING_PERMISSIONS: GO
ADM_U02_EVIDENCE_LATEST: evidence/GO_staging_admin_adm_u02/latest
TT_ADMIN_PLATFORM_DEV_FROZEN: true
TT_ADMIN_PLATFORM_STATUS: STABLE_FINAL
TT_ADMIN_PLATFORM_PERMANENT_FREEZE: true
TT_ADMIN_PLATFORM_OWNER: CLOSED
TT_ADMIN_PLATFORM_BLOCKING_PRODUCTION_GO: false
TT_ADMIN_PLATFORM_EXIT_MAINLINE: true
TT_ADMIN_ENTERPRISE_CAPABILITY_COMPLETE: true
TT_ADMIN_CAPABILITY_LEVEL: ENTERPRISE_COMPLETE
TT_PHASE2_ADMIN_FINAL_VALIDATION: GO
TT_ADMIN_PLATFORM_DEV_VALIDATION: CLOSED
TT_PRODUCTION_GO_BLAME_ADMIN: FORBIDDEN
TT_CURRENT_MAINLINE: PI3,PRODUCTION_READINESS,MAINNET,PRODUCTION_GO
TT_RELEASE_PIPELINE: ENFORCED
TT_DISPLAY_DATA_GOVERNANCE: PASS
TT_BUSINESS_MANUAL_UAT: PASS
TT_FRONTEND_API_CONSISTENCY_AUDIT: PASS
TT_PHASE12_FINAL_CONVERGENCE: CLOSED
TT_PHASE_1_LOCAL: CLOSED
TT_PHASE_2_TESTNET_STAGING: CLOSED
TT_ADMIN_GOVERNANCE_DISCIPLINE: ACTIVE
TT_DELIVERY_DECISION_POLICY: ENFORCED
TT_PROGRAM_MAINLINE_DISCIPLINE: ENFORCED
TT_PROJECT_PHASE: PRODUCT_DELIVERY
TT_ADMIN_PLATFORM_FINAL_CONVERGENCE: CLOSED
TT_ADMIN_OPERATOR_MAP_SSOT: ACTIVE
PRODUCT_ENHANCEMENT_SPRINT: ARCHIVED
PRODUCTION_INFRASTRUCTURE_AUDIT: ACTIVE
SYSTEM_AUDIT_SCOPE: FROZEN
FINAL_SYSTEM_AUDIT_BASELINE: PASS
PRODUCTION_GO_DECISION: NO_GO
TT_TESTNET_SIGNOFF: CLOSED
TT_TESTNET_GRADUATION: CLOSED
ALIGNMENT_AUDIT_CLASSIFICATION: EXPECTED_DIFFERENCE_VS_DRIFT
PRE_PRODUCTION_GO_CLOSURE: FIX_REAL_ONLY_CONFIRM_EXPECTED
RISK_CLASSIFICATION: BLOCKING_VS_NON_BLOCKING
TT_PHASE3_CONVERGENCE_GATE: PASS
TT_CAPABILITY_MATRIX_UNIFIED: ACTIVE
TT_ENTERPRISE_CAPABILITY_AUDIT: ACTIVE
TT_ENTERPRISE_CAPABILITY_AUDIT_VERSION: 2.1.0
TT_EVIDENCE_COMPLETENESS: PARTIAL
TT_EVIDENCE_PRODUCT_TRACK: COMPLETE
TT_EVIDENCE_PRODUCTION_TRACK: IN_PROGRESS
TT_PRODUCT_CAPABILITY: ENTERPRISE_COMPLETE
TT_PRODUCTION_CAPABILITY: IN_PROGRESS
TT_RELEASE_DECISION: NO_GO
TT_PROJECT_REPORTING_TEMPLATE: FIXED_20260702
TT_FORBIDDEN_REPORT_TOPICS: ADMIN_DAILY_PROGRESS,OFFICIAL_OPS_DAILY,CMS_DAILY
TT_PROGRAM_MAINLINE: PI3,PRODUCTION_READINESS,MAINNET,PRODUCTION_GO
```

**交付决策最高裁决：** [`TT-DELIVERY-DECISION-POLICY.md`](TT-DELIVERY-DECISION-POLICY.md) · `TT_DELIVERY_DECISION_POLICY: ENFORCED` · 三问决策门

**项目最高治理原则：** [`TT-PROGRAM-MAINLINE-DISCIPLINE.md`](TT-PROGRAM-MAINLINE-DISCIPLINE.md) · `TT_PROGRAM_MAINLINE_DISCIPLINE: ENFORCED` · **Product Delivery 阶段**

**Admin 治理纪律（STABLE_FINAL · CLOSED · 不进汇报主线）：** [`TT-ADMIN-PLATFORM-GOVERNANCE-DISCIPLINE.md`](TT-ADMIN-PLATFORM-GOVERNANCE-DISCIPLINE.md) · [`TT-ADMIN-PLATFORM-CLOSURE-20260702.md`](TT-ADMIN-PLATFORM-CLOSURE-20260702.md)

**固定汇报格式（强制）：** [`TT-PROGRAM-MAINLINE-DISCIPLINE.md`](TT-PROGRAM-MAINLINE-DISCIPLINE.md) §4 · **只报 Product Capability / Production Capability / Current Mainline**

**对齐审计长期规则（①↔② 毕业 · Phase ③ 主轨切换）：** [TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md](./TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md)

**Sign-off SSOT（③ 机读）：**
- ② Testnet：`evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260701T002252Z.md`
- Phase 1 Ops：`evidence/manual-uat/signoff/PHASE3-OPS-VALIDATION-SIGNOFF-20260701T010000Z.md`
- Phase 2 Convergence：`evidence/manual-uat/signoff/PHASE3-PRODUCTION-CONVERGENCE-SIGNOFF-20260701T004341Z.md`
- **ADM-U01 Staging RBAC：** `evidence/manual-uat/signoff/ADM-U01-STAGING-RBAC-SIGNOFF-20260701.md` · `evidence/GO_staging_admin_rbac_matrix/latest/report.json`
- **Phase ③ Convergence 审计：** `go-audit-20260701T101638Z/go_no_go.json` · `TT_PHASE3_CONVERGENCE_GATE: PASS` · `PHASE3_PRODUCTION_GO: NO_GO`（7× production-only blockers）
- **ADM-U02 Staging 权限/2FA：** `evidence/manual-uat/signoff/ADM-U02-STAGING-PERMISSIONS-SIGNOFF-20260701.md` · `evidence/GO_staging_admin_adm_u02/latest/report.json`
- **Phase② Admin Final Validation GO：** `evidence/manual-uat/signoff/PHASE2-ADMIN-FINAL-VALIDATION-SIGNOFF-20260702.md` · `evidence/GO_staging_admin_final_validation_walkthrough/20260702T003523Z/report.json` · `evidence/GO_admin_platform_40_complete/20260701T180425Z/report.json`
- **Admin Platform Closure：** [`TT-ADMIN-PLATFORM-CLOSURE-20260702.md`](TT-ADMIN-PLATFORM-CLOSURE-20260702.md) · `TT_ADMIN_PLATFORM_DEV_VALIDATION: CLOSED`
- 历史 Owner（2026-06-07）：`evidence/GO_phase2_testnet_20260526/phase3-production-prep/PHASE3-OWNER-SIGNOFF-SEBASTIAN-WARD-20260607.md`

---

## 1 · P0 优先序（当前 Sprint · 2026-06-07 更新）

**纪律：** **代码 / UI / DB schema / RBAC 冻结** — 本 Sprint **仅** PI-3 + go-live 运维子集。

| 序 | 轨道 | ID | 目标 | 入口 | 通过标准 |
|----|------|-----|------|------|----------|
| **P0-1** | **Merchant 闭环** | RP-002 · RP-005 | staging 可重复商家账号 + 注册→审核→listing 证据 | `bash scripts/dev/smoke-provider-onboarding-staging.sh` | 末行 **`TT_PHASE3_MERCHANT_CLOSURE: OK`** · listing **GET** 可读 |
| **P0-2** | **数据库恢复演练** | B-475 · TT-B475 | Fly PG 备份清单 + 逻辑 dump + 恢复演练记录 | `bash scripts/dev/run-phase3-db-restore-drill-staging.sh` | 末行 **`TT_PHASE3_DB_RESTORE_DRILL: OK`** · `last_restore_drill_utc` 更新 |
| **P0-3** | **生产回滚演练** | Fly releases | API/Web staging 镜像回滚→健康→回滚前镜像 | `bash scripts/dev/run-phase3-fly-release-rollback-drill.sh` | 末行 **`TT_PHASE3_RELEASE_ROLLBACK_DRILL: OK`** · 两轮 `/health` **200** |
| **P0-4** | **Production GO 审计** | PI-3 · GL | Runbook + 事故响应 + 监控 + 域名/TLS + env 审计 | `bash scripts/dev/run-phase3-production-go-audit.sh` | 产物 **`go_no_go.json`** · 报告 **[PRODUCTION-GO-NO-GO-AUDIT-REPORT](../../evidence/GO_phase2_testnet_20260526/phase3-production-prep/PRODUCTION-GO-NO-GO-AUDIT-REPORT.md)** |

**一键编排（Owner 终端 · 须 proxy + fly auth）：**

```bash
export HTTPS_PROXY=http://127.0.0.1:15715 HTTP_PROXY=http://127.0.0.1:15715 ALL_PROXY=socks5://127.0.0.1:15715
bash scripts/dev/run-phase3-production-prep-p0.sh
bash scripts/dev/run-phase3-production-go-audit.sh
```

**证据根：** `evidence/GO_phase2_testnet_20260526/phase3-production-prep/<UTC-stamp>/`  
**PI-3 清单：** [`issues-phase3-production.md`](../../evidence/GO_phase2_testnet_20260526/phase3-production-prep/issues-phase3-production.md)

---

## 2 · P0-1 · Merchant 闭环（RP-002 / RP-005）

**范围：** staging **数据 + 流程** — **不** 改 `market_merchant_gate` 规则 · **不** 改 Provider UI 冻结结构。

| 步骤 | 动作 |
|------|------|
| 1 | 固定账号 **`merchant@test.com`** / `Test123!`（或脚本内 `PHASE3_MERCHANT_EMAIL`） |
| 2 | 注册 → 资质 → （可选）准入费 webhook → Admin **`provider-applications`** 审核 |
| 3 | **`POST /api/v1/market/provider/listings`** → **`GET`** catalog 回读 |
| 4 | Deep Gate **G03 merchant** 登录烟测可 PASS（非 alone blocking） |

**本地对照（① · 非 staging GO）：** `bash scripts/dev/smoke-provider-onboarding-local.sh`

**HAT 基线缺口：** [HUMAN-ACCEPTANCE-REPORT](./HUMAN-ACCEPTANCE-REPORT.md) 商家 **PARTIAL** — 本轨收口后更新 Phase ③ prep 证据，**不** 自动改 HAT ②.8 历史报告。

---

## 3 · P0-2 · 数据库恢复演练（staging · Fly PG）

**App：** `tt-traveltrust-staging` · DSN 见 `scripts/dev/.env.staging-onboarding.local`

| 步骤 | 动作 |
|------|------|
| 1 | `fly postgres backup list` / `backup create`（或托管快照 API） |
| 2 | `pg_dump` 逻辑备份至证据目录（**不含** secrets 明文） |
| 3 | 恢复演练：**新库/临时 schema** 或 **文档化** restore 步骤 + Owner 签字 |
| 4 | 更新 [`evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json`](../evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json) **`last_restore_drill_utc`** |

**机读验收：** `python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py`（`status=PASS` 或 staging 演练 **`WAIVED`** + notes）

**指针：** [TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001](./TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001.md) · [TT-B324 迁移回滚指针](./TT-B324-DB-MIGRATION-ROLLFORWARD-RUNBOOK-POINTER.md)

---

## 4 · P0-3 · 生产回滚演练（staging Fly releases）

**Apps：** `tt-api-staging` · `tt-web-staging`

| 步骤 | 动作 |
|------|------|
| 1 | `fly releases -a <app>` 记录 **current** + **previous** image |
| 2 | `fly deploy --image <previous>`（**仅 staging**） |
| 3 | `curl https://<app>.fly.dev/health` → **200** |
| 4 | `fly deploy --image <current>` 回滚前镜像 · 再验 **200** |
| 5 | 证据：`rollback-drill.json`（image digests · timestamps · health codes） |

**禁止：** 对 production app 执行本演练脚本（脚本内 **hard gate** staging app 名）。

---

## 5 · 显式排除（Phase ③ prep 仍不做）

- 五主路由 / Auth / Provider / Escrow **UI 结构**变更  
- 新 API 路由 · 新 DB migration · RBAC 矩阵扩展  
- Mainnet / live PSP / Production CDN（RP-033 · RP-035）  
- **Production GO** 签字（M-00 / PI-3 P0 清单）

---

## 6 · P0-4 · Production GO 准备包（Runbook / 事故 / 监控 / 域名 / env）

| 交付物 | 路径 |
|--------|------|
| **Production Ops Runbook** | [PRODUCTION-OPS-RUNBOOK](./PRODUCTION-OPS-RUNBOOK.md) |
| **事故响应流程** | [PRODUCTION-INCIDENT-RESPONSE](./PRODUCTION-INCIDENT-RESPONSE.md) |
| **PI-3 问题清单** | [`issues-phase3-production.md`](../../evidence/GO_phase2_testnet_20260526/phase3-production-prep/issues-phase3-production.md) |
| **GO/NO-GO 审核报告** | [`PRODUCTION-GO-NO-GO-AUDIT-REPORT.md`](../../evidence/GO_phase2_testnet_20260526/phase3-production-prep/PRODUCTION-GO-NO-GO-AUDIT-REPORT.md) |
| **Production Readiness Report** | [PRODUCTION-READINESS-REPORT.md](./PRODUCTION-READINESS-REPORT.md) |
| **Production GO 决策包** | [PRODUCTION-GO-DECISION-PACKAGE.md](./PRODUCTION-GO-DECISION-PACKAGE.md) |
| **Infrastructure Audit** | [PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md](./PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md) · `bash scripts/dev/run-production-infrastructure-audit.sh` |
| **机读审计 JSON** | `phase3-production-prep/go-audit-<UTC>/go_no_go.json` · latest `go-audit-20260607T073403Z` |

**监控验证（staging 代理）：** `smoke-community-c8-staging-monitoring.sh` · `check-ops-monitoring-prometheus-examples.sh`  
**域名/TLS：** `*.fly.dev` 证书有效 · **专用 prod 域名仍为 OPEN（PI3-002）**  
**env 审计：** `GET /meta` + internal 403 探针 · 生产必达项见 [PRODUCTION-OPS-RUNBOOK §5](./PRODUCTION-OPS-RUNBOOK.md)

---

## 7 · 相关文档

| 文档 | 关系 |
|------|------|
| [PHASE29-RELEASE-POLISH](./PHASE29-RELEASE-POLISH.md) | ②.9 完成 · R8 签核 |
| [PHASE29-RELEASE-POLISH-BACKLOG](./PHASE29-RELEASE-POLISH-BACKLOG.md) | RP-002/005 post-beta 细项 |
| [PHASE3-ENTRY-RECHECK-REPORT](./PHASE3-ENTRY-RECHECK-REPORT.md) | **Phase ③ Entry Recheck**（post Catalog S5 · 20260607） |
| [PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX](./PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md) | Entry 矩阵 · **PHASE3_ENTRY_GO** |
| [HUMAN-ACCEPTANCE-REPORT](./HUMAN-ACCEPTANCE-REPORT.md) | HAT 基线 |
| [go-live-checklist](../go-live-checklist.md) | ③ Production GO |
| [ops/RUNBOOK.md](../../ops/RUNBOOK.md) | 资损场景 · P0 九项 · indexer |

---

*Phase ③ Production Preparation ACTIVE · GO audit track · 2026-06-07*
