# PRE-ETA_STANDBY · Release Control Standby

**Machine:** `TT_V311_PRE_ETA_STANDBY` · **ACTIVE** · **WAIT_WINDOW** · **Release Control**  
**Recorded:** `2026-07-18T14:01:01Z` · **Wait window locked:** `2026-07-19T01:39:37Z`  
**Governance:** `FROZEN_WAITING_EXECUTE`  
**决策版：** [TT-RELEASE-CONTROL-STANDBY-LATEST.md](./TT-RELEASE-CONTROL-STANDBY-LATEST.md)

> 不是缺检查 · 是 **Release Control**。Register 四桶 **FROZEN** · PFA **CLOSED**。

## Wait-window 纪律（Owner 已锁 · 2026-07-19）

| 项 | 状态 |
|----|------|
| Frozen RC / Money-Path / Gate | **不动** |
| Readiness Register 四桶 | **FROZEN** · 禁新灌 Finding 波 |
| Production Final Assurance | **CLOSED** |
| 新 Audit/Shadow/UI/CMS/Drift/E2E/Perf | **禁止** |
| 本窗工作 | **仅** heartbeat + Owner Action（不污染冻结） |

## Allowed
- F-02 Heartbeat（按需 · 证据落盘）
- Owner Action：candidate SHA 意向 · Domain/DNS · Email · WC · ETA/人员在场（见下表）
- 证据 stamp / 索引互指（**不**新开审计）

## Forbidden
- **任何**新 Audit / Shadow / UI / CMS / Drift / E2E / Performance / Hardening 轨
- Fix · Deploy · Config/Registry 改 · Min-Fix 预执行 · Money-Path
- ETA 前 Execute · 跳阶 · Production GO · Freeze 宣称

## Live
| Field | Value |
|-------|-------|
| Proposal #1 | `5` `Queued` |
| ETA | `2026-07-20T11:37:37Z` |
| Heartbeat | `execute_allowed_now=false` · `PASS_CLAIM=FORBIDDEN` |
| S0 premature ENTRY | **REFUSE_ENTRY**（`2026-07-19`）· 证据 `f02-operator-card-entry-refuse-20260719/` |
| S1–S5 | **禁止启动** 直至 heartbeat `execute_allowed_now=true` |
| Owner Hygiene Prep | **收口 · PARTIAL_PASS** · `owner-hygiene-20260719/` · **未改 Gate** |
| Owner Wait Checklist | **PASS_PREP_NON_MUTATING** · 已关闭 · `owner-wait-checklist-20260719/` |
| Production Shadow Check | **CLOSED** · Findings 不升 Blocker · `prod-readiness-shadow-20260719/` · **禁止扩 Shadow** |
| T0 UI Wave-1 | **CLOSED** · `NO_NEW_DRIFT` · **≠** Full UI/UX Acceptance · 剩余 UI 不进本窗 |
| Web3 Sec+UI Shadow | **CLOSED** · Findings 归档 · P0=0 · 延后分阶处理 · 禁 Fix |
| Hardening P0 | **CLOSED** · COMPLETE_WITH_FINDINGS · `hardening-p0-shadow-20260719/` |
| Hardening P1 | **CLOSED** · COMPLETE_WITH_FINDINGS · `hardening-p1-shadow-20260719/` |
| Hardening P2 | **CLOSED** · PAPER archived · `hardening-p2-incident-20260719/` |
| Hardening 全链 | **CLOSED** · [Chain CLOSED](./TT-PRODUCTION-READINESS-HARDENING-CHAIN-CLOSED-LATEST.md) · **禁新开** |
| PFA-01 RC Attestation | **NEED_OWNER_CONFIRM** · publish object NOT_PINNED · [PFA-01](./TT-PFA-01-RC-FINAL-ATTESTATION-LATEST.md) |
| PFA-02 Chain Manifest | **NEED_OWNER_CONFIRM** · ACTIVE spine 对齐 · staging FE 仍 LEGACY · [PFA-02](./TT-PFA-02-CHAIN-DEPLOYMENT-MANIFEST-LATEST.md) |
| PFA-03 Config Contract | **NEED_OWNER_CONFIRM** · WC ABSENT · secrets 未探值 · [PFA-03](./TT-PFA-03-CONFIG-CONTRACT-LATEST.md) |
| PSG Release Readiness Gate | **CONDITIONAL_GO** · 不要求零 Finding · [Gate](./TT-PSG-PRODUCTION-RELEASE-READINESS-GATE-LATEST.md) |
| Readiness Register | **FROZEN** · 全检查入册 · [Register](./TT-PRODUCTION-READINESS-REGISTER-LATEST.md) |
| Production Final Assurance | **CLOSED** · [PFA Track](./TT-PRODUCTION-FINAL-ASSURANCE-LATEST.md) |
| Final Paper A+B | **CLOSED** · archived · [Final Paper](./TT-PFA-FINAL-PAPER-REVIEW-LATEST.md) |
| PFA-UI-01 Runtime→UI | **CLOSED** · FINDING · UX 已穿透 · [PFA-UI-01](./TT-PFA-UI-01-RUNTIME-UI-BINDING-LATEST.md) |
| RW 最小修复候选 | **PAPER_QUEUED** · 待 `execute_allowed_now=true` · [队列](./TT-PFA-RELEASE-WINDOW-MIN-FIX-CANDIDATES-LATEST.md) |
| Release Control Standby | **ACTIVE** · [决策版](./TT-RELEASE-CONTROL-STANDBY-LATEST.md) |
| Admin / Perf / Escrow Composite | **Deferred** · 不进本窗 |
| WC | `KEY_ABSENT` · **OA-H1** |
| Prep Track | Register FROZEN · **heartbeat + Owner Action only** |

### Owner Actions（本窗 · 唯一允许的人工准备 · 非 Agent Fix）

| ID | 动作 | Agent |
|----|------|-------|
| **OA-RC-01** | `candidate_sha`（+ 可选 image）意向草稿 · 不 retag | 等待人工 |
| **OA-RC-02** | Domain/DNS Owner 确认 | 等待人工 |
| **OA-RC-03** | Email Owner 确认或书面 N/A | 等待人工 |
| **OA-H1** | WalletConnect → `KEY_PRESENT` | 等待人工 |
| **OA-RC-04** | ETA 提醒 · Release Window 人员在场确认 | 等待人工 |
| **OA-H2** | evidence `.env.bak*` 抽检（线下） | 等待人工 |

**本窗禁止：** Fix · Deploy · Config/Registry · Min-Fix · 新检查轨 · S1–S5 / Execute  
**本窗允许：** F-02 **heartbeat only** + 上表 Owner Action  
**ENTRY：** `execute_allowed_now=true` → Release Window → Min-Fix（WC→ACTIVE Runtime→Role→Trust）→ 单项复验 → Evidence → Operator Card `S0→S1→S2→S4→S3→S5` |

## 解除触发（机读 · 唯一）

`stamp-v311-f02-execute-monitor-heartbeat.py` → **`execute_allowed_now=true`**  
→ **立即**解除 WAIT_WINDOW  
→ **Release Window** → **Min-Fix Queue** → **单项复验**  
→ Operator Card **ENTRY** → `S0 → S1 → S2 → S4 → S3 → S5`  
每 Step：证据 + verdict · FAIL=最小修复+单项复验 · **禁止全量重跑**  
末汇总：F-02 Execution Report + Production Prep Gate（≠ Freeze / ≠ GO）

**在此之前：** heartbeat only · 禁新 Audit/Shadow/UI/CMS/Drift/E2E/Perf · 禁 Fix/Deploy/Config/Registry/Gate/Money-Path · 禁 S1–S5 / Execute。
