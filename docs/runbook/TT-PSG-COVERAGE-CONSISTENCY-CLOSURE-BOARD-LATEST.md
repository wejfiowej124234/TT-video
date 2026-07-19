# PSG · Coverage Consistency Closure Board

**Machine:** `TT_PSG_COVERAGE_CONSISTENCY_CLOSURE`  
**Status:** **IN_PROGRESS @ step 4** · `2026-07-19`  
**Control：** [Consistency Control](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md)  
**Coverage content SHA：** `50682517b71171129700eeac130ecbdace274bb4`  
**Build-aligned tip SHA：** `0a0265d32da36874d1c373b90b14bd6d496f9ac0`（含 50682517）  
**禁止：** 扩测刷 RBAC 100% · Web3 · Fix=8 · 改 Gate 裁决 · 伪造 ALIGNED_PASS

```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED
Local Measurement:   FINAL (LOCAL_PASS)
Release Alignment:   NOT_ALIGNED (build tip pinned; staging deploy next)
```

## Closure ladder

| Step | Action | Status |
|------|--------|--------|
| 1 | Commit Coverage Phase3 + Consistency Control | **DONE** `50682517` |
| 2 | Unique commit SHA（Coverage） | **DONE** `50682517…` |
| 3a | Git/Build 对齐（缺符号入提交） | **DONE** `0a0265d3` |
| 3b | Registry `pinned_sha` → 可构建 tip | **IN_PROGRESS** |
| 4 | Staging deploy same SHA | pending |
| 5 | Staging health/meta SHA match | pending |
| 6 | Staging re-run Phase3 cells only（不扩测） | pending |
| 7 | `coverage_run` ALIGNED_PASS | pending |
| 8 | Coverage Recalculate | pending |
| 9 | PSG stamp refresh（裁决不变） | pending |

### Step 3a · 已闭编译阻塞

| Missing symbol | Fix path |
|----------------|----------|
| `crate::session_cookie` | `main.rs` `mod session_cookie`（文件本已在 Git） |
| `crate::production_metrics` | 新增 `production_metrics.rs` + `mod` |
| `revoke_all_sessions_for_user` | `db/users_sessions.rs` |

Register cite：Consistency Step4 · Git/Build 漂移 · **CLOSED**（可构建）· Staging ALIGNED 另证。

## RBAC hold

| Item | Decision |
|------|----------|
| Current | 60/96 LOCAL · Threshold NEED_FIX |
| Why not 100% | 阈值 `pass/96==100` · 36×N/A 不计 PASS |
| Now | **不扩测** |
