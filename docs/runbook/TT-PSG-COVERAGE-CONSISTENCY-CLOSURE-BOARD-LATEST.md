# PSG · Coverage Consistency Closure Board

**Machine:** `TT_PSG_COVERAGE_CONSISTENCY_CLOSURE`  
**Status:** **IN_PROGRESS @ step 5–6 done · Recalculate deferred** · `2026-07-19`  
**Execution mode：** [Domain Batch Closure](./TT-PSG-DOMAIN-BATCH-CLOSURE-LATEST.md) · **Active Domain = RBAC**  
**Control：** [Consistency Control](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md)  
**Coverage content SHA：** `50682517b71171129700eeac130ecbdace274bb4`  
**Build-aligned tip SHA：** `0a0265d32da36874d1c373b90b14bd6d496f9ac0`（含 50682517）  
**Deploy / pin HEAD：** `406fb32ce00ed2cbd4f2a75d0e1b287416cd4a16`  
**禁止：** 扩测刷 RBAC 100% · Web3 · Fix=8 · 改 Gate 裁决 · 伪造 ALIGNED_PASS · 单点频繁部署 · **提前刷新 Coverage Measurement FINAL / GO**
```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED
Local Measurement:   FINAL (LOCAL_PASS)
Consistency Control: ALIGNED_PASS (Staging SHA parity)
Coverage Recalculate: DEFERRED (not yet)
```

## Closure ladder

| Step | Action | Status |
|------|--------|--------|
| 1 | Commit Coverage Phase3 + Consistency Control | **DONE** `50682517` |
| 2 | Unique commit SHA（Coverage） | **DONE** `50682517…` |
| 3a | Git/Build 对齐（缺符号入提交） | **DONE** `0a0265d3` |
| 3b | Registry `pinned_sha` → tip | **DONE** `406fb32c` |
| 4 | Staging deploy same SHA | **DONE** tip `406fb32c`（经 MIG-01/MIG-02 Register 闭环） |
| 5 | Staging health/meta SHA match | **DONE** `/meta` `build.git_sha=406fb32c` |
| 6 | Staging Coverage Evidence stamp | **DONE** `COVERAGE-RUN-LATEST.json` · `ALIGNED_PASS` · `migration_state=matched` |
| 7 | Consistency Gate `--require-aligned` | **目标本轮** |
| 8–9 | Coverage Metric Recalculate / GO | **DEFERRED**（本轮明确不提前更新） |

### Register 闭环（ΔFix=0 · 非 Web3）

| ID | Status |
|----|--------|
| `PSG-COV-STG-MIG-01` | **CLOSED**（migrations 入 Git） |
| `PSG-COV-STG-MIG-02` | **CLOSED**（LF + `20260713180000` checksum 对齐 tip） |

## RBAC hold

| Item | Decision |
|------|----------|
| Current | 60/96 LOCAL · Threshold NEED_FIX |
| Why not 100% | 阈值 `pass/96==100` · 36×N/A 不计 PASS |
| Now | **不扩测** · Domain Batch 仍停在 RBAC（ALIGNED 后才 Recalculate） |
