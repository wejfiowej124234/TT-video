# 177 · Production Governance Gap Closure Report

**Version:** 1.0.0 · **最后更新：** 2026-06-08  
**受众**：工程 · SRE · Owner  
**状态**：**COMPLETE · Phase ② 治理 Gap 收口**  
**前置**：[176 PRA Report](./176-Production-Readiness-Audit-Report.md) · [175 PRA Blueprint](./175-Production-Readiness-Audit-Program-Blueprint.md)  
**纪律**：**功能冻结** · ops harness only

> **SSOT**：Phase ② **Production Governance Gap** 收口报告。**证据包**：`evidence/PRODUCTION_GOVERNANCE_GAP_CLOSURE/closure-20260608T060940Z/` · 复跑：`bash scripts/ops/pra-governance-gap-closure.sh`

---

## 1. Executive verdict

| 维度 | 判定 | 说明 |
|------|------|------|
| **Phase ② 治理 Gap（5 项）** | **GO** | Staging Growth · RBAC · Merchant · B477 · Staging DR |
| **PRA 统一包（176）** | **GO** | 前置 Wave-1/2 已完成 |
| **147 `PRODUCTION_GO_DECISION`** | **NO_GO**（**未解除**） | PI3-001～004 · 006 **Owner 未闭合** |
| **158 深审矩阵** | **HOLD 58/100**（**未升格 GO**） | 矩阵 **仅**消费 PI3 execution gates |

**Gate 输出（Phase ② 治理 · 权威）：**

```text
TT_PRODUCTION_GOVERNANCE_GAP_CLOSURE: GO dir=evidence/PRODUCTION_GOVERNANCE_GAP_CLOSURE/closure-20260608T060940Z failures=0
```

**与 Production GO 的边界（禁止混用）：**

```text
TT_PHASE2_GOVERNANCE: GO
TT_PRODUCTION_GO_DECISION: NO_GO   # 147 · 不变
TT_158_AUDIT_MATRIX: HOLD 58/100 # 158 · 不变
```

> **说明**：本 Sprint **关闭的是 176 §3 所列 Phase ② 运维 gap**（staging 验证 harness），**不是** PI3 Production cutover。将 158 升至 **GO** 并解除 **147 NO_GO** 须走 [158 §4](./158-Production-Readiness-Deep-Audit-Report.md) Owner 序（域名 · Stripe Live · prod DR · R-003 prod · M-00）。

---

## 2. 五项 Gap 收口明细

| Gap ID | 项 | 结果 | 证据 |
|--------|-----|------|------|
| **G-01** | Fly Staging Growth 部署 | **GO** | validate **401**（路由存在 · 非 404）· admin growth **401** |
| **G-04** | RBAC Matrix 全量 | **GO** | `smoke-admin-rbac-matrix-local` + E3/E4 · 2FA session |
| **G-05** | Merchant Smoke | **GO** | `smoke-provider-onboarding-staging` · `TT_PHASE3_MERCHANT_CLOSURE: OK` |
| **G-03** | B477 Recovery | **GO*** | harness exit 0 · 细粒度 `TT_PRA_PRESSURE: PARTIAL`（recovery 窗口） |
| **G-06** | Staging DR | **GO** | `mode=fly_staging_evidence_reuse` · 122 baseline **READY** drill |

\* B477：workers=8 · timeout=300s · target_util=0.55；若需 **PASS** 非 PARTIAL，须 infra 调优后复跑。

### 2.1 Staging Full-Chain（含 Growth + Merchant）

```text
TT_PRA_STAGING_FULLCHAIN: GO passes=5 failures=0
```

- Growth：`/api/v1/growth/referrals/validate` → **401**（已部署）
- Merchant：`INTERNAL_API_SECRET` 自 `.env.staging-onboarding.local` · 复用 provider 路径 **OK**

### 2.2 RBAC Matrix

- 修复：Admin **2FA session** + route-matrix 探针
- CS 角色：DB `admin_console_roles` 指派（避免 API 409）

### 2.3 Staging DR

- Fly CLI **当前网络不可达**（`api.fly.io` timeout）· 无法 live drill
- 复用 **2026-06-07** staging drill 证据 `db-restore-drill-*` · **STATUS=READY**（122 基线）

---

## 3. 为何 147 / 158 不能在本 Sprint 解除

| 文档 | 当前 | 升格条件 | 本 Sprint 是否满足 |
|------|------|----------|-------------------|
| **147** | `PRODUCTION_GO_DECISION: NO_GO` | PI3 P0 **6/6 closed** · M-00 **BLOCKER=0** | **否** — prod 域/backup/Stripe 未配置 |
| **158** | **58/100 HOLD** | PI3-001～004 + 006 **全部 GO** · score ≥90 | **否** — 5 轨 Owner HOLD |

**158 计分逻辑**（`generate-production-readiness-deep-audit-matrix.py`）：**仅** PI3-001～006 execution gate 裁定；Phase ② PRA 绿 **不**计入 158 分数。

**147 解除路径**（摘要）：PI3-002 域名 → PI3-001 backup + PI3-003 Stripe → PI3-004 prod 回归 → PI3-006 go-live + M-00 签字。

---

## 4. 复现

```bash
export DATABASE_URL=postgres://traveltrust:traveltrust@localhost:5432/traveltrust
export SEED_TEST_ACCOUNTS=1
# local API :8080 healthy · scripts/dev/.env.staging-onboarding.local 存在
bash scripts/ops/pra-governance-gap-closure.sh
```

| 脚本 | Gap |
|------|-----|
| `scripts/ops/pra-staging-fullchain.sh` | G-01 · G-05 |
| `scripts/ops/pra-security-privilege-escalation.sh` | G-04 |
| `scripts/ops/pra-pressure-stress.sh` | G-03 |
| `scripts/ops/pra-disaster-recovery-drill.sh` | G-06 |

---

## 5. Owner 下一步（若目标为 Production GO）

1. `fly auth login` + 网络恢复 → 复跑 live staging DR
2. 配置 **PROD_*** 域 · Fly prod apps → `check-pi3-002-*` **GO**
3. `enable-fly-pg-backup.sh` prod + prod drill → PI3-001 **GO**
4. Stripe Live + webhook → PI3-003 **GO**
5. `run-r003-production-regression.sh` → PI3-004 **GO**
6. go-live §0–§11 + M-00 → PI3-006 **GO** → **147 GO** · **158 ≥90 GO**

---

## 6. 变更 log

| 日期 | 变更 |
|------|------|
| 2026-06-08 | Phase ② 治理 Gap **5/5 GO** · 147/158 **诚实维持 NO_GO/HOLD** |
