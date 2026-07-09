# 155 · PI3-006 Go-Live Checklist & Production Cutover Report

> **Sprint**：PI3-006 · **Go-Live Checklist & Production Cutover Program**（147 §6.6 · G5/G6/G7）  
> **Scope SSOT**：[148 PI3-005](./148-PI3-005-Production-Scope-Decision-Report.md) · **`PRODUCTION_SCOPE_SEPOLIA`**  
> **并联基线**：[151](./151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md) · [152](./152-PI3-001-FlyPG-Backup-Disaster-Recovery-Report.md) · [153](./153-PI3-003-Stripe-Live-Production-Webhook-Report.md) · [154](./154-PI3-004-Production-Readiness-Verification-Report.md) Execution  
> **Checklist SSOT**：[go-live-checklist.md](../../go-live-checklist.md) §0–§11 · P0 十二项  
> **日期**：2026-06-08  
> **纪律**：**禁止新增产品功能代码**  
> **一键 gate**：`bash scripts/check-pi3-006-go-live-production-cutover-execution.sh`  
> **结论**：**`PI3-006 HOLD`** — go-live §0–§11 程序 · P0 十二项矩阵 · Cutover Runbook · M-00 审计程序已交付；**Owner 勾选 / 签字 / prod cutover 尚未闭合**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **155 Execution Sprint 交付** | **COMPLETE** — §0–§11 矩阵 · P0 十二项 · Cutover Runbook · M-00 wrapper · gate |
| **148 Sepolia scope** | **LOCKED** — go-live **§9 Mainnet N/A** · `mainnet_section_9_status=N_A_SEPOLIA_SCOPE` |
| **go-live §0–§11 程序** | **COMPLETE** — 静态验 + 机读矩阵 |
| **go-live §0–§11 勾选** | **OPEN** — 大量 `[ ]` · sections_closed **0/12** |
| **P0 十二项** | **0/12 CLOSED** — 诚实跟踪 · 映射表 §11.1–11.12 |
| **Production Cutover Runbook** | **DELIVERED** — `PRODUCTION-CUTOVER-RUNBOOK-SEPOLIA-SCOPE.md` |
| **M-00 Final Release Audit** | **PROGRAM_RUN** — staging 代理 dry-run · **BLOCKER>0**（预期） |
| **Cutover smoke §7** | **NOT_RUN**（prod URL 未设） |
| **PI3-001～004 依赖** | **HOLD** — 151/152/153/154 execution sprint 均 HOLD |
| **PI3-006 baseline** | **`status=PLANNED`** |
| **PRODUCTION_GO_DECISION** | **NO_GO** · **M-00_SIGNED: false** |

**155 正式裁定：** **`PI3-006 HOLD`**

**升格 `PI3-006 GO`：** PI3-001～004 Owner **GO** → 逐项勾选 go-live §0–§11 → P0 十二项 **12/12** → `run-production-cutover-smoke.sh` on prod → `run-m00-final-release-audit.sh` prod **BLOCKER=0** → **M-00 签字** → baseline **`PASS`** → execution gate **`PI3-006_GO`**.

---

## 2. Sprint 范围与纪律

| 项 | 说明 |
|----|------|
| **执行** | go-live §0–§11 闭环矩阵 · P0 十二项 · Cutover Runbook · M-00 审计编排 |
| **未执行** | Owner 人工勾选 · prod cutover · M-00 签字 · `PRODUCTION_GO_DECISION: GO` |
| **禁止** | 新产品功能 · 借 Ops/CMS/Growth 冻结自动勾选 go-live |
| **§9 Mainnet** | **N/A** per 148 — 不挡 Sepolia cutover |

---

## 3. 交付物清单

### 3.1 脚本与 gate

| 资产 | 路径 |
|------|------|
| go-live §0–§11 矩阵 | `scripts/dev/verify-pi3-006-golive-checklist-matrix.sh` |
| P0 十二项矩阵 | `scripts/dev/verify-pi3-006-p0-twelve-items-matrix.sh` |
| Cutover smoke §7 | `scripts/dev/run-production-cutover-smoke.sh` |
| M-00 Final Release Audit | `scripts/dev/run-m00-final-release-audit.sh` |
| Baseline gate | `scripts/gates/check-pi3-006-go-live-production-cutover-baseline-record.py` |
| Execution gate | `scripts/check-pi3-006-go-live-production-cutover-execution.sh` |
| Gate wrapper | `scripts/gates/pi3-006-go-live-production-cutover-execution-gate.sh` |

### 3.2 机读证据

| 资产 | 路径 |
|------|------|
| PI3-006 baseline | `evidence/pi3_006_go_live_production_cutover/baseline_record.v1.json` |
| go-live section matrix | `evidence/pi3_006_go_live_production_cutover/golive-section-matrix.json` |
| P0 twelve items matrix | `evidence/pi3_006_go_live_production_cutover/p0-twelve-items-matrix.json` |
| Cutover Runbook | `docs/runbook/PRODUCTION-CUTOVER-RUNBOOK-SEPOLIA-SCOPE.md` |

### 3.3 npm gate

```bash
cd frontend && npm run gate:pi3-006-go-live-production-cutover-execution
```

---

## 4. go-live §0–§11 闭环矩阵（155 程序）

| § | 主题 | 程序状态 | 勾选状态 | PI3 依赖 |
|---|------|----------|----------|----------|
| **0** | 冻结 / digest / R-002 | **TRACKED** | OPEN | PI3-004 §0.3 |
| **1** | 合约与链 | **TRACKED** | OPEN | Sepolia 11155111 |
| **2** | 数据库 | **TRACKED** | OPEN | **PI3-001** §2.3 |
| **3** | 后端 API | **TRACKED** | OPEN | **PI3-002** §3.2 CORS |
| **4** | Indexer | **TRACKED** | OPEN | infra audit |
| **5** | 前端 | **TRACKED** | OPEN | PI3-002 prod URL |
| **6** | 密钥 / Stripe | **TRACKED** | OPEN | **PI3-003** |
| **7** | Cutover smoke | **TRACKED** | OPEN | `run-production-cutover-smoke.sh` |
| **8** | 回滚 | **TRACKED** | OPEN | Runbook §8 |
| **9** | Mainnet | **N/A** | N/A | **148 Sepolia defer** |
| **10** | 监控值班 | **TRACKED** | OPEN | ops runbook |
| **11** | P0 并联 + Check-G | **TRACKED** | OPEN | P0 十二项 |

**机读：** `verify-pi3-006-golive-checklist-matrix.sh` → `golive-section-matrix.json`

---

## 5. P0 十二项闭环矩阵

| P0 # | go-live 锚点 | 摘要 | 155 状态 |
|------|-------------|------|----------|
| 1 | §11.1 | 08-4 签字/定稿 | **OPEN** |
| 2 | §11.2 | 08-2 Owner + backup | **OPEN** |
| 3 | §11.3 | 08-2 审查一 | **OPEN** |
| 4 | §11.4 | Gate 矩阵 | **OPEN** |
| 5 | §11.5 | 08-4 定稿检查 | **OPEN** |
| 6 | §11.6 | Runbook P0 九项 | **OPEN** |
| 7 | §11.7 | evidence manifest | **OPEN** |
| 8 | §11.8 | 00 快速核对 7 项 | **OPEN** |
| 9 | §11.9 | P26 可调通 | **OPEN** |
| 10 | §11.10 | E2E 三项 | **OPEN** |
| 11 | §11.11 | 资损 runbook 演练 | **OPEN** |
| 12 | §11.12 | 02 §十三 | **OPEN** |

**闭合计数：** **0/12** · **closure_verdict: HOLD**

**机读：** `verify-pi3-006-p0-twelve-items-matrix.sh` → `p0-twelve-items-matrix.json`

---

## 6. Production Cutover Runbook（Sepolia）

**SSOT：** [PRODUCTION-CUTOVER-RUNBOOK-SEPOLIA-SCOPE.md](../../runbook/PRODUCTION-CUTOVER-RUNBOOK-SEPOLIA-SCOPE.md)

| 阶段 | 内容 |
|------|------|
| Pre-cutover T-7→T-1 | 151/152/153/154 Owner 闭合序 |
| Cutover day | 部署 → §7 smoke → indexer → Stripe → Escrow drill |
| Rollback | §8 pause / digest rollback / PG restore |
| Post-cutover | M-00 audit · baseline PASS · gate GO |

---

## 7. M-00 Final Release Audit

**Wrapper：** `scripts/dev/run-m00-final-release-audit.sh`  
**底层：** `scripts/dev/run-phase3-production-go-audit.sh`  
**决策包：** [PRODUCTION-GO-DECISION-PACKAGE.md](../../runbook/PRODUCTION-GO-DECISION-PACKAGE.md)

| 字段 | 155 dry-run |
|------|-------------|
| `M-00_SIGNED` | **false** |
| `PRODUCTION_GO_DECISION` | **NO_GO** |
| `PRODUCTION_CUTOVER_AUTHORIZED` | **false** |
| G6 audit (staging proxy) | **BLOCKER>0**（预期 — prod 项未闭合） |

**升格 G7：** Owner 闭合 PI3-001～004 → prod bases → **BLOCKER=0** → 更新决策包 → **M-00 签字**

---

## 8. Owner 闭合序（147 §4 + Cutover Runbook §3）

| 步 | 动作 |
|----|------|
| 1 | **151** prod 域 → **GO** |
| 2 | **152** Fly PG backup + drill → **GO** |
| 3 | **153** Stripe live + webhook → **GO** |
| 4 | **154** R-003 prod + 六域 UAT → **GO** |
| 5 | 逐项勾选 go-live §0–§11（§9 N/A 书面确认） |
| 6 | P0 十二项 **12/12** 并联签字 |
| 7 | `run-production-cutover-smoke.sh` on prod |
| 8 | `run-m00-final-release-audit.sh` prod **BLOCKER=0** |
| 9 | **M-00** · `PRODUCTION_GO_DECISION: GO` |
| 10 | baseline **`status=PASS`** → `check-pi3-006-go-live-production-cutover-execution.sh` → **GO** |

---

## 9. Gate 探针摘要（2026-06-08）

| 探针 | 结果 |
|------|------|
| Execution artifacts | **PASS** |
| 151/152/153/154 reports | **PASS** |
| PI3-006 baseline | **PLANNED** |
| go-live §0–§11 matrix | **PASS**（program · sections OPEN） |
| P0 十二项 matrix | **PASS**（0/12 · tracking） |
| Cutover Runbook | **PASS** |
| Cutover smoke | **NOT_RUN** |
| M-00 audit dry-run | **RECORDED** |
| 产品功能 diff | **NONE** ✓ |

**Gate 输出：** `TT_PI3_006_GO_LIVE_PRODUCTION_CUTOVER_EXECUTION: PI3-006_HOLD`  
**Evidence：** `evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-006-exec-20260608T014354Z`  
**go-live matrix：** sections_closed **0/12** · checkboxes unchecked **70** · §9 **N_A_SEPOLIA_SCOPE**  
**P0 十二项：** **0/12** · closure_verdict **HOLD**  
**M-00 dry-run：** audit **NO_GO** · blockers **7** · staging proxy

---

## 10. GO / HOLD 判定表

| 条件 | 状态 |
|------|------|
| 155 执行程序交付 | **PASS** |
| go-live §0–§11 程序 + 矩阵 | **PASS** |
| P0 十二项 **12/12** | **FAIL** (0/12) |
| PI3-001～004 Owner GO | **FAIL** (HOLD) |
| M-00 signed | **FAIL** |
| `PRODUCTION_GO_DECISION: GO` | **FAIL** |
| 145/146/150 Ops 冻结冒充 go-live | **拒绝** ✓ |

**最终结论：`PI3-006 HOLD`**

---

## 11. 与 Production GO 关系（147 §7.1）

| Gate | 关系 |
|------|------|
| **G5** | PI3-006 **GO** + P0 十二项并联 |
| **G6** | `run-m00-final-release-audit.sh` · **BLOCKER=0** on prod |
| **G7** | **M-00** · `PRODUCTION_GO_DECISION: GO` |
| **FINAL_SYSTEM_AUDIT PASS** | **不替代** go-live 勾选 |
| **PRODUCTION_GO** | **NO-GO** — 待 Owner 全链闭合 |

---

## 12. 证据与复跑

```bash
bash scripts/check-pi3-006-go-live-production-cutover-execution.sh
bash scripts/dev/verify-pi3-006-golive-checklist-matrix.sh
bash scripts/dev/verify-pi3-006-p0-twelve-items-matrix.sh

# Owner prod cutover
PROD_API_BASE=https://api.<domain> PROD_WEB_BASE=https://app.<domain> \
  bash scripts/dev/run-production-cutover-smoke.sh
PROD_API_BASE=… PROD_WEB_BASE=… \
  bash scripts/dev/run-m00-final-release-audit.sh
```

---

## 13. 交叉引用

| 文档 | 关系 |
|------|------|
| [147 §6.6](./147-PI3-Closure-Program-Audit-Report.md) | PI3-006 BLOCKED 审计 |
| [148](./148-PI3-005-Production-Scope-Decision-Report.md) | §9 N/A · Sepolia scope |
| [go-live-checklist.md](../../go-live-checklist.md) | §0–§11 SSOT |
| [PRODUCTION-GO-DECISION-PACKAGE](../../runbook/PRODUCTION-GO-DECISION-PACKAGE.md) | M-00 |
| [PRODUCTION-CUTOVER-RUNBOOK](../../runbook/PRODUCTION-CUTOVER-RUNBOOK-SEPOLIA-SCOPE.md) | Cutover 序 |
| [PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX §4](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md) | PI3-006 P0 |

---

**下一动作：** Owner 按 §8 闭合 151→152→153→154 → 勾选 go-live → M-00 → **`PI3-006 GO`**
