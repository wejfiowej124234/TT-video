# Phase① Sprint-A · Root Cause Burn-down

**Status:** **ACTIVE** — 暂停新功能 / 新治理域 / 非 P0·P1 优化  
**顺序（写死）：** **D46 → U12-1 → RC-02 → RC-01 → RC-03**  
**SSOT:** [TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md](./TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md)

**末行 grep:** `TT_PHASE1_SPRINT_A: ACTIVE`

---

## 执行纪律

每关闭一项后 **立即**：

```bash
bash scripts/dev/run-phase1-convergence-post-change-gate.sh
```

或分步：`run-phase1-convergence-full-master.sh` → PEB → baseline compare。

**签字闸：** Readiness **≥90** FREEZE_CANDIDATE · **≥95** PHASE1_EXIT_READY（**≠** ② staging GO）

---

## Burn-down 队列

| # | ID | 根因/硬闸 | Findings | Δ Readiness | 验证 | 状态 |
|---|-----|-----------|----------|-------------|------|------|
| 1 | **D46** | 04 §3.4 vs Axum 挂载 | DOA-SEED-003（已登记） | +2（间接） | `bash scripts/run-check-04-routes.sh` | **CLOSED** |
| 2 | **U12-1** | Phase① acceptance 绿集 | MASTER §11/U12-1 | +4 | `bash scripts/dev/run-go-local-phase1-acceptance.sh` | **OPEN** |
| 3 | **RC-02** | Runbook/registry 漂移 | DOA-SEED-001/004 | +6 | `run-doa-audit-gate.sh` · registry validator | OPEN |
| 4 | **RC-01** | 导航/IA 重复 MERGE | PF-SEED-001～003 | +8 | PF gate · site forensic MERGE 3 路由 | OPEN |
| 5 | **RC-03** | Admin RBAC REFACTOR | AG-SEED-001/003 | +5 | `run-admin-governance-audit-gate.sh` | OPEN |

**PEB 公式：** Executive = FZ(90) − OpenP0×2 − OpenP1×1

---

## 1 · D46 Closure Plan

| 项 | 内容 |
|----|------|
| **根因** | 10 条 Axum 已挂载路由未写入 **04 §3.4** |
| **影响面** | `docs/spec/04-后端与API.md` · `run-check-04-routes.sh` · 14 附录互指 |
| **修复** | 同批登记 publish-summary · merchant/acquisition listings · archive · trip-dates · steward-seat · resign |
| **回归** | `bash scripts/run-check-04-routes.sh` exit 0 |
| **证据** | `evidence/GO_phase1_convergence/sprint-a/D46-closure/` |

---

## 2 · U12-1 Closure Plan

| 项 | 内容 |
|----|------|
| **根因** | 冻结契约与 IA 收口漂移（login L5 · onboarding freeze） |
| **影响面** | `loginPageL5.contract` · `meOnboardingUiFreeze.contract` |
| **修复** | AuthL5FormError 纳入 L5 契约源；onboarding 冻结对齐 IA（steward bridge 外移） |
| **回归** | `bash scripts/dev/run-go-local-phase1-acceptance.sh` exit 0 |
| **证据** | `evidence/GO_phase1_convergence/sprint-a/U12-1-closure/` |

---

## 3–5 · RC-02 / RC-01 / RC-03

见各 RC 独立 closure 包（关闭后写入 `evidence/GO_phase1_convergence/sprint-a/RC-0N-closure/`）。

---

## Freeze Sign-off Evidence Pack（目标）

合并路径：`evidence/GO_phase1_convergence/sprint-a/FREEZE-SIGNOFF-PACK/`（Readiness ≥90 后汇编）

- Executive Dashboard · Top10 RC · Top20 Blockers · Closure Roadmap
- 逐项 closure JSON + gate logs
- Baseline compare PASS 链
