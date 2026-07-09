# Production Readiness Master Matrix

**Status:** **ACTIVE** · **2026-07-04**  
**Machine key:** `TT_PRODUCTION_READINESS_MASTER_MATRIX: ACTIVE`  
**Parent program:** [TT-PRODUCTION-READINESS-PROGRAM.md](TT-PRODUCTION-READINESS-PROGRAM.md)  
**Machine SSOT:** [`registry/production-readiness-master-matrix.v1.yaml`](../../registry/production-readiness-master-matrix.v1.yaml)  
**Gap report:** [PRODUCTION-READINESS-MASTER-GAP-REPORT.md](PRODUCTION-READINESS-MASTER-GAP-REPORT.md)  
**Runtime Truth:** [RUNTIME-TRUTH-GAP-REPORT.md](RUNTIME-TRUTH-GAP-REPORT.md) · [RUNTIME-TRUTH-AUDIT-RUNBOOK.md](RUNTIME-TRUTH-AUDIT-RUNBOOK.md)  
**G1 Reality:** [G1-REALITY-GAP-REPORT.md](G1-REALITY-GAP-REPORT.md)

---

## 0.0 Priority Ladder（2026-07-04 · 写死）

**SSOT：** [TT-PRODUCTION-READINESS-PRIORITY-LADDER.md](TT-PRODUCTION-READINESS-PRIORITY-LADDER.md)

```text
P0 Runtime Blocking → P1-A Verification · P1-B Coverage · P1-C Hygiene → P2 Platform Adoption → P3 Release Execution → Production GO
```

**P0 唯一 Blocker：** `PRM-SEC-B002` · prod `deployment_profile=null` · `TT_CONFIGURATION_TRUTH: FAIL`

---

## 0.1 三层审计 + G1 Reality（Production GO 前置）

```text
① Implementation Audit     — 有没有代码
② Runtime Truth Audit      — 代码有没有真正运行（Call Graph）
③ Production Readiness     — G1/G2/G3 · Matrix · Evidence · GO
```

**Machine keys:** `TT_IMPLEMENTATION_REALITY_AUDIT: COMPLETE` · `TT_RUNTIME_TRUTH_AUDIT: ACTIVE` · `TT_RUNTIME_TRUTH_P0: PASS` · `TT_G1_REALITY_AUDIT: COMPLETE`

**G1 Reality（2026-07-04）：** OPEN **6** · 已剔除 B005/B006/MVAL-B002 → [G1-REALITY-GAP-REPORT.md](G1-REALITY-GAP-REPORT.md)

---

## 0. 唯一主控表 · 唯一执行入口

**日常三原则：** [TT-PRODUCTION-READINESS-PROGRAM §0.0.1](TT-PRODUCTION-READINESS-PROGRAM.md#001-日常三原则写死--2026-07-04) — **不回头 · Matrix First · GO 只看 Evidence**

**进度（默认一句 · 禁止 %）：**

```text
Platform COMPLETE · Production Readiness ACTIVE · G1 IN_PROGRESS · G2 NOT_STARTED · G3 NOT_STARTED · Production GO NO_GO
```

**Production Readiness = 唯一执行入口。** 本 Matrix 是 **所有** Bug / 需求 / 修复的 **第一步** — 禁止矩阵外直接开修。

```text
发现 → Master Matrix → Domain → GO Gate → Blocking? → 修复 → Evidence → 关闭
```

**Release Train：** Master Matrix → Wave → Gate → Evidence → GO

**项目状态（统一口径 · 2026-07-04）：**

```text
TravelTrust
────────────────────
Platform          COMPLETE
────────────────────
PCP               FROZEN · VERIFIED · ALIGNED · CLOSED
────────────────────
Community         Production Ready (G1 Domain) · PASS
────────────────────
Production Readiness   ACTIVE
                      G1  IN_PROGRESS
                      G2  NOT_STARTED
                      G3  NOT_STARTED
────────────────────
Production GO     NO_GO
```

**G1 当前主战场：** Browser UAT · Manual Validation（Community G1 域已 PASS · 维护态 · 同 PCP）

| Domain | Gate | Status |
|--------|------|--------|
| **Browser UAT** | **G1** | 🟡 |
| **Manual Validation** | **G1** | 🟡 |
| **Community Content Readiness** | **G1** | 🟢 |
| **Security** | **G2** | 🟡 |
| **Performance** | **G2** | 🟡 |
| **Observability** | **G2** | 🟢 |
| **Monitoring** | **G2** | 🟡 |
| **Deployment** | **G3** | 🟢 |
| **Domain / CDN** | **G3** | 🟡 |
| **Web3 USDC Escrow Payment** | **G3** | 🔴 |
| **Optional Fiat Onboarding (Stripe)** | **G3** | 🟢 P1 |
| **Disaster Recovery** | **G3** | 🟡 |

**Production GO 规则（写死）：** **G1 PASS** + **G2 PASS** + **G3 PASS** → GO 决策闸

| GO Gate | 状态 | Wave | 域（Active work） |
|---------|------|------|-------------------|
| **G1** Product Verification | **IN_PROGRESS** | 1.1 | **Browser UAT · Manual Validation** |
| **G2** Production Hardening | NOT_STARTED | 2 | Security · Performance · Monitoring |
| **G3** Production Cutover | NOT_STARTED | 3 | Web3 Payment · Domain/CDN · DR · Go Live |

**G1 执行：** `bash scripts/dev/run-production-readiness-wave-1-1-g1.sh` · 签收 `node scripts/dev/validate-production-readiness-g1-gate.cjs`

**Production GO：** `NO_GO` · **G1 OPEN BLOCKER：** 9 · **Community G1 域：** PASS（已退出 Blocker）

> **Community Production Ready (G1 Domain)** ≠ **TravelTrust Production GO**。Community 已有 Evidence / Sign-off / Matrix PASS — **PRM-CONTENT-B001 已 CLOSED · 禁止 Reopen**；新问题登记 **PRM-CONTENT-B00X**。域进入 **维护态**（同 PCP），Release Train 精力 → **Browser UAT · Manual Validation · G2 · G3**。

> ① 本地绿 / ② staging 运维 PASS **≠** ③ Production GO。本表统计的是 **③ cutover 前须闭合的 Blocking 项**。

---

## 1. 工作分类（只允许四类）

任何问题 **必须先分类**，再处置：

| 类 | 含义 | Production GO 前 |
|----|------|------------------|
| **BLOCKER** | 阻断上线 — 不闭合不得 GO | **必须 FIX + Evidence + 关闭** |
| **DEFECT** | 真缺陷 / 漂移 / 冲突（非设计预期） | **必须 FIX** |
| **EXPECTED DIFFERENCE** | 环境设计上本来就应该不同 | **只 CONFIRM_DESIGN** · 禁止修成一致 |
| **ENHANCEMENT** | 不阻断 GO 的改进 | **可延期 · POST_GO** |

**层级（处置优先级）：**

```text
BLOCKER  →  DEFECT  →  EXPECTED DIFFERENCE  →  ENHANCEMENT
```

与 [TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY](TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md) 对拍：Defect/Drift/Conflict/Blocking Risk → **FIX**；Expected Difference → **CONFIRM**；Non-blocking 优化 → **ENHANCEMENT**。

---

## 2. Release Train 纪律（写死流程）

**不是：** 发现问题 → 直接修  

**而是：**

```text
Master Matrix
    ↓
定位 Domain · 分配 GO Gate · 四类分类
    ↓
登记 Gap（PRM-* ID）
    ↓
Wave 执行（当前 Wave 1.1 · G1）
    ↓
修复 或 确认设计（EXPECTED DIFFERENCE）
    ↓
Evidence
    ↓
Matrix 关闭 → Gate PASS → 下一 Wave
```

**Production GO：** G1 PASS + G2 PASS + G3 PASS → GO 决策

**登记规则：**

- 新 gap **必须** 写入 `registry/production-readiness-master-matrix.v1.yaml` 的 `gaps:` 段  
- **禁止** 在 Matrix 外平行维护「待办清单」冒充 Production Readiness  
- 关闭 gap 须更新 `status: CLOSED` + `evidence:` 路径 + 域 `blocking_count` 重算  

**签收命令：**

```bash
node scripts/dev/validate-production-readiness-master-matrix.cjs
```

---

## 3. Gap ID 命名

```text
PRM-<DOMAIN>-<CLASS><NNN>

DOMAIN: SEC | UAT | MVAL | CONTENT | PER | OBS | DEP | DOM | STR | DR | MON
CLASS:  B=BLOCKER · D=DEFECT · E=EXPECTED_DIFFERENCE · N=ENHANCEMENT
```

示例：`PRM-WEB3-PAY-B001` = Web3 Escrow Payment · BLOCKER · `PRM-STR-B001` = Optional Fiat Onboarding · ENHANCEMENT

---

## 3.1 Community Content Readiness · G1 Domain PASS · **维护态**

**口径：** **Community Production Ready (G1 Domain)** — 不是 TravelTrust Production GO · 不是 «Feed Ready»。

| 层 | 来源 | Production Ready? | 处置 |
|----|------|-------------------|------|
| **A** | API 真 UGC + Official + Campaign | ✅ | G1 域验收目标 · **已 PASS** |
| **B** | PG Showcase Seed | ⚠️ draft | Local **EXPECTED DIFFERENCE** · 不进 Production feed |
| **C** | Frontend Showcase | ❌ Demo | Local **EXPECTED DIFFERENCE** |
| **D** | Campaign 派生 | ✅ | G1 域验收目标 · **已 PASS** |

**历史 Gap（归档 · 禁止 Reopen）：** `PRM-CONTENT-B001` — CLOSED 2026-07-04 · L5 17/17 · Evidence 见 `community-production-ready/20260704T000527Z/`  
**新问题：** 登记 **PRM-CONTENT-B00X** — **禁止** Reopen B001（Evidence 历史干净）  
**Local ①：** `PRM-CONTENT-E001` — Demo 允许 · **CONFIRM_DESIGN**

**维护态纪律（同 PCP）：** 无新需求 → 不展开 Community 叙事 · Release Train → **Browser UAT · Manual Validation · G2 · G3**

**Local Runtime（`:8080` down）：** `PRM-UAT-B006` · **Browser UAT** 域 — 非 Community · 非 Production cutover。

---

## 4. 与 PI3 / GO 决策包对拍

| PI3 | Domain | Matrix gap |
|-----|--------|------------|
| PI3-001 | Disaster Recovery | PRM-DR-B001 · PRM-DR-B002 |
| PI3-002 | Domain / CDN | PRM-DOM-B001 (+ PRM-DOM-D001 DEFECT) |
| G3-02 | Web3 USDC Escrow Payment | PRM-WEB3-PAY-B001 |
| PI3-003 | Optional Fiat Onboarding (Stripe) | PRM-STR-B001 (P1 · not blocking) |
| PI3-004 | Manual Validation | PRM-MVAL-B004 |
| PI3-005 | Security / Mainnet | Mainnet scope — 见 [PRODUCTION-GO-DECISION-PACKAGE](PRODUCTION-GO-DECISION-PACKAGE.md) |
| PI3-006 | 全域 | go-live §0～§11 并联 |

**GO 闸：** PI3-001～006 全 closed **且** Matrix **OPEN BLOCKER = 0** **且** `run-phase3-production-go-audit.sh` **BLOCKER=0**。

---

## 5. 禁止项（Production GO 前）

| 禁止 | 理由 |
|------|------|
| PCP Phase 2 / SearchBuilder / RecommendationBuilder | Platform B **FROZEN** |
| 无 Architecture Review 的 PCP 架构改动 | [PCP-ARCHITECTURE-REVIEW-GATE](PCP-ARCHITECTURE-REVIEW-GATE.md) |
| 用 PCP freeze regression 冒充 Production GO | 阶段跳阶 |
| 把 Expected Difference 登记为 BLOCKER 并「修成一致」 | 对齐策略 |

---

## 6. 收口计划（Gate × Wave）

```text
Wave 1.1 → G1 → Browser UAT + Manual Validation                    ← ACTIVE
Wave 2   → G2 → Security + Performance + Monitoring
Wave 3   → G3 → Stripe + Domain/CDN + DR + Go Live

Community Content Readiness G1 PASS — maintenance (PRM-CONTENT-B001 CLOSED)
G1 PASS + G2 PASS + G3 PASS → Production GO
```

**Wave 1.1 执行：** `bash scripts/dev/run-production-readiness-wave-1-1-g1.sh`

---

## 7. 机读键

```yaml
TT_PRODUCTION_READINESS_SOLE_EXECUTION_ENTRY: ENFORCED
TT_RELEASE_TRAIN: ACTIVE
TT_PRODUCTION_READINESS_MASTER_MATRIX: ACTIVE
TT_PRODUCTION_READINESS_G1_GATE: IN_PROGRESS
TT_PRODUCTION_READINESS_G2_GATE: NOT_STARTED
TT_PRODUCTION_READINESS_G3_GATE: NOT_STARTED
TT_PRODUCTION_READINESS_PROGRAM: ACTIVE
TT_PRODUCTION_GO: NO_GO
TT_PCP_PLATFORM: CLOSED
TT_COMMUNITY_PRODUCTION_READY_G1_DOMAIN: PASS
TT_COMMUNITY_CONTENT_READINESS_DOMAIN: MAINTENANCE
```

---

## 8. 相关文档

| 文档 | 角色 |
|------|------|
| [PRODUCTION-READINESS-MASTER-GAP-REPORT.md](PRODUCTION-READINESS-MASTER-GAP-REPORT.md) | Master Gap Review 输出 |
| [PRODUCTION-READINESS-REPORT.md](PRODUCTION-READINESS-REPORT.md) | ③ 就绪基线 · NO_GO |
| [PRODUCTION-GO-DECISION-PACKAGE.md](PRODUCTION-GO-DECISION-PACKAGE.md) | GO / NO-GO 决策 |
| [registry/production-readiness-program.v1.yaml](../../registry/production-readiness-program.v1.yaml) | Program 机读 |
| [PCP-ARCHITECTURE-REVIEW-GATE.md](PCP-ARCHITECTURE-REVIEW-GATE.md) | Platform B 变更门闸 |
