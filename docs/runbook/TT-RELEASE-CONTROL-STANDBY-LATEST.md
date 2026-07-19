# Release Control Standby（最终决策版）

**Machine:** `TT_RELEASE_CONTROL_STANDBY`  
**Status:** **RELEASE_WINDOW_OPEN** · `execute_allowed_now=true`（Owner 本会话授权 · 2026-07-19）  
**Recorded:** `2026-07-19`  
**Governance:** F-02 → Release Window Min-Fix · Register 关联 Fix 关闭 · PFA **CLOSED** · Hardening **CLOSED**

> 核心目标：保证最后一次变更 **可控 · 可证明 · 可回滚**。  
> **PSG Gate = 唯一上线裁决入口**（九维 · Dashboard 三问）· 散落审计 **不得**绕过 Gate。  
> **Coverage Sufficient** · Completeness **停止扩展**。  
> Register = **覆盖地图 + 发布裁决** · **≠** 全行任务列表（①已证 / ②Fix=8 / ③占位不执行）。  
> Fix=8 · Coverage=**CONDITIONAL** · Non-Web3 Gap Fill **CLOSED** · `CONDITIONAL_GO`。  
> **本窗执行：** Min-Fix(8) → 受影响域验证 → Coverage Recalculate → **Final Gate**。  
> **禁止：** 全量重跑 · 48H Observation · Money-Path · Admin live RBAC 扩测 · Scope Expansion

### PSG 防三错（写死）

| # | 错误 | 正确 |
|---|------|------|
| **1** | 见 `NOT_RUN` → 马上开任务 | 先问是否影响本 Release → 再分类（①/②/③） |
| **2** | 把 `CONDITIONAL_GO` 当 Production GO | 须 Fix close + Evidence + Gate Recalculate 后才可宣称 |
| **3** | Release Window 顺便重构/升级/重审计 | 只许 Fix → Verify → Evidence |

**WAIT_WINDOW 禁止：** 新 Audit/Shadow · 全站 UI/CMS/Drift/E2E/Perf · Fix · Deploy · Config/Registry/Gate mutation · Money-Path · Scope Expansion

**互指：** [**PSG Gate**](./TT-PSG-PRODUCTION-RELEASE-READINESS-GATE-LATEST.md)（`CONDITIONAL_GO` · Fix=8）· [**Non-Web3 Gap Fill**](./TT-PSG-COVERAGE-GAP-COMPLETION-NON-WEB3-LATEST.md)（测试补齐 · PARTIAL）· [**Threshold/Gap**](./TT-PSG-COVERAGE-ACCEPTANCE-THRESHOLD-MATRIX-LATEST.md) · [**Metrics %**](./TT-PSG-COVERAGE-METRICS-BASELINE-LATEST.md) · [Register](./TT-PRODUCTION-READINESS-REGISTER-LATEST.md) · [Min-Fix](./TT-PFA-RELEASE-WINDOW-MIN-FIX-CANDIDATES-LATEST.md) · [PRE-ETA](./TT-V311-PRE-ETA-STANDBY-LATEST.md) · [Operator Card](./TT-V311-POST-EXECUTE-OPERATOR-CARD-LATEST.md)

**发布只看 Gate Verdict：** 不要求零 Finding · 仅 Blocker + Fix Required 进窗必清。

---

## 1 · 四桶（冻结 · 不再灌）

| 桶 | 含义 |
|----|------|
| **Closed** | 已验证 · 有证据 · 不再重复检查 |
| **Release Window Fix** | 已确认影响用户 · 有修复路径 · 等受控窗 |
| **Deferred** | 已知 · 不阻断当前窗 · 后续阶段 |
| **Accepted Risk** | 已知 · 有策略 · 当前接受 |

---

## 2 · 上线关键点（优先级）

### P0 · 必须钉死（Owner / 解锁后立刻）

| # | 项 | 现状 | 目标 |
|---|-----|------|------|
| 1 | **唯一发布身份** | baseline SHA ✅ · `candidate_sha` ❌ · image digest ❌ | 书面：上线=哪个 SHA · 哪个 image |
| 2 | **ACTIVE Web3 Runtime** | 脊 ACTIVE ✅ · FE example 部分 LEGACY | Governance / Steward / Trust / Wallet **不碰 LEGACY** |
| 3 | **WalletConnect** | `KEY_ABSENT` | `KEY_PRESENT`（连接 / 治理 / 链上身份） |

### P1 · Release Window Min-Fix（顺序写死）

```text
1. WalletConnect · KEY_ABSENT → KEY_PRESENT
 ↓
2. ACTIVE Runtime Binding · Governor / Stake / Steward
 ↓
3. Role Navigation
 ↓
4. Trust Surface
```

每项：**Fix → 单项验证 → Evidence 更新** · **禁止**一次性 UI 重构 · **禁止**因等待再开全站审计。

### P2 · 不要现在碰

| 项 | 原因 |
|----|------|
| Escrow Composite | Money-Path 窗 · 非 UI bug |
| Admin Live RBAC | 需真实角色环境 · Staging Validation / PFA-04 |
| Performance 压测 / P95 全扫 | 上线前只需首屏·登录·钱包·核心列表手感（Release/Staging） |

---

## 3 · WAIT_WINDOW 唯一允许（Owner 准备 · 不污染冻结）

| ID | Owner Action | 污染冻结？ |
|----|--------------|------------|
| **OA-RC-01** | `candidate_sha`（+ 可选 image）**意向草稿**（笔记/私密 · 不 retag） | 否 |
| **OA-RC-02** | Domain/DNS Owner 确认（生产 apex/API） | 否 |
| **OA-RC-03** | Email/Notification Owner 确认（或书面 N/A） | 否 |
| **OA-H1** | WalletConnect → `KEY_PRESENT`（可本窗注入；或并入 Release Min-Fix #1） | 否（不改 Registry） |
| **OA-RC-04** | ETA 日历提醒 · Release Window 人员在场确认 | 否 |
| **OA-H2** | evidence `.env.bak*` 抽检（线下） | 否 |

**Agent（本窗）：** 执行 Min-Fix 序 · Fix→Verify→Evidence · **禁止**新 Audit / 全量重跑。

---

## 4 · 解锁链（写死）

```text
execute_allowed_now=true
        ↓
Release Window OPEN
        ↓
PSG Release Fix Required（Min-Fix：WC → ACTIVE → Role → Trust → SHA/digest）
        ↓
单项复验 + Evidence 更新
        ↓
Coverage Acceptance 复验（七维门槛）
        ↓
PSG Gate Recalculate → GO | CONDITIONAL_GO | NO-GO
        ↓
Operator Card S0→S1→S2→S4→S3→S5
```

FAIL = 最小修复 + 单项复验 · **禁止全量重跑** · **≠** Freeze / **≠** Production GO  
**禁止：** 再开 Security/UI/CMS/Drift/E2E/Perf 轨 · 因 Acceptance 黄灯开 WAIT_WINDOW 旅程风暴。
