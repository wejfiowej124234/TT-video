# PSG · Coverage Consistency Closure Board

**Machine:** `TT_PSG_COVERAGE_CONSISTENCY_CLOSURE`  
**Status:** **BLOCKED @ step 4** · `2026-07-19`  
**Control：** [Consistency Control](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md)  
**Coverage fix SHA：** `50682517b71171129700eeac130ecbdace274bb4`  
**Pin HEAD：** `21b23d107e0c6360f2ad6132bdb65d6e4e101c3f`  
**Staging API meta（仍旧）：** `0bbc7adbd3142b111463fc398288ab94be5c0b84`  
**禁止：** 扩测刷 RBAC 100% · Web3 · Fix=8 · 改 Gate 裁决 · 伪造 ALIGNED_PASS

```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED
Local Measurement:   FINAL (LOCAL_PASS)
Release Alignment:   NOT_ALIGNED (pinned; staging BLOCKED)
```

## Closure ladder

| Step | Action | Status |
|------|--------|--------|
| 1 | Commit Coverage Phase3 + Consistency Control | **DONE** `50682517` |
| 2 | Unique commit SHA | **DONE** |
| 3 | Registry `pinned_sha` | **DONE** → `50682517…` |
| 4 | Staging deploy same SHA | **BLOCKED** · clean tip compile fail（`STAGING-DEPLOY-BLOCKED-LATEST.json`） |
| 5 | Staging health/meta SHA match | blocked by 4 |
| 6 | Staging re-run Phase3 cells only（不扩测） | blocked by 4 |
| 7 | `coverage_run` ALIGNED_PASS（git/api/web/migration） | blocked by 4 |
| 8 | Coverage Recalculate | blocked by 4 |
| 9 | PSG stamp refresh（裁决不变） | blocked by 4 |

### Step 4 blocker（写死）

Clean worktree @ `21b23d10` → `fly deploy tt-api-staging` **COMPILE_FAIL**：

- `crate::session_cookie` missing  
- `crate::production_metrics` missing  
- `crate::db::revoke_all_sessions_for_user` missing  

以上符号在**无关脏工作区 WIP**中，**不**属于本 Coverage 提交范围。  
**不得**用本地脏树冒充同 SHA Staging · **不得**跳过部署宣称 ALIGNED。

**Owner 解阻选项（择一，另批）：** 纳入最小可编译 WIP 并重钉 SHA · 或把 Coverage 变更落到可构建基线再部署。

## RBAC hold

| Item | Decision |
|------|----------|
| Current | 60/96 LOCAL · Threshold NEED_FIX |
| Why not 100% | 阈值 `pass/96==100` · 36×N/A 不计 PASS |
| Now | **不扩测** · Owner 后裁定有效格 / N/A / Acceptance |
