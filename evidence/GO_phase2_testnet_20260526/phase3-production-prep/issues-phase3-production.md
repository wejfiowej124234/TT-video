# 阶段三 · ③ 生产发布问题清单（PI-3）

**真源路径：** `evidence/GO_phase2_testnet_20260526/phase3-production-prep/issues-phase3-production.md`  
**主表：** [TT-MASTER · PI-3](../../../docs/runbook/TT-MASTER-PUBLISH-GO-CHECKLIST-001.md#tt-master-publish-pi3-gate)  
**审核报告：** [PRODUCTION-GO-NO-GO-AUDIT-REPORT](./PRODUCTION-GO-NO-GO-AUDIT-REPORT.md)  
**签字前硬条件：** 本表所有 **P0** 行 `closed`；**P1** 已 `closed` 或记入 **§0.3** backlog（不挡 M-00）。


## Production GO Program 重启（2026-06-07T07:34Z）

**基线：** `FINAL_SYSTEM_AUDIT: PASS` · **程序：** `PHASE3_PRODUCTION_GO: ACTIVE` · **决策：** `PRODUCTION_GO_DECISION: NO_GO`

| 交付物 | 路径 |
|--------|------|
| Production Readiness Report | [PRODUCTION-READINESS-REPORT.md](./PRODUCTION-READINESS-REPORT.md) |
| Production GO 决策包 | [PRODUCTION-GO-DECISION-PACKAGE.md](./PRODUCTION-GO-DECISION-PACKAGE.md) |
| 机读审计 | `go-audit-20260607T073403Z/go_no_go.json` |

**PI3-001～006 本 Sprint 闭合结果：** **0/6 closed** — 见决策包 §3；各项保持 **open**，须 Owner 执行生产基础设施动作。

---


## Production Infrastructure Audit（2026-06-07T07:45Z · ACTIVE）

**程序：** `PRODUCTION_INFRASTRUCTURE_AUDIT: ACTIVE` · 业务代码 **禁止变更**  
**报告：** [PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md](../../../docs/runbook/PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md)  
**问题清单：** [issues-production-infrastructure.md](./issues-production-infrastructure.md) · **`TT_PRODUCTION_INFRASTRUCTURE_AUDIT: NO_GO`**  
**机读：** `infra-audit-20260607T074550Z/`

| PI3 | 基础设施裁定 | 闭合脚本 |
|-----|-------------|----------|
| PI3-001 | **open** — B-475 `PLANNED` | `run-phase3-db-restore-drill-prod.sh` |
| PI3-002 | **open** — 无专用 prod 域 | `phase3-production-fly-deploy-and-sync.sh` · `deploy-tt-web-production.sh` · `patch-tt-api-prod-cors.sh` |

---
## 图例

| 状态 | 含义 |
|------|------|
| `open` | 未开始或阻塞 Production GO |
| `in_progress` | ③ 准备轨进行中（有证据路径） |
| `closed` | 已满足完成判据 |
| `defer` | P1 记入 backlog，不挡 M-00 |

---

## 问题登记

| ID | 优先级 | 环境/URL | 现象 | 处理 / 证据 | defer | 状态 |
|----|--------|----------|------|-------------|-------|------|
| PI3-001 | P0 | Fly PG · prod | B-475 `status=PLANNED`；staging Fly backups **not enabled** | 启用 prod PG backup plan · 填 `baseline_record.v1.json` → `PASS` · [TT-B475](../../../docs/runbook/TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001.md) · staging drill `2026-06-07T03:51:45Z` | | **open** |
| PI3-002 | P0 | 公网域名 | 无专用 production 域名；仅 `*.fly.dev` staging | 注册 `app.` / `api.` 域名 · CDN · TLS · CORS 锁定 · [PRODUCTION-OPS-RUNBOOK §4](../../../docs/runbook/PRODUCTION-OPS-RUNBOOK.md) | | **open** |
| PI3-003 | P0 | Stripe / PSP | Live PSP 未配置；staging test mode only | Stripe live 实例 · webhook 生产 URL · `sk_live` 隔离审计 · go-live §6 | | **open** |
| PI3-004 | P0 | R-002 / 93 | 全站 `report.json` **GO** 未针对 production 环境 | staging/community C7 GO **≠** full-site 93 · 跑 R-003 prod 口径 · [R-002](../../../docs/spec/R-002-回归执行闭环与发布准入.md) | | **open** |
| PI3-005 | P0 | Mainnet §9 | G0–G6+SL **NOT GO** | [TT-MAINNET](../../../docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md) · `evidence/mainnet_shadow_launch/` | | **open** |
| PI3-006 | P0 | go-live §0–§11 | 工程清单大量未勾 · P0 十二项并联未闭 | [go-live-checklist](../../../docs/go-live-checklist.md) · [缺口总表](../../../docs/spec/缺口与待补-官方总表.md) | | **open** |
| PI3-007 | P1 | CDN / HLS | P3-COM-1 production CDN/HLS **NOT STARTED** | [GO_production/community](../../../evidence/GO_production/community/README.md) · Matrix P5 | backlog | **defer** |
| PI3-008 | P1 | Admin RBAC | staging ② GO · prod SSO 未接 | [ADM-U02](../../../docs/runbook/ADM-U02-admin-permissions-2fa-approval.md) · `run_20260701T100804Z` | backlog | **defer** |
| PI3-009 | P1 | 监控 | promtool 未安装 · Prometheus 未接线生产 | `ops/monitoring/*.example.yml` · staging smoke PASS `20260607T040143Z` | backlog | **in_progress** |
| PI3-010 | P1 | CI build | TS/ESLint 未纳入 production build 硬闸 | Matrix P6 · `npm run build` full green | backlog | **defer** |

---

## §0.3 · P1 backlog（不挡 M-00 · 须书面登记）

- **PI3-007** Production CDN/HLS — post-GA 或灰度后迭代  
- **PI3-008** Admin SSO/RBAC — 监管级前升格  
- **PI3-009** Prometheus/Grafana 生产接线 — staging smoke PASS，prod 待部署  
- **PI3-010** 前端 CI lint/tsc — 发版前建议，不单独挡 ③ prep

---

## ③ 准备轨已 PASS（不闭合 PI-3 · 供审计引用）

| 项 | 证据 | 末行 |
|----|------|------|
| Merchant 闭环 | `p0-chain-20260701T101131Z/smoke.log` | `TT_PHASE3_MERCHANT_CLOSURE: OK` |
| DB 恢复演练（staging） | `p0-chain-20260701T101131Z/drill-record.json` | `TT_PHASE3_DB_RESTORE_DRILL: OK` |
| Fly 回滚演练（staging） | `p0-chain-20260701T101131Z/tt-*-staging-health.txt` | `TT_PHASE3_RELEASE_ROLLBACK_DRILL: OK` |
| ADM-U02 ② | `evidence/GO_staging_admin_adm_u02/run_20260701T100804Z/` | `TT_ADM_U02_STAGING_EVIDENCE: PASS` |
| P0 编排 | `p0-chain-20260701T101131Z/` | `TT_PHASE3_PRODUCTION_PREP_P0: OK` |
| P0 编排 | `p0-chain-20260607T035500Z/` | `TT_PHASE3_PRODUCTION_PREP_P0: OK` |
| 监控 smoke（staging） | `go-audit-20260607T040143Z/monitoring-smoke.log` | `TT_COMMUNITY_C8_STAGING_MONITORING: OK` |
| Production Runbook | [PRODUCTION-OPS-RUNBOOK](../../../docs/runbook/PRODUCTION-OPS-RUNBOOK.md) | 文档 v1.0.0 |
| 事故响应 | [PRODUCTION-INCIDENT-RESPONSE](../../../docs/runbook/PRODUCTION-INCIDENT-RESPONSE.md) | 文档 v1.0.0 |

---

## 阶段三出口核对（签 M-00 前）

- [ ] 上表 **P0** 全部为 **closed**
- [ ] **go-live** 子项已勾（**GL-00**）
- [ ] `README.md` **M-00** 待签

**清单维护者签字：** Sebastian Ward（塞巴斯蒂安·沃德）　日期：2026-06-07（**准备轨审计 · 非 M-00**）
