# Phase① Sprint-B · MASTER Green Campaign

**Status:** **CLOSED** — 转入 [Phase① Exit Review](./TT-PHASE1-EXIT-REVIEW.md)  
**顺序（写死）：** **MASTER 绿化 → Readiness 95 → Freeze Sign-off → U12-2 → Phase② 宽表评审申请**  
**SSOT:** [TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md](./TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md) · [TT-PHASE1-SPRINT-A-ROOT-CAUSE-BURN-DOWN.md](./TT-PHASE1-SPRINT-A-ROOT-CAUSE-BURN-DOWN.md)

**末行 grep:** `TT_PHASE1_SPRINT_B: CLOSED`

---

## 执行纪律

每关闭一项后 **立即**：

```bash
bash scripts/dev/run-phase1-convergence-post-change-gate.sh
```

**签字闸：**

| 闸 | 条件 | grep 锚 |
|----|------|---------|
| MASTER | `TT_FULL_SYSTEM_AUDIT_MASTER: READY` | post-change gate |
| Readiness | **≥95** `PHASE1_EXIT_READY` | `phase1-readiness-score.v1.json` |
| MASTER bonus | `evidence/GO_phase1_convergence/sprint-b/MASTER-READY.marker` | PEB +5 |
| Open P0 | **0** | findings registry |
| Phase① Exit | Freeze Sign-off Pack + Recommendation Report | sprint-b/FREEZE-SIGNOFF-PACK/ |

**诚实边界：** ① 绿 / MASTER READY **≠** ② staging GO **≠** ③ Production GO

---

## Burn-down 队列（Sprint-B 范围）

| # | ID | 根因/硬闸 | 验证 | 状态 |
|---|-----|-----------|------|------|
| 1 | **D52–D51 fix** | phase12 gate `set -e` 早退 · D51 browser matrix | `run-full-system-audit-phase12-gate.sh` | **CLOSED** |
| 2 | **D49** | ME-SETTINGS batch registry · account nav smoke | `smoke-account-nav-full-local.sh` | **CLOSED** |
| 3 | **D60** | enterprise-site-10 · orders E2E · AB guide 409 | `run-enterprise-site-10-local.sh` | **CLOSED** |
| 4 | **PF-SEED-004** | archive/ui-v1 retire backlog | findings CLOSED | **CLOSED** |
| 5 | **PGX-CX-002** | Market debounce UX | findings CLOSED | **CLOSED** |
| 6 | **DOA tail** | DOA-SEED-001/004 | findings CLOSED | **CLOSED** |
| 7 | **MASTER NO-GO** | phase12 D60 尾项 | `run-phase1-convergence-full-master.sh` | **CLOSED** |
| 8 | **Readiness 95** | PEB + MASTER marker | `run-phase1-executive-board-gate.sh` | **CLOSED** |
| 9 | **Freeze Sign-off Pack** | Dashboard · RC · Blockers · Roadmap | `sprint-b/FREEZE-SIGNOFF-PACK/` | **CLOSED** |
| 10 | **Phase① Exit Report** | Owner recommendation | `PHASE1-EXIT-RECOMMENDATION-REPORT.md` | **CLOSED** |
| 11 | **U12-2** | Sprint-B 收口后 | `exit-review/U12-2-OWNER-SIGNOFF.v1.md` | **NEXT · Exit Review** |

---

## D60 Closure（当前阻塞）

| 项 | 内容 |
|----|------|
| **根因** | `smoke-ab-core-chain.sh` guide 409 占用 · orders corridor E2E 与 L5 IA 漂移 |
| **修复** | AB smoke 轮换 guide · `orders-list-*` E2E 对齐「订单详情」/ 筛选 rail · 无搜索主接线 |
| **回归** | `bash scripts/dev/run-orders-corridor-local.sh` · `bash scripts/dev/run-enterprise-site-10-local.sh` |
| **证据** | `evidence/GO_phase1_convergence/sprint-b/D60-closure/` |

---

## MASTER READY 后清单

1. `touch evidence/GO_phase1_convergence/sprint-b/MASTER-READY.marker`
2. `bash scripts/dev/run-phase1-executive-board-gate.sh` → Readiness **≥95**
3. 汇编 `sprint-b/FREEZE-SIGNOFF-PACK/`
4. 生成 `PHASE1-EXIT-RECOMMENDATION-REPORT.md`
5. `bash scripts/dev/record-phase1-convergence-baseline.sh`（ intentional bump）
6. **U12-2** → Phase② 宽表评审申请

---

## PEB 公式（Sprint-B）

Executive = FZ(90) − OpenP0×2 − penalized OpenP1 + **+5 if MASTER-READY.marker**
TT_PHASE1_SPRINT_B: CLOSED
