# TravelTrust · Production Readiness Program

**Status:** **ACTIVE** · **2026-07-04**  
**Machine key:** `TT_PRODUCTION_READINESS_PROGRAM: ACTIVE`  
**唯一执行入口：** `TT_PRODUCTION_READINESS_SOLE_EXECUTION_ENTRY: ENFORCED`  
**Release Train：** `TT_RELEASE_TRAIN: ACTIVE`  

**Architecture（关卷 · 非执行面）：** Platform B PCP **CLOSED** — 见 [PCP-PLATFORM-STATUS.md](PCP-PLATFORM-STATUS.md)

---

## 0.0 最高原则（发布流程 · 写死）

**Production GO is earned by evidence, not by implementation.**

**Production GO 由证据获得，而不是由代码完成获得。**

| 不等于 GO | 唯一 GO 条件 |
|-----------|--------------|
| 功能写完 | Master Matrix 中 **G1 · G2 · G3** 全部以 **Evidence 关闭** |
| 测试通过 | 同上 |
| 文档完成 | 同上 |

此原则高于一切日常决策：无 Matrix 登记 · 无 Gate 归属 · 无 Evidence → **不得** 宣称关闭或 GO。

---

## 0.0.1 日常原则（写死 · 2026-07-04 · 五原则）

### 原则一 · 不回头

已关闭项默认 **维护态** — **不重新讨论**：

| 项 | 状态 |
|----|------|
| **PCP** | FROZEN · CLOSED · maintenance |
| **Community** | **Production Ready (G1 Domain) · Maintenance** — 统一口径见 [COMMUNITY-PLATFORM-MAINTENANCE.md](COMMUNITY-PLATFORM-MAINTENANCE.md) |

**Community 已退出 Release Train**（与 PCP 同为稳定平台能力）。默认**不**展开 Showcase / Demo / Legacy 叙事，除非 **③ Production 回归**。

**Community Media Guard：** 每次提交 `TT_COMMUNITY_MEDIA_GUARD` — `bash scripts/gates/run-community-media-guard.sh`（非 Blocker · 防回归）。

**仅在三类情况下可重新打开叙事：**

1. **新需求**（须 Matrix 登记新 Gap ID）
2. **架构评审**（PCP → [PCP-ARCHITECTURE-REVIEW-GATE](PCP-ARCHITECTURE-REVIEW-GATE.md)）
3. **线上事故**（Production incident · 新 Gap · Evidence）

否则：与 PCP 相同 — **bugfix · 证据 · i18n · 数据链** 可以，**不** 重开 Phase / 不 Reopen 已 CLOSED Gap（如 PRM-CONTENT-B001）。

### 原则二 · 只看 Master Matrix

任何 **Bug · 需求 · 优化** — **第一件事不是修，是进 Matrix：**

```text
Intake → Master Matrix（Domain · GO Gate · 四类分类 · PRM-* ID）
    → 然后才修复 / 确认设计
```

**Release Train 永远只有一个：** Master Matrix → Wave → Gate → Evidence → Production GO  
**禁止：** 矩阵外平行待办 · 先修后登记 · 无 Gap ID 的「顺手改」。

### 原则三 · GO 只看 Evidence

**禁止** 讨论：「我觉得可以上线了。」

**统一只答此链：**

```text
Evidence
    ↓
Master Matrix（Gap CLOSED + 路径）
    ↓
G1 PASS
    ↓
G2 PASS
    ↓
G3 PASS
    ↓
Production GO
```

无 Evidence 附件 · Matrix 未关闭 → **NO_GO**（无例外口语 GO）。

### 原则四 · 内容治理不阻塞生产基础设施（写死 · 2026-07-04）

**任何运营数据治理（Content / Data Governance）不得阻塞生产基础设施（Production Infrastructure）。**  
**只有直接影响 Production GO 的问题才能阻塞当前 G3 Domain。**

| **会阻塞 G3** | **不会阻塞 G3**（除非直接影响 Production GO） |
|---------------|--------------------------------------------------|
| DNS · TLS · CDN · WAF | Market Media DDG Remediation |
| Web3 USDC Escrow Payment | OCS Manifest 优化 |
| Optional Fiat Onboarding (Stripe) | 新增官方内容 |
| Disaster Recovery | 新增官方内容 |
| Production Monitoring | 内容丰富度 |
| Production Evidence | Community 运营活动 · 新 Campaign |

**机读键：** `TT_CONTENT_GOVERNANCE_NON_BLOCKING_G3: ENFORCED`

**独立数据治理轨（不挂 G3 / OCS / PCP）：** [Market Media DDG Remediation](TT-MARKET-MEDIA-DDG-REMEDIATION.md)

**Official Content Baseline：** **Version V1 · Status READY** — Production GO 引用 **V1**，不是「当前最新」。见 [§0.0.2](#002-项目阶段与-official-content-baseline-v1)。

### 原则五 · 配置优先于代码（G3 · 写死 · 2026-07-04）

**G3 阶段：若问题可通过配置面解决，禁止先改代码。**

| 配置面（优先） | 仅 Capability 缺失时才允许 |
|----------------|------------------------------|
| Fly Secrets · DNS · CDN · Stripe Dashboard · Cloudflare · WAF · 环境变量 · 部署参数 | Matrix 登记 Gap → 开发 / 平台能力补齐 |

**机读键：** `TT_CONFIGURATION_CHANGES_OVER_CODE_CHANGES: ENFORCED`

**与 G3 CCV 门禁联动：** 见 [G3-PRODUCTION-DOMAINS · CCV 门禁](G3-PRODUCTION-DOMAINS.md#tt-g3-ccv-pre-implementation-gate) · `TT_G3_CCV_PRE_IMPLEMENTATION_GATE: ENFORCED`

---

## 0.0.2 项目阶段与 Official Content Baseline V1

**一句话：** 项目已从 **「建设平台」** 正式转入 **「运营生产系统」**。

| 此前重点 | 现在开始 |
|----------|----------|
| Builder · Registry · Guard · Runtime · Verification | Production Network |
| | Production Payment |
| | Production DR |
| | Production Monitoring |
| | Production Cutover |
| | Production Evidence |

**Official Content Baseline V1 · READY**

| 字段 | 值 |
|------|-----|
| Version | **V1** |
| Status | **READY** |
| 含义 | OCS Surface Expansion VERIFIED + Post-Apply DDG PASS 后的官方运营数据基线 |

**版本纪律：** 新增官方城市 / Identity / Surface → **V1 → V1.1 → V2** — **不**原地修改 `READY`。Production GO 必须引用 **pinned version**（如 V1），而非「当前最新」。

SSOT：`registry/production-readiness-program.v1.yaml` · `official_content_baseline`

---

## 0. 一句话项目状态（统一口径）

**进度（默认只答这一句 · 禁止百分比如 95%/97%）：**

```text
Platform COMPLETE · Production Readiness ACTIVE · G1 IN_PROGRESS · G2 NOT_STARTED · G3 NOT_STARTED · Production GO NO_GO
```

百分比在此阶段 **无意义** — 不以完成度 % 汇报；只以 **Gate × Evidence × Matrix 关闭** 汇报。

**完整状态（需要上下文时才展开）：**

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

**G1 主战场：** Browser UAT · Manual Validation（Community G1 域 PASS · 维护态）

日常纪律：[§0.0.1 三原则](#001-日常三原则写死--2026-07-04) · 细节查 [Master Matrix](TT-PRODUCTION-READINESS-MASTER-MATRIX.md)。

---

## 0.1 唯一执行入口（= 原则二 · Matrix First）

**Production Readiness = 唯一执行入口。** 见 [§0.0.1 原则二](#原则二--只看-master-matrix)。

当前：**Wave 1.1 → G1** · `bash scripts/dev/run-production-readiness-wave-1-1-g1.sh`

---

## 1. 项目形态（成熟度跃迁）

TravelTrust 已从 **「业务系统」** 演进为 **「平台系统」**：

| 以前 | 现在 |
|------|------|
| 维护页面与功能切片 | 维护 **Platform A** + **Platform B (PCP)** + **Production** 三层底座 |
| 公开内容各模块各自治理 | 一切公开内容经 **PCP**（已 Architecture Closure） |
| 主线 = 功能 / PCP Phase | 主线 = **Production Readiness → Production GO → Public Launch** |

**PCP 已是平台 — 应稳定。** 能否上线取决于 **整个系统** 的生产就绪，而非再做一个 Builder。

---

## 1. 三层平台（互不影响）

```text
TravelTrust Platform
────────────────────────────────────────
Platform A          Identity · Wallet · Settlement · RBAC
────────────────────────────────────────
Platform B (PCP)    Governance · Builder · Public Content · Evidence
                    TT_PCP_ARCHITECTURE: FROZEN
────────────────────────────────────────
Production          Security · Performance · Operations · Monitoring
                    Browser UAT · Go Live · Domain · CDN · Stripe · DR
```

| 层 | 当前纪律 |
|----|----------|
| **Platform A** | 按 Trust/Settlement 既有 runbook；**不**与 PCP Builder 混谈 |
| **Platform B** | **禁止** 直接开发；变更仅 [Architecture Review](PCP-ARCHITECTURE-REVIEW-GATE.md) |
| **Production** | **本 Program 唯一执行面** |

---

## 2. 程序主链（唯一顺序 · 禁止跳阶）

```text
Architecture Closure          ← COMPLETE · TT_PCP_ARCHITECTURE: FROZEN
        ↓
Production Readiness Program  ← ACTIVE（本文件）
        ↓
Production GO                 ← 独立决策闸 · NO_GO 直至证据齐
        ↓
Mainnet / Public Launch      ← ③ · 另闸
```

**不是：** PCP → Phase 2  
**不是：** 用 SearchBuilder 冒充 Production Readiness  

**Phase 2 PCP（SearchBuilder / RecommendationBuilder）：** `NOT_STARTED` — **Production Readiness 与 Production GO 评估之后**，Owner 书面确认方可规划。

---

## 3. Production Readiness 域（与 PCP 无关）

本 Program 覆盖 **全系统** 上线能力，包括但不限于：

| 域 | 典型项 | 现有 SSOT 入口 |
|----|--------|----------------|
| **Security** | 密钥 · RBAC · webhook · TLS | [go-live-checklist](../go-live-checklist.md) · Admin RBAC |
| **Observability** | 日志 · 指标 · 告警 | Staging ops runbooks · C8 类证据 |
| **Performance** | SLO · 负载 · 缓存 | FINAL-SYSTEM-AUDIT · staging 压测 |
| **Disaster Recovery** | PG backup · 回滚 · RTO/RPO | [PRODUCTION-READINESS-REPORT](PRODUCTION-READINESS-REPORT.md) |
| **Deployment** | Fly · 镜像 digest · SHA 对齐 | [TT-LOCAL-FIRST-CONVERGENCE](TT-LOCAL-FIRST-CONVERGENCE.md) |
| **Browser UAT** |  persona · 走廊 · 人工验收 | [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) · [manual-uat](../../evidence/manual-uat/README.md) |
| **Live Services** | API · FE · indexer · worker | go-live §1～§8 |
| **Domain / CDN / CORS** | 生产域 · 静态资源 | PRODUCTION-READINESS-REPORT 差距表 |
| **Stripe** | Live mode · webhook 生产 | Phase ③ prep · PI3 |
| **Monitoring** | 值班 · 探针 · 合成监控 | ops RUNBOOK |
| **Regression / R-002** | 93 矩阵 · report.json | [R-002](../spec/R-002-回归执行闭环与发布准入.md) · [R-003](../spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md) |
| **Alignment Audit** | Defect 清零 · Expected Difference 确认 | [TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY](TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md) |

---

## 4. 与既有主链的对拍（不平行造轨）

| 文档 | 角色 |
|------|------|
| [TT-LOCAL-FIRST-CONVERGENCE.md](TT-LOCAL-FIRST-CONVERGENCE.md) | 发布治理 **唯一主链** L0→…→Production GO |
| [TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md](TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md) | Manual UAT → Regression → PER → Testnet → Mainnet prep |
| [PHASE3-PRODUCTION-PREPARATION.md](PHASE3-PRODUCTION-PREPARATION.md) | ③ 准备轨 · PI3 · 机读键 |
| [PRODUCTION-READINESS-REPORT.md](PRODUCTION-READINESS-REPORT.md) | 就绪报告 · 差距 · **当前 NO_GO 基线** |
| [PRODUCTION-GO-DECISION-PACKAGE.md](PRODUCTION-GO-DECISION-PACKAGE.md) | GO / NO-GO 决策包 |
| [go-live-checklist.md](../go-live-checklist.md) | 工程运维逐项勾选 |

**本 Program = 上述文档的「当前执行入口」叙事**；具体条款仍以各 SSOT 为准。

---

## 5. 阶段口径（①②③）

| 阶 | Production Readiness 含义 |
|----|----------------------------|
| **① 本地** | 产品验证 · Manual UAT · 缺陷回归 · **≠ Production GO** |
| **② 测试网 / Staging** | 真回调 · Sepolia · staging 矩阵 · **≠ Production GO** |
| **③ 公网 / 生产** | Live PSP · 主网 · Production GO · go-live |

**禁止** 用 ① PCP freeze regression 或 ② staging 窄切片冒充 ③ Production GO。

---

## 6. 当前基线快照（2026-07-04）

| 项 | 状态 |
|----|------|
| PCP Architecture Closure | **COMPLETE** · 7/7 ALIGNED |
| PCP Phase 1 Freeze | **COMPLETE** |
| PCP Phase 2 | **NOT_STARTED** |
| Production Readiness（③ cutover） | **NOT READY**（见 PRODUCTION-READINESS-REPORT） |
| Production GO | **NO_GO** |
| **本 Program** | **ACTIVE** |

---

## 7. 执行纪律（本 Program ACTIVE 期间）

| 做 | 不做 |
|----|------|
| Security / Ops / Deploy / UAT / R-002 闭环 | 新增 PCP Builder · Governed migration |
| Defect / Drift / Blocking Risk 清零 | SearchBuilder / RecommendationBuilder |
| Expected Difference **确认设计** | 把 Expected Difference **修成一致**（见对齐策略） |
| Production GO 证据包 | 用 PCP 文档改写冒充 Production GO |

**PCP 变更：** 仅 [Architecture Review Gate](PCP-ARCHITECTURE-REVIEW-GATE.md)。

---

## 8. Owner 下一步（Matrix 驱动 · 唯一入口）

**主控表：** [TT-PRODUCTION-READINESS-MASTER-MATRIX.md](TT-PRODUCTION-READINESS-MASTER-MATRIX.md) · Gap Report：[PRODUCTION-READINESS-MASTER-GAP-REPORT.md](PRODUCTION-READINESS-MASTER-GAP-REPORT.md)

**纪律：** Matrix → 定位 Domain → 登记 → 修复 → Evidence → 关闭（**不是** 想到哪个做哪个）

**Wave 1 顺序（Blocking 优先 · 2026-07-08 纠正）：**

1. **Web3 USDC Escrow Payment** — G3-02 · PAY-W01..W16 · `PRM-WEB3-PAY-B001`  
2. **Browser UAT + Manual Validation** — PER 前置  
3. **Domain / CDN** — PI3-002  
4. **Disaster Recovery** — PI3-001 · B-475  
5. **Security · Performance · Monitoring** — prod bases  
6. **R-002 prod + go-live** — PI3-004 · PI3-006  
7. **Production GO re-audit** — BLOCKER=0  

**P1 可选（不挡 GO）：** Optional Fiat Onboarding (Stripe PI3-003) — 仅 `TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`

**签收：**

```bash
node scripts/dev/validate-production-readiness-master-matrix.cjs
```

**不在此 Program 第一轮讨论：** Builder · Governance · Phase 2 功能范围。

---

## 9. 机读键

```yaml
TT_PRODUCTION_READINESS_SOLE_EXECUTION_ENTRY: ENFORCED
TT_RELEASE_TRAIN: ACTIVE
TT_PRODUCTION_READINESS_MASTER_MATRIX: ACTIVE
TT_PRODUCTION_READINESS_PROGRAM: ACTIVE
TT_PRODUCTION_READINESS_G1_GATE: IN_PROGRESS
TT_PRODUCTION_READINESS_G2_GATE: NOT_STARTED
TT_PRODUCTION_READINESS_G3_GATE: NOT_STARTED
TT_PCP_PLATFORM: CLOSED
TT_PCP_ACTIVE_DEVELOPMENT: false
TT_PCP_PHASE_2: NOT_STARTED
TT_CURRENT_PROGRAM_MAINLINE: PRODUCTION_READINESS
TT_CONTENT_GOVERNANCE_NON_BLOCKING_G3: ENFORCED
TT_OCS_OFFICIAL_CONTENT_BASELINE: V1_READY
TT_PRODUCTION_GO: NO_GO
```

**Matrix 签收：** `node scripts/dev/validate-production-readiness-master-matrix.cjs`  
**PCP 证据（只读 · 回归用）：** `node scripts/dev/validate-pcp-phase1-freeze-regression.cjs` — **不**替代 Production GO 闸。

---

## 10. 相关文档

| 文档 | 用途 |
|------|------|
| [TT-PRODUCTION-READINESS-MASTER-MATRIX.md](TT-PRODUCTION-READINESS-MASTER-MATRIX.md) | **唯一主控表** · Domain × Blocking |
| [PRODUCTION-READINESS-MASTER-GAP-REPORT.md](PRODUCTION-READINESS-MASTER-GAP-REPORT.md) | Master Gap Review 输出 |
| [registry/production-readiness-master-matrix.v1.yaml](../../registry/production-readiness-master-matrix.v1.yaml) | Matrix 机读 SSOT |
| [PCP-ARCHITECTURE-FINAL.md](PCP-ARCHITECTURE-FINAL.md) | Platform B  frozen 架构 |
| [PCP-ARCHITECTURE-REVIEW-GATE.md](PCP-ARCHITECTURE-REVIEW-GATE.md) | PCP 变更唯一入口 |
| [TT-PUBLIC-CONTENT-PLATFORM.md](TT-PUBLIC-CONTENT-PLATFORM.md) | PCP Hub（非当前主线） |
| [registry/production-readiness-program.v1.yaml](../../registry/production-readiness-program.v1.yaml) | 机读 Program SSOT |
