# PSG · Production Release Readiness Gate（唯一发布裁决入口）

**Machine:** `TT_PSG_PRODUCTION_RELEASE_READINESS_GATE`  
**Status:** **ACTIVE** · Release Control Standby  
**Recorded:** `2026-07-19`  
**Model:** Enterprise Release Governance · **九维统一入口**  
**Registry:** [`registry/psg-production-release-readiness-gate.v1.yaml`](../../registry/psg-production-release-readiness-gate.v1.yaml)  
**问题池 SSOT:** [Production Readiness Register](./TT-PRODUCTION-READINESS-REGISTER-LATEST.md)  
**覆盖模型:** [七维 Coverage Model](./TT-PSG-COVERAGE-MODEL-SEVEN-DIMENSIONS-LATEST.md)（≠ 单一行覆盖率）  
**Coverage Baseline:** [Acceptance Baseline Report](./TT-PSG-COVERAGE-ACCEPTANCE-BASELINE-LATEST.md)（只读 · Overall CONDITIONAL）  
**决策待命:** [Release Control Standby](./TT-RELEASE-CONTROL-STANDBY-LATEST.md)

> **PSG ≠ 全部修完才上线。**  
> **PSG = 上线前所有风险经过系统化验证与决策的唯一入口。**  
> 不要求零 Finding；要求每项风险：**有状态 · 有证据 · 有责任人 · 有处理路径**，且最终 Gate 可裁决是否允许上线。  
> 发布前 **只看本 Gate Verdict** · **禁止**用散落审计结果绕过裁决。  
> **≠** `TT_PSG_PRODUCTION_CERT` · **≠** Production GO（另闸）  
> **防三错：** ① Coverage≠任务列表 · ② `CONDITIONAL_GO`≠GO · ③ Release Window 禁扩 scope（禁顺便重构/重审计）

---

## Production Release Status（当前）

```text
PSG Production Release Readiness Gate
Status:               CONDITIONAL_GO
Release Blocker:      0
Release Fix Required: 2（本窗已关 ACTIVE/Trust/ROLE-01；剩 WC + ROLE-02）
Deferred / Accepted:  Tracked
Coverage Acceptance:  CONDITIONAL  ← Baseline COMPLETE · Mode=Evidence Sync
Release:              NOT_READY_FOR_GO
Baseline Report:      docs/runbook/TT-PSG-COVERAGE-ACCEPTANCE-BASELINE-LATEST.md
Next Action:          execute_allowed_now=true → Min-Fix → Affected-domain verify
                      → Coverage Recalculate（仅失效域）→ Gate Recalculate
```

| 含义 | |
|------|--|
| ✅ | 风险域已查 · Findings 已入册 · Coverage 门槛已定义 |
| ❌ | **还不能** GO：Fix=8 未关 · Coverage Acceptance 未达 PASS |
| 可做什么 | Release Window：修 → 单项复验 → **再验覆盖门槛** |
| 不可宣称 | Finding=0 才上线 · 修完不复验覆盖就 GO · CERT alone |

| Verdict | 条件 |
|---------|------|
| **GO** | Blocker=0 · Fix=0 · **Coverage Acceptance 必达维 PASS** · publish 钉死 · Owner Sign-off · Rollback |
| **CONDITIONAL_GO** | Blocker=0 ·（Fix>0 **或** Coverage Acceptance=CONDITIONAL）（**当前**） |
| **NO-GO** | Blocker>0 · 或 Coverage 必达维 **FAIL** · 或发布身份无计划 |

---

## 核心原则（写死）

| # | 原则 |
|---|------|
| 1 | **唯一裁决入口** — 上线资格只看本 Gate Verdict |
| 2 | **零 Finding 非目标** — Deferred / Accepted Risk / 后续优化必然存在 |
| 3 | **风险可追踪** — Status + Evidence + Owner + Window/Plan |
| 4 | **Register = 唯一问题池** — 禁止「做过但散落在 10 个文档」而不入册 |
| 5 | **Frozen 灌池禁令** — WAIT_WINDOW 不新开 Audit/Shadow/Drift/UI/CMS/E2E/Perf |

**流程（治理）：**

```text
D1–D9 风险域检查
        ↓
问题发现 → Register 分类 → Fix / Deferred / Accepted
        ↓
Release Window：修复 + 单项 Evidence
        ↓
七维 Coverage Acceptance 复验   ← 最终验收层
        ↓
Release Decision → GO / CONDITIONAL_GO / NO-GO
```

### Gate 结构（写死）

```text
PSG Gate
├── Release Blocker
├── Fix Required
├── Deferred / Accepted Risk
└── Coverage Acceptance   ← 七维最终层
      ├ Functional Domain     → PASS
      ├ User Journey          → 核心 PASS
      ├ API / Backend         → PASS
      ├ Code Line             → 可 DEFERRED
      ├ Security / Web3       → PASS
      ├ Data Governance       → PASS（P0）
      └ UI / UX               → P0 PASS
```

细则：[七维 Coverage Model](./TT-PSG-COVERAGE-MODEL-SEVEN-DIMENSIONS-LATEST.md)

---

## Dashboard 三问（每检查项 · 每维）

发布前对任意检查只回答：

| # | 问 | 答例 |
|---|----|------|
| 1 | **有没有检查？** | Web3 Runtime Binding · **DONE** · Evidence: `PFA-UI-01` |
| 2 | **有没有问题？** | Finding: WC missing · Sev P1 · Action: Release Window Fix |
| 3 | **能不能上线？** | **PSG Verdict:** `NO-GO` / `CONDITIONAL_GO` / `GO` |

---

## 检查项统一状态词

| Status | 含义 |
|--------|------|
| **PASS** | 本项验证通过（可仍有 Deferred 子项） |
| **CLOSED** | 已验证归档 · 不再扫 |
| **RELEASE_FIX_REQUIRED** | 发布前必须修 · 进 Release Window |
| **DEFERRED** | 不挡本窗 · 有 Owner · 有计划 |
| **ACCEPTED_RISK** | 本切片接受 · 有 Owner · 有应对 |
| **NOT_RUN** | 登记存在 · 本窗未跑（须归 Deferred 或排窗） |
| **BLOCKED** / **RELEASE_BLOCKER** | 硬停 · 清零前不得推进/GO |

Finding 桶（Register 四桶）与上表兼容：`CLOSED` · `RELEASE_FIX_REQUIRED`（含 Blocker 子类）· `DEFERRED` · `ACCEPTED_RISK`。

---

## 九维模型（全生命周期 · 统一入口）

```text
PSG Production Readiness Gate
├── 1. Release Identity
├── 2. Infrastructure Readiness
├── 3. Security Readiness
├── 4. Web3 Readiness
├── 5. Business Flow Readiness
├── 6. Data Governance
├── 7. UI/UX Readiness
├── 8. Operations Readiness
└── 9. Legal / External Readiness
```

每维叶子项统一记：**Status · Evidence · Owner · Severity（若有 Finding）· Window/Plan**。

### 维映射 · 当前登记（cite / 已做 · **不重跑**）

| # | Domain | 叶子（规范） | 当前覆盖证据 | Domain 态 |
|---|--------|--------------|--------------|-----------|
| **1** | **Release Identity** | SHA · Image Digest · Artifact Integrity · Release Owner | PFA-01 · OA-RC-01 | CLOSED 检查 · Fix: pin SHA/digest |
| **2** | **Infrastructure** | Domain/DNS · TLS · Runtime · Storage · DB · Backup | Final Paper A+B · OA-RC-02 | CLOSED 纸面 · DNS/drill→Deferred |
| **3** | **Security** | Secrets · Auth · RBAC · Headers · Permission Boundary | PFA-03 · Hardening P0 · W3S Shadow · Auth Freeze | CLOSED 纸面 · CSP/live RBAC→Deferred |
| **4** | **Web3** | Chain Identity · Addresses · Governor · Timelock · WC · Runtime Binding | PFA-02 · PFA-UI-01 · V311 CERT · Matrix · Constitution | CLOSED · **Fix: WC + ACTIVE bind** |
| **5** | **Business Flow** | Order · Escrow · Settlement · Dispute · Role Journey | Hardening P1 · Escrow Freeze · Admin CERT | CLOSED 纸面 · Money-Path/旅程→Deferred |
| **6** | **Data Governance** | CMS Ownership · Data Source · Content Lifecycle · Dup Prevention | CMS Specialty · HRD-DOM | CLOSED · Pulse 双轨→Deferred |
| **7** | **UI/UX** | Route · Navigation · Role Experience · Wallet Flow · Errors | T0 · Five-Main · PFA-UI-01 · Provider/Acquisition Freeze | CLOSED · **Fix: Role/Trust/Wallet** |
| **8** | **Operations** | Monitoring · Incident · Rollback · Owner · Escalation | Hardening P2 · Operator Card · Final Paper B | CLOSED 纸面 · pager/drill→Accepted/Deferred |
| **9** | **Legal / External** | ToS · Privacy · Token · Trust Center · Investor Material | Register **§2b** 五行 | **DEFERRED**（公开前）· Owner Legal/Founder |

细表与 Finding 分流 → [Register](./TT-PRODUCTION-READINESS-REGISTER-LATEST.md) §1–§7。

---

## 检查覆盖清单（存在于 Register · 不重跑）

| Domain | ID | Register |
|--------|-----|----------|
| Release Identity | PFA-01 | Closed（钉 SHA → Fix Required） |
| Chain Identity | PFA-02 | Closed |
| Config Contract | PFA-03 | Closed |
| UI Runtime Binding | PFA-UI-01 | Closed · Findings 分流 |
| Hardening P0–P2 | HRD | Closed |
| Web3 Security Shadow | W3S | Closed |
| Prod Readiness Shadow | PRS | Closed |
| CMS Data-Chain | CMS | Closed |
| T0 UI Readonly | T0 | Closed |
| Dependency + Obs/Backup | Final Paper A+B | Closed |
| Economic / Protocol（cite） | Constitution V3.1.1 | Closed · Register §1b |
| Chain Baseline Cert（cite） | V311 Clean Baseline | Closed · §1b |
| Execution Matrix（cite） | Web3 Active Matrix | Closed · §1b |
| Admin Capability（cite） | Admin Backoffice CERT | Closed · live→Deferred |
| UI Freezes（cite） | Five-Main / Auth / Provider / Acquisition / Escrow Draft | Closed · §1b |
| Ceremony / Rollback（cite） | Operator Card · Launch Day | Closed · §1b |
| Test Accounts（cite） | C1–E2 immutable | Closed · §1b |

---

## 当前计数（Gate）

| 项 | 值 |
|----|-----|
| Domains（九维） | **9** 已映射入册 |
| Coverage closed（主轨检查） | **12** + §1b cite |
| Release Blocker open | **0** |
| Release Fix Required open | **8** |
| Deferred / Accepted | Tracked · Owner/计划 · Register §3–§4 / §7 |

### Release Fix Required（必须进窗 · 唯一关注面）

| 类别 | 目标 |
|------|------|
| WalletConnect | `KEY_ABSENT` → `KEY_PRESENT` |
| ACTIVE Gov/Stake/Steward | UI/runtime 绑 ACTIVE（+ `/meta`） |
| Role | 角色入口一致 |
| Trust | 信息面一致 |
| `candidate_sha` | 发布对象唯一 |
| image digest | 发布制品唯一 |

细序：[Min-Fix](./TT-PFA-RELEASE-WINDOW-MIN-FIX-CANDIDATES-LATEST.md)

---

## 明确不做（当前 Gate 非阻断 · 已分流）

再开 Security Shadow · UI 全站 Audit · CMS 深挖 · Drift · E2E 大矩阵 · 性能专项  
→ 已在 **Deferred / Accepted Risk / Future Release** · **不**提升本 Gate。

---

## 解锁后裁决链（唯一合法下一动）

> **不是：** 修完 8 项 → 直接上线。  
> **而是：** 修完 → 单项 Evidence → **Coverage Acceptance 复验** → 再裁决。

```text
execute_allowed_now=true
        ↓
Release Window OPEN
        ↓
Fix Required = 8（Min-Fix）
  每项: 修复 → 验证 → Evidence
        ↓
Coverage Acceptance 复验（七维门槛）
        ↓
PSG Gate Recalculate → GO | CONDITIONAL_GO | NO-GO
        ↓
Operator Card S0→S1→S2→S4→S3→S5
```

### 最终发布判断（只看 Gate · 不看 Finding=0）

| 问 | 须 |
|----|-----|
| Blocker = 0？ | 是 |
| Fix Required 是否关闭？ | 是 |
| Coverage Acceptance 必达维 PASS？ | 是（Code Line 可 DEFERRED） |
| Evidence 是否齐？ | 是 |
| Owner Sign-off？ | 是 |
| Rollback 是否存在？ | 是 |

**禁止：** WAIT_WINDOW 因 Acceptance 黄灯新开全旅程/全站 Audit · 层③转本窗任务 · Release Window 扩 scope。

**Agent（Standby）：** heartbeat only · Register **FROZEN** · 不新开 Audit · 不预修 Min-Fix。
