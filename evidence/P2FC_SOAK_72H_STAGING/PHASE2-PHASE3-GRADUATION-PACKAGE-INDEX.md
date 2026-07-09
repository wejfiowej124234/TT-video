# Phase② Graduation · Phase③ Readiness · 等待窗口包索引

**模式：** Phase② Reliability Freeze · **仅监控** soak + graduation watcher  
**机读根：** 本目录 `*.v1.json`  
**诚实边界：** ② `TT_TESTNET_GRADUATION:CLOSED` **≠** ③ Production GO

---

## 0 · 实时监控（勿杀进程）

| 组件 | 路径 / 命令 |
|------|-------------|
| Soak job | `job-20260614T070154Z/` · pid `pid.txt` |
| Soak 日志 | `job-20260614T070154Z/soak.log` |
| 完成判据 | `COMPLETED.json` |
| Graduation watcher | `post-soak-graduation-watcher.log` |
| 等待锚点 | `GRADUATION-WAIT-ACTIVE.json` |

```bash
tail -f evidence/P2FC_SOAK_72H_STAGING/job-20260614T070154Z/soak.log
tail -f evidence/P2FC_SOAK_72H_STAGING/post-soak-graduation-watcher.log
```

**COMPLETED 后一键：** `bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh`

---

## 1 · Phase② Graduation Package

**SSOT 标准：** [TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md](../../docs/runbook/TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md)

**机读清单：** [phase2-graduation-package-manifest.v1.json](./phase2-graduation-package-manifest.v1.json)

| 闸 | 键 | 目标 | 证据 / 备注 |
|----|-----|------|-------------|
| G-01 | Open P0 | 0 | Burn-down |
| G-02 | Open P1 | 0 | TN-P1-001～010 收口后 |
| G-03 | Readiness | 100 | `TT_PHASE2_READINESS` |
| G-04 | Perfect validation | GO | Burn-down report |
| G-05 | blocking_open | 0 | graduation-matrix |
| G-06 | P2FC soak | COMPLETED | 本目录 `COMPLETED.json` |
| G-07 | Indexer | compound · missing=0 | `tn-p1-010-indexer-reconcile-20260614T065942Z` **CLOSED** |
| G-08 | D1–D24 + surface | 100% · untested=0 | `tn-p1-d6-reliability-surface-20260614T073334Z` **52/52** |
| G-09 | Owner sign-off | OWNER-SIGNOFF.md | post-soak 脚本写入 |

**已关闭 · 禁止重跑：** TN-P1-010 · D6 · TN-P1-001～008（见 manifest）

**毕业审计输出目录：** `evidence/GO_phase2_testnet_graduation/<stamp>/`

**末行 grep：** `TT_TESTNET_GRADUATION: CLOSED`

---

## 2 · Phase③ Production Readiness Backlog

**机读：** [phase3-production-readiness-backlog.v1.json](./phase3-production-readiness-backlog.v1.json)  
**Runbook：** [PHASE3-PRODUCTION-PREPARATION.md](../../docs/runbook/PHASE3-PRODUCTION-PREPARATION.md)

**入口前置：** `TT_TESTNET_GRADUATION: CLOSED` → `TT_PHASE3_ENTRY_REVIEW: ELIGIBLE`

| 序 | ID | 主题 | 态 |
|----|-----|------|-----|
| 1 | PI3-001 | Fly PG backup / B-475 | open |
| 2 | PI3-002 | Prod domain / CDN / CORS | open |
| 3 | PI3-003 | Stripe live | open |
| 4 | PI3-004 | R-002 prod GO | open |
| 5 | PI3-005 | Mainnet G0–G6 + SL | open |
| 6 | PI3-006 | go-live §0–§11 | open |

**staging 已 PASS（不闭合 PI3）：** merchant · DB drill · rollback drill — 见 `phase3-production-prep/`

---

## 3 · Go-Live Decision Package

**SSOT：** [PRODUCTION-GO-DECISION-PACKAGE.md](../../docs/runbook/PRODUCTION-GO-DECISION-PACKAGE.md)  
**Checklist：** [go-live-checklist.md](../../docs/go-live-checklist.md)  
**当前裁定：** `PRODUCTION_GO_DECISION: NO_GO` · `PRODUCTION_CUTOVER_AUTHORIZED: false`

**③ 闭卷条件：** PI3-001～006 全 closed → 复跑 `run-phase3-production-go-audit.sh` → **BLOCKER=0** → M-00

---

## 4 · Production Blocker Registry

**机读：** [production-blocker-registry.v1.json](./production-blocker-registry.v1.json)  
**Issues SSOT：** [issues-phase3-production.md](../GO_phase2_testnet_20260526/phase3-production-prep/issues-phase3-production.md)  
**审计 JSON：** `go-audit-20260607T073403Z/go_no_go.json` · **7 BLOCKER**

---

## 5 · 技术债清单（Freeze 期间不消）

**机读：** [technical-debt-registry.v1.json](./technical-debt-registry.v1.json)

| ID | 说明 | 处理阶 |
|----|------|--------|
| TD-02-BURN-DOWN-DOC | Burn-down 文仍标 009/010 OPEN | COMPLETED 后文档对拍 |
| TD-FEE-ROUTER-DIST | FeeRouter distribute 未跑 | ③ |
| TD-LIVE-SEPOLIA-STAKE |  live stake deferred | ③ / Owner |
| PI3-007～010 | P1 defer | 不挡 M-00 |

---

## 6 · COMPLETED 后执行序（写死）

1. Watcher 或人工触发 `run-phase2-testnet-post-soak-graduation-closure.sh`
2. `run-phase2-testnet-closure-governance-audit.sh` + `graduation-matrix.v1.json`
3. G-01～G-08 AND → `OWNER-SIGNOFF.md`
4. **`TT_TESTNET_GRADUATION: CLOSED`**
5. 启动 ③ 入口评审准备（本 Backlog · **不** cutover）

---

*Reliability Freeze · 2026-06-14 · Sebastian Ward solo maintainer*
