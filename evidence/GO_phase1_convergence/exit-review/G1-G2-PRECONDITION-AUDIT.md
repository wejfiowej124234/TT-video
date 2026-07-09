# G-1 / G-2 前置条件核查 · Phase① Exit Review

**Date (UTC):** 2026-06-13  
**SSOT:** [PHASE2-START-CHECKLIST §0](../../docs/runbook/PHASE2-START-CHECKLIST.md#0--总入口闸phase-②-任何工作流开工前)

---

## 核查结果

| Gate | 条件 | 态 | 证据 |
|------|------|-----|------|
| **G-0** | Phase ① 总验收 | **PASS** | `TT_GO_LOCAL_PHASE1: OK` · MASTER READY |
| **G-1** | 测试环境隔离决策 | **PASS** · Owner 已签 2026-06-03 | [PHASE2-G1-ENV-ISOLATION-DECISION](../../docs/runbook/PHASE2-G1-ENV-ISOLATION-DECISION.md) |
| **G-2** | staging 主机 + sqlx migrate | **PASS** | `g2-staging-migrate/latest/` · Fly HTTPS（见 PHASE2-REPOSITORY-STATUS） |
| **G-3** | 书面范围 ② only | **PASS** | 本文 + Exit Review runbook |
| **G-4** | B 轨非零 amount_minor | **PASS** | Closing Gap G4 · 20260606T095305Z |

---

## 2026-06-13 机读复跑

```bash
bash scripts/dev/run-phase1-to-phase2-transition-audit.sh
# → TT_PHASE2_TRANSITION_AUDIT: OK
# → TT_PHASE2_READY_VERDICT: READY_FOR_C1_C12
```

**T9:** `check-phase2-onboarding-staging-ready.sh` — **PASS**

---

## 结论

G-1/G-2 **前置条件满足**（机读 + 既有 Owner 决策书）。**U12-2** 待 [U12-2-OWNER-SIGNOFF.v1.md](./U12-2-OWNER-SIGNOFF.v1.md) 正式签字后，可提交 [Phase② 宽表评审申请](../../docs/runbook/PHASE2-WIDE-TABLE-REVIEW-APPLICATION.md)。

**grep:** `TT_G1_G2_PRECONDITION_AUDIT: PASS`
