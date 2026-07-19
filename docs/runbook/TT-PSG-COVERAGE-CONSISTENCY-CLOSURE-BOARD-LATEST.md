# PSG · Coverage Consistency Closure Board

**Machine:** `TT_PSG_COVERAGE_CONSISTENCY_CLOSURE`  
**Status:** **RECALCULATE_DONE · CLOSED @ tip 8fb138d6** · `2026-07-19`  
**Execution mode：** [Domain Batch Closure](./TT-PSG-DOMAIN-BATCH-CLOSURE-LATEST.md) · **Active Domain = RBAC**  
**Control：** [Consistency Control](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md)  
**Measurement：** [FINAL](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md) · Pass Tier **ALIGNED_PASS**  
**Alignment base SHA：** `678c9c4b` · **Recalculate tip：** `4bd92179` · **Evidence-lock tip：** `8fb138d6`（= Staging `/meta`）  
**禁止：** 扩测刷 RBAC 100% · Web3 · Fix=8 · 改 Gate · Local-only PASS · Local/Staging/Evidence 漂移
```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED
Local Measurement:   FINAL
Consistency Control: ALIGNED_PASS
Pass Tier:           ALIGNED_PASS
Threshold Rollup:    NEED_FIX (RBAC)
Coverage Recalculate: DONE
```

## Closure ladder

| Step | Action | Status |
|------|--------|--------|
| 1–6 | Commit → Staging → `/meta` → Evidence stamp | **DONE** @ `678c9c4b` |
| 7 | Consistency Gate `--require-aligned` | **DONE** @ `678c9c4b` |
| 8 | Coverage Measurement Recalculate（ALIGNED 绑定） | **DONE**（本轮；新 tip 须再 Staging 对拍） |
| 9 | Production GO | **禁止**（Fix=8 · RBAC NEED_FIX） |

## RBAC hold

| Item | Decision |
|------|----------|
| Current | 60/96 ALIGNED · Threshold NEED_FIX |
| Why not 100% | 阈值 `pass/96==100` · 36×N/A 不计 PASS |
| Now | **不扩测** · Domain Batch 仍停在 RBAC |
