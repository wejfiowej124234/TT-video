# PFA · Release Window 最小修复候选

**Machine:** `TT_PFA_RELEASE_WINDOW_MIN_FIX_CANDIDATES`  
**Status:** `RELEASE_WINDOW_OPEN` · `execute_allowed_now=true` · `2026-07-19`  
**Control:** [Release Control Standby](./TT-RELEASE-CONTROL-STANDBY-LATEST.md)

> 保证最后一次变更 **可控 · 可证明 · 可回滚**。  
> 每项：**Fix → 单项验证 → Evidence 更新** · **禁止**一次性 UI 重构 · **禁止**全量重跑 · **排除** 48H Observation。

## 执行顺序（写死）

| Seq | 项 | Finding | 动作 | 本窗状态 |
|-----|-----|---------|------|----------|
| **1** | WalletConnect | `PFA-UI-WALLET-01` | `KEY_ABSENT` → `KEY_PRESENT`（OA-H1 · Owner 注入 32-hex） | **OWNER_ACTION**（Agent 无法代注入密钥） |
| **2** | ACTIVE Runtime Binding | `PFA-UI-GOV-01` · `STEWARD-01` · `GOV-02` | FE/API 钉 v311 ACTIVE · `/meta` 对拍 | **IN_PROGRESS** |
| **3** | Role Navigation | `PFA-UI-ROLE-01` · `ROLE-02` | 角色入口复验（ROLE-02 依赖 WC） | **PENDING** |
| **4** | Trust Surface | `PFA-UI-TRUST-01`（leaf） | `/me/trust` → `/me/settings/trust` 重定向 | **PENDING** |
| — | Publish pin | `PFA-01-CANDIDATE-SHA` · `PFA-01-IMAGE-DIGEST` | tip SHA + Fly image digest | **PENDING** |

## 明确不进本队列

Escrow Composite（Money-Path）· Admin Live RBAC · 压测 / 全站 UI / Security Shadow / CMS / Drift / E2E / 合约重审 · **48H Soak**

## 解锁链

```text
execute_allowed_now=true
        ↓
Release Window OPEN
        ↓
Min-Fix Queue（上表 1→4 + Identity）
        ↓
Fix → 单项验证 → Evidence 更新（逐项）
        ↓
Coverage Recalculate + Threshold Rollup（真 pass/denom）
        ↓
PSG Gate（诚实 · Fix≠0 则 CONDITIONAL_GO）
```
