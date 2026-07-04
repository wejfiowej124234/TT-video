# G2 Reality Gap Report

**Review ID:** `G2-REALITY-AUDIT-20260704`  
**Date:** 2026-07-04  
**Layer:** Release Train · **G2 Gate Reality 复核**  
**Parent:** [TT-PRODUCTION-READINESS-MASTER-MATRIX.md](TT-PRODUCTION-READINESS-MASTER-MATRIX.md)  
**Machine SSOT:** [`registry/production-readiness-master-matrix.v1.yaml`](../../registry/production-readiness-master-matrix.v1.yaml)

---

## 0. Executive Summary

**Release Train：** G1 PASS → **G2 ← 当前主线** → G3 → Production GO

| 项 | 复核前 | G2 Reality Audit 后 |
|----|--------|---------------------|
| **G2 OPEN BLOCKER** | 4（含 PER-B001 误 CLOSED） | **4**（PER-B001 已 REOPEN） |
| **Matrix 自动关闭** | — | **0**（无假阻塞项） |
| **Matrix 纠正** | — | **1**（PRM-PER-B001 误 CLOSED → OPEN） |
| **G2 Gate** | NOT_STARTED | **IN_PROGRESS** |
| **Production GO** | NO_GO | **NO_GO** |

**一句话：** Security 实现 + Staging 运行态（internal 403）**已存在**，但 G2 阻塞项均属 **③ prod cutover / prod evidence** 范畴 — **② staging 证据不得关 G2 Blocker**；下一步 **G2 Reality Fix**（非 Wave 2 Formal）。

**下一轨：** [G2-REALITY-FIX-PLAN.md](G2-REALITY-FIX-PLAN.md)

**Evidence stamp:** `20260704T015213Z`  
**Signoff:** [`evidence/GO_production_readiness/g2-reality-audit/20260704T015213Z/g2-reality-audit-signoff.json`](../../evidence/GO_production_readiness/g2-reality-audit/20260704T015213Z/g2-reality-audit-signoff.json)

---

```text
G1 PASS（20260704T012909Z）
  → 代码锚点（router / auth / market_public_surface / fly manifests）
  → Staging 运行态探针（tt-api-staging /meta · internal 403）
  → 仓库内 Evidence（C8 · go-audit · .env.production.example）
  → 禁止仅读 Matrix/文档旧状态
  → 更新 Matrix + 本报告 + 正式验收计划
```

**命令：**

```bash
bash scripts/dev/run-g2-reality-audit-closure.sh
node scripts/dev/validate-production-readiness-g2-gate.cjs --evidence-dir evidence/GO_production_readiness/g2-reality-audit/20260704T015213Z
```

---

## 2. G2 Blocker 逐项裁定

| ID | 复核前 | 复核后 | 裁定 | 代码/运行态/证据 |
|----|--------|--------|------|------------------|
| **PRM-SEC-B001** | OPEN | **OPEN** | 仍阻塞 | `internal_api_secret_gate_layer` ✓ · staging `POST /internal/indexer-tick` 无 secret → **403** ✓ · **prod Fly secrets 对齐未复验** |
| **PRM-SEC-B002** | OPEN | **OPEN** | 仍阻塞 | `seed_test_accounts_disabled` ✓ · `.env.production.example` SEED=0 ✓ · profile 门闸 ✓ · **prod SEED=0 fly 审计未复验** |
| **PRM-PER-B001** | CLOSED（误） | **OPEN** | **REOPEN** | Matrix **无 closed_evidence** · 仓库 **无 prod perf/SLO 证据包** |
| **PRM-MON-B001** | OPEN | **OPEN** | 仍阻塞 | C8 staging monitoring 证据 + prometheus rules 脚本 ✓ · **≠ prod synthetic / on-call cutover** |

### 2.1 为何未自动关闭任何 Blocker

| 类别 | 说明 |
|------|------|
| **实现已存在** | SEC 门闸、seed 策略、C8 脚本 — **不等于 G2 closure 条件** |
| **② Staging 证据** | internal 403、C8 logs — **Expected Difference 边界内有效**，不可冒充 ③ prod |
| **Matrix 漂移** | PER-B001 无证据 CLOSED — **纠正为 OPEN**，非「消除阻塞」 |

### 2.2 Staging 运行态探针（本轮）

| 探针 | 结果 |
|------|------|
| `GET tt-api-staging/meta/build` | `deployment_profile=staging` · git @ G1 session |
| `meta.strict_mode.internal_api_secret_configured` | **true** |
| `POST /api/v1/internal/indexer-tick`（无 secret） | **403** |

---

## 3. 仍 OPEN 的 4 项 · Wave 2 正式验收入口

| 顺序 | ID | Wave 2 动作 |
|------|-----|-------------|
| 1 | PRM-SEC-B001 | Prod Fly secrets 清单 + internal 路由 prod-base 403 证据 |
| 2 | PRM-SEC-B002 | Prod `SEED_TEST_ACCOUNTS=0` fly 验证 + seed 端点 403 证据 |
| 3 | PRM-PER-B001 | Prod load smoke 或 SLO baseline · 提交 evidence 包 |
| 4 | PRM-MON-B001 | Prod synthetic probes + on-call runbook 签字证据 |

**编排 SSOT：** [G2-FORMAL-ACCEPTANCE-PLAN.md](G2-FORMAL-ACCEPTANCE-PLAN.md)

---

## 4. 诚实边界

- G2 Reality Audit **≠** G2 PASS **≠** Production GO  
- ② staging 运行态 / C8 **不得**关闭 PRM-SEC-* / PRM-MON-B001 的 prod cutover 条款  
- G1 PASS（`20260704T012909Z`）是 Wave 2 前置 · 已满足  

---

**Evidence:** `evidence/GO_production_readiness/g2-reality-audit/<stamp>/g2-reality-audit-signoff.json`  
**Owner:** Sebastian Ward · 2026-07-04
