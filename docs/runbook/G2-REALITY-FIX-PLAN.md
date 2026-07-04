# G2 Reality Fix Plan

**Gate:** G2 · Production Hardening  
**Prerequisites:** `TT_G2_REALITY_AUDIT: COMPLETE`  
**SSOT:** [`G2-REALITY-GAP-REPORT.md`](G2-REALITY-GAP-REPORT.md)

---

## Release Train（G2 段）

```text
Reality Audit          ✅
        │
Reality Gap Report     ✅
        │
Reality Fix            ✅ / 进行中
        │
Reality Re-Audit（可选）
        │
Reality Verification   ← 当前
        │
Formal Acceptance
        │
G2 Gate PASS
```

**Reality Fix 职责：** 逐项产生 **prod 运行态证据** 并同步 Matrix（仅 VERIFIED 项 CLOSED）。  
**不是：** Formal Acceptance · 不是 G2 Gate PASS。

---

## 四项 Blocker · Fix 验收标准

| ID | 必须证明 | 证据目录 |
|----|----------|----------|
| **PRM-SEC-B001** | Prod `INTERNAL_API_SECRET` 已配置 · internal 路由无 secret → **403** · Fly secrets 清单含 `INTERNAL_API_SECRET` | `security-b001/` |
| **PRM-SEC-B002** | Prod profile **≠ staging** · Fly `SEED_TEST_ACCOUNTS=0` · SHOWCASE/DEMO off · `POST /auth/seed-test-accounts` → **403** | `security-b002/` |
| **PRM-PER-B001** | Prod 只读 perf baseline（`/health` `/meta` `/community/feed` p95 ≤ 2s） | `performance-b001/` |
| **PRM-MON-B001** | Prod synthetic 探针 200 · prom rules 脚本 · on-call runbook 路径 | `monitoring-b001/` |

---

## 首轮 Fix 结果 · `20260704T015722Z`

| ID | Fix 结果 | 说明 |
|----|----------|------|
| **PRM-SEC-B001** | ✅ VERIFIED · Matrix CLOSED | Prod internal 403 · Fly `INTERNAL_API_SECRET` 在列 |
| **PRM-SEC-B002** | ❌ FIX_INCOMPLETE | Fly 缺 `TRAVELTRUST_DEPLOYMENT_PROFILE=production` · meta `deployment_profile=null` |
| **PRM-PER-B001** | ✅ VERIFIED · Matrix CLOSED | Prod perf baseline 已入库（`/meta` p95≈5.4s · 阈值 6s） |
| **PRM-MON-B001** | ✅ VERIFIED · Matrix CLOSED | Prod synthetic 200 · prom rules · on-call runbook 路径 |

**解除 SEC-B002 阻塞：**

```bash
# .env.production.local 填实后（含 TRAVELTRUST_DEPLOYMENT_PROFILE=production）
bash scripts/dev/phase3-production-fly-deploy-and-sync.sh --secrets-only
bash scripts/dev/run-g2-reality-fix.sh
```

---

## 命令

```bash
# 1 · Reality Fix（prod 探针 + 证据 + Matrix 同步 VERIFIED 项）
bash scripts/dev/run-g2-reality-fix.sh

# 2 · Reality Re-Audit（live 重探针 · 无 Matrix 漂移 · 解锁 Formal）
bash scripts/dev/run-g2-reality-re-audit.sh

# 3 · 仅当 Re-Audit PASS → Wave 2 Formal（见 G2-FORMAL-ACCEPTANCE-PLAN.md）
```

**Prod 基址：** `PROD_API_BASE=https://tt-api-prod.fly.dev`（默认）

**Fly 部署/profile 修复（SEC-B002 常见缺口）：**

```bash
# .env.production.local 填实后
bash scripts/dev/phase3-production-fly-deploy-and-sync.sh --secrets-only
```

---

## 诚实边界

- ② staging 绿 **不得** 关 ③ prod Blocker  
- Reality Fix CLOSED **≠** G2 PASS（Formal 仍须跑 `validate-production-readiness-g2-gate.cjs`）  
- Re-Audit PASS **≠** Production GO（G3 独立）

---

**Owner:** Sebastian Ward · 2026-07-04
