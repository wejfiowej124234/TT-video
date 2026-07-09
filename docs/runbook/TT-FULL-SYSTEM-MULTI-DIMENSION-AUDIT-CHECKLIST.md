# TravelTrust · 第一阶段收尾治理总标准（Phase ① Closure Governance Standard）

**Status:** **ACTIVE · Phase ① 本地开发阶段唯一收尾治理总标准** — 统管 **收尾 · 验收 · 治理 · 瘦身 · 优化 · 升级** 与 **进入 Phase ②** 依据 · **D01–D76 + DX-01** · **PF · DOA · LFC · PGX · AG · MA · FZ · QA2** · **U12/U23 · MASTER GATE** · **不**替代域 **FREEZE**  
**Version:** 1.14.0 · **2026-06-13**  
**历史路径 / grep：** `TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md` · `TT_PHASE1_CLOSURE_GOVERNANCE`  
**Maintainer discipline:** 单维护者自检 = Owner 四闸对拍（见 [solo-dev-rhythm §7](../solo-dev-rhythm.md)）

**阶段口径（写死）：** **① 本地 → ② 测试网 → ③ 公网/生产** — **须顺序递进，禁止跳阶**  
**禁止假完成：** ① 绿集 / 窄切片 `report.json` / 文档勾选 **不得** 冒充 ② staging GO 或 ③ **Production GO** — [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion) · [TT-9628 · §0.0.5](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)

## §0 · 文档定位 · Phase ① 收尾治理总标准 {#tt-phase1-closure-governance-standard}

> **本文定位（v1.14.0 · 执行收敛 · EX 接入 PEB · Owner 可执行收尾计划）：** **TravelTrust 第一阶段（Phase ① · 本地开发）唯一收尾治理总标准** — 统管 **收尾 · 验收 · 治理 · 瘦身 · 优化 · 升级**，以及 **进入 Phase ② 测试网** 的 **唯一依据**。  
> **不再**定义为「单纯审计清单」或「宽扫 checklist」；文中 **D01–D76 + DX-01** 与各 **DOMAIN-*（PF · DOA · LFC · PGX · AG · MA · **FZ · QA2 收口层**）** = **收尾检查面**；**U12 / U23** = **阶段升级总闸**；**MASTER GATE** = **Phase ① 收尾机读汇总**（**非** ② staging 全矩阵 GO · **非** ③ Production GO）。

| 维度 | 本文职责 |
|------|----------|
| **收尾（Closure）** | 域 FREEZE / ACTIVE · 绿集 · 烟测 · evidence 归档 |
| **验收（Acceptance）** | D/PF/DOA/LFC 维内 GO · U12 行逐项 ✅ |
| **治理（Governance）** | 七词裁决 · 96-18 台账 · Owner 四闸对拍 |
| **瘦身（Slimming）** | PF/LFC Top20 MERGE/RETIRE · Simplification Roadmap |
| **优化（Optimization）** | REFACTOR/UPDATE · 架构/UX/文档健康分 |
| **升级（Upgrade）** | **U12 全过** → 合法开工 **Phase ②**（仍须 [PHASE2-START](./PHASE2-START-CHECKLIST.md) G 闸） |

**历史文件名（路径不变）：** `TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md` — grep / CI / evidence 互指 **不迁移**；**统称：** **第一阶段收尾治理总标准** · **Phase①-CG-Standard**。

**与 [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) 关系：** ① **Freeze + 收尾治理** 以 **本文 + `run-full-system-audit-master-gate.sh`** 为宽表；② **Prepared/Not Started** 不变 — **任何 ② 实施/宣称** 须 **U12 全表 + G-1/G-2**。

**末行 grep（文档标识）：** `TT_PHASE1_CLOSURE_GOVERNANCE: ACTIVE`
### §0.2 · 收敛优化阶段 · 一级域冻结政策 {#tt-cg-convergence-phase}

> **v1.12.0 起：** **停止新增一级治理域**（不再扩展 D77+ · 新 DOMAIN-* 业务包）。  
> **允许：** **FZ · QA2** 收口层 · 现有域内 **MERGE/RETIRE/REFACTOR** · Backlog 登记 · Readiness 提升。

| 政策 | 说明 |
|------|------|
| **一级域冻结** | D01–D76 · DX-01 · PF · DOA · R/K/E/CA/UXA · CX/BA/OPS/TRUST/CS/ADMIN · AG · MA — **结构锁定** |
| **收口层** | **FZ**（冻结治理）· **QA2**（审计质量）— **非**新业务维 |
| **目标** | 压缩重复 · 合并根因 · 统一输出 · 提高 Readiness · **Phase① 冻结建议** |


### §0.3 · PHASE1_EXECUTIVE_BOARD · Owner 唯一管理视图 {#tt-cg-executive-board}

> **v1.13.0** — **不新增治理域 · 不扩展检查范围**；仅 **汇总 · 压缩 · 加速决策**。

| 视图 | 说明 |
|------|------|
| **Executive Freeze Dashboard** | 单页：Readiness · Matrix · P0/P1 · Root Causes · Blockers · Sprint A/B/C · GO/HOLD/NO_GO |
| **数据源** | FZ · QA2 · PF · DOA · CA · UXA · AG · CX · MA · 同级域 evidence |
| **目标** | 提高 **问题关闭率 · 收敛速度 · 决策效率 · 治理执行质量** |

---


### §0.4 · 执行收敛阶段 · EX 接入 PEB {#tt-cg-execution-convergence}

> **v1.14.0** — **停止新增一级治理域**；**EXECUTION_AUDIT (EX)** = **PEB 子模块**（**非** DOMAIN-EX）。

| 阶段 | 焦点 |
|------|------|
| v1.12 | FZ + QA2 收口层 |
| v1.13 | PEB Owner 驾驶舱 |
| **v1.14** | **EX 执行收敛** — 关闭率 · 根因压缩 · Readiness 速度 · Phase① 可执行收尾计划 |

---

### §0.5 · 最终收敛执行 · v1.14.0 结构冻结（FINAL · ACTIVE） {#tt-cg-final-convergence-freeze}

> **自 2026-06-13 起进入 Phase① 最终收敛执行阶段** — **立即冻结** 本文 **v1.14.0** 的 **结构 · 章节 · 治理域 · 检查维度**；**禁止** 新增 DOMAIN · D 维 · PF/DOA/LFC/PGX/AG/MA/FZ/QA2/PEB/EX 扩展项；**仅** 执行现有审计结果与 **Sprint-A/B/C Backlog**。

| 冻结项 | 说明 |
|--------|------|
| **标准版本** | **锁定 v1.14.0** — **禁止** v1.15+ 结构扩展 |
| **合并闸** | 任何代码改动后 **`run-phase1-convergence-post-change-gate.sh`** — FULL MASTER + 基线对比 |
| **逐页法证** | **`run-phase1-site-page-forensic.sh`** — KEEP/MERGE/RETIRE/REFACTOR（**非**新 DOMAIN） |
| **签字闸** | Readiness **≥90** FREEZE_CANDIDATE · **≥95** PHASE1_EXIT_READY |

**SSOT:** [TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md](./TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md) · **grep:** `TT_PHASE1_FINAL_CONVERGENCE: ACTIVE` · `TT_PHASE1_STANDARD_STRUCTURE: FROZEN_v1.14.0`

---

### §0.1 · Layer 分层架构（读序 · 执行序） {#tt-cg-layer-architecture}

> **DOMAIN-MA 真源** — **不新增业务检查维**；优化 **阅读 / 执行 / AI 推理 / 升级决策** 效率。

| Layer | 名称 | 收纳范围 | 主要章节 |
|-------|------|----------|----------|
| **L1** | **基础系统层** | D01–D25 · DX · DOA · CA · 契约/DB/链 | §2 · §10–§12 · §14 · §18 |
| **L2** | **产品体验层** | PF · UXA · CX · D13 · L5 UI | §13 · §19 · §21 |
| **L3** | **业务运营层** | BA · OPS · TRUST · CS · 旅程 | §4 · §22–§24 · §26 |
| **L4** | **平台治理层** | PGX · AG · Admin · RBAC | §25 · §27–§29 |
| **L5** | **生命周期治理层** | R · K · E · LFC | §15–§20 |
| **L6** | **升级总闸层** | U12 · U23 · MASTER · MA | §3.1 · §31 · MASTER gate |
| **L7** | **收口收敛层** | FZ · QA2 · PEB · **EX** | §32–§35.2 |

**风险权重（写死）：** **P0=4 · P1=2 · P2=1 · P3=0.5** — 域内 P0 **必须** 映射 U12 行或 MASTER 子闸。

**统一模型：** Findings → `unified-finding-model.v1.json` · 裁决 → 七词 · 执行 → **NOW / NEXT / LATER**

---

## 读前摘要

| 你要做什么 | 打开 |
|------------|------|
| **Phase ① 收尾 / 进 ② 前总验收** | [§0 定位](#tt-phase1-closure-governance-standard) → [§3.1 U12](#tt-full-audit-phase-upgrade-gates) → `run-full-system-audit-master-gate.sh` |
| **日常 ① 开发受影响维** | [§3 阶段总闸](#tt-full-audit-phase-gates) → [§5 一键命令](#tt-full-audit-one-shot) → 各域 **①** 列 |
| **准备开 ② 测试网** | [PHASE2-START-CHECKLIST · G-0～G-4](./PHASE2-START-CHECKLIST.md) + 本文 **②** 列 |
| **准备 ③ 生产 GO** | [go-live-checklist](../go-live-checklist.md) + [PHASE3-PRODUCTION-PREPARATION](./PHASE3-PRODUCTION-PREPARATION.md) + 本文 **③** 列 |
| **业务主链（注册→下单→托管）** | [§4 业务旅程审计](#tt-full-audit-journeys) · [TT-9625 金路径](./TT-9625-golden-path-system-spine.md) |
| **UI / L5 / 排版 / 风格** | [D13 UI 与 L5](#d13-ui-l5-design-freeze) · [86 双系统风](../spec/86-UI-双系统未来风-风格与动效技术规格.md) · [92 F/X/G](../spec/92-P0-全站UI分区控制表-金融体验灰区与动效裁决.md) |
| **链上 / Indexer / ABI** | [D15 链与 Web3](#d15-chain-web3-indexer) · [14 ABI](../spec/14-合约ABI与前端对齐.md) |
| **数据库 / 迁移** | [D14 数据与持久化](#d14-data-persistence-migrations) |
| **Admin / RBAC / 审计边界** | [D16 管理台](#d16-admin-rbac-audit-boundary) |
| **93 域矩阵细项** | [93 全站功能验证矩阵](../spec/93-全站功能验证矩阵-域别回归清单.md)（本文 **索引 + 横切**，**不**逐条复制 600+ 用例） |
| **深度专题报告（已有机读）** | [§6 深度审计报告索引](#tt-full-audit-deep-reports) |
| **企业级 D26–D45（边界/资金/容灾/真用户旅程）** | [§10 企业级补充维度](#tt-full-audit-enterprise-d26-d45) |
| **上线前极限边界 D46–D60** | [§11](#tt-full-audit-extreme-d46-d60) |
| **发布治理与运维 D61–D76 + DX-01** | [§12](#tt-full-audit-release-governance-d61-d76) |
| **DOMAIN-X 产品法证 PF-01～PF-20** | [§13 DOMAIN-X](#domain-x-product-forensic) · `run-product-forensic-audit-gate.sh` |
| **DOMAIN-Z 文档运维对齐 DOA-01～DOA-20** | [§14 DOMAIN-Z](#domain-z-doa) · `run-doa-audit-gate.sh` |
| **DOMAIN-R/K/E/CA/UXA 生命周期法证** | [§15–§20](#domain-r-requirements) · `run-lifecycle-forensic-audit-gate.sh` |
| **DOMAIN-CX…CS 平台治理（PGX）** | [§21–§27](#domain-cx-customer) · `run-platform-governance-audit-gate.sh` |
| **DOMAIN-AG 管理员与平台治理** | [§28–§29](#domain-ag-administration) · `run-admin-governance-audit-gate.sh` |
| **DOMAIN-MA 治理标准自审** | [§30–§31](#domain-ma-meta) · [Layer 分层](#tt-cg-layer-architecture) · `run-meta-audit-gate.sh` |
| **DOMAIN-FZ 收尾冻结** | [§32–§34](#domain-fz-freeze) · Closure Readiness · `run-freeze-governance-gate.sh` |
| **DOMAIN-QA2 审计质量** | [§33](#domain-qa2-quality) · Root Cause Compression · `run-audit-quality-gate.sh` |
| **PHASE1_EXECUTIVE_BOARD** | [§35](#phase1-executive-board) · **Owner 唯一视图** · `run-phase1-executive-board-gate.sh` |
| **EXECUTION_AUDIT (EX)** | [§35.2](#execution-audit-ex) · **PEB 子模块** · `run-execution-audit-gate.sh` |
| **Phase ①→② / ②→③ 升级总闸** | [§3.1](#tt-full-audit-phase-upgrade-gates) · PF · DOA · LFC · PGX · [§3.1.8 AG](#tt-full-audit-admin-governance-gates) · [§3.1.9 MA](#tt-full-audit-meta-gates) · [§3.1.10 FZ](#tt-full-audit-freeze-gates) · [§3.1.11 QA2](#tt-full-audit-qa2-gates) · [§3.1.12 PEB](#tt-full-audit-executive-board-gates) |

**与现有 SSOT 关系：**

```
本文（Phase ① 收尾治理总标准 · 三阶升级索引）
  ├─ ① 收尾面：D01–D76 + DX-01 + PF + DOA + R/K/E/CA/UXA + U12 + MASTER
  ├─ 业务/契约真源：spec/04 · 93 · 13-1 · 14 · 代码 + scripts/gates
  ├─ ① 域 ACTIVE：ENTERPRISE-SITE-10 · GO_local_* · 各 FREEZE.md
  ├─ ② 升级闸：U12 全过 + PHASE2-START G-1/G-2（PHASE2-REPOSITORY-STATUS）
  └─ ③ 闸：U23 + go-live · R-002 · PRODUCTION-GO-DECISION-PACKAGE
```

---

## §1 · 如何使用本文（收尾治理节奏） {#tt-full-audit-how-to}

### 1.1 收尾治理节奏（建议）

| 场景 | 范围 | 最低通过线 |
|------|------|------------|
| **日常开发（①）** | 动到的维度 + [§5](#tt-full-audit-one-shot) 受影响脚本 | 相关 **vitest/smoke exit 0** |
| **单域收尾（① ACTIVE）** | 单域 FREEZE README + 绿集 + 烟测 | 域 SSOT 声明 **ACTIVE** |
| **Phase ① 总收尾（进 ② 前）** | **U12 全表** + MASTER GATE + PF/DOA/LFC | `TT_FULL_SYSTEM_AUDIT_MASTER: READY` · `TT_PHASE1_CLOSURE_GOVERNANCE: MASTER_READY` |
| **Phase ② / ③ 宽扫** | §2 **②/③ 列** P0 + 93 staging/prod | `report.json` + [R-002](../spec/R-002-回归执行闭环与发布准入.md) |
| **Production GO（③）** | **U23 全表** + go-live **§0～§11** | **Production GO** 签字包（**非** ①② 宣称） |

### 1.2 每条检查项怎么填

| 符号 | 含义 |
|------|------|
| ☐ | 未验 |
| ✅ | 当前阶段 **PASS**（须附证据路径或命令 exit 0） |
| ❌ | **FAIL** — 须开 issue / 96-18 台账 |
| ⏭ | **N/A** / **BLOCKED** — 写原因与环境 |
| **① / ② / ③** | 该检查项 **首次必须满足的工程阶段** |

### 1.3 最小证据（与 93 §0.5 同源）

每条 **✅** 至少保留其一：

1. 本地命令 **exit 0** + 末行 grep（如 `TT_GO_LOCAL_PHASE1: OK`）
2. `evidence/GO_YYYYMMDD/<域>/` 脱敏 HTTP + 可选 DB 查询
3. Playwright / vitest 报告路径（**注明** `environment: local|staging|prod`）

---

## §2 · 维度总表（D01–D76 + DX-01 × 三阶） {#tt-full-audit-dimension-map}

**P0 维（发版 NO-GO 驱动）：** D01、D04、D05、D14、D15、D16、D20、D21、**D26–D28、D32、D35、D36、D41、D42**、**D46–D48、D52、D55–D57、D60**、**D56**、**D61–D63、D66–D68、DX-01、D73**  
**P1 维（CONDITIONAL / 体验债）：** D13、D17、D18、D22～D25、**D29–D31、D33–D34、D37、D40、D43–D45**、**D49–D51、D53–D54、D59**、**D65、D71–D72、D74–D75**  
**P0（③ 专属硬闸）：** **D38、D39** · **D58** · **D64、D69、D70、D76** · **D66**（生产 kill switch 未验 **NO-GO**）

| ID | 维度 | ① 本地 | ② 测试网 | ③ 生产 | 专题 SSOT |
|----|------|--------|----------|--------|-----------|
| **D01** | 阶段治理与宣称边界 | [§D01](#d01-phase-governance) | G-1/G-2 | go-live §0 | [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) |
| **D02** | 文档 / spec / handbook 卫生 | 04/93/07 对拍 | staging 环境表 | 08-4 签字 | [15 多维检查](../spec/15-多维度文档与技术检查报告.md) |
| **D03** | 注册 / 登录 / 会话 / 登出 | AUTH L5 绿集 | Cookie/Bearer 真值 | 生产 PSP 无关 | [AUTH-LOGIN-UI-FREEZE](../frontend/evidence/GO_local_auth_l5/AUTH-LOGIN-UI-FREEZE.md) |
| **D04** | HTTP 契约 / BFF / 04 路由闸 | `run-check-04-routes` | C11 类 staging | 契约冻结 | [04 §3.4](../spec/04-后端与API.md) |
| **D05** | 多重身份 / Hub / 发布中心 | identities + publish hub | context staging | 真链门闸 | [ME-IDENTITIES-UI-FREEZE](../frontend/evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md) |
| **D06** | Onboarding / B 轨准入费 | fee_schedule ① CLOSED | USDC/Stripe ② | 主网收款 | [onboarding-fee-schedule §8](../spec/artifacts/onboarding-fee-schedule.v1.md) |
| **D07** | 五主路由 / 营销 / Landing | FIVE-MAIN 冻结 | staging 目视 | 生产 CDN | [FIVE-MAIN-ROUTES-PHASE1-FREEZE](../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) |
| **D08** | 市场 / Discover / 收藏 | LANDING-MARKET SSOT | 跨设备收藏 ② | SLA ③ | [LANDING-MARKET-PAGES-CODE-SSOT](../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) |
| **D09** | 订单 / 支付 / 消息走廊 | orders L5 + A+B | staging 订单 | 真 PSP | [GO_local_orders_l5](../frontend/evidence/GO_local_orders_l5/README.md) |
| **D10** | Escrow / 托管 / 争议 | 草稿 UI 冻结 | 测试网链 | 主网资金 | [ESCROW-ORDER-PAGE-PHASE1-CLOSURE](../frontend/evidence/GO_local_web3_itinerary_l5/ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md) |
| **D11** | 向导工作台 / 档期 | guide workbench L5 | Sepolia 可选 | 主网 | [GUIDE-WORKBENCH-L5-FREEZE](../frontend/evidence/GO_local_guide_workbench_l5/GUIDE-WORKBENCH-L5-FREEZE.md) |
| **D12** | 商家入驻 / 工作台 | provider register+workbench | ② listing | ③ | [PROVIDER-WORKBENCH-L5-FREEZE](../frontend/evidence/GO_local_provider_workbench_l5/PROVIDER-WORKBENCH-L5-FREEZE.md) |
| **D13** | UI / L5 / 排版 / 风格 / a11y | 各域 FREEZE + 92 | C9 视觉 | 品牌 GO | [86](../spec/86-UI-双系统未来风-风格与动效技术规格.md) · [92](../spec/92-P0-全站UI分区控制表-金融体验灰区与动效裁决.md) |
| **D14** | 数据库 / 迁移 / PG 一致性 | sqlx migrate + IT | staging PG | 备份/恢复 | `crates/api/migrations/` |
| **D15** | 链 / Web3 / Indexer / ABI | Anvil/chain_off | Sepolia | Mainnet G0～G6 | [14](../spec/14-合约ABI与前端对齐.md) · [TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC](./TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC.md) |
| **D16** | Admin / RBAC / 能力 / 审计 | admin L5 + 变异审计 | staging admin | 生产 RBAC | [ADMIN-SECURITY-CLOSURE-REPORT](./ADMIN-SECURITY-CLOSURE-REPORT.md) |
| **D17** | 治理 / 主理人 / TTG 质押 | governance 矩阵闸 | Sepolia broadcast | 主网 | [STEWARD-WORKBENCH-L5-FREEZE](../frontend/evidence/GO_local_steward_workbench_l5/STEWARD-WORKBENCH-L5-FREEZE.md) |
| **D18** | 社区 UGC / 媒体 / 审核 | community ① 绿集 | C1～C12 | P3-COM | [COMMUNITY-L5-SYSTEM-AUDIT](../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-L5-SYSTEM-AUDIT.md) |
| **D19** | 收购 PD-009 | acquisition ① CLOSED | ② trust | ③ | [acquisition-publish-trust-rules §8.1](../spec/artifacts/acquisition-publish-trust-rules.v1.md) |
| **D20** | 安全 / 密钥 / 限流 / 会话 | rate limit 契约 | staging 密钥隔离 | 96-03 轮换 | [96-03](../spec/96-03-安全密钥与供应链.md) |
| **D21** | 回归矩阵 93 / R-002 / report.json | ISS-007 窄切片 | R-003 staging | release_gate GO | [93](../spec/93-全站功能验证矩阵-域别回归清单.md) · [R-002](../spec/R-002-回归执行闭环与发布准入.md) |
| **D22** | 可观测 / 日志 / x-request-id | dev 日志 | staging APM | on-call | [ops/RUNBOOK](../../ops/RUNBOOK.md) |
| **D23** | i18n / 文案 / 账户导航命名 | locales 键 + P3 | staging 语言 | 法务 copy | [ACCOUNT-NAV-NAMING-P3](../frontend/evidence/GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md) |
| **D24** | 性能 / E2E 稳定性 | e2e-stability-probe | staging 负载 | SLO ③ | `scripts/gates/e2e-stability-probe.sh` |
| **D25** | 跨域集成 / Trust Gate | CDIA + TGCA | staging 对拍 | 生产 NO-GO 闸 | [CROSS-DOMAIN-INTEGRATION-AUDIT-REPORT](./CROSS-DOMAIN-INTEGRATION-AUDIT-REPORT.md) |
| **D26** | Boundary Consistency · 权限边界矩阵 | 13-1 表2 · route-matrix | staging RBAC | 生产矩阵冻结 | [13-1 §二 表2](../spec/13-1-UI产品级SSOT与页面规范.md) · [87](../spec/87-TravelTrust-角色体系技术文档-融合架构版.md) |
| **D27** | Role Escalation · 权限提升攻击 | rbac-security 闸 | staging 负例 | 渗透/PRA | `l5-enterprise-rbac-security-audit.sh` |
| **D28** | Cross-Identity Isolation · 多身份隔离 | multi-demo · slot_rbac | staging 交叉读 | 主网隔离 | [LOCAL-MULTI-IDENTITY-CLOSURE](../frontend/evidence/GO_local_identity_workspace/LOCAL-MULTI-IDENTITY-CLOSURE.md) |
| **D29** | Source-of-Truth · 真源一致性 | 代码>文档 | staging 对拍 | 契约冻结 | [04 §3.4](../spec/04-后端与API.md) · AGENTS.md 冲突规则 |
| **D30** | Cache & Refresh · 缓存与刷新 | localStorage/event | 跨 tab/device ② | CDN/SSR ③ | LANDING-MARKET SSOT · `traveltrust:auth-change` |
| **D31** | Soft Delete Lifecycle · 归档/删除 | archive listing | staging PG | 合规保留 ③ | merchant-listings · orders cancelled |
| **D32** | Money Flow · 资金/托管状态机 | OED + mock-pay | 测试网链 | 真 PSP/主网 | [ORDER-ESCROW-DISPUTE-DEEP-AUDIT](./ORDER-ESCROW-DISPUTE-DEEP-AUDIT-REPORT.md) |
| **D33** | Trust & Reputation · 信誉评分 | trust-gate · me.trust | staging ITG | 主网声誉 | [IDENTITY-TRUST-GOVERNANCE-DEEP-AUDIT](./IDENTITY-TRUST-GOVERNANCE-DEEP-AUDIT-REPORT.md) |
| **D34** | Governance Attack Surface · 治理攻击面 | governance 矩阵 | Sepolia | 主网治理 | `l5-bg-governance-audit.sh` · ITG |
| **D35** | Admin Blast Radius · 管理员影响面 | AMWA · approvals | staging 2FA | 生产审批链 | [ADMIN-SECURITY-CLOSURE](./ADMIN-SECURITY-CLOSURE-REPORT.md) |
| **D36** | Audit Log Completeness · 审计日志 | admin audit logs | staging 变异全覆盖 | 不可篡改 ③ | `run-admin-mutating-actions-audit.sh` |
| **D37** | Customer Support Recoverability · 客服追溯 | x-request-id | staging 工单演练 | 生产 on-call | [ops/RUNBOOK](../../ops/RUNBOOK.md) |
| **D38** | Disaster Recovery · 容灾 | 文档+脚本存在 | DR 桌演 | **Fly DR GO** | `check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh` |
| **D39** | Backup & Restore · 备份恢复 | pg_dump 演练 | staging 恢复 | PITR ③ | `run-phase3-db-restore-drill-prod.sh` · B-475 |
| **D40** | Dependency Risk · 第三方依赖 | registry/npm/cargo | staging SBOM | 供应链 ③ | [96-03](../spec/96-03-安全密钥与供应链.md) |
| **D41** | Wallet Boundary · 钱包/私钥 | 无 pk 进 FE | 测试网签名 | HSM/托管 ③ | [35](../spec/35-钱包与DApp集成.md) · wallet-verify |
| **D42** | Chain Failure Handling · 链上异常 | indexer replay | RPC 降级 | 主网熔断 | TT-CHAIN-ARCHITECTURE · chain-sync-status |
| **D43** | Cross-Chain Consistency · 跨链一致 | meta.chain_id | 单链 staging | 多链声明 ③ | `GET /meta` · `.env` 对拍 |
| **D44** | Economic Attack Model · 经济/女巫 | rate limit · bond | staging 扫描 | 主网风控 | acquisition bond · growth_fraud_scan |
| **D45** | Real User Journey · 真用户 E2E | RUJR · site-10 | staging CUJ | 生产 CUJ GO | `l5-pe-user-journey-audit.sh` · PES RUJR e2e |
| **D46** | Route Ownership · 路由归属/死链/废弃入口 | 04+93+FE 路由闸 | staging C11 | 生产路由冻结 | `run-check-04-routes.sh` · `check-spec93-routes-vs-app.py` |
| **D47** | Error Boundary · 错误边界/空态/降级 | `error.tsx` 关键域 | staging 404/500 | 生产 on-call | 段级 `loading/error` · `ConsumerSurfaceStatePanel` |
| **D48** | Form Validation · 表单/脏态/重复提交 | auth/provider 绿集 | staging 负例 | 生产 PSP 表单 | `providerRegisterValidation` · `authRegisterL5` |
| **D49** | Notification · 通知/邮件/Toast 一致 | account-nav smoke | staging 邮件 | 生产 ESP | `smoke-account-nav-full-local.sh` · locales |
| **D50** | Mobile & Responsive · 移动/平板/窄屏 | l5-pe-mobile | staging 目视 | 生产 RUM | `l5-pe-mobile-responsive-audit.sh` |
| **D51** | Browser Compatibility · 浏览器兼容 | Playwright 多引擎 | staging 四浏览器 | 生产 analytics | `playwright.config.ts` · AFDA browser leg |
| **D52** | Timezone & Date · 时区/跨日/链上时间 | meta UTC · 行程日 | staging TZ | 生产 TZ 政策 | `GET /meta` · escrow/itinerary 字段 |
| **D53** | Media Upload & CDN · 媒体生命周期 | C2 上传负例 | staging C2/C4/C5 | CDN/违规 ③ | `smoke-community-c2-staging-upload.sh` |
| **D54** | Search/Filter/Pagination · 搜索筛选分页 | market debounce | staging discover | 生产 SLA | LANDING-MARKET SSOT · `useMarketPage` |
| **D55** | Idempotency · 幂等/重复点击/支付 | CDIA · Idempotency-Key | staging 重放 | 生产 PSP 幂等 | `cross-domain-integration-audit.py` |
| **D56** | Rate Limit & Abuse · 限流/刷接口/爬虫 | meta rate_limits | staging 429 | 生产 WAF | D20 + `growth_fraud_scan` |
| **D57** | Privacy · 隐私/最小化/导出/删号 | settings/privacy/data | staging 导出 | GDPR/删号 ③ | `/me/settings/privacy` · `/me/settings/data` |
| **D58** | Legal & Terms · 条款/退款/地区 | `/terms` `/privacy` | staging 法务稿 | Owner 签字 ③ | [31 §社区规范](../spec/31-TT社区-问题与优化清单-功能与排版.md) |
| **D59** | Analytics · 埋点/漏斗/审计事件 | page-brief v6 | ROV-T3 funnel | 生产 BI | `post-start-api-abi-smoke` · `/admin/growth/analytics` |
| **D60** | Final Human Acceptance · 真人验收矩阵 | 五角色手验+site-10 | P2HA · phase28 HAT | CUJ Owner 签 | `run-five-role-full-chain-audit.sh` · FRCA 矩阵 |
| **D61** | Release Ownership · 模块责任人/签字矩阵 | SOLO-MAINTAINER · sealed index | staging Owner 表 | 生产 Release Authority | [SOLO-MAINTAINER-SIGNATURE-INDEX](../frontend/evidence/GO_local_phase1/SOLO-MAINTAINER-SIGNATURE-INDEX.md) |
| **D62** | Change Management · 变更影响/回归覆盖 | CONTRIBUTING · R-002 路径 | staging diff 回归 | 生产 change board | [R-002](../spec/R-002-回归执行闭环与发布准入.md) · TT-9628 |
| **D63** | Rollback Readiness · 版本/DB/配置回滚 | rollback 脚本存在 | staging fly rollback drill | prod rollback GO | `run-phase3-fly-release-rollback-drill*.sh` |
| **D64** | Incident Response · P0/P1/P2 事故响应 | ops/RUNBOOK §1 骨架 | staging incident drill | on-call 填实 ③ | [ops/RUNBOOK](../../ops/RUNBOOK.md) · `/admin/alerts/incidents` |
| **D65** | Monitoring Coverage · 业务/infra 监控覆盖 | observability 路由 | staging APM/alerts | SLO ③ | `/admin/observability` · ROV 证据 |
| **D66** | Production Kill Switch · 熔断/降级 | env 开关文档 | staging 演练 | 生产 Pause 链 ③ | `ONBOARDING_PAYMENT_INTENTS_DISABLED` · Pause allowlist |
| **D67** | Feature Flag · 功能开关/环境隔离 | `GET /admin/flags` | staging publish 演练 | prod flag 审计 | `feature_flag_gate` · PG `feature_flags` |
| **D68** | Release Evidence · 发布证据链/验收包 | evidence/README | staging GO 包 | manifest+hash ③ | [08-4 §7](../spec/08-4-对外口径包.md) · go-live 证据 |
| **D69** | Operational Runbook · DB/RPC/Redis/Indexer/支付 | ops/RUNBOOK §2.55+ | staging 桌演 | 填实四列 ③ | ops/RUNBOOK · COMMUNITY-STAGING-OPS |
| **D70** | Executive Go-No-Go · 最终发布决策/Top Blockers | PRODUCTION-GO 包存在 | staging NO_GO 诚实 | Owner 双签 ③ | [PRODUCTION-GO-DECISION-PACKAGE](./PRODUCTION-GO-DECISION-PACKAGE.md) |
| **DX-01** | Developer Experience · 30 分钟启动/Seed/CI | README · start-api-with-seed | staging parity | prod deploy doc ③ | [TT-9618](./TT-9618-onboarding-local-testnet.md) · `dev-preflight.sh` |
| **D71** | Architecture Drift · SSOT 与实现偏移 | run-check-04-routes · AGENTS | staging 对拍 | 契约冻结 ③ | [TT-9622](./TT-9622-bounded-contexts-layering-and-integration-map.md) |
| **D72** | Technical Debt · 技术债登记/优先级 | 96-18 台账 | staging 复审 | 发版前清零 P0 | [96-18](../spec/96-18-未完成清单与多维检查.md) · 95 §10.3 |
| **D73** | Data Retention & Archival · 保留/归档策略 | soft-delete 文档 | staging 保留期 | 合规保留 ③ | D31 · ops/RUNBOOK §9 |
| **D74** | Vendor Lock-in · 第三方替换能力 | 96-03 · adapter 层 | staging 切换演练 | 多 PSP/RPC ③ | [96-03](../spec/96-03-安全密钥与供应链.md) |
| **D75** | Cost & Capacity · 资源成本/容量规划 | Fly/local 诚实标签 | staging 负载 | 容量签字 ③ | [PRODUCTION-INFRASTRUCTURE-AUDIT](./PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md) |
| **D76** | Business Continuity · 运营连续性 | D38 文档+脚本 | staging DR+rollback | BC plan ③ | D38/D39 · ROV · PI3 |

---

## §3 · 三阶段总闸 {#tt-full-audit-phase-gates}

| 阶段 | 名称 | 可合法宣称 | 总闸命令 / 证据 | 禁止冒充 |
|------|------|------------|-----------------|----------|
| **①** | 本地 · **收尾治理** | 域 **ACTIVE** · U12 行 ✅ · **MASTER READY** | `run-go-local-phase1-acceptance.sh` · **`run-full-system-audit-master-gate.sh`** → `TT_PHASE1_CLOSURE_GOVERNANCE: MASTER_READY` | ② staging GO · ③ Production GO · 仅 checklist 勾选 |
| **②** | 测试网 | 单槽 PASS（如 C7）· **非** 宽轨 GO | G-0～G-4 + 域 staging smoke；`environment.name=staging` 的 `report.json` | ① 本地 · ③ 主网 · ISS-007 **PARTIAL_GO** = 全矩阵 GO |
| **③** | 公网/生产 | **Production GO**（签字包） | [go-live-checklist](../go-live-checklist.md) · R-002 **`--require-go`** · Mainnet G0～G6 | ①② 任何 smoke |

**仓库当前态（查表时）：** [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) — ① Freeze · ② Prepared/Not Started（实施须 G-1/G-2）

---

## §3.1 · 阶段升级总闸（①→② · ②→③） {#tt-full-audit-phase-upgrade-gates}

> **本文 D26–D76 + DX-01 与 D01–D25 并联**；升级判定 **不替代** [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) G 闸与 [go-live-checklist](../go-live-checklist.md)，而是 **Phase ① 收尾治理总标准** 的 **全维硬条件**（**U12 = 进 ② 唯一宽表依据**）。  
> **写死：** **Phase ② 任何实施/宣称** 须 **D01–D76 + DX-01 全部 ① 列 P0 维 PASS**；**P1 维** 须 **GO** 或 **CONDITIONAL + 96-18 台账**；**禁止** 在 ① 未闭时开工 ②。  
> **Phase ③ Production GO** 须 **U23 全表 + D70 Executive 签字包**；**禁止** 用 ①② 机读绿冒充 ③。

### 3.1.1 Phase ① → Phase ②（测试网实施合法化）

| # | 升级条件 | 验收标准 | 机读 / 证据 | GO | NO-GO |
|---|----------|----------|-------------|-----|-------|
| **U12-1** | **D01** G-0 已闭 | `TT_GO_LOCAL_PHASE1: OK` | `run-go-local-phase1-acceptance.sh` | ✅ | 任一缺失 |
| **U12-2** | **D01** G-1/G-2 **Owner 书面确认** | staging 密钥/DB 隔离决策单 | PHASE2-START §0 行 | ✅ | 密钥混用 |
| **U12-3** | **D01–D76 + DX-01** 全部 **① 列** **P0 维** **PASS** | 无 open **P0** issue | §10.0 + §11.0 + §12.0 + 各维记录 | ✅ | 任一 P0 **FAIL** |
| **U12-4** | **D32/D42** 订单/链 ① 烟测 | OED probe **无 P0** | `run-order-escrow-dispute-deep-audit.sh` | ✅ | OED P0 |
| **U12-5** | **D27/D35/D36** Admin 安全 ① | AMWA + rbac-security exit 0 | `run-admin-security-closure-audit.sh` | ✅ | 变异无审计 |
| **U12-6** | **D28** multi-demo 隔离 | 四轨无交叉越权 | `LOCAL-MULTI-IDENTITY-CLOSURE` 手验 + ITG | ✅ | 交叉读订单 |
| **U12-7** | **D45/D60** 真用户 + 五角色 ① | RUJR + site-10 或 FRCA 手验矩阵 | `l5-pe-user-journey-audit.sh` · `run-enterprise-site-10-local.sh` | ✅ | 无 CUJ 证据 |
| **U12-8** | **D46** 路由归属/死链 | 04+FE 路由闸 exit 0；93 WARN 已登记 | `run-check-04-routes.sh` · `check-spec93-routes-vs-app.py` | ✅ | 404 主链入口 |
| **U12-9** | **D47/D48** 错误边界 + 表单 | 关键域 `error.tsx`；注册/入驻绿集 | 段级 error 清单 · `providerRegisterValidation` | ✅ | 白屏/双提交 |
| **U12-10** | **D50/D52/D55** 移动+时区+幂等 | mobile audit · meta UTC · CDIA 幂等 | `l5-pe-mobile-responsive-audit.sh` · CDIA | ✅ | 重复下单 |
| **U12-11** | **D56/D57** 限流+隐私路由 | rate_limits 诚实 · settings privacy/data 可达 | meta 探针 · `smoke-account-nav-full-local.sh` | ✅ | 无限刷写 |
| **U12-12** | **U12 总闸机读汇总** | §11–§12 + 全 DOMAIN + **MA·FZ·QA2·PEB（末闸）** **exit 0** | `run-full-system-audit-master-gate.sh` | ✅ | `MASTER: NO-GO` |
| **U12-13** | **D61–D63** 发布治理 ① | Owner 矩阵 · rollback 脚本 · R-002 路径 | SOLO-MAINTAINER · `run-phase3-fly-release-rollback-drill.sh` | ✅ | 无签字/无回滚 |
| **U12-14** | **DX-01** 新开发者 30 分钟启动 | README + seed + 测试账号 | `start-api-with-seed` 路径 · TT-9618 | ✅ | 无法本地起栈 |
| **U12-15** | **D69/D64** Runbook 骨架 ① | ops/RUNBOOK §1 四列存在 | [ops/RUNBOOK](../../ops/RUNBOOK.md) grep | ✅ | 触发表空 |
| **U12-16** | **D62/D68** 变更+证据链 ① | CONTRIBUTING pre-push · evidence 目录规范 | `dev-preflight.sh` · `evidence/README` | ✅ | 无证据路径 |
| **U12-17** | **DOMAIN-Z DOA** 收敛对齐 | U12-DOA-1～4 **全过** | `run-doa-audit-gate.sh` + artifacts | ✅ | drift P0 |
| **U12-18** | **Lifecycle Forensic** 收敛 | U12-LFC-1～6 **全过** | `run-lifecycle-forensic-audit-gate.sh` | ✅ | LFC P0 |
| **U12-19** | **Platform Governance** 最终补充 | U12-PGX-1～5 **全过** | `run-platform-governance-audit-gate.sh` | ✅ | PGX P0 |
| **U12-21** | **DOMAIN-AG** 后台治理深审 | U12-AG-1～5 **全过** | `run-admin-governance-audit-gate.sh` | ✅ | AG P0 |
| **U12-22** | **DOMAIN-MA** 标准自审 | U12-MA-1～4 **全过** | `run-meta-audit-gate.sh` | ✅ | MA P0 |
| **U12-23** | **DOMAIN-FZ** 收尾冻结 | U12-FZ-1～5 **全过** | `run-freeze-governance-gate.sh` | ✅ | FZ P0 |
| **U12-24** | **DOMAIN-QA2** 审计质量 | U12-QA2-1～5 **全过** | `run-audit-quality-gate.sh` | ✅ | QA2 P0 |
| **U12-25** | **PHASE1_EXECUTIVE_BOARD** 执行驾驶舱 | U12-PEB-1～5 **全过** | `run-phase1-executive-board-gate.sh` | ✅ | PEB P0 |

**升级结论句（合法 · Phase ① 收尾完成）：** 「**Phase ① 本地收尾治理 CLOSED**（U12 + MASTER + 全 DOMAIN + **MA·FZ·QA2·PEB 收口**）；**Phase ② 实施可开工**（Prepared → In Progress），范围 **②**；**前提：U12 全表 + G-1/G-2**；**非** staging 全矩阵 GO / **非** Production GO。」

**末行 grep（Phase ① 收尾）：** `TT_PHASE1_CLOSURE_GOVERNANCE: MASTER_READY`

**末行 grep（建议留痕）：** `TT_FULL_SYSTEM_AUDIT_PHASE12: READY`

### 3.1.2 Phase ② → Phase ③（公网/生产 GO 合法化）

| # | 升级条件 | 验收标准 | 机读 / 证据 | GO | NO-GO |
|---|----------|----------|-------------|-----|-------|
| **U23-1** | **D01** ② G 闸全清 + 域 staging smoke | G-0～G-4 + R-003 路径 | PHASE2-START · R-003 | ✅ | G-1/G-2 OPEN |
| **U23-2** | **D21** staging `report.json` | A/B P0 **PASS** · 环境字段正确 | `validate-regression-report.py` | ✅ | NO_GO |
| **U23-3** | **D01–D76 + DX-01** 全部 **② 列** **P0 维** **PASS** | staging 复验记录 | `evidence/GO_phase2_testnet_*/` · P2HA | ✅ | P0 FAIL |
| **U23-4** | **D32** 测试网资金/托管 | 链上/PSP test 四方对拍 | OED staging · onboarding ② | ✅ | 金额漂移 |
| **U23-5** | **D38/D39** 容灾/备份 | DR 桌演 + restore **exit 0** | `run-phase3-db-restore-drill-prod.sh` · PI3-001 | ✅ | 无备份 |
| **U23-6** | **D41** 钱包边界 ③ 设计 | 无私钥落盘 · 签名隔离 | go-live §1 · 35 | ✅ | pk 泄露 |
| **U23-7** | **D36/D37** 审计+客服追溯 | 变异 100% 有 audit · 工单可关联 request-id | AMWA staging · RUNBOOK | ✅ | 缺口 |
| **U23-8** | **D46–D60** staging 复验 | C11 · C2 媒体 · HAT | `smoke-community-c11` · phase28 HAT | ✅ | 真人矩阵 FAIL |
| **U23-9** | **D61–D70 + D76** 发布/运维/决策 ②③ | rollback drill · incident · GO 包 | `run-phase3-fly-release-rollback-drill-prod.sh` · PRODUCTION-GO | ✅ | PI3 open |
| **U23-10** | **D58** 法务条款 ③ | terms/privacy **Owner 签字** | go-live 法务包 | ✅ | 缺 disclaimer |
| **U23-11** | **D70 Executive** Top Blockers 清零 | `PRODUCTION_GO_DECISION: GO` | [PRODUCTION-GO-DECISION-PACKAGE](./PRODUCTION-GO-DECISION-PACKAGE.md) | ✅ | NO_GO 未消 |
| **U23-12** | **go-live** §0～§11 全勾 | Owner 双签 + 证据包完整 | go-live · R-002 **`--require-go`** | ✅ | 缺 § |

**升级结论句（合法）：** 「**Production GO**（③）— 与 **①②** 验收分离留痕。」

**末行 grep（建议留痕）：** `TT_FULL_SYSTEM_AUDIT_PHASE23: GO` 或 `PRODUCTION_GO_DECISION: GO`

### 3.1.3 维度级 GO/NO-GO 通则（D26–D76 + DX-01 适用）

| 判定 | 条件 |
|------|------|
| **维内 GO** | 该维 **当前阶段** 检查项 **全部 ✅**；P0 维 **零 FAIL**；证据路径已填 |
| **维内 CONDITIONAL** | 仅 **P1** FAIL / **BLOCKED** 有书面原因 + 96-18 台账 + 修复期限 |
| **维内 NO-GO** | 任一 **P0** FAIL；或 ③ 维 **无** 规定演练证据 |
| **阶段 NO-GO** | 任一 **P0 维** NO-GO；或 U12/U23 总表任一行未满足 |

### 3.1.4 DOMAIN-X · Product Forensic · 产品法证升级闸 {#tt-full-audit-domain-x-gates}

> **独立审计域** — **不占用 D77+ 编号**；与 **D46/D47/PF 重叠项** 以 **法证结论（KEEP/MERGE/RETIRE/REFACTOR）** 为准，**不**用 D 维 PASS 代替 PF 人工登记。  
> **与 U12-3 关系：** DOMAIN-X **默认 P1**（季度/发版前宽扫）；**PF-04/11/18/20 为域内 P0** — ② 开工 **不强制** 全 PF 闭，但 **③ Production GO 前须 U23-PF 全过**。

**裁决词（写死）：** **保留 KEEP** · **合并 MERGE** · **下线 RETIRE** · **重构 REFACTOR** — 每条 finding **必须** 四选一。

#### Phase ① → ②（建议 · 非 D 维硬闸）

| # | 条件 | 验收 | 机读 / 证据 | GO |
|---|------|------|-------------|-----|
| **U12-PF-1** | **PF-01** 路由法证基线 | 每主路由有 **存在理由+Owner** 列 | `run-product-forensic-audit-gate.sh` + registry | ✅ |
| **U12-PF-2** | **PF-04/11** 重复功能扫描 | Publish/Workbench/Settings 入口表 | `account-nav-page-tracker` · 手验 | ✅ |
| **U12-PF-3** | **PF-20** 权重快照 | weight JSON 归档 | `generate-product-forensic-weight-snapshot.py` | ✅ |

**末行 grep（建议）：** `TT_PRODUCT_FORENSIC_AUDIT: OK`

#### Phase ② → ③（Production GO 前 · 硬闸）

| # | 条件 | 验收 | GO | NO-GO |
|---|------|------|-----|-------|
| **U23-PF-1** | **PF-18** 可删功能清单 | 每条 **RETIRE/MERGE** 有 Owner 签字或 96-18 | ✅ | 只增不减无登记 |
| **U23-PF-2** | **PF-20** 权重 delta | 页面/按钮/入口 vs ① 基线 **不 silent 膨胀** | ✅ | 无 ADR 却 +30% 按钮 |
| **U23-PF-3** | **PF-08/09** Admin 瘦身 | AFDA 无 P0  unreachable · 权限数有上限叙事 | ✅ | 菜单无限增长 |
| **U23-PF-4** | **PF-04** 主链无双轨 | 同一业务 **≤2** 主入口（或 MERGE 计划） | ✅ | 三处「编辑资料」无裁决 |

**末行 grep：** `TT_PRODUCT_FORENSIC_PHASE23: GO`

### 3.1.5 DOMAIN-Z · Documentation & Operational Alignment · 文档运维对齐闸 {#tt-full-audit-domain-z-gates}

> **独立审计域** — 审计 **文档/脚本/DB/API/ABI/Admin/部署** 与 **实际运行** 一致性；裁决 **KEEP / UPDATE / DEPRECATE / REMOVE**。  
> **与 U12-3 关系：** DOA **域内 P0（DOA-03/10/12/15/16）** 须在 **进入收敛阶段 / Phase ② 宣称前** PASS；**P1 维** 须 **GO** 或 **CONDITIONAL + 96-18**。  
> **与 PF 并联：** PF 裁 **产品重量**；DOA 裁 **SSOT/脚本/环境漂移** — 同一对象可 **PF=MERGE** + **DOA=UPDATE**。

#### Phase ① → ②（收敛前 · 硬闸）

| # | 条件 | 验收 | 机读 / 证据 | GO |
|---|------|------|-------------|-----|
| **U12-DOA-1** | **DOA-16** 一键对齐审计 | gate **exit 0** | `run-doa-audit-gate.sh` | ✅ |
| **U12-DOA-2** | **DOA-03/10/12/15** P0 无漂移 | registry validator + 04 + ABI + RBAC smoke 路径 | §14.0 P0 维 | ✅ |
| **U12-DOA-3** | **Documentation Health Score** ≥ 50（①） | `documentation-health-score.v1.json` | `generate-doa-artifacts.py` | ✅ |
| **U12-DOA-4** | 八份 drift/alignment 报告已生成 | ssot/script/api-abi/db/admin/env/operational | `evidence/doa-audit/<stamp>/` | ✅ |

**末行 grep（建议）：** `TT_DOA_AUDIT: OK` · `TT_DOA_ARTIFACTS: OK`

#### Phase ② → ③（Production GO 前 · 硬闸）

| # | 条件 | 验收 | GO | NO-GO |
|---|------|------|-----|-------|
| **U23-DOA-1** | staging **DOA-10/12** 复验 | 04 + ABI gate on staging 证据 | ✅ | API/ABI 漂移 |
| **U23-DOA-2** | **DOA-15** Admin RBAC 矩阵 | smoke-admin-rbac staging + route-matrix | ✅ | 权限矩阵漂移 |
| **U23-DOA-3** | **DOA-17/19/20** 运维就绪 | deploy runbook · 监控 · DR 桌演 | ✅ | ops 文档空 |
| **U23-DOA-4** | Health Score **不 silent 下降** | vs ① 基线 delta 登记 | ✅ | 无 ADR 却 -20 分 |

**末行 grep：** `TT_DOA_PHASE23: GO`

### 3.1.6 全生命周期法证 · Lifecycle Forensic · 收敛总闸 {#tt-full-audit-lifecycle-gates}

> **§15–§19 + §20** — **进入收敛阶段前** 须与 **U12-3（D P0）** · **U12-PF** · **U12-DOA** **并联**全过。  
> **裁决：** **KEEP · MERGE · RETIRE · REFACTOR · UPDATE · DEPRECATE · REMOVE**

#### Phase ① → ②（收敛前 · 硬闸）

| # | 条件 | 验收 | 机读 / 证据 | GO |
|---|------|------|-------------|-----|
| **U12-LFC-1** | **Lifecycle gate** | `run-lifecycle-forensic-audit-gate.sh` **exit 0** | `TT_LIFECYCLE_FORENSIC_AUDIT: OK` | ✅ |
| **U12-LFC-2** | **R-10/20** 需求追踪 | requirement-trace + lineage 已生成 | JSON artifacts | ✅ |
| **U12-LFC-3** | **K-20** Bus Factor | score ≥ **50**（①） | `bus-factor-score.v1.json` | ✅ |
| **U12-LFC-4** | **CA-03/10/20** 架构 P0 | architecture ≥ **50** | `architecture-score.v1.json` | ✅ |
| **U12-LFC-5** | **UXA-04/20** 设计 P0 | design-consistency ≥ **50** | `design-consistency-score.v1.json` | ✅ |
| **U12-LFC-6** | **Executive + Roadmap** | 八词裁决 Top 列表 | EXECUTIVE + SIMPLIFICATION-ROADMAP | ✅ |

**末行 grep：** `TT_LIFECYCLE_FORENSIC_ARTIFACTS: OK`

#### Phase ② → ③（Production GO 前 · 硬闸）

| # | 条件 | 验收 | GO | NO-GO |
|---|------|------|-----|-------|
| **U23-LFC-1** | staging **R/CA** 复验 | 04+ABI+DTO staging 证据 | ✅ | 契约漂移 |
| **U23-LFC-2** | **E-20** 成本预测签字 | cost-projection Owner | ✅ | 无成本模型 |
| **U23-LFC-3** | **K-20** Bus Factor ≥ **60** | handoff runbook | ✅ | 单点无人可接 |
| **U23-LFC-4** | **UXA** L5 不退化 | l5-ux-score delta | ✅ | silent UX 膨胀 |
| **U23-LFC-5** | **Simplification** 执行 | Top20 REMOVE/MERGE 有进展 | ✅ | 只增不减 |

**末行 grep：** `TT_LIFECYCLE_FORENSIC_PHASE23: GO`

### 3.1.7 平台治理 · Platform Governance · PGX 闸 {#tt-full-audit-platform-governance-gates}

> **§21–§27** — CX · BA · OPS · TRUST · ADMIN · CS 切片；与 **DOMAIN-AG §28** 并联（AG = 深审层）。

#### Phase ① → ②

| # | 条件 | 机读 | GO |
|---|------|------|-----|
| **U12-PGX-1** | PGX gate exit 0 | `run-platform-governance-audit-gate.sh` | ✅ |
| **U12-PGX-2** | ADMIN RBAC 报告 | admin-capability-matrix | ✅ |
| **U12-PGX-3** | 冷启动 readiness | cold-start-readiness-report | ✅ |
| **U12-PGX-4** | Trust health | trust-health-report | ✅ |
| **U12-PGX-5** | Executive Platform | EXECUTIVE-PLATFORM-HEALTH | ✅ |

**grep：** `TT_PLATFORM_GOVERNANCE_AUDIT: OK`

#### Phase ② → ③

| # | 条件 | GO | NO-GO |
|---|------|-----|-------|
| **U23-PGX-1** | staging Admin RBAC | ✅ | 漂移 |
| **U23-PGX-2** | 冷启动/liquidity ② | ✅ | 空市场 |
| **U23-PGX-3** | Trust 反作弊 staging | ✅ | 洞 |
| **U23-PGX-4** | Admin Top100 有进展 | ✅ | 只增不减 |

**grep：** `TT_PLATFORM_GOVERNANCE_PHASE23: GO`

### 3.1.8 管理员与平台治理 · DOMAIN-AG · 后台治理深审闸 {#tt-full-audit-admin-governance-gates}

> **§28–§29** — 与 **PF-08/09 · DOA-14/15 · UXA-18 · §25 PGX-ADMIN** 并联。

#### Phase ① → ②

| # | 条件 | 机读 | GO |
|---|------|------|-----|
| **U12-AG-1** | AG gate exit 0 | `run-admin-governance-audit-gate.sh` | ✅ |
| **U12-AG-2** | RBAC + dangerous action | rbac-boundary · dangerous-action | ✅ |
| **U12-AG-3** | Early bird / growth 矩阵 | early-bird-incentive-matrix | ✅ |
| **U12-AG-4** | Admin L5 ≥ 40（①） | admin-l5-design-score | ✅ |
| **U12-AG-5** | Executive Governance | EXECUTIVE-GOVERNANCE-HEALTH | ✅ |

**grep：** `TT_ADMIN_GOVERNANCE_AUDIT: OK`

#### Phase ② → ③

| # | 条件 | GO | NO-GO |
|---|------|-----|-------|
| **U23-AG-1** | AFDA staging 复验 | ✅ | Admin 漂移 |
| **U23-AG-2** | Permission escalation 无 silent 增 | ✅ | 膨胀 |
| **U23-AG-3** | Dangerous ops 100% 审计 | ✅ | AMWA 缺口 |

**grep：** `TT_ADMIN_GOVERNANCE_PHASE23: GO`

### 3.1.9 治理标准审计 · DOMAIN-MA · 收口冻结闸 {#tt-full-audit-meta-gates}

> **§30–§31** — **不替代** U12-3 D P0；**优化** 标准自身 · **MA 建议末闸**。

| # | 条件 | 机读 | GO |
|---|------|------|-----|
| **U12-MA-1** | MA gate exit 0 | `run-meta-audit-gate.sh` | ✅ |
| **U12-MA-2** | Phase① Readiness ≥ **50** | `phase1-readiness-score.v1.json` | ✅ |
| **U12-MA-3** | Governance Efficiency ≥ **50** | `governance-efficiency-score.v1.json` | ✅ |
| **U12-MA-4** | Executive Summary 模板 | `EXECUTIVE-SUMMARY-TEMPLATE.md` | ✅ |

**grep：** `TT_META_AUDIT: OK`

### 3.1.10 收尾冻结治理 · DOMAIN-FZ · Closure Readiness {#tt-full-audit-freeze-gates}

> **§32–§34** — **不替代** U12-3 D P0；**决定** Phase① **是否达到冻结标准**。

| # | 条件 | 机读 | GO |
|---|------|------|-----|
| **U12-FZ-1** | FZ gate exit 0 | `run-freeze-governance-gate.sh` | ✅ |
| **U12-FZ-2** | Closure Readiness ≥ **80**（HOLD+） | `closure-readiness-score.v1.json` | ✅ |
| **U12-FZ-3** | Domain Completion Matrix | `domain-completion-matrix.v1.json` | ✅ |
| **U12-FZ-4** | Executive Freeze Report | `PHASE1-FREEZE-RECOMMENDATION-REPORT.md` | ✅ |
| **U12-FZ-5** | Backlog Registry 登记 | `phase1-closure-backlog-registry.v1.json` | ✅ |

**grep：** `TT_FREEZE_GOVERNANCE: OK`

| **U12-23** | **DOMAIN-FZ** 收尾冻结 | U12-FZ-1～5 | `run-freeze-governance-gate.sh` | ✅ | FZ P0 |

### 3.1.11 审计质量审计 · DOMAIN-QA2 · 收敛末闸 {#tt-full-audit-qa2-gates}

> **§33** — **MASTER 建议最后一包**；压缩 Findings 噪音 · 输出根因与效率分。

| # | 条件 | 机读 | GO |
|---|------|------|-----|
| **U12-QA2-1** | QA2 gate exit 0 | `run-audit-quality-gate.sh` | ✅ |
| **U12-QA2-2** | Root Cause Compression | `root-cause-compression.v1.json` | ✅ |
| **U12-QA2-3** | Audit Efficiency ≥ **50** | `audit-efficiency-score.v1.json` | ✅ |
| **U12-QA2-4** | AI Output Efficiency ≥ **50** | `ai-output-efficiency-score.v1.json` | ✅ |
| **U12-QA2-5** | Top10 Root Causes | `top10-root-causes.v1.json` | ✅ |

**grep：** `TT_AUDIT_QUALITY: OK`

| **U12-24** | **DOMAIN-QA2** 审计质量 | U12-QA2-1～5 | `run-audit-quality-gate.sh` | ✅ | QA2 P0 |

### 3.1.12 第一阶段执行驾驶舱 · PHASE1_EXECUTIVE_BOARD {#tt-full-audit-executive-board-gates}

> **§35** — **MASTER 末闸 · Owner 唯一视图**；**不替代** U12-3 D P0。

| # | 条件 | 机读 | GO |
|---|------|------|-----|
| **U12-PEB-1** | Executive Board gate exit 0 | `run-phase1-executive-board-gate.sh` | ✅ |
| **U12-PEB-2** | Executive Freeze Dashboard | `EXECUTIVE-FREEZE-DASHBOARD.md` | ✅ |
| **U12-PEB-3** | Readiness + Freeze Recommendation | `freeze-recommendation.v1.json` | ✅ |
| **U12-PEB-4** | Closure Sprint Queue A/B/C | `closure-sprint-queue.v1.json` | ✅ |
| **U12-PEB-5** | Top10 Root Causes + Top20 Blockers | `top10-root-causes.v1.json` 等 | ✅ |
| **U12-PEB-6** | **EX 执行审计**（PEB 子模块） | `run-execution-audit-gate.sh` | ✅ |

**grep：** `TT_PHASE1_EXECUTIVE_BOARD: OK`

| **U12-25** | **PHASE1_EXECUTIVE_BOARD** 执行驾驶舱 | U12-PEB-1～5 | `run-phase1-executive-board-gate.sh` | ✅ | PEB P0 |


---

## §4 · 业务旅程审计（端到端） {#tt-full-audit-journeys}

> 每条旅程：**角色** · **页面路径** · **API 脊** · **①/②/③ 检查项** · **SSOT**

### J1 · 旅行者：注册 → 登录 → 逛市场 → 下单

| # | 步骤 | ① 检查 | ② 检查 | ③ 检查 | SSOT |
|---|------|--------|--------|--------|------|
| J1-1 | 注册 `/auth/register` | ☐ vitest authRegisterL5 | ☐ staging 邮件/验证 | ☐ 生产合规 copy | A-REG-001 |
| J1-2 | 登录 `/auth/login` | ☐ authLoginUiFreeze 绿 | ☐ Cookie 载体一致 | ☐ 风控/限流 | A-LOG-001 |
| J1-3 | Me / Hub | ☐ `GET /api/v1/me` 200 | ☐ staging PG 持久化 | ☐ | A-ME-001 |
| J1-4 | `/market` 列表 | ☐ debounce 300ms · 收藏 localStorage | ☐ F-020 跨设备 | ☐ CDN | B-MKT-001 |
| J1-5 | 创建订单 | ☐ POST orders + 列表回读 | ☐ staging 双写 | ☐ 真 PSP | B-ORD-001 |
| J1-6 | `/orders` → `/pay` / `/escrow` | ☐ orders corridor smoke | ☐ | ☐ | [GO_local_orders_l5](../frontend/evidence/GO_local_orders_l5/README.md) |

**① 一键：** `bash scripts/smoke-ab-core-chain.sh` · `bash scripts/dev/run-orders-corridor-local.sh`

### J2 · 创新行程：Landing → 解锁 → Escrow 草稿

| # | 步骤 | ① 检查 | ② | ③ | SSOT |
|---|------|--------|-----|-----|------|
| J2-1 | `/` postItineraryCreate ×1 | ☐ ITINERARY_CARD_COUNT=1 | ☐ | ☐ | LANDING-MARKET SSOT |
| J2-2 | UnlockModal → getOrder | ☐ localStorage 跨 tab | ☐ | ☐ | |
| J2-3 | `/escrow/[id]` 草稿暖色壳 | ☐ run-web3-itinerary-l5-green | ☐ 测试网 sync | ☐ 已上链页未冻结 | ESCROW-DRAFT-EXPERIENCE-FREEZE |
| J2-4 | 全链烟测 | ☐ smoke-web3-itinerary-full-chain-local | ☐ | ☐ | |

**① 一键：** `bash scripts/dev/run-web3-itinerary-l5-green.sh` · `bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh`

### J3 · 商家：注册 → 准入费 → 工作台 → 挂牌

| # | 步骤 | ① | ② | ③ | SSOT |
|---|------|---|---|-----|------|
| J3-1 | `/provider/register` | ☐ providerRegisterL5 | ☐ | ☐ | PROVIDER-REGISTER-UI-FREEZE |
| J3-2 | `/me/onboarding?role=provider` | ☐ fee_schedule 全链 | ☐ USDC/Stripe | ☐ | onboarding §8.1 |
| J3-3 | `/provider` 工作台 | ☐ smoke-provider-workbench-l5 | ☐ | ☐ | PROVIDER-WORKBENCH-L5-FREEZE |
| J3-4 | merchant-listings API | ☐ GET/PATCH 烟测 | ☐ | ☐ | |

**① 一键：** `bash scripts/dev/smoke-provider-onboarding-local.sh` · `bash scripts/dev/smoke-provider-workbench-l5-local.sh`

### J4 · 向导：注册 → 资料 → 工作台 → 订单 hat=guide

| # | 步骤 | ① | ② | ③ | SSOT |
|---|------|---|---|-----|------|
| J4-1 | `/guide/register` | ☐ guide register L5 | ☐ | ☐ | |
| J4-2 | `/me/identities/guide/settings` | ☐ PATCH guide-profile | ☐ | ☐ | |
| J4-3 | `/guide` 工作台 | ☐ guide workbench smoke | ☐ | ☐ | GUIDE-WORKBENCH-L5-FREEZE |
| J4-4 | 订单走廊 hat=guide | ☐ GET orders | ☐ | ☐ | |

### J5 · 主理人：注册 → TTG 质押 → 治理工作台

| # | 步骤 | ① | ② | ③ | SSOT |
|---|------|---|---|-----|------|
| J5-1 | `/steward/register` | ☐ steward register | ☐ | ☐ | |
| J5-2 | Anvil TTG / stake | ☐ Step 3c start-api-with-seed | ☐ Sepolia broadcast **Owner-only** | ☐ Mainnet | TT-PHASE2-GOVERNANCE-STACK |
| J5-3 | `/governance?view=region` | ☐ steward workbench smoke | ☐ | ☐ | STEWARD-WORKBENCH-L5-FREEZE |

### J6 · 收购 PD-009：Hub → 子站 → bond → listing

| # | 步骤 | ① | ② | ③ | SSOT |
|---|------|---|---|-----|------|
| J6-1 | `/me/identities` → acquisition | ☐ Hub UI 冻结 | ☐ | ☐ | ME-IDENTITIES-UI-FREEZE |
| J6-2 | `/market/acquisition` | ☐ acquisitionL5 绿集 | ☐ | ☐ | acquisition §8.1 |
| J6-3 | trust / bond / listing 门闸 | ☐ smoke-acquisition-pd009-local | ☐ | ☐ | |

### J7 · 社区：Feed → 发帖 → 审核 → Admin

| # | 步骤 | ① | ② | ③ | SSOT |
|---|------|---|---|-----|------|
| J7-1 | `/community` Feed | ☐ community vitest 绿 | ☐ C1 feed≥20 | ☐ P3-COM | |
| J7-2 | 媒体上传 MinIO | ☐ Step 3e 本地 | ☐ C2 安全 | ☐ 生产 CDN | |
| J7-3 | 举报 / Admin 下架 | ☐ admin community | ☐ C3 | ☐ | |
| J7-4 | 93 D 域矩阵 | ☐ ① narrow | ☐ C7 report.json | ☐ 全站 93 GO | |

### J8 · 发布中心 / Workspace Context（Wave1）

| # | 步骤 | ① | ② | ③ | SSOT |
|---|------|---|---|-----|------|
| J8-1 | `/me/publish` 五轨壳 | ☐ publishHub smoke | ☐ staging curl | ☐ | PUBLISH-HUB-PHASE1-CLOSURE |
| J8-2 | `GET /api/v1/me/publish-summary` | ☐ W1-A3 API + BFF | ☐ PH-B-1 对拍 | ☐ | |
| J8-3 | Header context switcher | ☐ vitest activeWorkspaceContext | ☐ | ☐ | ADR-20260613 |

**① 一键：** `bash scripts/dev/smoke-publish-hub-local.sh`

---

## §5 · ① 本地 · 一键审计命令 {#tt-full-audit-one-shot}

**日常最小集（[solo-dev-rhythm §6.5](../solo-dev-rhythm.md)）：**

```bash
# 仓库根
bash scripts/dev/run-go-local-phase1-acceptance.sh          # → TT_GO_LOCAL_PHASE1: OK
bash scripts/gates/local-phase1-linkage-quality-gates.sh    # → TT_PHASE1_LINKAGE_QUALITY_GATES_SUMMARY: OK
```

**宽①（全站企业 10 · 可选）：**

```bash
bash scripts/dev/run-enterprise-site-10-local.sh              # → TT_ENTERPRISE_SITE_10_LOCAL: OK
# 可选长跑 E2E：ENTERPRISE_SITE_10_FULL_E2E=1
```

**五域深度 + Trust Gate 汇总：**

```bash
bash scripts/dev/run-final-system-audit.sh                    # → FINAL_SYSTEM_AUDIT 报告
```

**动 frontend 前（pre-push 子集见 CONTRIBUTING）：**

```bash
cargo test -p traveltrust-api                                 # 默认 API 单测
bash scripts/run-check-04-routes.sh                           # 04 路由闸（Python）
python registry/validate-spec-path-dependencies-registry.py   # spec 路径依赖
```

**企业级 D26–D45 宽扫（① · 推荐发版前）：** 见 [§10.0](#tt-full-audit-enterprise-one-shot)

**Phase ① 收尾 MASTER（进 ② 前 · 必跑）：**

```bash
bash scripts/dev/run-full-system-audit-master-gate.sh   # → MASTER_READY
```

**DOMAIN-Z 文档运维对齐（① · 收尾面）：**

```bash
bash scripts/dev/run-doa-audit-gate.sh              # → TT_DOA_AUDIT: OK
# SKIP_DOA_ROUTES=1  # 04 路由暂 FAIL 仍生成 drift 报告
bash scripts/dev/run-full-system-audit-master-gate.sh # → MASTER + PF + DOA + LFC

bash scripts/dev/run-lifecycle-forensic-audit-gate.sh   # → TT_LIFECYCLE_FORENSIC_AUDIT: OK

bash scripts/dev/run-platform-governance-audit-gate.sh  # → TT_PLATFORM_GOVERNANCE_AUDIT: OK

bash scripts/dev/run-admin-governance-audit-gate.sh     # → TT_ADMIN_GOVERNANCE_AUDIT: OK

bash scripts/dev/run-meta-audit-gate.sh                 # → TT_META_AUDIT: OK（建议最后）
```

---

## §6 · 深度审计报告索引 {#tt-full-audit-deep-reports}

| 报告 | 维度 | 生成命令 | 产物 |
|------|------|----------|------|
| [FINAL-SYSTEM-AUDIT-REPORT](./FINAL-SYSTEM-AUDIT-REPORT.md) | 五域汇总 | `bash scripts/dev/run-final-system-audit.sh` | `docs/runbook/FINAL-SYSTEM-AUDIT-REPORT.md` |
| [ORDER-ESCROW-DISPUTE-DEEP-AUDIT](./ORDER-ESCROW-DISPUTE-DEEP-AUDIT-REPORT.md) | D09/D10 | `bash scripts/dev/run-order-escrow-dispute-deep-audit.sh` | `evidence/order-escrow-dispute-deep-audit/` |
| [COMMUNITY-DEEP-AUDIT](./COMMUNITY-DEEP-AUDIT-REPORT.md) | D18 | `bash scripts/dev/run-community-deep-audit.sh` | `evidence/community-deep-audit/` |
| [IDENTITY-TRUST-GOVERNANCE-DEEP-AUDIT](./IDENTITY-TRUST-GOVERNANCE-DEEP-AUDIT-REPORT.md) | D05/D17 | `identity-trust-governance-deep-audit.py` | `evidence/identity-trust-governance-deep-audit/` |
| [CROSS-DOMAIN-INTEGRATION-AUDIT](./CROSS-DOMAIN-INTEGRATION-AUDIT-REPORT.md) | D25 | `cross-domain-integration-audit.py` | `evidence/cross-domain-integration-audit/` |
| [ADMIN-SECURITY-CLOSURE](./ADMIN-SECURITY-CLOSURE-REPORT.md) | D16 | admin 变异审计脚本族 | |
| [PRODUCTION-READINESS-DEEP-AUDIT](./PRODUCTION-READINESS-DEEP-AUDIT-REPORT.md) | ③ | `generate-production-readiness-deep-audit-matrix.py` | handbook **158** |
| [L5-Operations-Deep-Audit](./156-L5-Operations-Deep-Audit-Report.md) | D13/D24 | `run-l5-enterprise-live-evidence-audit.sh` | |
| [PHASE1-ENTERPRISE-CLOSURE-AUDIT](./PHASE1-ENTERPRISE-CLOSURE-AUDIT.md) | D01/D06 | ① onboarding 垂直 | |
| [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md) | ② 缺口 | 读表 | |
| [ENTERPRISE-SITE-10-L5-MATRIX](./ENTERPRISE-SITE-10-L5-MATRIX.md) | ① 全站 10 | `run-enterprise-site-10-local.sh` | |

**L5 产品卓越子矩阵（UI/UX 专项）：**

```bash
bash scripts/dev/run-l5-product-excellence-audit.sh           # IA / 设计系统 / 移动 / 转化 / a11y
bash scripts/dev/l5-pe-design-system-audit.sh
bash scripts/dev/l5-pe-information-architecture-audit.sh
bash scripts/dev/l5-er-a11y-live-audit.sh
```

---

## D01 · 阶段治理与宣称 {#d01-phase-governance}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D01-1 | 结论句标明 **①/②/③** | ☐ | ☐ | ☐ |
| D01-2 | 未用 ① 绿冒充 staging **GO** | ☐ | ☐ | ☐ |
| D01-3 | ISS-007 **PARTIAL_GO** 未当全矩阵 GO | ☐ | ☐ | ☐ |
| D01-4 | Phase ② 实施前 **G-0～G-4** 已读 | N/A | ☐ | N/A |
| D01-5 | Production 宣称走 **go-live** 签字 | N/A | N/A | ☐ |
| D01-6 | [TT-9628 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary) 已理解 | ☐ | ☐ | ☐ |

---

## D02 · 文档 / spec / handbook {#d02-docs-spec-handbook}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D02-1 | 动 `docs/spec` 路径依赖 → registry 盘点同步 | ☐ | ☐ | ☐ |
| D02-2 | engineering `00～50` 三处对拍（手册/README/磁盘） | ☐ | ☐ | ☐ |
| D02-3 | 04 HTTP 与 `frontend/lib/api/routes.ts` 同批 | ☐ | ☐ | ☐ |
| D02-4 | 13-1 表 1 路由 ↔ `frontend/app` 无孤儿页 | ☐ | ☐ | ☐ |
| D02-5 | 08-4 / 缺口总表 发版前并联（③） | N/A | ☐ | ☐ |

---

## D03 · 注册 / 登录 / 会话 {#d03-auth-session}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D03-1 | `/auth/login` UI 冻结 — 仅数据链/i18n/a11y | ☐ | ☐ | ☐ |
| D03-2 | `/auth/register` UI 冻结 | ☐ | ☐ | ☐ |
| D03-3 | 登录后 `traveltrust_session_token` / Me 一致 | ☐ | ☐ | ☐ |
| D03-4 | 登出后受保护 API **401** | ☐ | ☐ | ☐ |
| D03-5 | `/me/sessions` · security-notifications 路由 SSOT | ☐ | ☐ | ☐ |
| D03-6 | 限流 / 429 Retry-After 与前端退避 | ☐ | ☐ | ☐ |

**① 绿集：** `authLoginUiFreeze` · `authRegisterUiFreeze` · `authL5FullScore` · `loginPageL5`

---

## D04 · HTTP 契约 / BFF / 04 路由 {#d04-http-bff-routes}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D04-1 | `bash scripts/run-check-04-routes.sh` exit 0 | ☐ | ☐ | ☐ |
| D04-2 | Next `app/api/v1/*` 与 Rust 路由无冲突 | ☐ | ☐ | ☐ |
| D04-3 | `GET /meta` · page-brief v6 对拍 | ☐ | ☐ | ☐ |
| D04-4 | ABI gate 55-S13（改合约时） | ☐ | ☐ | ☐ |
| D04-5 | staging C11 route-gate 24 API + 18 browser | N/A | ☐ | N/A |

---

## D05 · 多重身份 / Hub / 发布中心 {#d05-identity-hub-publish}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D05-1 | `/me/identities` Hub UI 冻结 | ☐ | ☐ | ☐ |
| D05-2 | 五槽 visibility 与 `meIdentitySlots` 一致 | ☐ | ☐ | ☐ |
| D05-3 | Workspace Context switcher + ADR | ☐ | ☐ | ☐ |
| D05-4 | `/me/publish` IA 边界 100 · UI 冻结 | ☐ | ☐ | ☐ |
| D05-5 | publish-summary API + BFF upstream-first | ☐ | ☐ | ☐ |
| D05-6 | `/me/settings` 分组导航与 P3 命名 | ☐ | ☐ | ☐ |

**①：** `bash scripts/dev/smoke-publish-hub-local.sh` · `acquisitionL5` · `meIdentitiesPage.contract`

---

## D06 · Onboarding / 准入费 {#d06-onboarding-fee}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D06-1 | quote → PI → webhook/mark-paid → entitlement | ☐ | ☐ | ☐ |
| D06-2 | `fee_schedule_v1` 三方对拍 | ☐ | ☐ | ☐ |
| D06-3 | B 轨 USDC 文案与 **ONBOARDING-B-TRACK-USDC-SSOT** | ☐ | ☐ | ☐ |
| D06-4 | staging **关闭** `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` | N/A | ☐ | N/A |
| D06-5 | Stripe test webhook 与 PG 对拍 | N/A | ☐ | N/A |

---

## D07 · 五主路由 / 营销 {#d07-five-main-marketing}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D07-1 | 仅 `frontend/` 现行树 — 禁止 archive 分叉 | ☐ | ☐ | ☐ |
| D07-2 | `/` · `/traveltrust` · `/market` · `/did-rank` · `/community/*` UI 冻结 | ☐ | ☐ | ☐ |
| D07-3 | 动五主须 `homeMarketing` + 绿集 exit 0 | ☐ | ☐ | ☐ |
| D07-4 | [88 §一](../spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) 无结构回流 | ☐ | ☐ | ☐ |
| D07-5 | `/governance/*` 治理层变更允许边界 | ☐ | ☐ | ☐ |

---

## D08 · 市场 / Discover {#d08-market-discover}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D08-1 | `useMarketPage` 300ms debounce | ☐ | ☐ | ☐ |
| D08-2 | 收藏 localStorage SSOT + F-020 best-effort | ☐ | ☐ | ☐ |
| D08-3 | MARKET-L5 = `/market` 主 only | ☐ | ☐ | ☐ |
| D08-4 | 子站 PG catalog 优先 | ☐ | ☐ | ☐ |
| D08-5 | provider/guide 公开 catalog seed | ☐ | ☐ | ☐ |

---

## D09 · 订单 / 支付 / 消息 {#d09-orders-pay-messages}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D09-1 | B-ORD-001～003 **93 P0** PASS | ☐ | ☐ | ☐ |
| D09-2 | `/orders` 列表 L5 冻结 | ☐ | ☐ | ☐ |
| D09-3 | hat=traveler/merchant/guide 走廊 | ☐ | ☐ | ☐ |
| D09-4 | 订单消息 chain_off 挂载时 200 | ☐ | ☐ | ☐ |
| D09-5 | mock-pay / 链上 pay 环境标注 | ☐ | ☐ | ☐ |

---

## D10 · Escrow / 托管 / 争议 {#d10-escrow-dispute}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D10-1 | 预链上草稿 UI 冻结（暖色壳） | ☐ | ☐ | ☐ |
| D10-2 | 旅行者默认不暴露 FeeRouter / cyan DID | ☐ | ☐ | ☐ |
| D10-3 | `NEXT_PUBLIC_ESCROW_DEV_TOOLS=1` 才开高级区 | ☐ | ☐ | ☐ |
| D10-4 | chain-sync-status 可读 | ☐ | ☐ | ☐ |
| D10-5 | 已上链订单页 **未** 同锁 — 单独审计 | ☐ | ☐ | ☐ |
| D10-6 | 争议 opening / 证据 API（若启用） | ☐ | ☐ | ☐ |

---

## D11 · 向导工作台 {#d11-guide-workbench}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D11-1 | `/guide` L5 冻结 | ☐ | ☐ | ☐ |
| D11-2 | 准入 SSOT `/me/settings/trust` | ☐ | ☐ | ☐ |
| D11-3 | 档期 / guide-profile PATCH | ☐ | ☐ | ☐ |
| D11-4 | 93-B guide 批次（若跑矩阵） | ☐ | ☐ | ☐ |

---

## D12 · 商家 {#d12-merchant-provider}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D12-1 | `/provider/register` UI 冻结 | ☐ | ☐ | ☐ |
| D12-2 | `/provider` 工作台 L5 冻结 | ☐ | ☐ | ☐ |
| D12-3 | merchant-listings API + 工作台深链 | ☐ | ☐ | ☐ |
| D12-4 | `/market/provider` 曝光 card | ☐ | ☐ | ☐ |

---

## D13 · UI / L5 / 排版 / 风格 / a11y {#d13-ui-l5-design-freeze}

**横切六维（与 93 §0.6 同源）：**

| 子维 | 检查什么 | ① 入口 | ② | ③ |
|------|----------|--------|---|-----|
| **布局/token** | L5 壳 · max-width · 暖金暗玻璃 · 禁止 layout 回流 | 各域 FREEZE.md | C9 视觉 | 品牌签字 |
| **排版层级** | eyebrow / title / meta · 44px 触控 | `meSettingsL5` · `authL5Form` | | |
| **分区 F/X/G** | 资金页克制 · Experience 页动效 | [92 §四](../spec/92-P0-全站UI分区控制表-金融体验灰区与动效裁决.md) | | |
| **双系统风** | Auth L5 vs Console 暖链 | [86](../spec/86-UI-双系统未来风-风格与动效技术规格.md) | | |
| **三态 UI** | loading / empty / error 可辨 | 各页手点 + vitest | | |
| **a11y** | focus ring · aria · 键盘筛选 | `publishHubFilterA11y` · L5 a11y 脚本 | `l5-er-a11y-live-audit` | |

| # | 页面族 | ① UI 冻结 SSOT |
|---|--------|----------------|
| D13-1 | Auth 登录/注册 | AUTH-LOGIN · AUTH-REGISTER FREEZE |
| D13-2 | Me settings / identities | ME-SETTINGS-L5 · ME-IDENTITIES |
| D13-3 | Header utility 菜单 | HEADER-UTILITY-MENU-L5-FREEZE |
| D13-4 | Admin Console | Admin L5 vitest 联盟 |
| D13-5 | Community shell | COMMUNITY-PHASE1-FREEZE |
| D13-6 | Escrow 草稿体验 | ESCROW-DRAFT-EXPERIENCE-FREEZE |

---

## D14 · 数据 / 持久化 / 迁移 {#d14-data-persistence-migrations}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D14-1 | API 启动 `migrations applied` | ☐ | ☐ | ☐ |
| D14-2 | 写后 GET 再读 / PG 查询一致 | ☐ | ☐ | ☐ |
| D14-3 | chain_off hydrate 与 PG 不打架 | ☐ | ☐ | ☐ |
| D14-4 | CDIA / community PG consistency ② | N/A | ☐ | N/A |
| D14-5 | 备份 · PITR · 恢复演练 | N/A | N/A | ☐ |
| D14-6 | 索引 / 慢查询 / 连接池 | ☐ | ☐ | ☐ |

---

## D15 · 链 / Web3 / Indexer / ABI {#d15-chain-web3-indexer}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D15-1 | `forge build` + ABI sync 与 14 对拍 | ☐ | ☐ | ☐ |
| D15-2 | Anvil local TTG（可选 Step 3c） | ☐ | N/A | N/A |
| D15-3 | Sepolia governance stack（**Owner + 11155111**） | N/A | ☐ | N/A |
| D15-4 | Indexer checkpoint / FINALITY_N / 双写策略 | ☐ | ☐ | ☐ |
| D15-5 | `GET /meta.chain` 与环境一致 | ☐ | ☐ | ☐ |
| D15-6 | Mainnet G0～G6 + Shadow Launch | N/A | N/A | ☐ |
| D15-7 | 钱包网络切换 · 错误链 ID 提示 | ☐ | ☐ | ☐ |

---

## D16 · Admin / RBAC / 审计边界 {#d16-admin-rbac-audit-boundary}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D16-1 | Admin 能力壳与 routesAdmin* SSOT | ☐ | ☐ | ☐ |
| D16-2 | super_admin vs console role 分离 | ☐ | ☐ | ☐ |
| D16-3 | 变异操作 audit log 落库 | ☐ | ☐ | ☐ |
| D16-4 | Admin 2FA policy staging | N/A | ☐ | ☐ |
| D16-5 | 队列审批 / suspend / moderation 边界 | ☐ | ☐ | ☐ |
| D16-6 | Admin 前端 deep audit PASS | ☐ | ☐ | ☐ |
| D16-7 | 普通用户 **不可** 访问 `/admin/*` | ☐ | ☐ | ☐ |

**边界声明：** Admin 能力 **≠** 全站业务 SSOT；业务真源仍在 04/93/各 app README。

---

## D17 · 治理 / 主理人 {#d17-governance-steward}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D17-1 | governance-matrix-local-gate | ☐ | ☐ | ☐ |
| D17-2 | steward-seat / resign / finalize-resign 路由 | ☐ | ☐ | ☐ |
| D17-3 | Region steward 工作台 `#steward-ttg-stake` | ☐ | ☐ | ☐ |
| D17-4 | 治理 params / pool / rewards 只读页 | ☐ | ☐ | ☐ |

---

## D18 · 社区 UGC {#d18-community}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D18-1 | community narrow 13 + l5-all 42 vitest | ☐ | ☐ | ☐ |
| D18-2 | MinIO 媒体桶 + COMMUNITY_MEDIA_S3_* | ☐ | ☐ | ☐ |
| D18-3 | C1～C12 槽（**≠** Phase ② GO） | N/A | ☐ | N/A |
| D18-4 | 反刷 / 429 / retry_after_sec | ☐ | ☐ | ☐ |
| D18-5 | DID/Trust 互链 C12 | N/A | ☐ | N/A |

---

## D19 · 收购 PD-009 {#d19-acquisition}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D19-1 | `acquisition_publish_gate.rs` 门闸 | ☐ | ☐ | ☐ |
| D19-2 | 非 region_steward / 非 96-18 准入费混淆 | ☐ | ☐ | ☐ |
| D19-3 | smoke-acquisition-pd009-local | ☐ | ☐ | ☐ |

---

## D20 · 安全 / 密钥 / 限流 {#d20-security-secrets}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D20-1 | `.env` 无 secrets 进 git | ☐ | ☐ | ☐ |
| D20-2 | staging/prod 密钥隔离 G-1 | N/A | ☐ | ☐ |
| D20-3 | CORS_ORIGINS 与前端端口一致 | ☐ | ☐ | ☐ |
| D20-4 | INTERNAL_API_SECRET / webhook 签名 | ☐ | ☐ | ☐ |
| D20-5 | STRICT_SSOT 本地预检（若启用） | ☐ | N/A | ☐ |
| D20-6 | CSRF / XSS / SSRF 面（Admin 上传等） | ☐ | ☐ | ☐ |

---

## D21 · 回归矩阵 93 / R-002 {#d21-regression-93-r002}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D21-1 | `report.json` 含 `environment` §0.9 | ☐ | ☐ | ☐ |
| D21-2 | A/B **P0 核心链** 全 PASS 才 GO | ☐ | ☐ | ☐ |
| D21-3 | `validate-regression-report.py` | ☐ | ☐ | ☐ |
| D21-4 | R-003 staging 首次全量 A+B | N/A | ☐ | N/A |
| D21-5 | 93 批次 tracker 下一批指针 | ☐ | ☐ | ☐ |

---

## D22 · 可观测 {#d22-observability}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D22-1 | API 日志含 `x-request-id` | ☐ | ☐ | ☐ |
| D22-2 | 支付/争议/Admin 变异可追溯 | ☐ | ☐ | ☐ |
| D22-3 | staging monitoring smoke C8 | N/A | ☐ | ☐ |
| D22-4 | on-call / RUNBOOK P0 九项填实 | N/A | N/A | ☐ |

---

## D23 · i18n / 文案 {#d23-i18n-copy}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D23-1 | 关键路径 locales 键存在（中英） | ☐ | ☐ | ☐ |
| D23-2 | 无裸 key 外露（publish_hub_* 等） | ☐ | ☐ | ☐ |
| D23-3 | 账户导航 P3 命名一致 | ☐ | ☐ | ☐ |
| D23-4 | 法务/免责声明 ③ 签字 | N/A | N/A | ☐ |

---

## D24 · 性能 / E2E 稳定 {#d24-performance-e2e}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D24-1 | `e2e-stability-probe.sh` | ☐ | ☐ | ☐ |
| D24-2 | Playwright 全矩阵（可选） | ☐ | ☐ | ☐ |
| D24-3 | 429 风暴 / 退避不拖死 | ☐ | ☐ | ☐ |
| D24-4 | 生产 SLO / 容量 | N/A | N/A | ☐ |

---

## D25 · 跨域集成 / Trust Gate {#d25-cross-domain-trust}

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D25-1 | CDIA verdict PASS | ☐ | ☐ | ☐ |
| D25-2 | Trust Gate Chain Audit TGCA | ☐ | ☐ | ☐ |
| D25-3 | 五角色 reality audit 矩阵 | ☐ | ☐ | ☐ |
| D25-4 | FINAL_SYSTEM_AUDIT 汇总 | ☐ | ☐ | ☐ |

---

## §10 · 企业级补充维度 D26–D45 {#tt-full-audit-enterprise-d26-d45}

> **不替代 D01–D25**；与之 **并联** 用于边界安全、资金完整性、容灾与真用户旅程。每维结构：**风险 · SSOT · 机读 · 验收 · ①②③ 清单 · 维内 GO/NO-GO · 记录模板**。

### §10.0 · 企业级一键审计（① 推荐） {#tt-full-audit-enterprise-one-shot}

```bash
# 仓库根 — 五域深度 + Trust Gate 汇总
bash scripts/dev/run-final-system-audit.sh

# RBAC / 权限提升 / Admin 变异面
bash scripts/dev/l5-enterprise-rbac-security-audit.sh
bash scripts/dev/run-admin-security-closure-audit.sh

# 订单·托管·资金状态机
bash scripts/dev/run-order-escrow-dispute-deep-audit.sh

# 身份·信任·治理
bash scripts/dev/run-identity-trust-governance-deep-audit.sh
bash scripts/dev/l5-bg-governance-audit.sh

# 跨域 + Trust Gate
bash scripts/dev/run-cross-domain-integration-audit.sh   # 若存在；否则 cross-domain-integration-audit.py

# 真用户旅程（探针 + RUJR e2e 存在性）
bash scripts/dev/l5-pe-user-journey-audit.sh
bash scripts/dev/run-l5-enterprise-acceptance.sh

# Admin RBAC 矩阵（须 API+psql）
bash scripts/dev/smoke-admin-rbac-matrix-local.sh
```

**成功判据（① 宽扫）：** 上列脚本 **exit 0**；`FINAL_SYSTEM_AUDIT` 汇总 **无 P0**；末行可 grep **`TT_FULL_SYSTEM_AUDIT_ENTERPRISE: OK`**（自检留痕，非 CI 硬闸）。

---

### §10.1 · 单维记录模板（D26–D76 + DX-01 复制用）

```markdown
### Dxx · <维度名> · YYYY-MM-DD
- **阶段 / 环境：** ① local | ② staging | ③ prod
- **风险等级：** P0 | P1
- **机读：** <script> → exit 0 / findings.json verdict
- **维内结论：** GO | CONDITIONAL | NO-GO
- **P0 开放项：** —
- **证据：** evidence/.../
```

---

## D26 · Boundary Consistency · 权限边界矩阵 {#d26-boundary-consistency}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [13-1 §二 表2](../spec/13-1-UI产品级SSOT与页面规范.md) · [87 RBAC](../spec/87-TravelTrust-角色体系技术文档-融合架构版.md) · `GET /api/v1/admin/rbac/route-matrix` |
| **机读** | `bash scripts/dev/smoke-admin-rbac-matrix-local.sh` · Step 6c `route-matrix` 探针 |
| **① GO** | 表2 角色×页面与 FE 路由无未授权入口；route-matrix 200 | 
| **② GO** | staging 矩阵与 ① 同构；未登录 **401** on `/admin/*` |
| **③ GO** | 生产矩阵 **冻结** + 变更须审批 |
| **NO-GO** | 旅行者可见 Admin 写接口；矩阵与 04 路由不一致 |

**验收标准：** 每个 **mutating** Admin API 在矩阵中有 **role + route**；Escrow 参与者边界符合 **87 §4–§6**。

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D26-1 | `smoke-admin-rbac-matrix-local.sh` exit 0 | ☐ | ☐ | ☐ |
| D26-2 | 13-1 表2 与 `/admin/permissions` UI 一致 | ☐ | ☐ | ☐ |
| D26-3 | 订单 hat=traveler/merchant/guide 列表隔离 | ☐ | ☐ | ☐ |
| D26-4 | slot_rbac profile patch gate 负例 403 | ☐ | ☐ | ☐ |

---

## D27 · Role Escalation · 权限提升攻击 {#d27-role-escalation}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [ADMIN-SECURITY-CLOSURE](./ADMIN-SECURITY-CLOSURE-REPORT.md) · `scripts/ops/pra-security-privilege-escalation.sh` |
| **机读** | `bash scripts/dev/l5-enterprise-rbac-security-audit.sh` |
| **① GO** | tourist 不能 `PUT /admin/*`；local 直写 console-role 仅 dev 闸 |
| **② GO** | staging 须 approvals 链；2FA policy 探针 |
| **③ GO** | PRA 渗透无 **Critical**；生产禁用 role 直写 |
| **NO-GO** | 水平/垂直越权可读他人 PII 或改 role |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D27-1 | l5-enterprise-rbac-security-audit exit 0 | ☐ | ☐ | ☐ |
| D27-2 | 未授权 `GET /api/v1/admin/capabilities` → 401/403 | ☐ | ☐ | ☐ |
| D27-3 | `POST console-role-change-request` 非 super 不可绕过 | ☐ | ☐ | ☐ |
| D27-4 | JWT/Session 篡改不能提权为 super_admin | ☐ | ☐ | ☐ |

---

## D28 · Cross-Identity Isolation · 多身份隔离 {#d28-cross-identity-isolation}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [LOCAL-MULTI-IDENTITY-CLOSURE](../frontend/evidence/GO_local_identity_workspace/LOCAL-MULTI-IDENTITY-CLOSURE.md) · `chain_off/slot_rbac.rs` |
| **机读** | `bash scripts/dev/run-identity-trust-governance-deep-audit.sh` · multi-demo 手验 |
| **① GO** | `multi-demo@test.com` 四轨数据 **不** 交叉污染 |
| **② GO** | staging 同账号 operator 槽 **不能** 读另一槽私有 listing |
| **③ GO** | 主网同 wallet 多身份策略书面化 |
| **NO-GO** | merchant 会话读 acquisition 私有草稿 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D28-1 | ITG audit 无 P0 交叉域 | ☐ | ☐ | ☐ |
| D28-2 | Workspace context 切换不泄露他轨 token | ☐ | ☐ | ☐ |
| D28-3 | `GET orders?hat=` 仅返回 hat 范围内 | ☐ | ☐ | ☐ |
| D28-4 | Hub 槽 state 与 API 写门一致 | ☐ | ☐ | ☐ |

---

## D29 · Source-of-Truth · 真源一致性 {#d29-source-of-truth}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（文档漂移 **P0** 若影响资金/权限） |
| **SSOT** | **冲突以 `frontend/` / `crates/api` 为准**（AGENTS.md）· [04 §3.4](../spec/04-后端与API.md) |
| **机读** | `bash scripts/run-check-04-routes.sh` · `python registry/validate-spec-path-dependencies-registry.py` |
| **① GO** | 04 ↔ routes.ts ↔ Rust 路由 三方一致 |
| **② GO** | staging BFF 与 API 同形 JSON（如 publish-summary） |
| **③ GO** | 发版 tip 契约 **冻结** 声明 |
| **NO-GO** | 文档路径与实现矛盾且未标 backlog |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D29-1 | run-check-04-routes exit 0 | ☐ | ☐ | ☐ |
| D29-2 | `lib/api.ts` 与 `api/routes.ts` 同批 gate | ☐ | ☐ | ☐ |
| D29-3 | FREEZE README 与代码 layout 无分叉 | ☐ | ☐ | ☐ |
| D29-4 | BFF upstream-first 字段与 Rust handler 同形 | ☐ | ☐ | ☐ |

---

## D30 · Cache & Refresh · 缓存与刷新一致性 {#d30-cache-refresh}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | [LANDING-MARKET-PAGES-CODE-SSOT](../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · `traveltrust:auth-change` |
| **机读** | `run-web3-itinerary-l5-green.sh` · vitest market/favorites |
| **① GO** | 登录/登出后 Me/市场 **刷新** 一致；localStorage SSOT 明确 |
| **② GO** | 跨 tab `storage` 事件或 refetch；收藏 F-020 SLA |
| **③ GO** | CDN/SSR 缓存策略与订单状态 **不** 长期脏读 |
| **NO-GO** | 登出后仍显示上一用户订单 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D30-1 | 登出 → `/api/v1/me` 401 + UI 未登录 | ☐ | ☐ | ☐ |
| D30-2 | `useMarketPage` debounce 300ms 无 stale 风暴 | ☐ | ☐ | ☐ |
| D30-3 | publish-summary 切换 identity 后计数更新 | ☐ | ☐ | ☐ |
| D30-4 | Admin 列表 Apply 后 URL query 与 applied_filters 一致 | ☐ | ☐ | ☐ |

---

## D31 · Soft Delete Lifecycle · 删除/归档生命周期 {#d31-soft-delete-lifecycle}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | merchant-listings archive · orders cancelled · community 下架 |
| **机读** | provider workbench smoke · community moderation IT |
| **① GO** | archive 后列表不可公开发现；draft delete 不可恢复（或契约明确） |
| **② GO** | PG 行状态与 GET 列表一致 |
| **③ GO** | 合规保留期 + 硬删策略 Owner 签字 |
| **NO-GO** | 归档 listing 仍在 discover 出现 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D31-1 | archivePublished 后 GET listings 无 published 行 | ☐ | ☐ | ☐ |
| D31-2 | 订单 cancelled 不出现在 traveler 有效列表 | ☐ | ☐ | ☐ |
| D31-3 | Admin suspend acquisition listing 传播到 market | ☐ | ☐ | ☐ |
| D31-4 | 社区帖下架后 Feed 不可见 | ☐ | ☐ | ☐ |

---

## D32 · Money Flow · 资金流与托管状态机 {#d32-money-flow}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [ORDER-ESCROW-DISPUTE-DEEP-AUDIT](./ORDER-ESCROW-DISPUTE-DEEP-AUDIT-REPORT.md) · [53 状态机](../spec/53-阶段开发技术文档.md) · onboarding fee |
| **机读** | `bash scripts/dev/run-order-escrow-dispute-deep-audit.sh` · `smoke-ab-core-chain.sh` |
| **① GO** | 创单→支付/mock-pay→订单状态可读；无「无状态跳转」 |
| **② GO** | 测试网 escrow sync 与 PG 对拍 |
| **③ GO** | 真 PSP + 主网 release 四方一致 |
| **NO-GO** | 未支付显示 escrowed；金额可双花 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D32-1 | OED audit 无 P0 | ☐ | ☐ | ☐ |
| D32-2 | B-ORD P0 链 93 PASS | ☐ | ☐ | ☐ |
| D32-3 | onboarding quote→paid→role 金额一致 | ☐ | ☐ | ☐ |
| D32-4 | chain-sync-status 与 UI 状态标签一致 | ☐ | ☐ | ☐ |
| D32-5 | 争议 opening 不绕过托管余额 | ☐ | ☐ | ☐ |

---

## D33 · Trust & Reputation · 信誉与评分体系 {#d33-trust-reputation}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（门闸字段错误 **P0**） |
| **SSOT** | [IDENTITY-TRUST-GOVERNANCE-DEEP-AUDIT](./IDENTITY-TRUST-GOVERNANCE-DEEP-AUDIT-REPORT.md) · `/did-rank` · `GET /me.trust` |
| **机读** | `run-identity-trust-governance-deep-audit.sh` · `trust-gate-chain-audit.py` |
| **① GO** | trust-gate seed + guide 可见性门闸 |
| **② GO** | staging ITG PASS；C12 DID 互链 |
| **③ GO** | 声誉算法变更须 ADR + 回滚 |
| **NO-GO** | 低 trust 账号 bypass acquisition bond |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D33-1 | ITG findings 无 P0 | ☐ | ☐ | ☐ |
| D33-2 | acquisition_publish_gate 负例拦截 | ☐ | ☐ | ☐ |
| D33-3 | `/did-rank` 与 trust 投影不矛盾 | ☐ | ☐ | ☐ |
| D33-4 | 评价/评分写后只读一致 | ☐ | ☐ | ☐ |

---

## D34 · Governance Attack Surface · 治理攻击面 {#d34-governance-attack-surface}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（主网 **P0**） |
| **SSOT** | governance proposals/delegate/rewards · [TT-PHASE2-GOVERNANCE-STACK](./TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md) |
| **机读** | `bash scripts/dev/l5-bg-governance-audit.sh` · `governance-matrix-local-gate.sh` |
| **① GO** | 非 steward 不能 submit 非法 proposal；delegate 只读边界 |
| **② GO** | Sepolia broadcast **仅** chain_id=11155111 + Owner |
| **③ GO** | 主网治理 **timelock/multisig** 证据 |
| **NO-GO** | 单用户可无限 mint 投票权 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D34-1 | governance-matrix-local-gate exit 0 | ☐ | ☐ | ☐ |
| D34-2 | l5-bg-governance-audit exit 0 | ☐ | ☐ | ☐ |
| D34-3 | TTG stake 与工作台 seat 状态一致 | ☐ | ☐ | ☐ |
| D34-4 | 无裸 `forge broadcast` 绕过 pregate | ☐ | ☐ | ☐ |

---

## D35 · Admin Blast Radius · 管理员影响面 {#d35-admin-blast-radius}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [ADMIN-SECURITY-CLOSURE](./ADMIN-SECURITY-CLOSURE-REPORT.md) · approvals · 2FA policy |
| **机读** | `bash scripts/dev/run-admin-mutating-actions-audit.sh` |
| **① GO** | 每个 mutating admin action 可映射 **approval 或 audit** |
| **② GO** | staging 2FA policy 与 capabilities 一致 |
| **③ GO** | 生产 **双人复核** + blast radius runbook |
| **NO-GO** | 单点 super_admin 无审计批量删数据 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D35-1 | AMWA exit 0 · 无 unmapped mutating | ☐ | ☐ | ☐ |
| D35-2 | suspend/ban/role-change 全留 audit | ☐ | ☐ | ☐ |
| D35-3 | Admin 误操作可回滚或补偿路径文档化 | ☐ | N/A | ☐ |
| D35-4 | `/admin/permissions` production safety panel 警告可见 | ☐ | ☐ | ☐ |

---

## D36 · Audit Log Completeness · 审计日志完整性 {#d36-audit-log-completeness}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | `admin_audit_logs` · `/admin/audit` · `insert_admin_audit_log` |
| **机读** | AMWA + `GET /api/v1/admin/audit-logs` 抽样 |
| **① GO** | 变异操作 **100%** 有 log 行（action/actor/resource） |
| **② GO** | staging 与 prod schema 一致；筛选可复现 |
| **③ GO** | 不可篡改存储/WORM 或等价 |
| **NO-GO** | 成功 suspend 无 audit 行 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D36-1 | run-admin-mutating-actions-audit 全覆盖 | ☐ | ☐ | ☐ |
| D36-2 | audit log detail 链回 list filter | ☐ | ☐ | ☐ |
| D36-3 | auth_audit_events 与 admin_audit 分工清晰 | ☐ | ☐ | ☐ |
| D36-4 | 时钟 skew 不影响排序可追溯 | ☐ | ☐ | ☐ |

---

## D37 · Customer Support Recoverability · 客服可追溯性 {#d37-customer-support-recoverability}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | [ops/RUNBOOK](../../ops/RUNBOOK.md) · x-request-id · order_id/user_id |
| **机读** | 手验：API 响应头 + admin 检索 |
| **① GO** | 任意失败请求可 grep `x-request-id` |
| **② GO** | staging 工单演练：id → audit → order |
| **③ GO** | on-call  Runbook P0 九项填实 |
| **NO-GO** | 生产投诉无法关联请求链 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D37-1 | API 日志含 x-request-id（启用时） | ☐ | ☐ | ☐ |
| D37-2 | Admin 可按 user_id/order_id 检索 | ☐ | ☐ | ☐ |
| D37-3 | 支付/争议工单字段 SSOT 文档化 | ☐ | ☐ | ☐ |
| D37-4 | PII 脱敏导出流程 | N/A | ☐ | ☐ |

---

## D38 · Disaster Recovery · 容灾恢复 {#d38-disaster-recovery}

| 项 | 值 |
|----|-----|
| **风险** | **P0（③）** |
| **SSOT** | [PHASE3-PRODUCTION-PREPARATION](./PHASE3-PRODUCTION-PREPARATION.md) · PI3-001 |
| **机读** | `bash scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh` |
| **① GO** | DR runbook 可读；脚本存在 |
| **② GO** | staging 故障切换桌演 **有记录** |
| **③ GO** | Fly DR + RTO/RPO 达标 Owner 签字 |
| **NO-GO** | ③ 无 DR 演练证据 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D38-1 | PI3-001 gate exit 0（③） | N/A | ☐ | ☐ |
| D38-2 | API/Indexer 降级模式文档化 | ☐ | ☐ | ☐ |
| D38-3 | 多 AZ/区域策略（若适用） | N/A | ☐ | ☐ |
| D38-4 | 链 RPC 多提供商 failover | N/A | ☐ | ☐ |

---

## D39 · Backup & Restore · 备份恢复 {#d39-backup-restore}

| 项 | 值 |
|----|-----|
| **风险** | **P0（③）** |
| **SSOT** | B-475 · `evidence/b475_pg_backup_pitr_baseline/` |
| **机读** | `bash scripts/dev/run-phase3-db-restore-drill-prod.sh` · `check-b475-pg-backup-pitr-baseline-record.py` |
| **① GO** | 本地 pg_dump 恢复演练 **可选** |
| **② GO** | staging 备份可列出 + 测试 restore |
| **③ GO** | PITR 恢复 **exit 0** + 基线 record |
| **NO-GO** | 无 fly backup list 输出 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D39-1 | `fly postgres backup list` 非空（③） | N/A | ☐ | ☐ |
| D39-2 | restore drill 后 migration 版本一致 | N/A | ☐ | ☐ |
| D39-3 | MinIO/community 媒体备份策略 | ☐ | ☐ | ☐ |
| D39-4 | 链上状态 **不** 仅依赖 DB 单点 | ☐ | ☐ | ☐ |

---

## D40 · Dependency Risk · 第三方依赖风险 {#d40-dependency-risk}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（关键 PSP/RPC **P0**） |
| **SSOT** | [96-03](../spec/96-03-安全密钥与供应链.md) · registry/spec-path-dependencies |
| **机读** | `validate-spec-path-dependencies-registry.py` · `npm audit` / `cargo audit`（按需） |
| **① GO** | 无已知 Critical 未记账；Stripe/RPC 版本锁定 |
| **② GO** | staging 与 prod 依赖清单一致 |
| **③ GO** | SBOM + 漏洞响应 SLA |
| **NO-GO** | 生产用 abandoned 库无替代计划 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D40-1 | spec-path registry exit 0 | ☐ | ☐ | ☐ |
| D40-2 | `.env.example` 与 96-03 密钥类对拍 | ☐ | ☐ | ☐ |
| D40-3 | GitHub Actions 欠费不冒充验收（本地绿留痕） | ☐ | ☐ | ☐ |
| D40-4 | 第三方 ToS 变更跟踪 | N/A | ☐ | ☐ |

---

## D41 · Wallet Boundary · 钱包与私钥边界 {#d41-wallet-boundary}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [35 钱包与 DApp](../spec/35-钱包与DApp集成.md) · wallet-verify · `.env` 无 pk |
| **机读** | post-start wallet-verify 探针 · grep 仓库无 `PRIVATE_KEY` 进 FE |
| **① GO** | 仅 `NEXT_PUBLIC_*` 进前端；签名在用户钱包 |
| **② GO** | 测试网 chainId 不匹配拒绝签名 |
| **③ GO** | 托管/KMS 策略；Anvil pk **不进** prod |
| **NO-GO** | FE bundle 含私钥或助记词 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D41-1 | wallet-verify challenge/confirm 401 未登录 | ☐ | ☐ | ☐ |
| D41-2 | Escrow 高级区仅 DEV_TOOLS env | ☐ | ☐ | ☐ |
| D41-3 | MetaMask 网络切换提示 i18n 存在 | ☐ | ☐ | ☐ |
| D41-4 | 服务端不持久化用户私钥 | ☐ | ☐ | ☐ |

---

## D42 · Chain Failure Handling · 链上异常处理 {#d42-chain-failure-handling}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC](./TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC.md) · indexer · chain-sync-status |
| **机读** | OED · `/admin/observability` · indexer reconcile |
| **① GO** | RPC 失败 UI/API **不** 假成功；indexer REPLAY 可观测 |
| **② GO** | 测试网 reorg 演练或文档 |
| **③ GO** | 熔断 + 人工介入 runbook |
| **NO-GO** | chain-sync 永久 pending 无提示 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D42-1 | `GET orders/:id/chain-sync-status` 诚实态 | ☐ | ☐ | ☐ |
| D42-2 | INDEXER_REPLAY_REQUIRED 启动日志 | ☐ | ☐ | ☐ |
| D42-3 | finalize/reorg 策略与 FINALITY_N 一致 | ☐ | ☐ | ☐ |
| D42-4 | 用户可读错误非 500 裸栈 | ☐ | ☐ | ☐ |

---

## D43 · Cross-Chain Consistency · 跨链一致性 {#d43-cross-chain-consistency}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（多链宣称未实现 **P0**） |
| **SSOT** | `GET /meta` · root `.env` CHAIN_ID · frontend `NEXT_PUBLIC_*` |
| **机读** | `sync-frontend-env-local-from-root.*` · go-live §1.2 |
| **① GO** | meta.chain_id === 部署 Anvil/本地链 |
| **② GO** | Sepolia 单链 staging；无混链地址 |
| **③ GO** | 主网地址集与 indexer chain_id 一致 |
| **NO-GO** | UI 显示 chain A、tx 发 chain B |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D43-1 | meta vs .env CHAIN_ID 对拍 | ☐ | ☐ | ☐ |
| D43-2 | 合约地址前后端一致 | ☐ | ☐ | ☐ |
| D43-3 | 未支持跨链桥 **不** 暗示已通 | ☐ | ☐ | ☐ |
| D43-4 | bridge 若启用须单独立项 SSOT | N/A | N/A | ☐ |

---

## D44 · Economic Attack Model · 经济攻击与女巫防护 {#d44-economic-attack-model}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（资金类 **P0**） |
| **SSOT** | rate limit · acquisition bond · growth_fraud_scan · onboarding 不退费 |
| **机读** | CDIA · community 反刷 · API 429 契约 |
| **① GO** | 429 + retry_after 生效；注册/发帖限流 |
| **② GO** | staging fraud scan 跑通 |
| **③ GO** | 主网经济参数 Owner 签字 |
| **NO-GO** | 零成本批量刷 entitlement |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D44-1 | CRITICAL_WRITE_RATE_LIMIT 生产态启用（③） | ☐ | ☐ | ☐ |
| D44-2 | acquisition bond 不足不能 publish | ☐ | ☐ | ☐ |
| D44-3 | referral/airdrop 规则防自推自领 | ☐ | ☐ | ☐ |
| D44-4 | Sybil 多账号同 wallet 策略 | ☐ | ☐ | ☐ |

---

## D45 · Real User Journey · 真实用户端到端旅程 {#d45-real-user-journey}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（CUJ FAIL **② NO-GO**） |
| **SSOT** | [ENTERPRISE-SITE-10](./ENTERPRISE-SITE-10-L5-MATRIX.md) · PES RUJR · [L5-CROSS-ROLE-REALITY](../frontend/evidence/L5-CROSS-ROLE-REALITY-AUDIT-FINDINGS-MATRIX.md) |
| **机读** | `bash scripts/dev/run-enterprise-site-10-local.sh` · `l5-pe-user-journey-audit.sh` · `frontend/e2e/pes-real-user-journey-review.spec.ts` |
| **① GO** | site-10 或等价 CUJ smoke exit 0 |
| **② GO** | staging C10 类 CUJ + 截图 |
| **③ GO** | 生产 Shadow Launch / CUJ 签字 |
| **NO-GO** | 仅 API 绿、无浏览器 CUJ |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D45-1 | run-enterprise-site-10-local（或 SKIP_E2E 子集） | ☐ | ☐ | ☐ |
| D45-2 | l5-pe-user-journey-audit exit 0 | ☐ | ☐ | ☐ |
| D45-3 | 五角色 reality matrix 无 P0 UX 断点 | ☐ | ☐ | ☐ |
| D45-4 | 注册→Hub→publish→workbench→order 单会话可走通 | ☐ | ☐ | ☐ |
| D45-5 | 移动端 44px 触控关键 CTA（RUJR 抽检） | ☐ | ☐ | ☐ |

---

## §11 · 上线前极限边界维度 D46–D60 {#tt-full-audit-extreme-d46-d60}

> **不替代 D01–D45**；聚焦 **路由完整性、体验兜底、合规与真人验收**。**Phase ② 开工硬前提：** 本段全部 **P0 维 ① 列 PASS**（见 [§3.1 U12](#tt-full-audit-phase-upgrade-gates)）。

### §11.0 · 极限边界一键审计（① → U12 推荐） {#tt-full-audit-extreme-one-shot}

```bash
# 仓库根 — 唯一总闸（推荐 · 含 §10 + §11 + §12）
bash scripts/dev/run-full-system-audit-master-gate.sh

# §11 子集（D46–D60 · 不含 D61–D76）
bash scripts/dev/run-full-system-audit-phase12-gate.sh

# 可选：跳过 Phase1 总验收（仅调试 bundle，禁止冒充 U12-1）
# SKIP_GO_LOCAL_PHASE1=1 bash scripts/dev/run-full-system-audit-phase12-gate.sh

# 可选：跳过 site-10 重跑（仍须 D60 手验矩阵留痕）
# SKIP_SITE10=1 bash scripts/dev/run-full-system-audit-phase12-gate.sh

# 分维深扫（与上列并联，非替代）
bash scripts/run-check-04-routes.sh
python scripts/check-spec93-routes-vs-app.py          # 默认 WARN；ENFORCE=1 → exit 1
bash scripts/dev/l5-pe-mobile-responsive-audit.sh
bash scripts/dev/l5-pe-accessibility-audit.sh
bash scripts/dev/smoke-account-nav-full-local.sh
python scripts/dev/cross-domain-integration-audit.py  # D55 幂等 · 须 API
bash scripts/dev/run-five-role-full-chain-audit.sh    # ② 默认真 staging；① 设 FRCA_API_BASE=http://127.0.0.1:8080
```

**成功判据（① U12）：** `run-full-system-audit-phase12-gate.sh` **exit 0**；末行 **`TT_FULL_SYSTEM_AUDIT_PHASE12: READY`**；**D60** 须附 **五角色手验矩阵**（模板见 §11.1）。

---

### §11.1 · 单维记录模板（D46–D60 · 与 §10.1 同构）

```markdown
### Dxx · <维度名> · YYYY-MM-DD
- **阶段 / 环境：** ① local | ② staging | ③ prod
- **风险等级：** P0 | P1
- **SSOT：** <path>
- **机读：** <script> → exit 0 / findings.json
- **维内结论：** GO | CONDITIONAL | NO-GO
- **P0 开放项：** —
- **证据：** evidence/GO_YYYYMMDD/full-system-audit/dxx/
```

---

## D46 · Route Ownership & Dead Link · 全路由归属/死链/废弃入口 {#d46-route-ownership-dead-link}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [04 §3.4](../spec/04-后端与API.md) · [96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md) · [13-1 表2](../spec/13-1-UI产品级SSOT与页面规范.md) |
| **机读** | `bash scripts/run-check-04-routes.sh` · `python scripts/check-spec93-routes-vs-app.py` · `bash scripts/dev/smoke-community-c11-staging-route-gate.sh`（②） |
| **① GO** | 04 API 挂载 + FE `page.tsx` 对拍 exit 0；Hub/顶栏 **无** 指向 404 的主链 Link |
| **② GO** | staging C11 route gate；废弃路由 **410/redirect** 或从 nav 移除 |
| **③ GO** | 生产路由表 **冻结**；变更须 04+96-20 同批 |
| **NO-GO** | 注册/下单/托管主链存在死链；93 §5 路径无 page 且未登记 BLOCKED |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D46-1 | `run-check-04-routes.sh` exit 0 | ☐ | ☐ | ☐ |
| D46-2 | `check-spec93-routes-vs-app.py` 无未登记 orphan（或 ENFORCE=1 PASS） | ☐ | ☐ | ☐ |
| D46-3 | 五主/Hub/工作台 nav href 手验无 404 | ☐ | ☐ | ☐ |
| D46-4 | `archive/` · 废弃入口 **不** 出现在生产 nav | ☐ | ☐ | ☐ |

---

## D47 · Error Boundary & Fallback · 错误边界/空态/降级 {#d47-error-boundary-fallback}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | 各域 `app/*/error.tsx` · `loading.tsx` · [86 §6](../spec/86-UI-双系统未来风-风格与动效技术规格.md) · `ConsumerSurfaceStatePanel` |
| **机读** | 段级清单 grep · `bash scripts/dev/l5-pe-accessibility-audit.sh`（`role="alert"`） |
| **① GO** | `/` · `/auth/*` · `/me/*` · `/admin` · `/escrow` · `/provider` 有 error 边界或等价壳 |
| **② GO** | staging 强制 500/404 探针 → 用户可读降级（非白屏） |
| **③ GO** | 生产 error 不泄露栈/密钥；on-call 可关联 request-id |
| **NO-GO** | 发布中心/订单页 throw 导致整站白屏；空列表无 empty 态 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D47-1 | 关键域 `error.tsx` 存在且 L5 壳一致 | ☐ | ☐ | ☐ |
| D47-2 | API 失败 → inline error / toast（非 infinite loading） | ☐ | ☐ | ☐ |
| D47-3 | 空态 copy 与 i18n 键一致（market/orders/inbox） | ☐ | ☐ | ☐ |
| D47-4 | `global-error` / root error 可 Retry | ☐ | ☐ | ☐ |

---

## D48 · Form Validation & Dirty State · 表单校验/未保存退出/重复提交 {#d48-form-validation-dirty-state}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [AUTH-REGISTER-UI-FREEZE](../frontend/evidence/GO_local_auth_l5/AUTH-REGISTER-UI-FREEZE.md) · [PROVIDER-REGISTER-UI-FREEZE](../frontend/evidence/GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md) · onboarding 表单 |
| **机读** | `npx vitest run providerRegisterValidation authRegisterL5 loginPageL5` · `smoke-provider-onboarding-local.sh` |
| **① GO** | 必填/格式校验客户端+服务端一致；提交中 button disabled |
| **② GO** | staging 双次 POST 不产生双单（见 D55） |
| **③ GO** | PSP 表单 PCI 边界；生产无 duplicate charge |
| **NO-GO** | 未校验即可提交入驻；重复点击创建多 draft order |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D48-1 | providerRegisterValidation + authRegisterL5 exit 0 | ☐ | ☐ | ☐ |
| D48-2 | 非法 email/phone 负例拦截 | ☐ | ☐ | ☐ |
| D48-3 | 长表单离开页 confirm（dirty）或 autosave 诚实 | ☐ | ☐ | ☐ |
| D48-4 | submit loading 态防连点 | ☐ | ☐ | ☐ |

---

## D49 · Notification & Message Consistency · 站内通知/邮件/Toast {#d49-notification-message-consistency}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | `frontend/locales/*` · `/me/settings/notifications-prefs` · 订单/争议状态机 copy |
| **机读** | `bash scripts/dev/smoke-account-nav-full-local.sh` · 订单状态 vitest 契约 |
| **① GO** | Toast/inline 与订单 API `status` 字段一致；无中英混排硬编码 |
| **② GO** | staging 邮件/webhook 测试模式；通知 prefs 持久化 |
| **③ GO** | 生产 ESP 模板与法务 disclaimer 一致 |
| **NO-GO** | 支付成功 UI 仍显示 pending；同态多文案冲突 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D49-1 | smoke-account-nav 覆盖 settings/notifications | ☐ | ☐ | ☐ |
| D49-2 | 订单/escrow 状态 badge 与 API 对拍 | ☐ | ☐ | ☐ |
| D49-3 | 错误 toast 含可行动 next step | ☐ | ☐ | ☐ |
| D49-4 | Admin 操作 success/error 与 audit 叙事一致 | ☐ | ☐ | ☐ |

---

## D50 · Mobile & Responsive Layout · 移动/平板/窄屏 {#d50-mobile-responsive-layout}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（结账/签约 CTA 不可点 **P0**） |
| **SSOT** | [FIVE-MAIN](../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) layout lock · `touchTargetLink44Classes` |
| **机读** | `bash scripts/dev/l5-pe-mobile-responsive-audit.sh` · RUJR 44px 抽检 |
| **① GO** | 375px 宽主链可完成注册→Hub→market CTA；admin sidebar 折叠 |
| **② GO** | staging iPad 横竖屏无横向溢出 |
| **③ GO** | 生产 RUM 或 CUJ 移动签字 |
| **NO-GO** | 固定宽表撑破 viewport；关键 CTA &lt;44px |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D50-1 | l5-pe-mobile-responsive-audit exit 0 | ☐ | ☐ | ☐ |
| D50-2 | 五主路由 375px 目视无 clip | ☐ | ☐ | ☐ |
| D50-3 | Admin shell mobile nav fold 可用 | ☐ | ☐ | ☐ |
| D50-4 | Escrow/订单 primary action 触控达标 | ☐ | ☐ | ☐ |

---

## D51 · Browser Compatibility · Chrome/Safari/Firefox/Edge {#d51-browser-compatibility}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（支付/Web3 **P0** 于 ③） |
| **SSOT** | `frontend/playwright.config.ts` · `e2e/admin-frontend-deep-audit-browser.spec.ts` |
| **机读** | `bash scripts/dev/run-admin-frontend-deep-audit.sh`（browser leg）· Playwright `--project=firefox|webkit` |
| **① GO** | Chromium CUJ smoke pass；无 webkit-only API 未 polyfill |
| **② GO** | staging 四浏览器 smoke 或 AFDA browser matrix 无 P0 |
| **③ GO** | 生产 analytics 浏览器分布与 supported 声明一致 |
| **NO-GO** | Safari 无法登录/签名；Edge 下 layout 崩 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D51-1 | playwright.config 含 chromium+firefox+webkit | ☐ | ☐ | ☐ |
| D51-2 | 登录/注册/Cookie 在 webkit 本地 smoke | ☐ | ☐ | ☐ |
| D51-3 | AFDA browser matrix 无 unreachable admin P0 | ☐ | ☐ | ☐ |
| D51-4 | wallet connect 浏览器矩阵文档化 | ☐ | ☐ | ☐ |

---

## D52 · Timezone & Date Lifecycle · 时区/日期/过期/跨日/链上时间 {#d52-timezone-date-lifecycle}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | `GET /api/v1/meta` · 行程/itinerary 日期字段 · escrow finality · [14](../spec/14-合约ABI与前端对齐.md) block time |
| **机读** | meta 探针 · OED 日期字段 · `chain-sync-status` |
| **① GO** | API 时间戳 UTC 存储；UI 显示与用户 locale 一致且可预期 |
| **② GO** | staging 跨日订单/档期边界 IT |
| **③ GO** | 生产 TZ 政策 + 链上 finality 与 UI 倒计时一致 |
| **NO-GO** | 行程跨日显示错日；链上 confirmed 仍显示 pending 无限 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D52-1 | meta/build 含诚实 server time 或 UTC 约定 | ☐ | ☐ | ☐ |
| D52-2 | 订单/escrow 过期态与后端一致 | ☐ | ☐ | ☐ |
| D52-3 | guide 档期跨 timezone 不 double-book | ☐ | ☐ | ☐ |
| D52-4 | chain-sync block time vs wall clock 文档化 | ☐ | ☐ | ☐ |

---

## D53 · Media Upload & CDN Lifecycle · 图片视频/CDN/违规媒体 {#d53-media-upload-cdn-lifecycle}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（违规内容 bypass **P0**） |
| **SSOT** | [COMMUNITY-L5-SYSTEM-AUDIT](../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-L5-SYSTEM-AUDIT.md) · `POST .../upload-media` |
| **机读** | `bash scripts/dev/smoke-community-c2-staging-upload.sh`（②）· C4/C5 evidence 脚本 |
| **① GO** | MIME/大小负例 4xx；假文件头拒绝 |
| **② GO** | staging CDN URL 可达；删除/下架后链接失效 |
| **③ GO** | 违规媒体审核队列 + DMCA 流程 |
| **NO-GO** | 任意扩展名可上传 executable；删除帖媒体仍公开 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D53-1 | upload-media 负例（空/fake/wrong MIME） | ☐ | ☐ | ☐ |
| D53-2 | 图片/视频播放器 C4/C5 证据路径 | ☐ | ☐ | ☐ |
| D53-3 | 用户删帖后 media URL 不可访问 | ☐ | ☐ | ☐ |
| D53-4 | CDN cache invalidation 文档化 | N/A | ☐ | ☐ |

---

## D54 · Search Filter Pagination · 搜索/筛选/分页/排序/空结果 {#d54-search-filter-pagination}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | [LANDING-MARKET-PAGES-CODE-SSOT](../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · `useMarketPage` 300ms debounce |
| **机读** | `bash scripts/dev/run-web3-itinerary-l5-green.sh` · market vitest |
| **① GO** | discover 筛选/分页/排序与 API query 一致；空结果有 empty 态 |
| **② GO** | staging 大数据集分页性能可接受 |
| **③ GO** | 生产搜索 SLA 与空结果 SEO 诚实 |
| **NO-GO** | 筛选后仍显示全量；页码与 API offset 漂移 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D54-1 | useMarketPage debounce + getDiscoverOrders 对拍 | ☐ | ☐ | ☐ |
| D54-2 | 子站 PG catalog 筛选与 MARKET-L5 一致 | ☐ | ☐ | ☐ |
| D54-3 | admin 列表分页 filter 可复现 | ☐ | ☐ | ☐ |
| D54-4 | 空结果 copy 与 i18n 一致 | ☐ | ☐ | ☐ |

---

## D55 · Idempotency & Double-Click · 幂等/重复支付/重复下单 {#d55-idempotency-double-click}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [04 附录 Idempotency-Key](../spec/04-后端与API.md) · [onboarding-fee-schedule R2](../spec/artifacts/onboarding-fee-schedule.v1.md) |
| **机读** | `python scripts/dev/cross-domain-integration-audit.py` · post-start `idempotency_cache` 探针 |
| **① GO** | 重放同一 Idempotency-Key → 409/同结果；UI 连点不双 POST |
| **② GO** | staging PSP test 幂等 replay |
| **③ GO** | 生产 charge idempotency + 对账 |
| **NO-GO** | 双次下单双扣款；bond 幂等失败双扣 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D55-1 | CDIA 幂等用例 PASS | ☐ | ☐ | ☐ |
| D55-2 | POST 写接口支持 Idempotency-Key 文档一致 | ☐ | ☐ | ☐ |
| D55-3 | 支付/下单 button disabled 至响应 | ☐ | ☐ | ☐ |
| D55-4 | onboarding 同 key 重放 narrative 符合 R2 | ☐ | ☐ | ☐ |

---

## D56 · Rate Limit & Abuse Protection · 限流/刷接口/机器人 {#d56-rate-limit-abuse-protection}

| 项 | 值 |
|----|-----|
| **风险** | **P0**（与 **D20** 并联） |
| **SSOT** | [96-03](../spec/96-03-安全密钥与供应链.md) · `GET /meta` `rate_limits` · growth anti-fraud |
| **机读** | meta 探针 · `growth_fraud_scan` · API 429 契约测试 |
| **① GO** | 本地可开 `TRAVELTRUST_STRICT_API_RATE_LIMIT=1` 验证 429；注册/发帖有限流 |
| **② GO** | staging 429 + Retry-After；fraud scan 跑通 |
| **③ GO** | 生产 WAF/bot 防护 + CRITICAL_WRITE 限流启用 |
| **NO-GO** | 无限刷 POST 写接口；referral 自刷自领 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D56-1 | meta.rate_limits 字段诚实（非永久 0 冒充生产） | ☐ | ☐ | ☐ |
| D56-2 | 429 响应含 retry 叙事 | ☐ | ☐ | ☐ |
| D56-3 | growth anti-fraud rules + scan-runs 可达 | ☐ | ☐ | ☐ |
| D56-4 | 爬虫/scrape 敏感列表有 throttle | ☐ | ☐ | ☐ |

---

## D57 · Privacy & Data Minimization · 隐私/导出/删号 {#d57-privacy-data-minimization}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | `/me/settings/privacy` · `/me/settings/data` · [P3 账户导航](../frontend/evidence/GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md) |
| **机读** | `bash scripts/dev/smoke-account-nav-full-local.sh` |
| **① GO** | 隐私 toggles 持久化；数据页诚实说明采集范围 |
| **② GO** | staging 导出/删号流程演练（或 BLOCKED 台账） |
| **③ GO** | GDPR/删号 **Owner 签字** + 保留期政策 |
| **NO-GO** | 隐藏 PII 仍公开 API 返回；无删号路径却宣称合规 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D57-1 | settings/privacy + settings/data 路由可达 | ☐ | ☐ | ☐ |
| D57-2 | 获赞隐藏等 toggle 与 API 一致 | ☐ | ☐ | ☐ |
| D57-3 | 导出请求可追踪（或明确 N/A） | ☐ | ☐ | ☐ |
| D57-4 | 删号/anon 流程文档化 | N/A | ☐ | ☐ |

---

## D58 · Legal Compliance & Terms · 条款/退款/地区限制 {#d58-legal-compliance-terms}

| 项 | 值 |
|----|-----|
| **风险** | **P1（③ P0）** |
| **SSOT** | `/terms` · `/privacy` · `/terms/community-guidelines` · go-live 法务包 |
| **机读** | 路由存在性 · 63 烟雾 community guidelines · go-live §法务 |
| **① GO** | 条款/隐私/社区规范页可达；footer/注册 consent 链接正确 |
| **② GO** | staging 法务稿版本号与 locales 一致 |
| **③ GO** | 退款规则/免责声明/地区限制 **Owner 签字** |
| **NO-GO** | ③ 无 disclaimer 仍收款；受限地区无 gate |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D58-1 | `/terms` `/privacy` `/terms/community-guidelines` 200 | ☐ | ☐ | ☐ |
| D58-2 | 注册/结账附近 consent 链条款 | ☐ | ☐ | ☐ |
| D58-3 | 退款/争议政策与 OED 叙事一致 | ☐ | ☐ | ☐ |
| D58-4 | 地区限制（若启用）gate 诚实 | N/A | ☐ | ☐ |

---

## D59 · Analytics & Event Tracking · 埋点/漏斗/审计事件 {#d59-analytics-event-tracking}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | page-brief `analytics_events` v6 · `/admin/growth/analytics` · ROV-T3 |
| **机读** | `post-start-api-abi-smoke.ps1` page-brief 段 · `bash scripts/ops/rov-wave1-t3-growth-funnel.sh`（②） |
| **① GO** | page-brief 7 v6 events 契约 PASS；Admin analytics API 200 |
| **② GO** | staging funnel/overview 与 ROV 证据一致 |
| **③ GO** | 生产 BI 与 privacy 最小化对拍 |
| **NO-GO** | 转化漏斗关键步无 event；Admin 数与 FE 不一致 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D59-1 | page-brief analytics_events 7 项 PASS | ☐ | ☐ | ☐ |
| D59-2 | CTA click 事件命名 SSOT 一致 | ☐ | ☐ | ☐ |
| D59-3 | admin growth analytics overview/funnel 200 | ☐ | ☐ | ☐ |
| D59-4 | 审计事件不含明文 PII | ☐ | ☐ | ☐ |

---

## D60 · Final Human Acceptance Matrix · 真人验收矩阵 {#d60-final-human-acceptance-matrix}

| 项 | 值 |
|----|-----|
| **风险** | **P0**（② CUJ **NO-GO** 驱动） |
| **SSOT** | [L5-CROSS-ROLE-REALITY](../frontend/evidence/L5-CROSS-ROLE-REALITY-AUDIT-FINDINGS-MATRIX.md) · [ENTERPRISE-SITE-10](./ENTERPRISE-SITE-10-L5-MATRIX.md) · P2HA manifest |
| **机读** | `bash scripts/dev/run-enterprise-site-10-local.sh` · `bash scripts/dev/run-five-role-full-chain-audit.sh` · `bash scripts/dev/record-phase2-human-acceptance-sprint-evidence.sh`（②） |
| **① GO** | **六 persona** 手验矩阵 signed：游客 · 旅行者 · 向导 · 商家 · 主理人 · 管理员 · **多身份**（`multi-demo@test.com`）全路径 **无 P0 断点** |
| **② GO** | P2HA manifest **`TT_PHASE2_HUMAN_ACCEPTANCE_SPRINT: OK`** · phase28 HAT |
| **③ GO** | Shadow Launch / Production CUJ **Owner 双签** |
| **NO-GO** | 仅 API 绿无浏览器；任一角色的注册→退出主链不可完成 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D60-1 | site-10 或等价 CUJ smoke exit 0 | ☐ | ☐ | ☐ |
| D60-2 | 五角色 FRCA 矩阵 **无 P0**（① 本地 API 探针 + 手验列） | ☐ | ☐ | ☐ |
| D60-3 | multi-demo 多身份切换 Hub→publish→workbench 手验 | ☐ | ☐ | ☐ |
| D60-4 | steward + admin 治理/后台路径手验 | ☐ | ☐ | ☐ |
| D60-5 | 真人签字表归档 `evidence/.../human-acceptance/` | ☐ | ☐ | ☐ |

**① 手验矩阵模板（复制到证据目录）：**

| Persona | 注册/登录 | Hub/身份 | 核心工作台 | 下单/托管 | 退出 | ① 签字 |
|---------|-----------|----------|------------|-----------|------|--------|
| 游客 | N/A | 浏览 `/` `/market` | — | — | — | ☐ |
| 旅行者 | ☐ | `/me/identities` | orders | escrow draft | ☐ | ☐ |
| 向导 | ☐ | guide hat | guide workbench | 档期/接单 | ☐ | ☐ |
| 商家 | merchant seed | publish hub | `/provider` | merchant orders | ☐ | ☐ |
| 主理人 | steward | governance | steward WB | proposal | ☐ | ☐ |
| 管理员 | admin promote | — | `/admin` | audit sample | ☐ | ☐ |
| 多身份 | multi-demo | slot 切换 | 四轨无交叉 | — | ☐ | ☐ |

---

## §12 · 发布治理与运维维度 D61–D76 + DX-01 {#tt-full-audit-release-governance-d61-d76}

> **TravelTrust 全生命周期审计体系 · 发布治理 / 事故响应 / 开发体验 / 运营连续性** 段。**Phase ② 开工** 须本段 **P0 维 ① PASS**（并联 [§3.1 U12](#tt-full-audit-phase-upgrade-gates)）。**Phase ③** 须 **D70 + D69 + D64 + D76** 填实 + **PRODUCTION_GO_DECISION: GO**。

### §12.0 · 发布治理一键审计（① · U12/U23 推荐） {#tt-full-audit-governance-one-shot}

```bash
# 仓库根 — 唯一总闸（含 §10 + §11 + §12）
bash scripts/dev/run-full-system-audit-master-gate.sh

# 仅发布治理段（不跑 site-10 等重项时可 SKIP_SITE10=1 跑 phase12 子集）
bash scripts/dev/run-full-system-audit-governance-gate.sh

# 分维深扫
bash scripts/dev/run-phase3-fly-release-rollback-drill.sh          # D63 ② staging
python scripts/ops/feature_flag_gate_workflow_digest.py verify     # D67
bash scripts/dev-preflight.sh                                      # DX-01 / D62
bash scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh  # D76 ↔ D38
```

**证据包最低要求（每维 ✅）：**

| 要素 | 要求 |
|------|------|
| **路径** | `evidence/GO_YYYYMMDD/full-system-audit/dXX/` 或域 `GO_local_*` |
| **机读** | 脚本 **exit 0** + 末行 grep 锚 |
| **签字** | D61/D70 须 Owner 行；D60/D70 须 persona 矩阵 |
| **环境** | JSON/MD 头 **`environment: local\|staging\|prod`** |
| **升级闸** | 记录表注明关联 **U12-n / U23-n** |

**成功判据（① Master）：** `run-full-system-audit-master-gate.sh` **exit 0** → **`TT_FULL_SYSTEM_AUDIT_MASTER: READY`**

---

### §12.1 · 单维记录模板（D61–D76 + DX-01 · 扩展 §10.1）

```markdown
### Dxx · <维度名> · YYYY-MM-DD
- **阶段 / 环境：** ① local | ② staging | ③ prod
- **风险等级：** P0 | P1
- **SSOT：** <path>
- **机读：** <script> → exit 0
- **维内结论：** GO | CONDITIONAL | NO-GO
- **升级闸关联：** U12-n | U23-n
- **证据包：** evidence/.../ （manifest · log · 签字扫描 optional）
- **P0 开放项 → 96-18：**
```

---

### §12.2 · 升级闸 × 维度映射（摘录）

| 升级闸 | 关联维度 |
|--------|----------|
| U12-3 | 全部 P0 维 ① |
| U12-13 | D61–D63 |
| U12-14 | DX-01 |
| U12-15 | D64、D69 |
| U12-16 | D62、D68 |
| U23-9 | D61–D70、D76 |
| U23-11 | D70 |
| U23-12 | D68、go-live |

---

## D61 · Release Ownership · 模块责任人与签字矩阵 {#d61-release-ownership}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [SOLO-MAINTAINER-SIGNATURE-INDEX](../frontend/evidence/GO_local_phase1/SOLO-MAINTAINER-SIGNATURE-INDEX.md) · [sealed-programs index](./sealed-programs-and-epics-master-index.md) · 各域 FREEZE **Maintainer** |
| **机读** | `test -f frontend/evidence/GO_local_phase1/SOLO-MAINTAINER-SIGNATURE-INDEX.md` · 域 README Owner 行 grep |
| **① GO** | 五主/Auth/Escrow/Provider 等 ACTIVE 域均有 **Product/Engineering/Owner** 签字或 solo 自证 |
| **② GO** | staging 变更 **Release Owner** 书面指定 |
| **③ GO** | Production **Release Authority** 双签矩阵 |
| **NO-GO** | 无主责域发版；FREEZE 域无 Owner 仍改 UI |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D61-1 | SOLO-MAINTAINER 索引可读且与 AGENTS 一致 | ☐ | ☐ | ☐ |
| D61-2 | 动 FREEZE 路径的 PR 须对应域绿集（文档声明） | ☐ | ☐ | ☐ |
| D61-3 | sealed-programs 表与 evidence GO 卷互指无断链 | ☐ | ☐ | ☐ |
| D61-4 | Release 签字表归档 `evidence/.../release-ownership/` | ☐ | ☐ | ☐ |

---

## D62 · Change Management · 变更影响分析与回归覆盖 {#d62-change-management}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [CONTRIBUTING](../../CONTRIBUTING.md) · [R-002](../spec/R-002-回归执行闭环与发布准入.md) · [TT-9628 §0.0.3](./TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-report-json-path-convention) |
| **机读** | `bash scripts/dev-preflight.sh` · `validate-regression-report.py` |
| **① GO** | 变更须声明影响维 + 跑受影响 smoke/vitest |
| **② GO** | staging `report.json` **`environment.name=staging`** |
| **③ GO** | 生产变更 board + R-002 **`--require-go`** |
| **NO-GO** | 宽改无回归；ISS-007 PARTIAL_GO 冒充 staging GO |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D62-1 | CONTRIBUTING pre-push 命令集文档化 | ☐ | ☐ | ☐ |
| D62-2 | 04/14 契约变更同批 `run-check-04-routes` | ☐ | ☐ | ☐ |
| D62-3 | 93 批次 tracker 与变更范围对拍 | ☐ | ☐ | ☐ |
| D62-4 | 变更记录含 **影响维 Dxx 列表** | ☐ | ☐ | ☐ |

---

## D63 · Rollback Readiness · 版本/DB/配置回滚 {#d63-rollback-readiness}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [PRODUCTION-INFRASTRUCTURE-AUDIT](./PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md) · Fly release · sqlx migrate down 政策 |
| **机读** | `bash scripts/dev/run-phase3-fly-release-rollback-drill.sh` · `run-phase3-db-restore-drill-prod.sh` |
| **① GO** | rollback 脚本存在；migrate **仅 forward** 政策文档化 |
| **② GO** | staging Fly 镜像回滚 drill **exit 0** 留痕 |
| **③ GO** | prod rollback + DB restore 双演练 Owner 签字 |
| **NO-GO** | ③ 无 rollback 证据；config 误发布无回滚路径 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D63-1 | `run-phase3-fly-release-rollback-drill.sh` 可执行 | ☐ | ☐ | ☐ |
| D63-2 | catalog-import `rollback.ts` 或等价文档 | ☐ | ☐ | ☐ |
| D63-3 | ② staging rollback 证据 `evidence/.../rollback-drill/` | N/A | ☐ | ☐ |
| D63-4 | 配置/feature flag 回滚与 D67 互指 | ☐ | ☐ | ☐ |

---

## D64 · Incident Response · P0/P1/P2 事故响应 {#d64-incident-response}

| 项 | 值 |
|----|-----|
| **风险** | **P1（③ P0）** |
| **SSOT** | [ops/RUNBOOK §1](../../ops/RUNBOOK.md) · `POST /internal/incident/open` · `/admin/alerts/incidents` |
| **机读** | RUNBOOK 四列 grep · admin incidents 路由存在 |
| **① GO** | 触发表 **①～⑩** 骨架存在；P0/P1/P2 定义文档化 |
| **② GO** | staging 桌演 1 次 + 证据 |
| **③ GO** | on-call 联系人填实；MTTR 目标签字 |
| **NO-GO** | 生产 P0 无值班链；incident 不可创建 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D64-1 | ops/RUNBOOK §1 四列非空骨架 | ☐ | ☐ | ☐ |
| D64-2 | `/admin/alerts/incidents` 可达 | ☐ | ☐ | ☐ |
| D64-3 | x-request-id 关联 D37 工单演练 | ☐ | ☐ | ☐ |
| D64-4 | ② incident drill 证据归档 | N/A | ☐ | ☐ |

---

## D65 · Monitoring Coverage · 业务与基础设施监控 {#d65-monitoring-coverage}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | `/admin/observability` · [173 ROV-01](../handbook/engineering/173-ROV-01-Real-Operations-Validation-Program-Blueprint.md) · indexer health |
| **机读** | `GET /admin/observability/overview` · ROV wave scripts |
| **① GO** | meta · DB · indexer · rate_limits 可观测字段诚实 |
| **② GO** | staging alerts 测试 fire；C8 runbook 证据 |
| **③ GO** | 资金路径 SLO + 告警路由 on-call |
| **NO-GO** | 链同步 pending 无告警；Growth 漏斗断档无发现 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D65-1 | observability overview 200（本地 API+admin） | ☐ | ☐ | ☐ |
| D65-2 | indexer checkpoint/lag 字段可读 | ☐ | ☐ | ☐ |
| D65-3 | ROV-T3 analytics 证据（若跑 ROV） | N/A | ☐ | ☐ |
| D65-4 | 关键业务指标（订单/支付）监控声明 | ☐ | ☐ | ☐ |

---

## D66 · Production Kill Switch · 熔断与降级 {#d66-production-kill-switch}

| 项 | 值 |
|----|-----|
| **风险** | **P0（③）** |
| **SSOT** | [96-18 §11.7](../spec/96-18-商家与主理人准入费用与治理币兑换设计.md) **`ONBOARDING_PAYMENT_INTENTS_DISABLED`** · Pause allowlist · ops/RUNBOOK §1 |
| **机读** | env 开关注册 grep · `503 onboarding_payment_intents_disabled` vitest |
| **① GO** | kill switch **文档化**；本地可模拟 disabled 503 |
| **② GO** | staging 熔断演练（只读/RPC 切换） |
| **③ GO** | 生产 Pause 链 + 批准人填实 |
| **NO-GO** | ③ 无熔断仍收真钱；误配置无法秒级停写 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D66-1 | onboarding payment kill switch 负例可测 | ☐ | ☐ | ☐ |
| D66-2 | RUNBOOK RPC/indexer 降级路径文档化 | ☐ | ☐ | ☐ |
| D66-3 | Admin 只读模式或等价叙事存在 | ☐ | ☐ | ☐ |
| D66-4 | ② 降级桌演证据 | N/A | ☐ | ☐ |

---

## D67 · Feature Flag · 功能开关与环境隔离 {#d67-feature-flag}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [240 Feature Flag](../spec/240-阶段Feature-Flag与灰度系统.md) · `GET/POST /admin/flags` · PG `feature_flags` |
| **机读** | `python scripts/ops/feature_flag_gate_workflow_digest.py verify` · smoke-admin-rbac flags |
| **① GO** | flags API 200；scope/enabled 过滤负例 400 |
| **② GO** | staging publish 乐观锁 409 演练 |
| **③ GO** | prod flag 变更 audit 100% |
| **NO-GO** | 生产开关无 audit；staging/prod flag 混用 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D67-1 | `GET /admin/flags` auth 探针 | ☐ | ☐ | ☐ |
| D67-2 | feature_flag_gate digest verify exit 0 | ☐ | ☐ | ☐ |
| D67-3 | `NEXT_PUBLIC_*` 与 server flag 边界文档化 | ☐ | ☐ | ☐ |
| D67-4 | 秒级回滚叙事与 D63 互指 | ☐ | ☐ | ☐ |

---

## D68 · Release Evidence · 发布证据链与验收包 {#d68-release-evidence}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [08-4 §7 可验证发布](../spec/08-4-对外口径包.md) · [evidence/README](../../evidence/README.md) · ops/RUNBOOK §12.6 |
| **机读** | evidence 目录结构 · `validate-regression-report.py` |
| **① GO** | 每次域 ACTIVE 留 `evidence/GO_*` + exit 0 log |
| **② GO** | staging 包含 `report.json` + git sha + 环境表 |
| **③ GO** | manifest + hash + 可复现构建说明 |
| **NO-GO** | 无证据宣称 GO；环境字段缺失 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D68-1 | evidence/README 索引与 GO 卷一致 | ☐ | ☐ | ☐ |
| D68-2 | 审计记录含 git sha + 命令 exit 0 | ☐ | ☐ | ☐ |
| D68-3 | R-002 report 路径约定遵守 | ☐ | ☐ | ☐ |
| D68-4 | ③ manifest 与 deploy 参数 export 对拍 | N/A | ☐ | ☐ |

---

## D69 · Operational Runbook · DB/RPC/Redis/Indexer/支付故障处置 {#d69-operational-runbook}

| 项 | 值 |
|----|-----|
| **风险** | **P1（③ P0）** |
| **SSOT** | [ops/RUNBOOK §2.55–§2.56](../../ops/RUNBOOK.md) · [COMMUNITY-STAGING-OPS-RUNBOOK](./COMMUNITY-STAGING-OPS-RUNBOOK.md) |
| **机读** | RUNBOOK 章节存在性 · C8 `record-community-c8-evidence.sh` |
| **① GO** | RPC/Indexer/reorg/执行器/token 场景 **①～⑤** 四列骨架 |
| **② GO** | indexer-reconcile curl 模板可执行 |
| **③ GO** | 支付/Stripe webhook 故障 runbook 填实 |
| **NO-GO** | ③ 触发表「批准人」仍占位；无 Redis/DB 处置节 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D69-1 | RUNBOOK §2.55 internal indexer 模板 | ☐ | ☐ | ☐ |
| D69-2 | §12.2 x-request-id 与 D37 一致 | ☐ | ☐ | ☐ |
| D69-3 | 社区 staging ops runbook 安装证据（C8） | N/A | ☐ | ☐ |
| D69-4 | Stripe/PSP 故障节与 go-live §6 互指 | ☐ | ☐ | ☐ |

---

## D70 · Executive Go-No-Go · 最终发布决策与 Top Blockers {#d70-executive-go-no-go}

| 项 | 值 |
|----|-----|
| **风险** | **P0（③ 驱动）** |
| **SSOT** | [PRODUCTION-GO-DECISION-PACKAGE](./PRODUCTION-GO-DECISION-PACKAGE.md) · [go-live-checklist](../go-live-checklist.md#go-decision-entry-point) · PI3-001～006 |
| **机读** | grep `PRODUCTION_GO_DECISION` · `issues-phase3-production.md` |
| **① GO** | 决策包模板存在；当前态 **诚实 NO_GO** 可接受 |
| **② GO** | Top Blockers 清单与 staging 审计同步 |
| **③ GO** | **`PRODUCTION_GO_DECISION: GO`** + Owner 双签 |
| **NO-GO** | ③ 宣称 GO 但 PI3 open；无 Top Blockers 机制 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D70-1 | PRODUCTION-GO-DECISION-PACKAGE 可读 | ☐ | ☐ | ☐ |
| D70-2 | Top Blockers 表（PI3/96-18）无 silent open P0 | ☐ | ☐ | ☐ |
| D70-3 | FINAL_SYSTEM_AUDIT 与 GO 决策权重序一致 | ☐ | ☐ | ☐ |
| D70-4 | Executive 签字扫描或 solo 自证归档 | ☐ | ☐ | ☐ |

---

## DX-01 · Developer Experience · 新开发者 30 分钟启动 {#dx-01-developer-experience}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | 根 [README](../../README.md) · [TT-9618](./TT-9618-onboarding-local-testnet.md) · [start-api-with-seed-README](../scripts/dev/start-api-with-seed-README.md) |
| **机读** | `bash scripts/dev-preflight.sh` · `start-api-with-seed.bat` Step 0–1c 路径 |
| **① GO** | 新开发者 **≤30min** 起 API+FE+PG+seed；测试账号文档化 |
| **② GO** | staging 部署 README 与本地 parity 表 |
| **③ GO** | prod deploy runbook + secrets 隔离说明 |
| **NO-GO** | README 与脚本端口/env 不一致；无 Test123! 种子说明 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DX-01-1 | README「本地开发」链到 TT-9618 / start-api-with-seed | ☐ | ☐ | ☐ |
| DX-01-2 | `.env` / PORT 解析脚本 `_dev_stack_ports` 一致 | ☐ | ☐ | ☐ |
| DX-01-3 | Docker postgres + migrate + seed exit 0 路径 | ☐ | ☐ | ☐ |
| DX-01-4 | CI/CD 可复现：`dev-preflight` 或 CONTRIBUTING 三连 | ☐ | ☐ | ☐ |

---

## D71 · Architecture Drift · SSOT 与实现偏移 {#d71-architecture-drift}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | [TT-9622](./TT-9622-bounded-contexts-layering-and-integration-map.md) · AGENTS.md **代码>文档** · Epic C drift UI |
| **机读** | `bash scripts/run-check-04-routes.sh` · CDIA · admin cross-check |
| **① GO** | 04 路由与代码无 silent drift |
| **② GO** | staging 对拍 `GET /meta` vs env |
| **③ GO** | 契约冻结 + ADR 变更 |
| **NO-GO** | 文档宣称 Implemented 但路由 404 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D71-1 | run-check-04-routes exit 0 | ☐ | ☐ | ☐ |
| D71-2 | TT-9622 边界与 `crates/api` 模块图无矛盾 | ☐ | ☐ | ☐ |
| D71-3 | FREEZE 域代码与 FREEZE.md 一致 | ☐ | ☐ | ☐ |
| D71-4 | Epic C admin drift 矩阵无 P0 | ☐ | ☐ | ☐ |

---

## D72 · Technical Debt · 技术债登记与优先级 {#d72-technical-debt}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | [96-18](../spec/96-18-未完成清单与多维检查.md) · [95 §10.3](../spec/95-全链路生产就绪检查清单与完成度矩阵.md) TODO triage |
| **机读** | 96-18 `#9618-one-page-priority` · 95 evidence bounded scans |
| **① GO** | open P0 有 Owner+期限；TODO triage 有界 PASS |
| **② GO** | staging 前 P0 技术债清零或 CONDITIONAL |
| **③ GO** | 发版前 95 矩阵 P0 闭 |
| **NO-GO** | silent P0 债；ISS 冒充完成 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D72-1 | 96-18 台账与本文 FAIL 项同步 | ☐ | ☐ | ☐ |
| D72-2 | 95 §10.3 TODO/dead_code 有界证据 | ☐ | ☐ | ☐ |
| D72-3 | BLOCKED 项有环境原因 | ☐ | ☐ | ☐ |
| D72-4 | ③ 前 tech debt P0 burn-down 记录 | N/A | ☐ | ☐ |

---

## D73 · Data Retention & Archival · 数据保留与归档 {#d73-data-retention-archival}

| 项 | 值 |
|----|-----|
| **风险** | **P0（③ 合规）** |
| **SSOT** | D31 soft delete · ops/RUNBOOK §9 · GDPR 删号路径 |
| **机读** | merchant-listings archive · orders cancelled 态 |
| **① GO** | 删除/归档语义文档化；audit 保留期声明 |
| **② GO** | staging 归档/恢复演练 |
| **③ GO** | 法定保留期 + 删号 SLA Owner 签字 |
| **NO-GO** | 软删仍公开 API；无保留政策却采集 PII |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D73-1 | D31 与 D73 检查项不矛盾 | ☐ | ☐ | ☐ |
| D73-2 | `/me/settings/data` 诚实说明保留范围 | ☐ | ☐ | ☐ |
| D73-3 | admin audit 日志保留策略 | ☐ | ☐ | ☐ |
| D73-4 | ③ 合规保留证据 | N/A | ☐ | ☐ |

---

## D74 · Vendor Lock-in · 第三方依赖替换能力 {#d74-vendor-lock-in}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | [96-03](../spec/96-03-安全密钥与供应链.md) · D40 · Stripe/RPC/Fly adapter |
| **机读** | registry/npm/cargo audit · 96-03 轮换表 |
| **① GO** | PSP/链/RPC 抽象层文档化 |
| **② GO** | staging 第二 RPC 或 Stripe test 切换演练 |
| **③ GO** | 多 vendor 故障切换 runbook |
| **NO-GO** | 单点 RPC 无 fallback 仍 ③ GO |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D74-1 | 96-03 密钥分类与轮换职责 | ☐ | ☐ | ☐ |
| D74-2 | `GET /meta` 多 RPC 叙事或诚实单点 | ☐ | ☐ | ☐ |
| D74-3 | npm/cargo lockfile 可复现 | ☐ | ☐ | ☐ |
| D74-4 | ③ vendor exit 计划或 BLOCKED 台账 | N/A | ☐ | ☐ |

---

## D75 · Cost & Capacity · 资源成本与容量规划 {#d75-cost-capacity}

| 项 | 值 |
|----|-----|
| **风险** | **P1（③ 峰值 P0）** |
| **SSOT** | [PRODUCTION-INFRASTRUCTURE-AUDIT](./PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md) · Fly sizing · e2e-stability-probe |
| **机读** | `bash scripts/gates/e2e-stability-probe.sh` · infra audit report |
| **① GO** | 本地资源诚实（rate limit 0 须标注非生产） |
| **② GO** | staging 负载探测或 ROV 容量备注 |
| **③ GO** | 峰值容量签字 + 成本告警 |
| **NO-GO** | ③ 无容量规划仍 cutover |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D75-1 | meta rate_limits 本地 vs 生产差异文档化 | ☐ | ☐ | ☐ |
| D75-2 | e2e-stability-probe 可跑 | ☐ | ☐ | ☐ |
| D75-3 | PG connection 池/config 文档 | ☐ | ☐ | ☐ |
| D75-4 | ③ 容量与成本 Owner 表 | N/A | N/A | ☐ |

---

## D76 · Business Continuity · 运营连续性 {#d76-business-continuity}

| 项 | 值 |
|----|-----|
| **风险** | **P0（③）** |
| **SSOT** | D38/D39 · [173 ROV-01](../handbook/engineering/173-ROV-01-Real-Operations-Validation-Program-Blueprint.md) · PI3 |
| **机读** | `check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh` · D63 rollback |
| **① GO** | DR+rollback+runbook 三文档并联可读 |
| **② GO** | staging DR 桌演 + 业务连续 24h 叙事 |
| **③ GO** | RTO/RPO 达标 + ROV 或等价运营验证 |
| **NO-GO** | ③ 单点故障无 BC 计划 |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| D76-1 | D38 DR 脚本存在 | ☐ | ☐ | ☐ |
| D76-2 | D39 restore drill 路径 | ☐ | ☐ | ☐ |
| D76-3 | D63 rollback 与 BC 互指 | ☐ | ☐ | ☐ |
| D76-4 | ② 运营连续演练证据 | N/A | ☐ | ☐ |

---

## §13 · DOMAIN-X · PRODUCT FORENSIC AUDIT · 产品法证级审计 {#domain-x-product-forensic}

> **独立审计域** — **不占用 D77+ 编号**；与 **D46/D47/D05/PF 重叠项** 以 **法证结论（KEEP/MERGE/RETIRE/REFACTOR）** 为准，**不**用 D 维 PASS 代替 PF 人工登记。
> **阶段：** 默认 **P1** 宽扫；**PF-04/11/18/20 为域内 P0** — ② 开工 **不强制** 全 PF 闭；**③ Production GO 前须 [U23-PF](#tt-full-audit-domain-x-gates) 全过**。
> **诚实边界：** ① 机读 gate **≠** 人工法证完成；`run-product-forensic-audit-gate.sh` 证明 **工具链 + SSOT 路径** 存在。

### §13.0 · PF 维度地图（PF-01～PF-20） {#tt-full-audit-pf-dimension-map}

**域内 P0：** **PF-04** · **PF-11** · **PF-18** · **PF-20**

| ID | 子维 | 域内风险 | 核心问题 | 主要 SSOT |
|----|------|----------|----------|-----------|
| **PF-01** | Route Ownership · 路由归属 | P1 | 每路由为何存在、谁负责、是否仍有价值 | [04 §3.4](../spec/04-后端与API.md) · [96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md) · [13-1 表2](../spec/13-1-UI产品级SSOT与页面规范.md) |
| **PF-02** | Button Inventory · 按钮盘点 | P1 | 全站按钮归属、重复、点击率（若可得） | [92 §四](../spec/92-P0-全站UI分区控制表-金融体验灰区与动效裁决.md) · PF-20 `button_like_*` |
| **PF-03** | CTA Uniqueness · 主 CTA 唯一 | P1 | 单页仅一个主 CTA，禁止多主行动并列高亮 | [86](../spec/86-UI-双系统未来风-风格与动效技术规格.md) · FIVE-MAIN FREEZE |
| **PF-04** | Duplicate Function · 重复功能 | **P0** | 同一业务 ≤2 主入口；双轨状态须裁决 | PUBLISH-HUB-IA-BOUNDARY · PROVIDER/GUIDE WORKBENCH FREEZE |
| **PF-05** | Screen Density · 页面密度 | P1 | 单页模块/卡片/按钮数是否超载 | PF-20 weight · 各域 FREEZE layout lock |
| **PF-06** | Click Depth · 点击深度 | P1 | 核心任务点击步数 | TT-9625 金路径 · PES journey |
| **PF-07** | Role Surface · 角色可见面 | P1 | 五角色能见/不能见 | 87 · account-nav-page-tracker |
| **PF-08** | Admin Surface · 后台膨胀 | P1 | Admin 菜单/页/按钮逐项 | adminShellSidebarModel · ADMIN-SECURITY-CLOSURE |
| **PF-09** | Permission Explosion · 权限膨胀 | P1 | 权限/能力数量是否失控 | smoke-admin-rbac-matrix · route-matrix |
| **PF-10** | Workflow Simplification · 流程瘦身 | P1 | 开通向导/入驻步数 | onboarding · register FREEZE |
| **PF-11** | Navigation Rationalization · 导航理性 | **P0** | 单功能入口数（Publish Hub 四入口） | PUBLISH-HUB-IA-BOUNDARY · ACCOUNT-NAV-NAMING-P3 |
| **PF-12** | Form Audit · 表单审计 | P1 | 字段数、校验、说明是否过长 | providerRegisterValidation · authRegisterL5 · D48 |
| **PF-13** | Empty State · 空态 | P1 | 空页是否有唯一下一步 CTA | D47 · ConsumerSurfaceStatePanel |
| **PF-14** | Error State · 错误态 | P1 | 错误是否可恢复、非白屏 | D47 · error.tsx |
| **PF-15** | Mobile Reachability · 移动可达 | P1 | 拇指区、按钮间距、窄屏主链 | l5-pe-mobile-responsive · D50 |
| **PF-16** | Cognitive Load · 认知负担 | P1 | 首进：我是谁/干什么/下一步 | L5-CROSS-ROLE-REALITY |
| **PF-17** | Information Architecture · 信息架构 | P1 | Settings/Hub/Publish/Workbench/Orders 不串层 | l5-pe-information-architecture · 13-1 |
| **PF-18** | Feature Retirement · 功能下线 | **P0** | 可删功能清单；删除而非仅优化 | 96-18 · product-forensic-registry |
| **PF-19** | UX Debt · UX 债务 | P1 | 须未来重做项登记 | 96-18 · L5-MULTI-DIMENSIONAL-EXCELLENCE |
| **PF-20** | Product Weight · 产品重量 | **P0** | 页面/按钮/表单/权限/角色/入口计数 | generate-product-forensic-weight-snapshot.py |

### §13.1 · Finding 登记模板（裁决词写死） {#tt-full-audit-pf-finding-template}

**裁决词（四选一 · 必填）：** **KEEP**（保留）· **MERGE**（合并入口/状态）· **RETIRE**（下线）· **REFACTOR**（重构 · 登记 UX 债）

```markdown
### PF finding · <PF-xx> · <路由/按钮/功能名> · YYYY-MM-DD
- **阶段 / 环境：** ① local | ② staging | ③ prod
- **PF 维：** PF-xx
- **对象：** route | button | CTA | nav_entry | form | admin_menu | permission | workflow
- **路径 / 标识：** e.g. `/guide` · `header_userMenu_publish_hub` · 「编辑资料」
- **重复/问题：** 与 <另一入口> 双轨 · 或 孤儿 · 或 密度过载
- **裁决：** KEEP | MERGE | RETIRE | REFACTOR
- **理由（一句）：** …
- **Owner / 台账：** 96-18 #… | FREEZE 域 | ADR-…
- **证据：** evidence/product-forensic-audit/…/product-forensic-registry.v1.json
```

**登记落点：** `evidence/product-forensic-audit/<stamp>/product-forensic-registry.v1.json` · schema `traveltrust.product_forensic_registry.v1`

### §13.2 · ① 一键法证命令 {#tt-full-audit-pf-one-shot}

```bash
# 仓库根 — DOMAIN-X bootstrap（机读基线 + PF-20 权重 + registry stub）
bash scripts/dev/run-product-forensic-audit-gate.sh
# → TT_PRODUCT_FORENSIC_AUDIT: OK
# → evidence/product-forensic-audit/<stamp>/

# 仅 PF-20 权重快照
python scripts/dev/generate-product-forensic-weight-snapshot.py

# 全量法证产出（矩阵 · Top100 · Executive · Roadmap）
python scripts/dev/generate-product-forensic-artifacts.py evidence/product-forensic-audit/<stamp>/
# → TT_PRODUCT_FORENSIC_ARTIFACTS: OK · TT_PRODUCT_FORENSIC_EXECUTIVE: OK

# 人工法证并联（非 gate 替代）
bash scripts/dev/l5-pe-information-architecture-audit.sh      # PF-07/17
bash scripts/dev/smoke-account-nav-full-local.sh              # PF-11
bash scripts/dev/smoke-publish-hub-local.sh                   # PF-04/11
bash scripts/dev/run-admin-frontend-deep-audit.sh             # PF-08
bash scripts/dev/smoke-admin-rbac-matrix-local.sh           # PF-09
bash scripts/dev/l5-pe-mobile-responsive-audit.sh           # PF-15
bash scripts/dev/run-five-role-full-chain-audit.sh            # PF-07
```

**成功判据（① 机读基线）：** `run-product-forensic-audit-gate.sh` **exit 0** · 末行 **`TT_PRODUCT_FORENSIC_AUDIT: OK`** · registry stub 已创建 · **人工 findings 仍须 §13.1 模板补齐**。

**③ 硬闸末行：** **`TT_PRODUCT_FORENSIC_PHASE23: GO`**（见 [§3.1.4 U23-PF](#tt-full-audit-domain-x-gates)）。

### §13.3 · 裁决规则（KEEP / MERGE / RETIRE / REFACTOR） {#tt-pf-verdict-rules}

| 裁决 | 适用 | 必须满足 | 禁止 |
|------|------|----------|------|
| **KEEP** | 唯一主链/合规必需/已 FREEZE ACTIVE | Owner + SSOT 引用 + ① evidence | 无理由保留 duplicate |
| **MERGE** | 同业务双轨入口/按钮/状态 | 指定 **canonical** 入口 + 迁移计划 + 96-18 或 ADR | 无限期「暂时两处都有」 |
| **RETIRE** | 孤儿/废弃/隐藏无效/ archive | 从 nav 移除 · redirect/410 · ③ 前代码删或 flag off | 仅隐藏仍可达 |
| **REFACTOR** | 过载/步数过多/IA 串层/UX 债 | PF-19 登记 + 目标态 + 排期 | 冒充 KEEP 拖延 |

**域内 P0 未裁决 = NO-GO（PF-04/11/18/20）：** 重复功能 · 四入口 Publish · 无 RETIRE 清单 · 权重 silent 膨胀。

### §13.4 · 证据包要求（每轮法证） {#tt-pf-evidence-package}

| 产物 | 路径 | 必填阶段 |
|------|------|----------|
| Registry | `product-forensic-registry.v1.json` | ①②③ |
| Route Inventory Matrix | `route-inventory-matrix.v1.json` | ① |
| Button Inventory Matrix | `button-inventory-matrix.v1.json` | ① |
| Permission Matrix | `permission-matrix.v1.json` | ① · ② API 补全 |
| Role Matrix | `role-matrix.v1.json` | ① |
| Navigation Matrix | `navigation-matrix.v1.json` | ① |
| Workflow Matrix | `workflow-matrix.v1.json` | ① |
| Feature Retirement List | `feature-retirement-list.v1.json` | ① · **③ 签字** |
| UX Debt Registry | `ux-debt-registry.v1.json` | ① |
| Product Weight Report | `product-weight-report.v1.json` | ①②③ delta |
| Complexity Score | `complexity-score.v1.json` | ① |
| Redundancy Score | `redundancy-score.v1.json` | ① |
| Simplification Roadmap | `simplification-roadmap.v1.md` | ② |
| Top 100 Findings | `top-100-product-findings.v1.json` | ① |
| Top 20 Merge/Remove/Refactor | `top-20-*-candidates.v1.json` | ① |
| Executive Product Health | `EXECUTIVE-PRODUCT-HEALTH-REPORT.md` | ② · **③ GO 前** |

**生成命令：** `python scripts/dev/generate-product-forensic-artifacts.py evidence/product-forensic-audit/<stamp>/`  
**末行 grep：** `TT_PRODUCT_FORENSIC_ARTIFACTS: OK` · `TT_PRODUCT_FORENSIC_EXECUTIVE: OK`

### §13.5 · PF 法证八件套（每维必含） {#tt-pf-eight-piece-standard}

每个 **PF-01～PF-20** 块须含下列行（下文各 PF 节已嵌入）：

| # | 要素 | 说明 |
|---|------|------|
| 1 | **审计目标** | 本轮要回答的产品问题（一句） |
| 2 | **检查清单** | 机读 + 人工项（表格 `#` 行） |
| 3 | **机读入口** | script / vitest / grep 锚 |
| 4 | **人工验收** | 目视/五角色/Admin 走查 |
| 5 | **风险等级** | P0/P1/P2（域内 P0 见 §13.0） |
| 6 | **SSOT** | spec / FREEZE / tracker JSON |
| 7 | **①②③ GO/NO-GO** | 三阶验收句 |
| 8 | **证据包 / 产出矩阵** | §13.4 中对应 JSON/MD 文件名 |

### §13.6 · 法证产出 × PF 映射 {#tt-pf-artifact-map}

| 产出 | 主要 PF |
|------|---------|
| Route Inventory Matrix | PF-01 |
| Button Inventory Matrix | PF-02 |
| CTA 登记（registry） | PF-03 |
| Duplicate Function（registry + redundancy） | PF-04 |
| Product Weight / Complexity | PF-05 · PF-20 |
| Workflow Matrix | PF-06 · PF-10 |
| Role Matrix | PF-07 |
| Admin Surface（AFDA） | PF-08 |
| Permission Matrix | PF-09 |
| Navigation Matrix | PF-11 |
| Form 清单（registry） | PF-12 |
| Empty/Error（registry） | PF-13 · PF-14 |
| Mobile（RUJR 抽检） | PF-15 |
| Cognitive（RUJR） | PF-16 |
| IA Matrix | PF-17 |
| Feature Retirement List | PF-18 |
| UX Debt Registry | PF-19 |
| Executive + Roadmap + Top100 | PF-20 · 全域 |

### §13.7 · Executive Product Health（③ 前必读） {#tt-pf-executive-health}

**`EXECUTIVE-PRODUCT-HEALTH-REPORT.md`** 须含：**Complexity Score · Redundancy Score · Top Merge/Remove/Refactor · 诚实边界（①≠③）**。

**③ GO 条件（并联 U23-PF）：** Redundancy **不**较 ① baseline 恶化无 ADR · Feature Retirement List **Owner 签字** · Top P0 findings **已裁决**（非 PENDING）。

---

## PF-01 · Route Ownership · 路由归属法证 {#pf-01-route-ownership}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（主链孤儿 **P0**） |
| **SSOT** | [04 §3.4](../spec/04-后端与API.md) · [96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md) · [13-1 表2](../spec/13-1-UI产品级SSOT与页面规范.md) |
| **机读** | `bash scripts/run-check-04-routes.sh` · `python scripts/check-spec93-routes-vs-app.py` |
| **① GO** | 每 **主链** 路由（`/guide` `/provider` `/orders` `/community` `/governance`）有 **存在理由 + Owner + 价值** 登记 |
| **② GO** | staging 路由表与 ① 同构；废弃路由 redirect/410 |
| **③ GO** | 生产路由 **冻结**；新增路由须 PF-01 finding **KEEP** + 04 同批 |
| **NO-GO** | 孤儿 `page.tsx` 无 Owner；主链 404；重复路由无裁决 |


| **八件套 · 审计目标** | 每路由为何存在、谁负责、是否仍有价值 |
| **人工验收** | 主链路由表 Owner 签字 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `route-inventory-matrix.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Route Inventory Matrix** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-01-1 | run-check-04-routes exit 0 | ☐ | ☐ | ☐ |
| PF-01-2 | check-spec93-routes-vs-app 无未登记 orphan | ☐ | ☐ | ☐ |
| PF-01-3 | registry 中主链路由有存在理由列 | ☐ | ☐ | ☐ |
| PF-01-4 | 废弃页从 nav 移除或标 RETIRE | ☐ | ☐ | ☐ |

---

## PF-02 · Button Inventory · 按钮盘点法证 {#pf-02-button-inventory}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（资金类重复 CTA **P0**） |
| **SSOT** | [92](../spec/92-P0-全站UI分区控制表-金融体验灰区与动效裁决.md) · PF-20 `button_like_*` 计数 |
| **机读** | PF-20 snapshot · 手验 + `product-forensic-registry.v1.json` |
| **① GO** | 高重复按钮（如「编辑资料」）每条有 **KEEP/MERGE/RETIRE/REFACTOR** |
| **② GO** | staging 与 ① 按钮归属表一致 |
| **③ GO** | 生产无未登记 duplicate pay/submit 按钮 |
| **NO-GO** | 同一操作 3+ 按钮无裁决；资金页双 primary |


| **八件套 · 审计目标** | 全站按钮归属与重复 |
| **人工验收** | Top20 按钮目视 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `button-inventory-matrix.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Button Inventory Matrix** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-02-1 | 「编辑资料」Guide/Settings/Publish Hub 三处已登记 verdict | ☐ | ☐ | ☐ |
| PF-02-2 | PF-20 buttons_app/components 基线归档 | ☐ | ☐ | ☐ |
| PF-02-3 | orders/escrow 仅一个 primary 资金 CTA | ☐ | ☐ | ☐ |
| PF-02-4 | Admin 写操作按钮与 AMWA 映射 | ☐ | ☐ | ☐ |

---

## PF-03 · CTA Uniqueness · 主 CTA 唯一法证 {#pf-03-cta-uniqueness}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（结账/签约 **P0**） |
| **SSOT** | [86](../spec/86-UI-双系统未来风-风格与动效技术规格.md) · [FIVE-MAIN](../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) |
| **机读** | 手验 · `l5-pe-user-journey-audit.sh` · vitest 契约 |
| **① GO** | 每页 **≤1** 视觉主 CTA（立即发布/创建提案/查看订单 不并列高亮） |
| **② GO** | staging CUJ 目视主 CTA 唯一 |
| **③ GO** | 生产转化页主 CTA A/B 有 ADR |
| **NO-GO** | Workbench 与 Publish Hub 双「立即发布」同屏高亮 |


| **八件套 · 审计目标** | 单页仅一个主 CTA |
| **人工验收** | 五主+Publish+Orders 截图 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `registry CTA rows` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **registry** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-03-1 | /me/publish 主 CTA 唯一（五轨壳） | ☐ | ☐ | ☐ |
| PF-03-2 | /governance 提案/质押 CTA 不并列 primary | ☐ | ☐ | ☐ |
| PF-03-3 | /orders 列表 primary 与 escrow 入口不冲突 | ☐ | ☐ | ☐ |
| PF-03-4 | 五主路由 marketing CTA 符合 92 F/X/G | ☐ | ☐ | ☐ |

---

## PF-04 · Duplicate Function · 重复功能法证 {#pf-04-duplicate-function}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [PUBLISH-HUB-IA-BOUNDARY](../frontend/evidence/GO_local_auth_l5/PUBLISH-HUB-IA-BOUNDARY-SCORE.md) · [PROVIDER-WORKBENCH](../frontend/evidence/GO_local_provider_workbench_l5/PROVIDER-WORKBENCH-L5-FREEZE.md) · [GUIDE-WORKBENCH](../frontend/evidence/GO_local_guide_workbench_l5/GUIDE-WORKBENCH-L5-FREEZE.md) |
| **机读** | `bash scripts/dev/smoke-publish-hub-local.sh` · `smoke-provider-workbench-l5-local.sh` · registry findings |
| **① GO** | 同一业务 **≤2** 主入口；双状态轨有 **MERGE/RETIRE** 计划或书面 KEEP |
| **② GO** | staging Publish Hub vs Workbench inventory 对拍 |
| **③ GO** | ③ 无 silent 第三入口 |
| **NO-GO** | Publish Hub + Workbench 双挂牌管理无裁决；三处编辑资料无 SSOT |


| **八件套 · 审计目标** | 同一业务≤2入口无双轨状态 |
| **人工验收** | Publish vs Workbench 走查 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `top-20-merge-candidates.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Duplicate + Redundancy** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-04-1 | Publish Hub vs `/provider` 工作台 inventory **MERGE/KEEP** 已登记 | ☐ | ☐ | ☐ |
| PF-04-2 | merchant 轨 `/me/publish?filter=merchant` 与工作台互链诚实 | ☐ | ☐ | ☐ |
| PF-04-3 | guide 档期/资料 vs guide workbench 无双写状态 | ☐ | ☐ | ☐ |
| PF-04-4 | 社区帖 **仅** 头像下拉 `/community/me/posts` 无 Publish Hub 第六轨 | ☐ | ☐ | ☐ |

---

## PF-05 · Screen Density · 页面密度法证 {#pf-05-screen-density}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（结账页过载 **P0**） |
| **SSOT** | 各域 FREEZE layout lock · PF-20 counts |
| **机读** | PF-20 snapshot · 手验密度表 |
| **① GO** | 工作台/Admin 单页模块数有上限叙事（如 ≤8 主卡片） |
| **② GO** | staging 高密度页有 REFACTOR 计划 |
| **③ GO** | 生产结账/托管页不超载 |
| **NO-GO** | 10 卡片 + 15 按钮同屏无登记 |


| **八件套 · 审计目标** | 单页模块/按钮不过载 |
| **人工验收** | 最密 10 页截图 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `product-weight-report.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Product Weight** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-05-1 | /provider` `/guide` 工作台卡片数登记 | ☐ | ☐ | ☐ |
| PF-05-2 | /governance?view=region` 模块密度手验 | ☐ | ☐ | ☐ |
| PF-05-3 | /admin 首页 KPI 密度可扫读 | ☐ | ☐ | ☐ |
| PF-05-4 | PF-20 密度 delta 无 silent +30% 卡片 | ☐ | ☐ | ☐ |

---

## PF-06 · Click Depth · 点击深度法证 {#pf-06-click-depth}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | [TT-9625 金路径](./TT-9625-golden-path-system-spine.md) · PES journey · onboarding 链 |
| **机读** | `l5-pe-user-journey-audit.sh` · `smoke-provider-onboarding-local.sh` |
| **① GO** | 发布商家 ≤ 文档声明步数；开通向导 ≤ 目标步数 |
| **② GO** | staging CUJ 点击深度与 ① 对拍 |
| **③ GO** | 生产 CUJ 深度 Owner 签字 |
| **NO-GO** | 核心任务需 8+ 点击无 REFACTOR 计划 |


| **八件套 · 审计目标** | 核心任务点击步数 |
| **人工验收** | 商家发布/下单步数手测 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `workflow-matrix.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Workflow Matrix** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-06-1 | merchant 发布挂牌：Hub→publish→listing 深度登记 | ☐ | ☐ | ☐ |
| PF-06-2 | guide 开通：register→trust→workbench 深度 | ☐ | ☐ | ☐ |
| PF-06-3 | steward：register→stake→governance WB 深度 | ☐ | ☐ | ☐ |
| PF-06-4 | acquisition：Hub→子站→bond 深度 | ☐ | ☐ | ☐ |

---

## PF-07 · Role Surface · 五角色可见面法证 {#pf-07-role-surface}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（越权面 **P0**） |
| **SSOT** | [87](../spec/87-TravelTrust-角色体系技术文档-融合架构版.md) · [account-nav-page-tracker](../frontend/evidence/GO_local_auth_l5/account-nav-page-tracker.v1.json) · D28 |
| **机读** | `l5-pe-information-architecture-audit.sh` · `run-five-role-full-chain-audit.sh` |
| **① GO** | Traveler/Guide/Merchant/Acquisition/Steward 各有一张 **能见/不能见** 表 |
| **② GO** | staging 五角色 nav 与 ① 一致 |
| **③ GO** | 生产 RBAC 与可见面冻结 |
| **NO-GO** | merchant 见 steward 质押；traveler 见 Admin 写入口 |


| **八件套 · 审计目标** | 五角色能见/不能见 |
| **人工验收** | multi-demo + 五角色矩阵 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `role-matrix.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Role Matrix** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-07-1 | Traveler：市场/订单/escrow 可达；工作台不可 | ☐ | ☐ | ☐ |
| PF-07-2 | Guide：`/guide` + hat=guide orders；merchant 工作台不可 | ☐ | ☐ | ☐ |
| PF-07-3 | Merchant：`/provider` + publish merchant 轨 | ☐ | ☐ | ☐ |
| PF-07-4 | Acquisition/Steward 子站与治理面隔离 | ☐ | ☐ | ☐ |

---

## PF-08 · Admin Surface · 后台膨胀法证 {#pf-08-admin-surface}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（③ unreachable P0 **P0**） |
| **SSOT** | `frontend/lib/admin/adminShellSidebarModel.ts` · [ADMIN-SECURITY-CLOSURE](./ADMIN-SECURITY-CLOSURE-REPORT.md) |
| **机读** | `bash scripts/dev/run-admin-frontend-deep-audit.sh` · AFDA browser matrix |
| **① GO** | Admin 每组菜单有 Owner；无 unreachable P0 页 |
| **② GO** | staging AFDA 无菜单无限增长 |
| **③ GO** | 生产 Admin 新页须 PF-08 **KEEP** + RBAC |
| **NO-GO** | sidebar 组数 silent 翻倍；死链菜单项 |


| **八件套 · 审计目标** | Admin 菜单/页/按钮不膨胀 |
| **人工验收** | AFDA 全菜单 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `admin-frontend-deep-audit` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Admin inventory** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-08-1 | adminShellSidebarModel 与磁盘 page 对拍 | ☐ | ☐ | ☐ |
| PF-08-2 | run-admin-frontend-deep-audit 无 P0 unreachable | ☐ | ☐ | ☐ |
| PF-08-3 | 每组 workspace/onboarding/ops 有瘦身候选登记 | ☐ | ☐ | ☐ |
| PF-08-4 | Admin 按钮数 vs PF-20 admin_page_tsx delta | ☐ | ☐ | ☐ |

---

## PF-09 · Permission Explosion · 权限膨胀法证 {#pf-09-permission-explosion}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（生产 mutating 无映射 **P0**） |
| **SSOT** | D27/D35 · `GET /admin/rbac/route-matrix` · D16 |
| **机读** | `bash scripts/dev/smoke-admin-rbac-matrix-local.sh` · `l5-enterprise-rbac-security-audit.sh` |
| **① GO** | 权限/能力总数有基线；增幅 >20% 须 ADR |
| **② GO** | staging route-matrix 与 ① 对拍 |
| **③ GO** | 生产权限数上限叙事 + 审批 |
| **NO-GO** | 权限数无限增长；mutating API 无矩阵行 |


| **八件套 · 审计目标** | 权限数量可控 |
| **人工验收** | route-matrix 行数 baseline |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `permission-matrix.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Permission Matrix** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-09-1 | smoke-admin-rbac-matrix-local exit 0 | ☐ | ☐ | ☐ |
| PF-09-2 | capabilities 列表计数归档 registry | ☐ | ☐ | ☐ |
| PF-09-3 | console-role vs super_admin 边界清晰 | ☐ | ☐ | ☐ |
| PF-09-4 | PF-20 权限计数列（手填）与上次 delta | ☐ | ☐ | ☐ |

---

## PF-10 · Workflow Simplification · 流程瘦身法证 {#pf-10-workflow-simplification}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | onboarding-fee-schedule · guide/provider register FREEZE · TT-9625 |
| **机读** | `smoke-provider-onboarding-local.sh` · guide register vitest |
| **① GO** | 开通向导/商家入驻步数 ≤ 目标（文档化 3/5/8） |
| **② GO** | staging onboarding 与 ① 步数一致 |
| **③ GO** | 生产流程变更须 UX 签字 |
| **NO-GO** | 8 步流程无 REFACTOR 却宣称简化 |


| **八件套 · 审计目标** | 开通/入驻步数最小化 |
| **人工验收** | 向导/主理人/商家步数 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `workflow-matrix.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Workflow Matrix** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-10-1 | provider register L5 步数登记 | ☐ | ☐ | ☐ |
| PF-10-2 | guide register → trust → workbench 步数 | ☐ | ☐ | ☐ |
| PF-10-3 | onboarding B 轨 quote→PI 步数 | ☐ | ☐ | ☐ |
| PF-10-4 | 可 MERGE 的中间页已登记 | ☐ | ☐ | ☐ |

---

## PF-11 · Navigation Rationalization · 导航入口理性法证 {#pf-11-navigation-rationalization}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [PUBLISH-HUB-IA-BOUNDARY](../frontend/evidence/GO_local_auth_l5/PUBLISH-HUB-IA-BOUNDARY-SCORE.md) · [ACCOUNT-NAV-NAMING-P3](../frontend/evidence/GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md) · `headerUserMenuNavModel.ts` |
| **机读** | `bash scripts/dev/smoke-account-nav-full-local.sh` · account-nav-page-tracker |
| **① GO** | Publish Hub 入口：顶栏/Settings/Hub/Workbench **≤ 合理数** 且 verdict 齐全 |
| **② GO** | staging 顶栏与 ① tracker 一致 |
| **③ GO** | 生产 nav 变更须 IA 冻结例外 |
| **NO-GO** | 四入口同功能无 MERGE；社区帖回流发布中心 |


| **八件套 · 审计目标** | 单功能入口数 rationalize |
| **人工验收** | Publish 四入口表 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `navigation-matrix.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Navigation Matrix** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-11-1 | header `publish_hub` / `my_posts` 命名冻结对拍 | ☐ | ☐ | ☐ |
| PF-11-2 | Publish Hub 入口表（Topbar/Settings/Hub/Workbench）已填 | ☐ | ☐ | ☐ |
| PF-11-3 | `/orders` 边界 copy 互指 publish 诚实 | ☐ | ☐ | ☐ |
| PF-11-4 | settings 分组无第五「发布」平行轨 | ☐ | ☐ | ☐ |

---

## PF-12 · Form Audit · 表单法证 {#pf-12-form-audit}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（PSP 表单 **P0**） |
| **SSOT** | AUTH/PROVIDER register FREEZE · D48 |
| **机读** | `providerRegisterValidation` · `authRegisterL5` vitest |
| **① GO** | 每表单字段数/必填/说明登记；过长有 REFACTOR |
| **② GO** | staging 负例与 ① 一致 |
| **③ GO** | 生产 PSP 表单 PCI 边界 |
| **NO-GO** | 20+ 字段无分步；双提交 |


| **八件套 · 审计目标** | 表单字段/校验/说明 |
| **人工验收** | 最长 10 表单 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `registry form rows` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **registry** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-12-1 | providerRegisterValidation exit 0 | ☐ | ☐ | ☐ |
| PF-12-2 | authRegisterL5 exit 0 | ☐ | ☐ | ☐ |
| PF-12-3 | guide-profile PATCH 字段最小化 | ☐ | ☐ | ☐ |
| PF-12-4 | PF-20 form_tags_app delta | ☐ | ☐ | ☐ |

---

## PF-13 · Empty State · 空态法证 {#pf-13-empty-state}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | D47 · `ConsumerSurfaceStatePanel` · 各域 empty copy |
| **机读** | 手验 · vitest 三态契约 |
| **① GO** | market/orders/inbox/publish 空态有 **唯一下一步** |
| **② GO** | staging 空态与 ① 一致 |
| **③ GO** | 生产空态 CTA 不误导 |
| **NO-GO** | 空列表无 CTA；多 competing empty actions |


| **八件套 · 审计目标** | 空态唯一下一步 |
| **人工验收** | orders/market/publish 空账户 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `registry empty rows` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **registry** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-13-1 | /orders 空态 → market 或 publish 单 CTA | ☐ | ☐ | ☐ |
| PF-13-2 | /me/publish 空轨 → 对应 workbench 深链 | ☐ | ☐ | ☐ |
| PF-13-3 | /community feed 空态诚实 | ☐ | ☐ | ☐ |
| PF-13-4 | provider inbox 空态 | ☐ | ☐ | ☐ |

---

## PF-14 · Error State · 错误态法证 {#pf-14-error-state}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（白屏 **P0**） |
| **SSOT** | D47 · 段级 `error.tsx` · i18n error keys |
| **机读** | `l5-pe-accessibility-audit.sh` · 手验 500 探针 |
| **① GO** | 关键域 error 可 Retry/回退；非白屏 |
| **② GO** | staging 404/500 降级可读 |
| **③ GO** | 生产 error 不泄露栈 |
| **NO-GO** | publish/orders throw 白屏；无恢复路径 |


| **八件套 · 审计目标** | 错误可恢复 |
| **人工验收** | 500/404 探针 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `registry error rows` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **registry** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-14-1 | `/me/*` `/provider` `/guide` error.tsx 存在 | ☐ | ☐ | ☐ |
| PF-14-2 | API 失败 inline error 非 infinite loading | ☐ | ☐ | ☐ |
| PF-14-3 | escrow 链失败用户可读文案 | ☐ | ☐ | ☐ |
| PF-14-4 | Admin error 与 audit 叙事一致 | ☐ | ☐ | ☐ |

---

## PF-15 · Mobile Reachability · 移动可达法证 {#pf-15-mobile-reachability}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（结账 CTA **P0**） |
| **SSOT** | FIVE-MAIN layout · D50 · `touchTargetLink44Classes` |
| **机读** | `bash scripts/dev/l5-pe-mobile-responsive-audit.sh` |
| **① GO** | 375px 主链 CTA 在拇指区；间距 ≥ 44px |
| **② GO** | staging 移动 CUJ 无 clip |
| **③ GO** | 生产 RUM 移动签字 |
| **NO-GO** | 固定底栏遮挡 CTA；双列按钮过密 |


| **八件套 · 审计目标** | 拇指区/间距/窄屏 |
| **人工验收** | 375px 走查 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `l5-pe-mobile log` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Mobile checklist** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-15-1 | l5-pe-mobile-responsive-audit exit 0 | ☐ | ☐ | ☐ |
| PF-15-2 | /orders `/escrow` mobile primary 可达 | ☐ | ☐ | ☐ |
| PF-15-3 | header 用户菜单 mobile 折叠可用 | ☐ | ☐ | ☐ |
| PF-15-4 | workbench 卡片 mobile 不横向溢出 | ☐ | ☐ | ☐ |

---

## PF-16 · Cognitive Load · 认知负担法证 {#pf-16-cognitive-load}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | [L5-CROSS-ROLE-REALITY](../frontend/evidence/L5-CROSS-ROLE-REALITY-AUDIT-FINDINGS-MATRIX.md) · PES |
| **机读** | `l5-pe-user-journey-audit.sh` · 手验首进 30s |
| **① GO** | 首进 30s 内用户知：我是谁/干什么/下一步 |
| **② GO** | staging 新用户 CUJ 无迷失 |
| **③ GO** | 生产 onboarding 文案签字 |
| **NO-GO** | Hub 四轨同屏无 context；身份切换无反馈 |


| **八件套 · 审计目标** | 首进认知三问 |
| **人工验收** | 5 秒测试 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `RUJR notes` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **registry** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-16-1 | Workspace context switcher 可见且诚实 | ☐ | ☐ | ☐ |
| PF-16-2 | /me/identities Hub 槽叙事清晰 | ☐ | ☐ | ☐ |
| PF-16-3 | multi-demo 切换无认知断点 | ☐ | ☐ | ☐ |
| PF-16-4 | 五主路由首屏 eyebrow/title 层级 | ☐ | ☐ | ☐ |

---

## PF-17 · Information Architecture · 信息架构层法证 {#pf-17-information-architecture}

| 项 | 值 |
|----|-----|
| **风险** | **P1**（串层 **P0**） |
| **SSOT** | `l5-pe-information-architecture-audit.sh` · [13-1](../spec/13-1-UI产品级SSOT与页面规范.md) · [L5-CROSS-ROLE-REALITY](../frontend/evidence/L5-CROSS-ROLE-REALITY-AUDIT-FINDINGS-MATRIX.md) |
| **机读** | `bash scripts/dev/l5-pe-information-architecture-audit.sh` |
| **① GO** | Settings/Hub/Publish/Workbench/Orders **不串层** |
| **② GO** | staging IA 与 ① tracker 一致 |
| **③ GO** | 生产 IA 变更须 ADR |
| **NO-GO** | 订单管理进 Settings；治理进 Publish Hub |


| **八件套 · 审计目标** | Settings/Hub/WB/Orders 不串层 |
| **人工验收** | IA 层归属表 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `navigation-matrix.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Navigation Matrix** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-17-1 | l5-pe-information-architecture-audit exit 0 | ☐ | ☐ | ☐ |
| PF-17-2 | account-nav-page-tracker.v1.json 对拍 | ☐ | ☐ | ☐ |
| PF-17-3 | `/me/settings` 无 workbench 平行入口 | ☐ | ☐ | ☐ |
| PF-17-4 | `/orders` vs `/me/publish` 三分法文档一致 | ☐ | ☐ | ☐ |

---

## PF-18 · Feature Retirement · 功能下线法证 {#pf-18-feature-retirement}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | [96-18](../spec/96-18-未完成清单与多维检查.md) · `product-forensic-registry.v1.json` · U23-PF-1 |
| **机读** | registry findings · 手验 RETIRE 清单 |
| **① GO** | 每条候选下线功能有 **RETIRE/MERGE** + Owner 或 96-18 |
| **② GO** | staging 已 RETIRE 功能不可达 |
| **③ GO** | ③ 无只增不减无登记 |
| **NO-GO** | 废弃路由仍 nav；RETIRE 无台账 |


| **八件套 · 审计目标** | 可删功能清单·删而非优化 |
| **人工验收** | RETIRE 候选 Owner 签 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `feature-retirement-list.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Feature Retirement List** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-18-1 | registry `findings` 含 RETIRE 候选 ≥1 条评审 | ☐ | ☐ | ☐ |
| PF-18-2 | archive/ui-v1 不回流 nav | ☐ | ☐ | ☐ |
| PF-18-3 | 重复实验页有 RETIRE 日期 | ☐ | ☐ | ☐ |
| PF-18-4 | U23-PF-1 Owner 签字或 96-18 链 | ☐ | ☐ | ☐ |

---

## PF-19 · UX Debt · UX 债务法证 {#pf-19-ux-debt}

| 项 | 值 |
|----|-----|
| **风险** | **P1** |
| **SSOT** | 96-18 · [L5-MULTI-DIMENSIONAL-EXCELLENCE](../frontend/evidence/L5-MULTI-DIMENSIONAL-EXCELLENCE-FINDINGS-MATRIX.md) |
| **机读** | registry findings REFACTOR 类 · 96-18 grep |
| **① GO** | 须未来重做项登记；有优先级 |
| **② GO** | staging 债务与 ① 台账同步 |
| **③ GO** | 发版前 P0 UX 债清零或 CONDITIONAL |
| **NO-GO** | silent REFACTOR 堆积无台账 |


| **八件套 · 审计目标** | UX 债登记 |
| **人工验收** | P1/P2 backlog |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `ux-debt-registry.v1.json` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **UX Debt Registry** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-19-1 | registry 含 REFACTOR findings | ☐ | ☐ | ☐ |
| PF-19-2 | 88 §一 UX 缺口与 PF 互指 | ☐ | ☐ | ☐ |
| PF-19-3 | 已上链 escrow 页债务单独登记 | ☐ | ☐ | ☐ |
| PF-19-4 | ② PH-B 新功能不增加未登记债 | ☐ | ☐ | ☐ |

---

## PF-20 · Product Weight · 产品重量法证 {#pf-20-product-weight}

| 项 | 值 |
|----|-----|
| **风险** | **P0** |
| **SSOT** | `generate-product-forensic-weight-snapshot.py` · `product-weight-snapshot.v1.json` |
| **机读** | `python scripts/dev/generate-product-forensic-weight-snapshot.py` |
| **① GO** | 权重快照归档；与上次 delta **诚实** |
| **② GO** | staging 快照与 ① 基线对比 |
| **③ GO** | ③ 无 silent +30% 按钮/路由无 ADR |
| **NO-GO** | 页面/按钮膨胀无登记；U23-PF-2 FAIL |


| **八件套 · 审计目标** | 全站重量与 delta |
| **人工验收** | Complexity/Redundancy 趋势 |
| **判定规则** | KEEP=唯一主链 · MERGE=指定 canonical · RETIRE=下线 · REFACTOR=UX债（§13.3） |
| **证据包** | `product-weight-report + scores` · `product-forensic-registry.v1.json` |
| **产出矩阵** | **Executive Product Health** |
| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| PF-20-1 | generate-product-forensic-weight-snapshot exit 0 | ☐ | ☐ | ☐ |
| PF-20-2 | TT_PRODUCT_FORENSIC_WEIGHT: OK 留痕 | ☐ | ☐ | ☐ |
| PF-20-3 | 权重表（下）已填并与 JSON 一致 | ☐ | ☐ | ☐ |
| PF-20-4 | 过重/过轻项各 ≥1 条评审结论 | ☐ | ☐ | ☐ |

**PF-20 权重输出表（与 `product-weight-snapshot.v1.json` 同形 · 手填 delta 列）：**

| 计数项 | ① 基线 | ② staging | ③ prod | delta vs 基线 | 过重/过轻 | verdict |
|--------|--------|-----------|--------|---------------|-----------|---------|
| `routes_inferred_from_page_tsx` | | | | | | KEEP/MERGE/RETIRE/REFACTOR |
| `page_tsx_files` | | | | | | |
| `error_tsx_files` | | | | | | |
| `loading_tsx_files` | | | | | | |
| `button_like_tsx` (app) | | | | | | |
| `button_like_components` | | | | | | |
| `form_tags_app` | | | | | | |
| `admin_page_tsx` | | | | | | |
| `me_settings_pages` | | | | | | |
| **权限数**（route-matrix 手填） | | | | | | |
| **角色轨数**（五角色+Admin） | | | | | | |
| **Publish/Workbench 入口数** | | | | | | |

> **判读：** 无 ADR 却 **+30%** 按钮/路由/Admin 页 → **PF-20 NO-GO** · U23-PF-2。

---
---


## §14 · DOMAIN-Z · DOCUMENTATION_AND_OPERATIONAL_ALIGNMENT_AUDIT · 文档与运维对齐 {#domain-z-doa}

> **独立审计域（非 D 编号）** — 审计 **文档 · 脚本 · 代码 · DB · API · ABI · Admin · 部署** 与 **实际运行** 是否一致。  
> **与 D/PF 关系：** D04/D14/D15/D29 验 **契约/数据/链**；PF 验 **产品重复与重量**；**DOA 验 SSOT/脚本/环境是否漂移**。  
> **裁决词（写死）：** **KEEP** · **UPDATE** · **DEPRECATE** · **REMOVE**

### §14.0 · DOA 维度地图（DOA-01～DOA-20） {#tt-doa-dimension-map}

**域内 P0：** **DOA-03** · **DOA-10** · **DOA-12** · **DOA-15** · **DOA-16**

| ID | 子维 | 风险 | 核心对齐对象 | 主要 SSOT / 机读 |
|----|------|------|--------------|------------------|
| **DOA-01** | README · 根文档 | P1 | 本地开发/端口/seed 叙事 | `README.md` · TT-9618 |
| **DOA-02** | Runbook · 运维文档 | P1 | runbook 索引 vs 磁盘 | `docs/runbook/README.md` |
| **DOA-03** | SSOT · Spec 路径注册 | **P0** | registry ↔ inventory ↔ 消费方 | `validate-spec-path-dependencies-registry.py` |
| **DOA-04** | ADR · Handbook | P1 | engineering 主序 · ADR 互指 | `check-handbook-frontmatter.sh` |
| **DOA-05** | Environment · 环境变量 | P1 | `.env` ↔ README ↔ FE sync | `sync-frontend-env-local-from-root.*` |
| **DOA-06** | Docker · 本地栈 | P1 | compose / start-api-with-seed | `start-api-with-seed-README.md` |
| **DOA-07** | Seed · 测试账号 | P1 | SEED_TEST_ACCOUNTS · 96-18 | `post-start-api-abi-smoke` |
| **DOA-08** | Migrations · sqlx | P1 | migrate 集 ↔ Step 3d | `crates/api/migrations/` |
| **DOA-09** | PG Schema · 库表对齐 | P1 | schema vs models/IT | `ensure-api-db-migrations.*` |
| **DOA-10** | API · 04 契约 | **P0** | Axum 挂载 ↔ 04 ↔ FE | `run-check-04-routes.sh` |
| **DOA-11** | Frontend DTO · BFF | P1 | routes.ts ↔ 04 ↔ page | `check-spec93-routes-vs-app.py` |
| **DOA-12** | ABI · 合约对齐 | **P0** | forge ↔ contracts/abi ↔ FE | `check-55-s13.sh` |
| **DOA-13** | Indexer · 链同步文档 | P1 | 110/TT-CHAIN ↔ internal API | TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC |
| **DOA-14** | Admin UI · 后台对齐 | P1 | admin page ↔ admin API | `frontend/app/admin/README.md` · AFDA |
| **DOA-15** | RBAC Matrix · 权限矩阵 | **P0** | route-matrix ↔ UI ↔ 87 | `smoke-admin-rbac-matrix-local.sh` |
| **DOA-16** | Local Scripts · 一键脚本 | **P0** | master/pf/doa/start-api 存在且文档化 | §14.2 · CONTRIBUTING |
| **DOA-17** | Testnet Deploy · 测试网部署 | P1 | PHASE2 scripts ↔ fly/staging | PHASE2-START-CHECKLIST |
| **DOA-18** | CI/CD · 本地闸 parity | P1 | dev-preflight ↔ TT-LOCAL | `dev-preflight.sh` |
| **DOA-19** | Monitoring · 监控告警 | P1 | RUNBOOK ↔ /admin/observability | `ops/RUNBOOK.md` |
| **DOA-20** | Backup/DR · 备份恢复 | P1 | PI3-001 ↔ ops §1 | `check-pi3-001-*.sh` |

### §14.1 · 裁决规则（KEEP / UPDATE / DEPRECATE / REMOVE） {#tt-doa-verdict-rules}

| 裁决 | 适用 | 必须满足 |
|------|------|----------|
| **KEEP** | 文档/脚本/契约与运行一致 | 机读 gate PASS + 路径有效 |
| **UPDATE** | 漂移但仍有价值 | 同批更新 SSOT+代码+脚本；96-18 或 ADR |
| **DEPRECATE** | 旧路径仍只读引用 | 互指新 SSOT + 移除 deadline |
| **REMOVE** | 无效/重复/孤儿 | 删文件/路由 + registry 同步 + grep 零引用 |

### §14.2 · 法证产出（DOA 交付物） {#tt-doa-deliverables}

| 产出 | 文件 | 主要 DOA |
|------|------|----------|
| SSOT Drift Report | `ssot-drift-report.v1.json` | DOA-03/04 |
| Script Drift Report | `script-drift-report.v1.json` | DOA-16/17/18 |
| API/ABI Compatibility Report | `api-abi-compatibility-report.v1.json` | DOA-10/11/12 |
| Database Schema Alignment Report | `database-schema-alignment-report.v1.json` | DOA-08/09 |
| Admin Capability Matrix | `admin-capability-matrix.v1.json` | DOA-14/15 |
| Environment Consistency Report | `environment-consistency-report.v1.json` | DOA-05/06 |
| Operational Readiness Report | `OPERATIONAL-READINESS-REPORT.md` | DOA-19/20 |
| Documentation Health Score | `documentation-health-score.v1.json` | 全域 |
| Registry | `doa-audit-registry.v1.json` | 全域 |

**生成：** `python scripts/dev/generate-doa-artifacts.py evidence/doa-audit/<stamp>/`  
**grep：** `TT_DOA_ARTIFACTS: OK` · `TT_DOA_OPERATIONAL_READINESS: OK`

### §14.3 · ① 一键对齐审计 {#tt-doa-one-shot}

```bash
bash scripts/dev/run-doa-audit-gate.sh
# → TT_DOA_AUDIT: OK
# SKIP_DOA_ROUTES=1  # 若 04 路由闸暂 FAIL 仍生成 drift 报告

bash scripts/dev/run-full-system-audit-master-gate.sh
# 含 §10–§12 + DOMAIN-X(PF) + DOMAIN-Z(DOA)（见 U12-12/17）
```

### §14.4 · DOA 八件套（每维必含） {#tt-doa-eight-piece}

同 PF §13.5：**审计目标 · 检查清单 · 机读 · 人工验收 · 风险 · SSOT · ①②③ GO/NO-GO · 证据/产出**；裁决用 **KEEP/UPDATE/DEPRECATE/REMOVE**。

### §14.5 · 三域并联（D · PF · DOA） {#tt-doa-cross-domain}

| 场景 | D | PF | DOA |
|------|---|----|----|
| 路由 404 | D46 PASS | PF-01 RETIRE/MERGE | DOA-10 UPDATE 04/FE |
| ABI 不一致 | D15 FAIL | — | DOA-12 UPDATE |
| 双入口 | D05 功能 | PF-04 MERGE | DOA-02 UPDATE runbook |
| 脚本不存在 | DX-01 | — | DOA-16 REMOVE/UPDATE |
| 进入收敛前 | U12-3 D P0 | U12-PF 基线 | **U12-DOA 全过** |

---

### DOA-01 · README · 根文档 {#doa-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 根 README 与 TT-9618/端口/seed 叙事一致 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-01` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | README.md · TT-9618-onboarding-local-testnet.md |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-01-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-01-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-01-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-02 · Runbook · 运维索引 {#doa-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | runbook README 索引 vs 磁盘脚本 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-02` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | docs/runbook/README.md |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-02-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-02-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-02-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-03 · SSOT · Spec 路径注册 {#doa-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | registry ↔ inventory ↔ 消费方零孤儿 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-03` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P0** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | validate-spec-path-dependencies-registry.py |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-03-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-03-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-03-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-04 · ADR · Handbook {#doa-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | engineering 主序 · frontmatter · ADR 互指 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-04` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | check-handbook-frontmatter.sh |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-04-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-04-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-04-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-05 · Environment · 环境变量 {#doa-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | .env.example ↔ README ↔ FE sync |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `environment-consistency-report.v1.json` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | .env.example · sync-frontend-env-local-from-root.* |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-05-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-05-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-05-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-06 · Docker · 本地栈 {#doa-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | compose/start-api 文档与端口一致 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-06` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | start-api-with-seed-README.md |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-06-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-06-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-06-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-07 · Seed · 测试账号 {#doa-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | SEED 账号 ↔ 96-18 ↔ smoke 种子 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-07` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | post-start-api-abi-smoke · SEED_TEST_ACCOUNTS |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-07-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-07-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-07-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-08 · Migrations · sqlx {#doa-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | migrate 集完整 · Step 3d 可跑 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-08` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | crates/api/migrations/ |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-08-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-08-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-08-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-09 · PG Schema · 库表对齐 {#doa-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | schema vs models/IT · ensure 脚本 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `database-schema-alignment-report.v1.json` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | ensure-api-db-migrations.* |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-09-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-09-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-09-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-10 · API · 04 契约 {#doa-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Axum 挂载 ↔ 04 ↔ OpenAPI 叙事 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `api-abi-compatibility-report.v1.json` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P0** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | run-check-04-routes.sh |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-10-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-10-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-10-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-11 · Frontend DTO · BFF {#doa-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | routes.ts ↔ 93 ↔ page 存在 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-11` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | check-spec93-routes-vs-app.py |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-11-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-11-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-11-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-12 · ABI · 合约对齐 {#doa-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | forge ↔ contracts/abi ↔ FE abis |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `api-abi-compatibility-report.v1.json` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P0** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | check-55-s13.sh |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-12-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-12-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-12-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-13 · Indexer · 链同步文档 {#doa-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 110/TT-CHAIN ↔ internal API 叙事 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-13` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC.md |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-13-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-13-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-13-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-14 · Admin UI · 后台对齐 {#doa-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | admin page ↔ admin API ↔ AFDA |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `admin-capability-matrix.v1.json` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | frontend/app/admin/README.md |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-14-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-14-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-14-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-15 · RBAC Matrix · 权限矩阵 {#doa-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | route-matrix ↔ UI ↔ smoke |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `admin-capability-matrix.v1.json` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P0** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | smoke-admin-rbac-matrix-local.sh |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-15-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-15-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-15-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-16 · Local Scripts · 一键脚本 {#doa-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | master/pf/doa/start 脚本存在且文档化 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `script-drift-report.v1.json` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P0** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | run-full-system-audit-master-gate.sh |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-16-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-16-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-16-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-17 · Testnet Deploy · 测试网 {#doa-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | PHASE2 脚本 ↔ fly/staging 叙事 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-17` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | PHASE2-START-CHECKLIST.md |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-17-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-17-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-17-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-18 · CI/CD · 本地闸 parity {#doa-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | dev-preflight ↔ CONTRIBUTING pre-push |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `run-doa-audit-gate.sh DOA-18` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | dev-preflight.sh |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-18-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-18-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-18-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-19 · Monitoring · 监控告警 {#doa-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | ops RUNBOOK ↔ observability 路由 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `OPERATIONAL-READINESS-REPORT.md` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | ops/RUNBOOK.md |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-19-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-19-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-19-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |


### DOA-20 · Backup/DR · 备份恢复 {#doa-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | PI3-001 ↔ ops §1 ↔ 桌演脚本 |
| 2 | **检查清单** | SSOT 路径存在 · 文档互指 · 无孤儿引用 · 裁决登记 |
| 3 | **机读** | `OPERATIONAL-READINESS-REPORT.md` |
| 4 | **人工验收** | 对照 drift report 逐项 **KEEP/UPDATE/DEPRECATE/REMOVE** |
| 5 | **风险** | **P1** — 漂移导致误部署/404/ABI 失败/权限洞 |
| 6 | **SSOT** | check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh |
| 7 | **①②③ GO** | ① gate PASS + registry；② staging 复验 DOA-10/12/15；③ DR/监控 DOA-19/20 签字 |
| 8 | **证据/产出** | `evidence/doa-audit/<stamp>/` · `doa-audit-registry.v1.json` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| DOA-20-1 | 机读 gate PASS | ☐ | ☐ | ☐ |
| DOA-20-2 | drift report 无 open P0 | ☐ | ☐ | ☐ |
| DOA-20-3 | 裁决四词已登记 | ☐ | ☐ | ☐ |




## §15 · DOMAIN-R · REQUIREMENTS_TRACEABILITY_AUDIT · 需求追踪与功能血缘 {#domain-r-requirements}

> **独立审计域** — 与 **D / PF / DOA** 并联；裁决 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE****。  
> **收敛前：** 须 **U12-LFC** + **U12-PF** + **U12-DOA** 并联通过（**非** ②③ GO 替代）。

### §15.0 · 维度地图（R-01～R-20） {#tt-r-map}

**域内 P0：** **R-01** · **R-03** · **R-06** · **R-10** · **R-11** · **R-16** · **R-20**

| ID | 子维 | 风险 | 核心问题 | SSOT / 机读 |
|----|------|------|----------|-------------|
| **R-01** | 93 矩阵追踪 | P0 | 93 用例 ↔ 路由/API | 93 · check-spec93-routes |
| **R-02** | 96-20 页面对齐 | P1 | page ↔ spec 章节 | 96-20 |
| **R-03** | 04 API 需求 | P0 | Axum ↔ 04 §3.4 | run-check-04-routes.sh |
| **R-04** | 13-1 UI SSOT | P1 | 页面规范 ↔ app | 13-1 表2 |
| **R-05** | 业务旅程 J1–J8 | P1 | 旅程步骤 ↔ 证据 | §4 · TT-9625 |
| **R-06** | Onboarding 需求 | P0 | fee_schedule 全链 | onboarding-fee-schedule.v1 |
| **R-07** | Admin 能力需求 | P1 | AFDA ↔ route-matrix | admin README |
| **R-08** | Web3/Escrow 需求 | P1 | 行程→草稿→托管 | ESCROW-ORDER-PAGE-CLOSURE |
| **R-09** | Community/治理需求 | P1 | C11/HAT/governance | COMMUNITY FREEZE |
| **R-10** | 路由→需求映射 | P0 | 每路由 requirement_id | requirement-trace-matrix |
| **R-11** | API 端点追踪 | P0 | 04 表 ↔ 注册路由 | run-check-04-routes |
| **R-12** | OpenAPI 叙事 | P1 | 文档 ↔ 实现 | 04 · openapi 若有 |
| **R-13** | FE page 追踪 | P1 | page.tsx ↔ 96-20 | check-spec93 |
| **R-14** | 按钮/CTA 需求 | P1 | 92 分区 ↔ 页面 | button-inventory-matrix |
| **R-15** | 工作流步骤追踪 | P1 | wizard 步数 ↔ spec | workflow-matrix |
| **R-16** | RBAC 需求矩阵 | P0 | 87 ↔ route-matrix | smoke-admin-rbac |
| **R-17** | 多身份需求 | P1 | identities ↔ acquisition | ME-IDENTITIES-FREEZE |
| **R-18** | 收购 PD-009 追踪 | P1 | bond/listing gate | acquisition README |
| **R-19** | 96-18 台账联动 | P1 | open gap ↔ route | 96-18 |
| **R-20** | 孤儿功能检测 | P0 | 无需求引用的路由/按钮 | feature-lineage-report |

### §15.1 · 裁决与产出 {#tt-r-verdicts}

| 产出 | 文件 | 关联维 |
|------|------|--------|
| 见 §20.2 统一产出矩阵 | `evidence/lifecycle-forensic-audit/` | 全域 |

**gate：** `bash scripts/dev/run-lifecycle-forensic-audit-gate.sh` → **`TT_LIFECYCLE_FORENSIC_AUDIT: OK`**

### R-01 · 93 矩阵追踪 {#r-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 93 用例 ↔ 路由/API |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-01` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | 93 · check-spec93-routes |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-01-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-01-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-02 · 96-20 页面对齐 {#r-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | page ↔ spec 章节 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-02` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | 96-20 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-02-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-02-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-03 · 04 API 需求 {#r-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Axum ↔ 04 §3.4 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-03` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | run-check-04-routes.sh |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-03-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-03-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-04 · 13-1 UI SSOT {#r-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 页面规范 ↔ app |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-04` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | 13-1 表2 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-04-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-04-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-05 · 业务旅程 J1–J8 {#r-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 旅程步骤 ↔ 证据 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-05` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | §4 · TT-9625 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-05-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-05-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-06 · Onboarding 需求 {#r-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | fee_schedule 全链 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-06` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | onboarding-fee-schedule.v1 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-06-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-06-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-07 · Admin 能力需求 {#r-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | AFDA ↔ route-matrix |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-07` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | admin README |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-07-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-07-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-08 · Web3/Escrow 需求 {#r-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 行程→草稿→托管 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-08` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ESCROW-ORDER-PAGE-CLOSURE |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-08-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-08-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-09 · Community/治理需求 {#r-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | C11/HAT/governance |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-09` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | COMMUNITY FREEZE |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-09-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-09-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-10 · 路由→需求映射 {#r-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 每路由 requirement_id |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-10` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | requirement-trace-matrix |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-10-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-10-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-11 · API 端点追踪 {#r-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 04 表 ↔ 注册路由 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-11` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | run-check-04-routes |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-11-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-11-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-12 · OpenAPI 叙事 {#r-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 文档 ↔ 实现 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-12` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | 04 · openapi 若有 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-12-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-12-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-13 · FE page 追踪 {#r-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | page.tsx ↔ 96-20 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-13` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | check-spec93 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-13-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-13-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-14 · 按钮/CTA 需求 {#r-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 92 分区 ↔ 页面 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-14` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | button-inventory-matrix |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-14-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-14-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-15 · 工作流步骤追踪 {#r-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | wizard 步数 ↔ spec |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-15` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | workflow-matrix |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-15-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-15-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-16 · RBAC 需求矩阵 {#r-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 87 ↔ route-matrix |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-16` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | smoke-admin-rbac |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-16-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-16-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-17 · 多身份需求 {#r-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | identities ↔ acquisition |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-17` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ME-IDENTITIES-FREEZE |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-17-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-17-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-18 · 收购 PD-009 追踪 {#r-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | bond/listing gate |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-18` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | acquisition README |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-18-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-18-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-19 · 96-18 台账联动 {#r-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | open gap ↔ route |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-19` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | 96-18 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-19-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-19-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### R-20 · 孤儿功能检测 {#r-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 无需求引用的路由/按钮 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `R-20` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | feature-lineage-report |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| R-20-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| R-20-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| R-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §16 · DOMAIN-K · KNOWLEDGE_AND_BUS_FACTOR_AUDIT · 知识单点与传承 {#domain-k-knowledge}

> **独立审计域** — 与 **D / PF / DOA** 并联；裁决 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE****。  
> **收敛前：** 须 **U12-LFC** + **U12-PF** + **U12-DOA** 并联通过（**非** ②③ GO 替代）。

### §16.0 · 维度地图（K-01～K-20） {#tt-k-map}

**域内 P0：** **K-01** · **K-02** · **K-18** · **K-19** · **K-20**

| ID | 子维 | 风险 | 核心问题 | SSOT / 机读 |
|----|------|------|----------|-------------|
| **K-01** | Bus Factor 总览 | P0 | 单维护者风险量化 | solo-dev-rhythm · bus-factor-score |
| **K-02** | Runbook 覆盖 | P0 | ops/RUNBOOK 四列 | ops/RUNBOOK.md |
| **K-03** | Onboarding 交接 | P1 | TT-9618 可独立起栈 | TT-9618 |
| **K-04** | Handbook 工程语料 | P1 | engineering 00–50 三处对拍 | check-handbook-* |
| **K-05** | 运维手册 | P1 | 监控/告警/故障 | ops/RUNBOOK · TT-LOCAL |
| **K-06** | 脚本所有权 | P1 | scripts/dev 地图 | script-drift-report |
| **K-07** | ADR 决策记录 | P1 | Why 可追溯 | docs/adr |
| **K-08** | Evidence 卫生 | P1 | evidence/README 规范 | CONTRIBUTING |
| **K-09** | DB 运维知识 | P1 | migrate/restore 文档 | ensure-api-db-migrations |
| **K-10** | 链/Indexer 知识 | P1 | TT-CHAIN 可读 | TT-CHAIN-ARCHITECTURE |
| **K-11** | Admin 运维知识 | P1 | RBAC 变更流程 | ADMIN-SECURITY-CLOSURE |
| **K-12** | 安全 Runbook | P1 | AMWA/incident | run-admin-security-closure |
| **K-13** | 备份/DR 知识 | P1 | PI3-001 可执行 | check-pi3-001 |
| **K-14** | Frontend 域 README | P1 | app/*/README 覆盖 | frontend/app |
| **K-15** | Backend crate 文档 | P1 | crates 边界说明 | crates/api |
| **K-16** | 外部依赖文档 | P1 | Stripe/PSP/链 RPC | PHASE2-START |
| **K-17** | CI 知识 parity | P1 | dev-preflight = 本地真相 | dev-preflight.sh |
| **K-18** | SOLO-MAINTAINER 索引 | P0 | 签字包/角色自证 | SOLO-MAINTAINER-SIGNATURE |
| **K-19** | 知识风险登记 | P0 | 单点域清单 | knowledge-risk-report |
| **K-20** | Bus Factor 目标 | P0 | ③ 前 ≥60 + handoff | bus-factor-score.v1.json |

### §16.1 · 裁决与产出 {#tt-k-verdicts}

| 产出 | 文件 | 关联维 |
|------|------|--------|
| 见 §20.2 统一产出矩阵 | `evidence/lifecycle-forensic-audit/` | 全域 |

**gate：** `bash scripts/dev/run-lifecycle-forensic-audit-gate.sh` → **`TT_LIFECYCLE_FORENSIC_AUDIT: OK`**

### K-01 · Bus Factor 总览 {#k-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 单维护者风险量化 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-01` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | solo-dev-rhythm · bus-factor-score |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-01-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-01-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-02 · Runbook 覆盖 {#k-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | ops/RUNBOOK 四列 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-02` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | ops/RUNBOOK.md |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-02-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-02-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-03 · Onboarding 交接 {#k-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | TT-9618 可独立起栈 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-03` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | TT-9618 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-03-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-03-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-04 · Handbook 工程语料 {#k-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | engineering 00–50 三处对拍 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-04` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | check-handbook-* |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-04-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-04-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-05 · 运维手册 {#k-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 监控/告警/故障 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-05` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ops/RUNBOOK · TT-LOCAL |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-05-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-05-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-06 · 脚本所有权 {#k-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | scripts/dev 地图 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-06` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | script-drift-report |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-06-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-06-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-07 · ADR 决策记录 {#k-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Why 可追溯 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-07` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | docs/adr |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-07-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-07-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-08 · Evidence 卫生 {#k-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | evidence/README 规范 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-08` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | CONTRIBUTING |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-08-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-08-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-09 · DB 运维知识 {#k-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | migrate/restore 文档 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-09` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ensure-api-db-migrations |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-09-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-09-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-10 · 链/Indexer 知识 {#k-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | TT-CHAIN 可读 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-10` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | TT-CHAIN-ARCHITECTURE |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-10-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-10-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-11 · Admin 运维知识 {#k-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | RBAC 变更流程 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-11` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ADMIN-SECURITY-CLOSURE |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-11-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-11-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-12 · 安全 Runbook {#k-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | AMWA/incident |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-12` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | run-admin-security-closure |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-12-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-12-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-13 · 备份/DR 知识 {#k-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | PI3-001 可执行 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-13` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | check-pi3-001 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-13-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-13-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-14 · Frontend 域 README {#k-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | app/*/README 覆盖 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-14` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | frontend/app |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-14-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-14-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-15 · Backend crate 文档 {#k-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | crates 边界说明 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-15` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | crates/api |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-15-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-15-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-16 · 外部依赖文档 {#k-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Stripe/PSP/链 RPC |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-16` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PHASE2-START |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-16-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-16-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-17 · CI 知识 parity {#k-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | dev-preflight = 本地真相 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-17` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | dev-preflight.sh |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-17-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-17-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-18 · SOLO-MAINTAINER 索引 {#k-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 签字包/角色自证 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-18` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | SOLO-MAINTAINER-SIGNATURE |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-18-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-18-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-19 · 知识风险登记 {#k-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 单点域清单 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-19` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | knowledge-risk-report |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-19-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-19-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### K-20 · Bus Factor 目标 {#k-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | ③ 前 ≥60 + handoff |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `K-20` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | bus-factor-score.v1.json |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| K-20-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| K-20-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| K-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §17 · DOMAIN-E · ECONOMIC_SUSTAINABILITY_AUDIT · 经济可持续与单位经济 {#domain-e-economics}

> **独立审计域** — 与 **D / PF / DOA** 并联；裁决 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE****。  
> **收敛前：** 须 **U12-LFC** + **U12-PF** + **U12-DOA** 并联通过（**非** ②③ GO 替代）。

### §17.0 · 维度地图（E-01～E-20） {#tt-e-map}

**域内 P0：** **E-01** · **E-20**

| ID | 子维 | 风险 | 核心问题 | SSOT / 机读 |
|----|------|------|----------|-------------|
| **E-01** | fee_schedule 单位经济 | P0 | SKU/quote/payment 对拍 | onboarding-fee-schedule.v1 |
| **E-02** | B 轨准入收入 | P1 | provider/steward 准入 | fee_schedule_v1.rs |
| **E-03** | Escrow 费用路由 | P1 | FeeRouter 叙事 | 14 · escrow |
| **E-04** | 收购 bond 经济 | P1 | listing gate 成本 | acquisition rules §8 |
| **E-05** | Steward stake | P1 | 治理质押经济 | governance stack |
| **E-06** | 基础设施成本 | P1 | local/staging/prod 分层 | cost-projection-report |
| **E-07** | Staging 成本预测 | P1 | ② fly/DB 估算 | PHASE2-START |
| **E-08** | Production 成本预测 | P1 | ③ 算力/DB/PSP | PHASE3 · go-live |
| **E-09** | PSP 费率假设 | P1 | Stripe test→prod | onboarding ② |
| **E-10** | 链 Gas 经济 | P1 | Sepolia vs 主网 | TT-PHASE2 broadcast |
| **E-11** | Support 成本 | P2 | 客服/工单模型 | RUNBOOK |
| **E-12** | Moderation 成本 | P2 | 社区审核 | community spec |
| **E-13** | Indexer 运维成本 | P1 | 索引节点 | TT-CHAIN |
| **E-14** | 存储/DB 成本 | P1 | PG 增长模型 | migrations count |
| **E-15** | CDN/计算成本 | P2 | fly/edge | PHASE3 |
| **E-16** | 收入归因 | P1 | 角色/产品线 | unit-economics-report |
| **E-17** | CUJ 单位经济 | P1 | 金路径单笔模型 | TT-9625 |
| **E-18** | Break-even 叙事 | P2 | Owner 签字 | PRODUCTION-GO |
| **E-19** | 经济债台账 | P1 | 96-18 经济项 | 96-18 |
| **E-20** | 成本预测报告 | P0 | 三阶 cost 表 | cost-projection-report.v1.json |

### §17.1 · 裁决与产出 {#tt-e-verdicts}

| 产出 | 文件 | 关联维 |
|------|------|--------|
| 见 §20.2 统一产出矩阵 | `evidence/lifecycle-forensic-audit/` | 全域 |

**gate：** `bash scripts/dev/run-lifecycle-forensic-audit-gate.sh` → **`TT_LIFECYCLE_FORENSIC_AUDIT: OK`**

### E-01 · fee_schedule 单位经济 {#e-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | SKU/quote/payment 对拍 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-01` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | onboarding-fee-schedule.v1 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-01-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-01-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-02 · B 轨准入收入 {#e-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | provider/steward 准入 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-02` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | fee_schedule_v1.rs |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-02-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-02-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-03 · Escrow 费用路由 {#e-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | FeeRouter 叙事 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-03` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | 14 · escrow |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-03-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-03-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-04 · 收购 bond 经济 {#e-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | listing gate 成本 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-04` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | acquisition rules §8 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-04-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-04-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-05 · Steward stake {#e-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 治理质押经济 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-05` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | governance stack |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-05-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-05-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-06 · 基础设施成本 {#e-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | local/staging/prod 分层 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-06` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | cost-projection-report |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-06-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-06-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-07 · Staging 成本预测 {#e-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | ② fly/DB 估算 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-07` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PHASE2-START |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-07-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-07-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-08 · Production 成本预测 {#e-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | ③ 算力/DB/PSP |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-08` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PHASE3 · go-live |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-08-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-08-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-09 · PSP 费率假设 {#e-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Stripe test→prod |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-09` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | onboarding ② |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-09-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-09-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-10 · 链 Gas 经济 {#e-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Sepolia vs 主网 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-10` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | TT-PHASE2 broadcast |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-10-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-10-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-11 · Support 成本 {#e-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 客服/工单模型 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-11` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | RUNBOOK |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-11-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-11-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-12 · Moderation 成本 {#e-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 社区审核 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-12` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | community spec |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-12-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-12-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-13 · Indexer 运维成本 {#e-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 索引节点 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-13` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | TT-CHAIN |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-13-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-13-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-14 · 存储/DB 成本 {#e-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | PG 增长模型 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-14` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | migrations count |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-14-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-14-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-15 · CDN/计算成本 {#e-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | fly/edge |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-15` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | PHASE3 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-15-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-15-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-16 · 收入归因 {#e-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 角色/产品线 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-16` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | unit-economics-report |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-16-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-16-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-17 · CUJ 单位经济 {#e-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 金路径单笔模型 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-17` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | TT-9625 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-17-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-17-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-18 · Break-even 叙事 {#e-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Owner 签字 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-18` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | PRODUCTION-GO |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-18-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-18-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-19 · 经济债台账 {#e-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 96-18 经济项 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-19` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | 96-18 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-19-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-19-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### E-20 · 成本预测报告 {#e-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 三阶 cost 表 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `E-20` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | cost-projection-report.v1.json |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| E-20-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| E-20-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| E-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §18 · DOMAIN-CA · CODE_ARCHITECTURE_AUDIT · 代码架构与技术卓越 {#domain-ca-architecture}

> **独立审计域** — 与 **D / PF / DOA** 并联；裁决 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE****。  
> **收敛前：** 须 **U12-LFC** + **U12-PF** + **U12-DOA** 并联通过（**非** ②③ GO 替代）。

### §18.0 · 维度地图（CA-01～CA-20） {#tt-ca-map}

**域内 P0：** **CA-03** · **CA-06** · **CA-08** · **CA-10** · **CA-12** · **CA-18** · **CA-20**

| ID | 子维 | 风险 | 核心问题 | SSOT / 机读 |
|----|------|------|----------|-------------|
| **CA-01** | Backend 模块化 | P1 | crates 边界 | crates/api |
| **CA-02** | Frontend lib 分层 | P1 | lib vs components | frontend/lib |
| **CA-03** | API 路由分层 | P0 | routes/ 结构 | crates/api/src/routes |
| **CA-04** | 状态管理 | P1 | hooks/context 模式 | frontend/lib |
| **CA-05** | 组件复用率 | P1 | 重复 UI 组件 | modularity-score |
| **CA-06** | 死代码/archive | P0 | archive/ui-v1 等 | feature-retirement-list |
| **CA-07** | 耦合热点 | P1 | cross-import 审查 | architecture-score |
| **CA-08** | DTO 对齐 | P0 | FE types ↔ API | 04 · routes.ts |
| **CA-09** | 契约测试 | P1 | vitest contract 集 | *.contract.test.ts |
| **CA-10** | ABI 架构 | P0 | forge↔FE abis | check-55-s13 |
| **CA-11** | Indexer 架构 | P1 | internal API 边界 | TT-CHAIN |
| **CA-12** | 路径依赖注册 | P0 | registry validator | validate-spec-path-* |
| **CA-13** | 错误处理层 | P1 | error.tsx / API errors | D47 |
| **CA-14** | 性能架构 | P1 | debounce/cache 叙事 | LANDING-MARKET SSOT |
| **CA-15** | Migration 架构 | P1 | sqlx 集 vs models | migrations/ |
| **CA-16** | 测试金字塔 | P1 | unit/smoke/e2e 比 | CONTRIBUTING |
| **CA-17** | CI 闸架构 | P1 | gates/ 索引 | TT-9628 §0.0.2a |
| **CA-18** | 安全边界层 | P0 | auth/RBAC/middleware | ADMIN-SECURITY |
| **CA-19** | 可观测性钩子 | P1 | request-id/metrics | ops/RUNBOOK |
| **CA-20** | 技术债登记 | P0 | CA finding registry | lifecycle-forensic-registry |

### §18.1 · 裁决与产出 {#tt-ca-verdicts}

| 产出 | 文件 | 关联维 |
|------|------|--------|
| 见 §20.2 统一产出矩阵 | `evidence/lifecycle-forensic-audit/` | 全域 |

**gate：** `bash scripts/dev/run-lifecycle-forensic-audit-gate.sh` → **`TT_LIFECYCLE_FORENSIC_AUDIT: OK`**

### CA-01 · Backend 模块化 {#ca-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | crates 边界 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-01` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | crates/api |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-01-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-01-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-02 · Frontend lib 分层 {#ca-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | lib vs components |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-02` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | frontend/lib |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-02-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-02-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-03 · API 路由分层 {#ca-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | routes/ 结构 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-03` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | crates/api/src/routes |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-03-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-03-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-04 · 状态管理 {#ca-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | hooks/context 模式 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-04` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | frontend/lib |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-04-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-04-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-05 · 组件复用率 {#ca-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 重复 UI 组件 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-05` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | modularity-score |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-05-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-05-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-06 · 死代码/archive {#ca-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | archive/ui-v1 等 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-06` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | feature-retirement-list |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-06-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-06-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-07 · 耦合热点 {#ca-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | cross-import 审查 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-07` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | architecture-score |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-07-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-07-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-08 · DTO 对齐 {#ca-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | FE types ↔ API |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-08` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | 04 · routes.ts |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-08-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-08-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-09 · 契约测试 {#ca-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | vitest contract 集 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-09` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | *.contract.test.ts |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-09-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-09-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-10 · ABI 架构 {#ca-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | forge↔FE abis |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-10` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | check-55-s13 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-10-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-10-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-11 · Indexer 架构 {#ca-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | internal API 边界 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-11` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | TT-CHAIN |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-11-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-11-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-12 · 路径依赖注册 {#ca-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | registry validator |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-12` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | validate-spec-path-* |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-12-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-12-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-13 · 错误处理层 {#ca-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | error.tsx / API errors |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-13` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | D47 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-13-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-13-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-14 · 性能架构 {#ca-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | debounce/cache 叙事 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-14` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | LANDING-MARKET SSOT |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-14-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-14-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-15 · Migration 架构 {#ca-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | sqlx 集 vs models |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-15` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | migrations/ |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-15-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-15-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-16 · 测试金字塔 {#ca-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | unit/smoke/e2e 比 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-16` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | CONTRIBUTING |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-16-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-16-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-17 · CI 闸架构 {#ca-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | gates/ 索引 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-17` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | TT-9628 §0.0.2a |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-17-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-17-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-18 · 安全边界层 {#ca-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | auth/RBAC/middleware |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-18` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | ADMIN-SECURITY |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-18-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-18-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-19 · 可观测性钩子 {#ca-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | request-id/metrics |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-19` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ops/RUNBOOK |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-19-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-19-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CA-20 · 技术债登记 {#ca-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | CA finding registry |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `CA-20` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | lifecycle-forensic-registry |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CA-20-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| CA-20-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| CA-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §19 · DOMAIN-UXA · UX_UI_DESIGN_GOVERNANCE_AUDIT · 设计系统与 L5 体验治理 {#domain-uxa-design}

> **独立审计域** — 与 **D / PF / DOA** 并联；裁决 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE****。  
> **收敛前：** 须 **U12-LFC** + **U12-PF** + **U12-DOA** 并联通过（**非** ②③ GO 替代）。

### §19.0 · 维度地图（UXA-01～UXA-20） {#tt-uxa-map}

**域内 P0：** **UXA-01** · **UXA-02** · **UXA-04** · **UXA-07** · **UXA-14** · **UXA-15** · **UXA-16** · **UXA-19** · …

| ID | 子维 | 风险 | 核心问题 | SSOT / 机读 |
|----|------|------|----------|-------------|
| **UXA-01** | 设计系统 86 | P0 | 双系统风 token | 86 spec |
| **UXA-02** | 五主路由冻结 | P0 | 结构/视觉 lock | FIVE-MAIN FREEZE |
| **UXA-03** | 视觉层级 | P1 | 标题/卡片/强调 | 86 · 92 |
| **UXA-04** | CTA 优先级 | P0 | 单页单主 CTA | 92 §四 · PF-03 |
| **UXA-05** | 布局统一性 | P1 | shell/grid 一致 | layout lock FREEZE |
| **UXA-06** | 信息密度 | P1 | PF-05 密度 | product-weight |
| **UXA-07** | 移动端体验 | P0 | 窄屏主链 | l5-pe-mobile-responsive |
| **UXA-08** | 无障碍 baseline | P1 | a11y 关键路径 | auth/me FREEZE |
| **UXA-09** | 空态 | P1 | 唯一下一步 | PF-13 · D47 |
| **UXA-10** | 错误恢复 | P1 | 非白屏 | error.tsx · PF-14 |
| **UXA-11** | Loading 态 | P2 | skeleton 一致 | loading.tsx 集 |
| **UXA-12** | 表单 UX | P1 | 字段/校验长度 | PF-12 · D48 |
| **UXA-13** | 弹窗/Modal | P1 | UnlockModal 等模式 | landing/market SSOT |
| **UXA-14** | 导航 IA | P0 | Hub 不串层 | PF-11 · account-nav |
| **UXA-15** | Publish Hub 边界 | P0 | 四入口裁决 | PUBLISH-HUB-IA |
| **UXA-16** | Workbench 边界 | P0 | provider/guide 不重复 | PROVIDER-WORKBENCH-FREEZE |
| **UXA-17** | Settings 中心 | P1 | settings 子页 IA | me/settings/* |
| **UXA-18** | Admin UI 治理 | P1 | 后台不膨胀 | PF-08 · adminShell |
| **UXA-19** | L5 UX 评分 | P0 | cross-role 矩阵 | L5-CROSS-ROLE-REALITY |
| **UXA-20** | 设计一致性分 | P0 | design-consistency-score | design-consistency-score.v1.json |

### §19.1 · 裁决与产出 {#tt-uxa-verdicts}

| 产出 | 文件 | 关联维 |
|------|------|--------|
| 见 §20.2 统一产出矩阵 | `evidence/lifecycle-forensic-audit/` | 全域 |

**gate：** `bash scripts/dev/run-lifecycle-forensic-audit-gate.sh` → **`TT_LIFECYCLE_FORENSIC_AUDIT: OK`**

### UXA-01 · 设计系统 86 {#uxa-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 双系统风 token |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-01` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | 86 spec |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-01-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-01-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-02 · 五主路由冻结 {#uxa-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 结构/视觉 lock |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-02` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | FIVE-MAIN FREEZE |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-02-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-02-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-03 · 视觉层级 {#uxa-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 标题/卡片/强调 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-03` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | 86 · 92 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-03-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-03-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-04 · CTA 优先级 {#uxa-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 单页单主 CTA |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-04` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | 92 §四 · PF-03 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-04-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-04-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-05 · 布局统一性 {#uxa-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | shell/grid 一致 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-05` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | layout lock FREEZE |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-05-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-05-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-06 · 信息密度 {#uxa-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | PF-05 密度 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-06` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | product-weight |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-06-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-06-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-07 · 移动端体验 {#uxa-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 窄屏主链 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-07` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | l5-pe-mobile-responsive |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-07-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-07-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-08 · 无障碍 baseline {#uxa-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | a11y 关键路径 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-08` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | auth/me FREEZE |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-08-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-08-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-09 · 空态 {#uxa-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 唯一下一步 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-09` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PF-13 · D47 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-09-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-09-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-10 · 错误恢复 {#uxa-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 非白屏 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-10` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | error.tsx · PF-14 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-10-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-10-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-11 · Loading 态 {#uxa-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | skeleton 一致 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-11` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | loading.tsx 集 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-11-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-11-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-12 · 表单 UX {#uxa-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 字段/校验长度 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-12` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PF-12 · D48 |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-12-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-12-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-13 · 弹窗/Modal {#uxa-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | UnlockModal 等模式 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-13` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | landing/market SSOT |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-13-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-13-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-14 · 导航 IA {#uxa-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Hub 不串层 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-14` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | PF-11 · account-nav |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-14-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-14-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-15 · Publish Hub 边界 {#uxa-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 四入口裁决 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-15` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | PUBLISH-HUB-IA |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-15-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-15-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-16 · Workbench 边界 {#uxa-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | provider/guide 不重复 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-16` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | PROVIDER-WORKBENCH-FREEZE |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-16-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-16-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-17 · Settings 中心 {#uxa-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | settings 子页 IA |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-17` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | me/settings/* |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-17-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-17-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-18 · Admin UI 治理 {#uxa-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 后台不膨胀 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-18` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PF-08 · adminShell |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-18-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-18-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-19 · L5 UX 评分 {#uxa-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | cross-role 矩阵 |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-19` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | L5-CROSS-ROLE-REALITY |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-19-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-19-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### UXA-20 · 设计一致性分 {#uxa-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | design-consistency-score |
| 2 | **检查清单** | 全站路由/按钮/权限/流程逐项 · 重复/漂移/膨胀 |
| 3 | **机读** | `run-lifecycle-forensic-audit-gate.sh` · `UXA-20` 子集 |
| 4 | **人工验收** | registry 登记 ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | design-consistency-score.v1.json |
| 7 | **①②③ GO** | ① LFC gate + artifacts；② staging 复验 P0；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/lifecycle-forensic-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| UXA-20-1 | gate/artifact PASS | ☐ | ☐ | ☐ |
| UXA-20-2 | 无 open P0 drift | ☐ | ☐ | ☐ |
| UXA-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §20 · Phase ① 收尾法证 · 统一产出与 MASTER 汇总 {#tt-lifecycle-forensic-unified}

> **Phase ① 收尾治理 · 统一法证产出** — **D01–D76 + DX-01 + PF + DOA + R + K + E + CA + UXA** · **进 ② 前** 机读+人工法证 **交付物索引**（§20.2）。  
> **诚实边界：** ① 本地 artifact **≠** ② staging 全矩阵 **≠** ③ Production GO。

### §20.0 · 七词裁决（全域写死） {#tt-lfc-verdict-vocabulary}

**KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**

| 裁决 | 域 |
|------|-----|
| KEEP / MERGE / RETIRE / REFACTOR | PF · UXA · 产品/体验 |
| UPDATE / DEPRECATE / REMOVE | DOA · R · K · CA · 文档/脚本/架构 |
| 组合 | 同对象可 PF=**MERGE** + DOA=**UPDATE** + CA=**REFACTOR** |

### §20.1 · Phase ① 一键收尾治理 {#tt-lfc-one-shot}

```bash
# 全生命周期法证（R+K+E+CA+UXA + 统一产出）
bash scripts/dev/run-lifecycle-forensic-audit-gate.sh
# → TT_LIFECYCLE_FORENSIC_AUDIT: OK

# Phase ① 收尾 MASTER GATE（§11–§12 + PF + DOA + Lifecycle）
bash scripts/dev/run-full-system-audit-master-gate.sh
# → TT_FULL_SYSTEM_AUDIT_MASTER: READY
# → TT_PHASE1_CLOSURE_GOVERNANCE: MASTER_READY

# 可选跳过：SKIP_DOMAIN_X=1 · SKIP_DOMAIN_Z=1 · SKIP_LIFECYCLE=1 · SKIP_*_ROUTES=1
```

### §20.2 · 统一产出矩阵（法证交付物） {#tt-lfc-deliverables}

| 产出 | 文件 | 主域 |
|------|------|------|
| Requirement Trace Matrix | `requirement-trace-matrix.v1.json` | R |
| Feature Lineage Report | `feature-lineage-report.v1.json` | R |
| Knowledge Risk Report | `knowledge-risk-report.v1.json` | K |
| Bus Factor Score | `bus-factor-score.v1.json` | K |
| Unit Economics Report | `unit-economics-report.v1.json` | E |
| Cost Projection Report | `cost-projection-report.v1.json` | E |
| Architecture Score | `architecture-score.v1.json` | CA |
| Maintainability Score | `maintainability-score.v1.json` | CA |
| Modularity Score | `modularity-score.v1.json` | CA |
| Design Consistency Score | `design-consistency-score.v1.json` | UXA |
| L5 UX Score | `l5-ux-score.v1.json` | UXA |
| Route/Button/Permission/Role/Workflow Matrix | `*-matrix.v1.json` | PF + R |
| Feature Retirement List | `feature-retirement-list.v1.json` | PF + CA |
| Top 100 / Top 20 ×3 | `top-*-*.v1.json` | 全域 |
| Complexity / Redundancy Score | `complexity-score.v1.json` 等 | PF + CA |
| Documentation Health Score | `documentation-health-score.v1.json` | DOA + K |
| Executive Product Health Report | `EXECUTIVE-PRODUCT-HEALTH-REPORT.md` | 全域 |
| Simplification Roadmap | `SIMPLIFICATION-ROADMAP.md` | 全域 |
| Master Registry | `lifecycle-forensic-registry.v1.json` | 全域 |

**生成：** `python scripts/dev/generate-lifecycle-forensic-artifacts.py evidence/lifecycle-forensic-audit/<stamp>/`  
**grep：** `TT_LIFECYCLE_FORENSIC_ARTIFACTS: OK` · `TT_LIFECYCLE_FORENSIC_EXECUTIVE: OK` · `TT_LIFECYCLE_FORENSIC_ROADMAP: OK`

### §20.3 · 三域五域并联 {#tt-lfc-cross-domain}

| 检查类型 | D | PF | DOA | R | K | E | CA | UXA |
|----------|---|----|----|---|---|---|----|-----|
| 路由 404 | D46 | PF-01 | DOA-10 | R-10 | — | — | CA-08 | UXA-14 |
| 双入口 | D05 | PF-04 | DOA-02 | R-20 | — | — | CA-05 | UXA-15 |
| 文档漂移 | D62 | — | DOA-03 | R-03 | K-04 | — | CA-12 | — |
| 设计不一致 | D13 | PF-03 | — | — | — | — | — | UXA-01 |
| 单位经济 | D06 | — | — | R-06 | — | E-01 | — | — |
| Bus factor | D70 | — | K-01 | — | K-20 | — | — | — |

---


## §21 · DOMAIN-CX · CUSTOMER_EXPERIENCE_AUDIT · 客户体验 {#domain-cx-customer}

> **Phase ① 收尾治理 · 最终补充域** — 七词裁决 **KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE** · 须 **U12-PGX** + MASTER 并联。

### §21.0 · 维度地图（CX-01～CX-20） {#tt-cx-map}

**域内 P0（摘）：** **CX-01** · **CX-03** · **CX-06** · **CX-11** · **CX-16** · **CX-17** · **CX-20** …

| ID | 子维 | 风险 | 核心问题 | SSOT |
|----|------|------|----------|------|
| **CX-01** | 新用户首次进入 | P0 | landing→我是谁/下一步 | TT-9625 · L5-CROSS-ROLE |
| **CX-02** | 注册/登录成功路径 | P1 | auth L5 绿集 | AUTH-LOGIN-FREEZE |
| **CX-03** | 首次成功路径 FSJ | P0 | 金路径第一步 escrow | TT-9625 |
| **CX-04** | 回访路径 | P1 | orders/settings 回访 | account-nav-page-tracker |
| **CX-05** | 认知负担 | P1 | 首屏模块数 | PF-16 · CX score |
| **CX-06** | Publish/Hub 迷路 | P0 | 四入口认知 | PF-04 · PUBLISH-HUB-IA |
| **CX-07** | 任务完成率 | P1 | CUJ 手验矩阵 | l5-pe-user-journey-audit |
| **CX-08** | 迷路率 | P1 | 404/死链/双轨 | D46 · PF-01 |
| **CX-09** | 空态下一步 | P1 | ConsumerSurfaceStatePanel | PF-13 |
| **CX-10** | 错误恢复 | P1 | error.tsx 可恢复 | PF-14 · D47 |
| **CX-11** | 移动端首次体验 | P0 | 窄屏主链 | l5-pe-mobile-responsive |
| **CX-12** | 多身份切换体验 | P1 | identities hub | ME-IDENTITIES-FREEZE |
| **CX-13** | 设置中心可达 | P1 | settings 子页 IA | smoke-account-nav-full |
| **CX-14** | 订单中心体验 | P1 | orders/escrow 走廊 | GO_local_orders_l5 |
| **CX-15** | 社区首次参与 | P2 | C11 空态 | COMMUNITY FREEZE |
| **CX-16** | 五角色首进 | P0 | cross-role matrix | L5-CROSS-ROLE-REALITY |
| **CX-17** | CTA 优先级 | P0 | 单主 CTA | UXA-04 · 92 |
| **CX-18** | 表单负担 | P1 | 注册/入驻步数 | PF-12 |
| **CX-19** | 留存体验钩子 | P2 | bookmark/favorites | LANDING-MARKET SSOT |
| **CX-20** | CX 汇总分 | P0 | top-50-user-experience-findings | user-success-report |

### CX-01 · 新用户首次进入 {#cx-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | landing→我是谁/下一步 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | TT-9625 · L5-CROSS-ROLE |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-01-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-01-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-02 · 注册/登录成功路径 {#cx-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | auth L5 绿集 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | AUTH-LOGIN-FREEZE |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-02-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-02-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-03 · 首次成功路径 FSJ {#cx-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 金路径第一步 escrow |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | TT-9625 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-03-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-03-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-04 · 回访路径 {#cx-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | orders/settings 回访 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | account-nav-page-tracker |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-04-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-04-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-05 · 认知负担 {#cx-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 首屏模块数 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PF-16 · CX score |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-05-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-05-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-06 · Publish/Hub 迷路 {#cx-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 四入口认知 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | PF-04 · PUBLISH-HUB-IA |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-06-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-06-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-07 · 任务完成率 {#cx-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | CUJ 手验矩阵 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | l5-pe-user-journey-audit |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-07-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-07-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-08 · 迷路率 {#cx-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 404/死链/双轨 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | D46 · PF-01 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-08-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-08-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-09 · 空态下一步 {#cx-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | ConsumerSurfaceStatePanel |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PF-13 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-09-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-09-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-10 · 错误恢复 {#cx-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | error.tsx 可恢复 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PF-14 · D47 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-10-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-10-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-11 · 移动端首次体验 {#cx-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 窄屏主链 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | l5-pe-mobile-responsive |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-11-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-11-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-12 · 多身份切换体验 {#cx-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | identities hub |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ME-IDENTITIES-FREEZE |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-12-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-12-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-13 · 设置中心可达 {#cx-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | settings 子页 IA |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | smoke-account-nav-full |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-13-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-13-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-14 · 订单中心体验 {#cx-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | orders/escrow 走廊 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | GO_local_orders_l5 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-14-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-14-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-15 · 社区首次参与 {#cx-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | C11 空态 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | COMMUNITY FREEZE |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-15-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-15-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-16 · 五角色首进 {#cx-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | cross-role matrix |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | L5-CROSS-ROLE-REALITY |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-16-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-16-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-17 · CTA 优先级 {#cx-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 单主 CTA |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | UXA-04 · 92 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-17-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-17-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-18 · 表单负担 {#cx-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 注册/入驻步数 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PF-12 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-18-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-18-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-19 · 留存体验钩子 {#cx-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | bookmark/favorites |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | LANDING-MARKET SSOT |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-19-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-19-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CX-20 · CX 汇总分 {#cx-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | top-50-user-experience-findings |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | user-success-report |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CX-20-1 | gate PASS | ☐ | ☐ | ☐ |
| CX-20-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CX-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §22 · DOMAIN-BA · BUSINESS_ANALYTICS_AUDIT · 商业分析 {#domain-ba-analytics}

> **Phase ① 收尾治理 · 最终补充域** — 七词裁决 **KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE** · 须 **U12-PGX** + MASTER 并联。

### §22.0 · 维度地图（BA-01～BA-20） {#tt-ba-map}

**域内 P0（摘）：** **BA-01** · **BA-03** · **BA-07** · **BA-14** · **BA-20** …

| ID | 子维 | 风险 | 核心问题 | SSOT |
|----|------|------|----------|------|
| **BA-01** | 转化漏斗 | P0 | register→escrow 阶段 | conversion-funnel-report |
| **BA-02** | Landing 转化 | P1 | itinerary create | LANDING-MARKET SSOT |
| **BA-03** | Market discover | P0 | getDiscoverOrders | useMarketPage |
| **BA-04** | Escrow 转化 | P1 | draft→pay | ESCROW-CLOSURE |
| **BA-05** | 增长闭环 | P1 | TT-9624 八类闭环 | TT-9624 |
| **BA-06** | 供需平衡 | P1 | listing vs demand | marketplace-liquidity-report |
| **BA-07** | 平台流动性 | P0 | discover 非空 | CS + BA 并联 |
| **BA-08** | 商家供给 | P1 | provider workbench exposure | PROVIDER-WORKBENCH |
| **BA-09** | 向导供给 | P1 | guide workbench | GUIDE-WORKBENCH-FREEZE |
| **BA-10** | 收购供给 | P1 | acquisition listing | acquisition README |
| **BA-11** | 主理人治理参与 | P2 | governance funnel | STEWARD-WORKBENCH |
| **BA-12** | fee_schedule 转化 | P1 | onboarding quote | onboarding-fee-schedule |
| **BA-13** | Referral 增长 | P2 | /me/referrals | growth hub |
| **BA-14** | Publish hub 转化 | P0 | 四入口→listing | PF-04 |
| **BA-15** | Admin 运营指标 | P1 | observability 路由 | admin README |
| **BA-16** | 社区 UGC 增长 | P2 | community posts | COMMUNITY audit |
| **BA-17** | 跨域 Trust Gate | P1 | CDIA/TGCA | CROSS-DOMAIN-INTEGRATION |
| **BA-18** | report.json 指标 | P1 | R-002 环境字段 | validate-regression-report |
| **BA-19** | 单位经济挂钩 | P1 | E-01 fee_schedule | unit-economics-report |
| **BA-20** | 商业指标汇总 | P0 | Executive platform BA 段 | EXECUTIVE-PLATFORM-HEALTH |

### BA-01 · 转化漏斗 {#ba-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | register→escrow 阶段 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | conversion-funnel-report |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-01-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-01-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-02 · Landing 转化 {#ba-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | itinerary create |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | LANDING-MARKET SSOT |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-02-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-02-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-03 · Market discover {#ba-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | getDiscoverOrders |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | useMarketPage |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-03-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-03-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-04 · Escrow 转化 {#ba-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | draft→pay |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ESCROW-CLOSURE |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-04-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-04-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-05 · 增长闭环 {#ba-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | TT-9624 八类闭环 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | TT-9624 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-05-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-05-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-06 · 供需平衡 {#ba-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | listing vs demand |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | marketplace-liquidity-report |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-06-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-06-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-07 · 平台流动性 {#ba-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | discover 非空 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | CS + BA 并联 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-07-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-07-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-08 · 商家供给 {#ba-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | provider workbench exposure |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PROVIDER-WORKBENCH |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-08-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-08-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-09 · 向导供给 {#ba-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | guide workbench |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | GUIDE-WORKBENCH-FREEZE |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-09-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-09-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-10 · 收购供给 {#ba-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | acquisition listing |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | acquisition README |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-10-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-10-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-11 · 主理人治理参与 {#ba-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | governance funnel |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | STEWARD-WORKBENCH |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-11-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-11-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-12 · fee_schedule 转化 {#ba-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | onboarding quote |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | onboarding-fee-schedule |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-12-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-12-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-13 · Referral 增长 {#ba-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | /me/referrals |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | growth hub |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-13-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-13-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-14 · Publish hub 转化 {#ba-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 四入口→listing |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | PF-04 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-14-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-14-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-15 · Admin 运营指标 {#ba-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | observability 路由 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | admin README |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-15-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-15-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-16 · 社区 UGC 增长 {#ba-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | community posts |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | COMMUNITY audit |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-16-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-16-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-17 · 跨域 Trust Gate {#ba-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | CDIA/TGCA |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | CROSS-DOMAIN-INTEGRATION |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-17-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-17-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-18 · report.json 指标 {#ba-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | R-002 环境字段 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | validate-regression-report |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-18-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-18-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-19 · 单位经济挂钩 {#ba-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | E-01 fee_schedule |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | unit-economics-report |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-19-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-19-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### BA-20 · 商业指标汇总 {#ba-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Executive platform BA 段 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | EXECUTIVE-PLATFORM-HEALTH |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| BA-20-1 | gate PASS | ☐ | ☐ | ☐ |
| BA-20-2 | 无 open P0 | ☐ | ☐ | ☐ |
| BA-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §23 · DOMAIN-OPS · REAL_OPERATION_AUDIT · 真人运营 {#domain-ops-real}

> **Phase ① 收尾治理 · 最终补充域** — 七词裁决 **KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE** · 须 **U12-PGX** + MASTER 并联。

### §23.0 · 维度地图（OPS-01～OPS-20） {#tt-ops-map}

**域内 P0（摘）：** **OPS-01** · **OPS-03** · **OPS-07** · **OPS-08** · **OPS-15** · **OPS-20** …

| ID | 子维 | 风险 | 核心问题 | SSOT |
|----|------|------|----------|------|
| **OPS-01** | 运营 Runbook | P0 | ops/RUNBOOK 四列 | ops/RUNBOOK.md |
| **OPS-02** | 客服处理流程 | P1 | 工单/request-id | RUNBOOK · D36 |
| **OPS-03** | 争议处理 | P0 | OED 走廊 | run-order-escrow-dispute-deep-audit |
| **OPS-04** | 商家运营 | P1 | provider workbench ops | PROVIDER-WORKBENCH |
| **OPS-05** | 向导运营 | P1 | guide schedule/listing | GUIDE-WORKBENCH |
| **OPS-06** | 主理人运营 | P1 | governance ops | STEWARD-WORKBENCH |
| **OPS-07** | Admin 日常运营 | P0 | admin 工作流 | run-admin-frontend-deep-audit |
| **OPS-08** | 安全运营 | P0 | AMWA 变异审计 | run-admin-security-closure |
| **OPS-09** | 内容审核 | P1 | community moderation | COMMUNITY C11 |
| **OPS-10** | 收购运营 suspend | P1 | admin suspend listing | acquisition rules |
| **OPS-11** |  onboarding 运营 | P1 | fee payment ops | onboarding §8 |
| **OPS-12** | 订单运营走廊 | P1 | GET orders hat | merchantOrderCorridor |
| **OPS-13** | 监控告警 | P1 | observability | ops RUNBOOK §1 |
| **OPS-14** | Incident 响应 | P1 | PI3/DR | check-pi3-001 |
| **OPS-15** | 运营效率 | P0 | operational-efficiency-report | EXECUTIVE-PLATFORM |
| **OPS-16** | 多角色运营交叉 | P1 | 五角色手验 | run-five-role-full-chain-audit |
| **OPS-17** | Publish hub 运营 | P1 | listing 审核 | PUBLISH-HUB |
| **OPS-18** | Trust 运营 | P1 | trust 字段运营 | me.trust API |
| **OPS-19** | 96-18 运营债 | P1 | open ops gaps | 96-18 |
| **OPS-20** | 运营复杂度 | P0 | 后台+流程步数 | PF-08 + ADMIN |

### OPS-01 · 运营 Runbook {#ops-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | ops/RUNBOOK 四列 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | ops/RUNBOOK.md |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-01-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-01-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-02 · 客服处理流程 {#ops-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 工单/request-id |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | RUNBOOK · D36 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-02-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-02-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-03 · 争议处理 {#ops-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | OED 走廊 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | run-order-escrow-dispute-deep-audit |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-03-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-03-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-04 · 商家运营 {#ops-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | provider workbench ops |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PROVIDER-WORKBENCH |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-04-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-04-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-05 · 向导运营 {#ops-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | guide schedule/listing |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | GUIDE-WORKBENCH |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-05-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-05-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-06 · 主理人运营 {#ops-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | governance ops |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | STEWARD-WORKBENCH |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-06-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-06-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-07 · Admin 日常运营 {#ops-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | admin 工作流 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | run-admin-frontend-deep-audit |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-07-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-07-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-08 · 安全运营 {#ops-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | AMWA 变异审计 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | run-admin-security-closure |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-08-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-08-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-09 · 内容审核 {#ops-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | community moderation |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | COMMUNITY C11 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-09-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-09-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-10 · 收购运营 suspend {#ops-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | admin suspend listing |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | acquisition rules |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-10-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-10-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-11 ·  onboarding 运营 {#ops-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | fee payment ops |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | onboarding §8 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-11-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-11-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-12 · 订单运营走廊 {#ops-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | GET orders hat |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | merchantOrderCorridor |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-12-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-12-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-13 · 监控告警 {#ops-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | observability |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ops RUNBOOK §1 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-13-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-13-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-14 · Incident 响应 {#ops-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | PI3/DR |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | check-pi3-001 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-14-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-14-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-15 · 运营效率 {#ops-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | operational-efficiency-report |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | EXECUTIVE-PLATFORM |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-15-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-15-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-16 · 多角色运营交叉 {#ops-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 五角色手验 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | run-five-role-full-chain-audit |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-16-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-16-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-17 · Publish hub 运营 {#ops-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | listing 审核 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | PUBLISH-HUB |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-17-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-17-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-18 · Trust 运营 {#ops-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | trust 字段运营 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | me.trust API |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-18-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-18-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-19 · 96-18 运营债 {#ops-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | open ops gaps |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | 96-18 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-19-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-19-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### OPS-20 · 运营复杂度 {#ops-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 后台+流程步数 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | PF-08 + ADMIN |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| OPS-20-1 | gate PASS | ☐ | ☐ | ☐ |
| OPS-20-2 | 无 open P0 | ☐ | ☐ | ☐ |
| OPS-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §24 · DOMAIN-TRUST · TRUST_AND_REPUTATION_AUDIT · 信任与声誉 {#domain-trust-reputation}

> **Phase ① 收尾治理 · 最终补充域** — 七词裁决 **KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE** · 须 **U12-PGX** + MASTER 并联。

### §24.0 · 维度地图（TRUST-01～TRUST-20） {#tt-trust-map}

**域内 P0（摘）：** **TRUST-01** · **TRUST-02** · **TRUST-04** · **TRUST-05** · **TRUST-09** · **TRUST-19** · **TRUST-20** …

| ID | 子维 | 风险 | 核心问题 | SSOT |
|----|------|------|----------|------|
| **TRUST-01** | 信任体系总览 | P0 | me.trust 字段 | acquisition-publish-trust-rules |
| **TRUST-02** | 认证门闸 | P0 | onboarding/trust settings | me/settings/trust |
| **TRUST-03** | 评分生命周期 | P1 | reputation 叙事 | IDENTITY-TRUST-GOVERNANCE |
| **TRUST-04** | 收购 bond | P0 | acquisition_publish_gate | acquisition L5 |
| **TRUST-05** | Identities hub trust | P0 | identities→acquisition | ME-IDENTITIES-FREEZE |
| **TRUST-06** | Provider trust | P1 | merchant trust 字段 | provider register |
| **TRUST-07** | Guide trust | P1 | guide staking 叙事 | guide workbench |
| **TRUST-08** | Steward stake | P1 | governance stake | TT-PHASE2 governance |
| **TRUST-09** | 反作弊 | P0 | rate limit + audit | D56 · admin security |
| **TRUST-10** | 反刷单 | P1 | order idempotency | D52 CDIA |
| **TRUST-11** | 反女巫 | P1 | multi-identity isolation | D28 LOCAL-MULTI-IDENTITY |
| **TRUST-12** | ITG 深度 | P1 | identity-trust-governance audit | identity-trust-governance-deep-audit |
| **TRUST-13** | Admin trust 工具 | P1 | admin trust mutate | ADMIN-SECURITY |
| **TRUST-14** | 链上 trust 边界 | P2 | Sepolia vs 主网 | D15 · 14 |
| **TRUST-15** | 社区 trust | P2 | UGC reputation | community spec |
| **TRUST-16** | Escrow trust | P1 | dispute trust | OED audit |
| **TRUST-17** | Market trust signals | P1 | listing trust display | market pages |
| **TRUST-18** | Trust 文档 SSOT | P1 | spec vs code | DOA-03 + TRUST |
| **TRUST-19** | Trust 缺口台账 | P0 | 96-18 trust 项 | trust-health-report |
| **TRUST-20** | Trust health 分 | P0 | trust-health-report.v1.json | registry |

### TRUST-01 · 信任体系总览 {#trust-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | me.trust 字段 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | acquisition-publish-trust-rules |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-01-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-01-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-02 · 认证门闸 {#trust-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | onboarding/trust settings |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | me/settings/trust |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-02-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-02-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-03 · 评分生命周期 {#trust-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | reputation 叙事 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | IDENTITY-TRUST-GOVERNANCE |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-03-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-03-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-04 · 收购 bond {#trust-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | acquisition_publish_gate |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | acquisition L5 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-04-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-04-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-05 · Identities hub trust {#trust-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | identities→acquisition |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | ME-IDENTITIES-FREEZE |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-05-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-05-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-06 · Provider trust {#trust-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | merchant trust 字段 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | provider register |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-06-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-06-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-07 · Guide trust {#trust-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | guide staking 叙事 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | guide workbench |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-07-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-07-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-08 · Steward stake {#trust-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | governance stake |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | TT-PHASE2 governance |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-08-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-08-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-09 · 反作弊 {#trust-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | rate limit + audit |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | D56 · admin security |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-09-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-09-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-10 · 反刷单 {#trust-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | order idempotency |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | D52 CDIA |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-10-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-10-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-11 · 反女巫 {#trust-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | multi-identity isolation |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | D28 LOCAL-MULTI-IDENTITY |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-11-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-11-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-12 · ITG 深度 {#trust-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | identity-trust-governance audit |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | identity-trust-governance-deep-audit |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-12-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-12-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-13 · Admin trust 工具 {#trust-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | admin trust mutate |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ADMIN-SECURITY |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-13-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-13-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-14 · 链上 trust 边界 {#trust-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Sepolia vs 主网 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | D15 · 14 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-14-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-14-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-15 · 社区 trust {#trust-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | UGC reputation |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | community spec |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-15-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-15-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-16 · Escrow trust {#trust-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | dispute trust |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | OED audit |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-16-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-16-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-17 · Market trust signals {#trust-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | listing trust display |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | market pages |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-17-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-17-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-18 · Trust 文档 SSOT {#trust-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | spec vs code |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | DOA-03 + TRUST |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-18-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-18-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-19 · Trust 缺口台账 {#trust-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 96-18 trust 项 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | trust-health-report |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-19-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-19-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### TRUST-20 · Trust health 分 {#trust-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | trust-health-report.v1.json |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | registry |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| TRUST-20-1 | gate PASS | ☐ | ☐ | ☐ |
| TRUST-20-2 | 无 open P0 | ☐ | ☐ | ☐ |
| TRUST-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §25 · DOMAIN-ADMIN · ADMINISTRATOR_GOVERNANCE_AUDIT · 管理员治理 {#domain-admin-governance}

> **Phase ① 收尾治理 · 最终补充域** — 七词裁决 **KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE** · 须 **U12-PGX** + MASTER 并联。

### §25.0 · 维度地图（ADMIN-01～ADMIN-20） {#tt-admin-map}

**域内 P0（摘）：** **ADMIN-01** · **ADMIN-02** · **ADMIN-03** · **ADMIN-09** · **ADMIN-10** · **ADMIN-11** · **ADMIN-15** · **ADMIN-17** · **ADMIN-19** · **ADMIN-20** …

| ID | 子维 | 风险 | 核心问题 | SSOT |
|----|------|------|----------|------|
| **ADMIN-01** | Admin 路由全量 | P0 | admin page 集 | admin README · AFDA |
| **ADMIN-02** | Sidebar 菜单 | P0 | adminShellSidebarModel | run-admin-frontend-deep-audit |
| **ADMIN-03** | 按钮/CTA 膨胀 | P0 | admin 按钮盘点 | top-100-admin-findings |
| **ADMIN-04** | 用户管理 | P1 | users admin API | route-matrix |
| **ADMIN-05** | 订单管理 | P1 | orders admin | 04 admin routes |
| **ADMIN-06** | 争议管理 | P1 | dispute admin | OED |
| **ADMIN-07** | 治理管理 | P1 | governance admin | governance matrix |
| **ADMIN-08** | 内容管理 | P1 | community admin | COMMUNITY admin |
| **ADMIN-09** | RBAC 矩阵 | P0 | route-matrix smoke | smoke-admin-rbac-matrix |
| **ADMIN-10** | 权限膨胀 | P0 | rbac-expansion-report | PF-09 |
| **ADMIN-11** | 危险权限 | P0 | dangerous-permission-report | AMWA |
| **ADMIN-12** | 审批流 | P1 | admin approvals | ADMIN-SECURITY-CLOSURE |
| **ADMIN-13** | 审核流 | P1 | listing/content approve | provider/market ops |
| **ADMIN-14** | 风控工具 | P1 | risk admin surfaces | AFDA |
| **ADMIN-15** | 日志审计 | P0 | audit log 100% | D36 · run-admin-mutating |
| **ADMIN-16** | 权限继承 | P1 | role hierarchy | 87 · route-matrix |
| **ADMIN-17** | 越权访问 | P0 | rbac-security 负例 | l5-enterprise-rbac-security |
| **ADMIN-18** | 管理员 UX | P1 | mobile admin nav | l5-pe-mobile admin fold |
| **ADMIN-19** | 后台瘦身 | P0 | MERGE/RETIRE 菜单 | PF-08 · Simplification |
| **ADMIN-20** | Admin capability 矩阵 | P0 | admin-capability-matrix | registry |

### ADMIN-01 · Admin 路由全量 {#admin-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | admin page 集 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | admin README · AFDA |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-01-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-01-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-02 · Sidebar 菜单 {#admin-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | adminShellSidebarModel |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | run-admin-frontend-deep-audit |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-02-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-02-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-03 · 按钮/CTA 膨胀 {#admin-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | admin 按钮盘点 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | top-100-admin-findings |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-03-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-03-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-04 · 用户管理 {#admin-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | users admin API |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | route-matrix |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-04-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-04-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-05 · 订单管理 {#admin-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | orders admin |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | 04 admin routes |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-05-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-05-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-06 · 争议管理 {#admin-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | dispute admin |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | OED |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-06-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-06-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-07 · 治理管理 {#admin-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | governance admin |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | governance matrix |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-07-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-07-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-08 · 内容管理 {#admin-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | community admin |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | COMMUNITY admin |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-08-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-08-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-09 · RBAC 矩阵 {#admin-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | route-matrix smoke |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | smoke-admin-rbac-matrix |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-09-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-09-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-10 · 权限膨胀 {#admin-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | rbac-expansion-report |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | PF-09 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-10-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-10-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-11 · 危险权限 {#admin-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | dangerous-permission-report |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | AMWA |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-11-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-11-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-12 · 审批流 {#admin-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | admin approvals |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | ADMIN-SECURITY-CLOSURE |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-12-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-12-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-13 · 审核流 {#admin-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | listing/content approve |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | provider/market ops |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-13-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-13-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-14 · 风控工具 {#admin-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | risk admin surfaces |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | AFDA |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-14-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-14-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-15 · 日志审计 {#admin-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | audit log 100% |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | D36 · run-admin-mutating |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-15-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-15-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-16 · 权限继承 {#admin-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | role hierarchy |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | 87 · route-matrix |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-16-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-16-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-17 · 越权访问 {#admin-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | rbac-security 负例 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | l5-enterprise-rbac-security |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-17-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-17-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-18 · 管理员 UX {#admin-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | mobile admin nav |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | l5-pe-mobile admin fold |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-18-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-18-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-19 · 后台瘦身 {#admin-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | MERGE/RETIRE 菜单 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | PF-08 · Simplification |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-19-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-19-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### ADMIN-20 · Admin capability 矩阵 {#admin-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | admin-capability-matrix |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | registry |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| ADMIN-20-1 | gate PASS | ☐ | ☐ | ☐ |
| ADMIN-20-2 | 无 open P0 | ☐ | ☐ | ☐ |
| ADMIN-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §26 · DOMAIN-CS · COLD_START_AND_NETWORK_EFFECT_AUDIT · 冷启动与网络效应 {#domain-cs-coldstart}

> **Phase ① 收尾治理 · 最终补充域** — 七词裁决 **KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE** · 须 **U12-PGX** + MASTER 并联。

### §26.0 · 维度地图（CS-01～CS-20） {#tt-cs-map}

**域内 P0（摘）：** **CS-01** · **CS-04** · **CS-06** · **CS-07** · **CS-12** · **CS-19** · **CS-20** …

| ID | 子维 | 风险 | 核心问题 | SSOT |
|----|------|------|----------|------|
| **CS-01** | 种子用户 | P0 | SEED_TEST_ACCOUNTS | start-api-with-seed-README |
| **CS-02** | 种子商家 | P1 | merchant@test seed | provider workbench smoke |
| **CS-03** | 种子向导 | P1 | guide seed narrative | guide workbench |
| **CS-04** | 种子脚本一键 | P0 | start-api-with-seed | TT-9618 |
| **CS-05** | 种子内容 | P1 | discover 非空 | marketplace-liquidity |
| **CS-06** | 供需匹配 | P0 | listing↔discover | getDiscoverOrders |
| **CS-07** | 信任冷启动 | P0 | trust 初始态 | trust-health-report |
| **CS-08** | 收购冷启动 | P1 | bond→listing path | acquisition smoke |
| **CS-09** | 社区冷启动 | P2 | empty feed | community seed |
| **CS-10** | Onboarding 冷启动 | P1 | fee_schedule 首单 | onboarding §8 |
| **CS-11** | 增长飞轮 | P1 | referral/publish | growth hub |
| **CS-12** | 流动性启动 | P0 | market liquidity report | marketplace-liquidity-report |
| **CS-13** | 网络效应路径 | P1 | multi-sided 叙事 | TT-9622 bounded contexts |
| **CS-14** | 五主路由引流 | P1 | marketing→market | FIVE-MAIN + LANDING |
| **CS-15** | Enterprise site 10 | P1 | 全站种子链 | run-enterprise-site-10-local |
| **CS-16** | Local multi-demo | P1 | 四轨种子 | LOCAL-MULTI-IDENTITY |
| **CS-17** | Indexer/链冷启动 | P2 | chain_off mode | D15 ① |
| **CS-18** | Admin 种子工具 | P1 | admin seed ops | admin README |
| **CS-19** | 冷启动风险 Top50 | P0 | top-50-cold-start-risks | registry |
| **CS-20** | Readiness 报告 | P0 | cold-start-readiness-report | EXECUTIVE-PLATFORM |

### CS-01 · 种子用户 {#cs-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | SEED_TEST_ACCOUNTS |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | start-api-with-seed-README |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-01-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-01-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-02 · 种子商家 {#cs-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | merchant@test seed |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | provider workbench smoke |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-02-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-02-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-03 · 种子向导 {#cs-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | guide seed narrative |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | guide workbench |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-03-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-03-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-04 · 种子脚本一键 {#cs-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | start-api-with-seed |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | TT-9618 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-04-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-04-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-05 · 种子内容 {#cs-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | discover 非空 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | marketplace-liquidity |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-05-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-05-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-06 · 供需匹配 {#cs-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | listing↔discover |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | getDiscoverOrders |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-06-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-06-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-07 · 信任冷启动 {#cs-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | trust 初始态 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | trust-health-report |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-07-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-07-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-08 · 收购冷启动 {#cs-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | bond→listing path |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | acquisition smoke |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-08-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-08-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-09 · 社区冷启动 {#cs-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | empty feed |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | community seed |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-09-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-09-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-10 · Onboarding 冷启动 {#cs-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | fee_schedule 首单 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | onboarding §8 |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-10-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-10-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-11 · 增长飞轮 {#cs-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | referral/publish |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | growth hub |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-11-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-11-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-12 · 流动性启动 {#cs-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | market liquidity report |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | marketplace-liquidity-report |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-12-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-12-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-13 · 网络效应路径 {#cs-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | multi-sided 叙事 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | TT-9622 bounded contexts |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-13-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-13-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-14 · 五主路由引流 {#cs-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | marketing→market |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | FIVE-MAIN + LANDING |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-14-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-14-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-15 · Enterprise site 10 {#cs-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 全站种子链 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | run-enterprise-site-10-local |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-15-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-15-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-16 · Local multi-demo {#cs-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 四轨种子 |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | LOCAL-MULTI-IDENTITY |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-16-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-16-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-17 · Indexer/链冷启动 {#cs-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | chain_off mode |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P2** |
| 6 | **SSOT** | D15 ① |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-17-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-17-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-18 · Admin 种子工具 {#cs-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | admin seed ops |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | admin README |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-18-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-18-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-19 · 冷启动风险 Top50 {#cs-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | top-50-cold-start-risks |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | registry |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-19-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-19-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### CS-20 · Readiness 报告 {#cs-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | cold-start-readiness-report |
| 2 | **检查清单** | 全角色/路由/按钮/工作流 · 重复/流失/瓶颈 |
| 3 | **机读** | `run-platform-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | EXECUTIVE-PLATFORM |
| 7 | **①②③ GO** | ① PGX gate + artifacts；② staging 复验；③ Executive 签字 |
| 8 | **证据/产出** | `evidence/platform-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| CS-20-1 | gate PASS | ☐ | ☐ | ☐ |
| CS-20-2 | 无 open P0 | ☐ | ☐ | ☐ |
| CS-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §27 · 平台治理 · 统一产出与 Phase ① 最终补充 {#tt-platform-governance-unified}

> **v1.9.0 最终补充** — **CX · BA · OPS · TRUST · ADMIN · CS** · 与 §20 LFC · PF · DOA **并联** 构成 Phase ① 收尾全表。

### §27.0 · ① 一键平台治理审计 {#tt-pgx-one-shot}

```bash
bash scripts/dev/run-platform-governance-audit-gate.sh
# → TT_PLATFORM_GOVERNANCE_AUDIT: OK

bash scripts/dev/run-full-system-audit-master-gate.sh
# 含 PGX（SKIP_PLATFORM_GOV=1 可跳过）
```

### §27.1 · 产出矩阵 {#tt-pgx-deliverables}

| 产出 | 文件 | 主域 |
|------|------|------|
| Admin Capability Matrix | `admin-capability-matrix.v1.json` | ADMIN |
| RBAC Expansion Report | `rbac-expansion-report.v1.json` | ADMIN |
| Dangerous Permission Report | `dangerous-permission-report.v1.json` | ADMIN |
| Cold Start Readiness Report | `cold-start-readiness-report.v1.json` | CS |
| Marketplace Liquidity Report | `marketplace-liquidity-report.v1.json` | BA/CS |
| Trust Health Report | `trust-health-report.v1.json` | TRUST |
| User Success Report | `user-success-report.v1.json` | CX |
| Conversion Funnel Report | `conversion-funnel-report.v1.json` | BA |
| Operational Efficiency Report | `operational-efficiency-report.v1.json` | OPS |
| Top 100 Admin Findings | `top-100-admin-findings.v1.json` | ADMIN |
| Top 50 Permission Findings | `top-50-permission-findings.v1.json` | ADMIN |
| Top 50 Cold Start Risks | `top-50-cold-start-risks.v1.json` | CS |
| Top 50 User Experience Findings | `top-50-user-experience-findings.v1.json` | CX |
| Executive Platform Health | `EXECUTIVE-PLATFORM-HEALTH-REPORT.md` | 全域 |
| Registry | `platform-governance-registry.v1.json` | 全域 |

**grep：** `TT_PLATFORM_GOVERNANCE_ARTIFACTS: OK` · `TT_PLATFORM_GOVERNANCE_EXECUTIVE: OK`

---


## §28 · DOMAIN-AG · ADMINISTRATION_AND_GOVERNANCE_AUDIT · 管理员与平台治理 {#domain-ag-administration}

> **Phase ① 收尾 · 后台治理深审** — 覆盖 **六类业务主体 + 七类管理员角色** · 全 admin 路由/菜单/按钮/工作流。  
> **与 §25 DOMAIN-ADMIN（PGX 切片）· PF-08/09 · DOA-14/15 · UXA-18 并联** — AG = **完整治理 + L5 后台体验** 深审层。  
> **裁决：** **KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**

### §28.0 · 维度地图（AG-01～AG-20） {#tt-ag-map}

**域内 P0（摘）：** **AG-01** · **AG-02** · **AG-03** · **AG-04** · **AG-05** · **AG-06** · **AG-07** · **AG-10** · **AG-15** · **AG-16** · **AG-17** · **AG-18** · **AG-19** · **AG-20** …

| ID | 子维 | 风险 | 核心问题 | SSOT |
|----|------|------|----------|------|
| **AG-01** | 六类业务主体边界 | P0 | Traveler/Guide/Merchant/Acquisition/Steward/Admin 职责 | 87 · admin README |
| **AG-02** | 管理员角色 taxonomy | P0 | Super/Ops/Content/Gov/Support/Risk/Finance | admin-role-responsibility-matrix |
| **AG-03** | RBAC 权限矩阵 | P0 | route-matrix ↔ UI ↔ API | smoke-admin-rbac-matrix |
| **AG-04** | 审批链路 | P0 | /admin/approvals 工作流 | approval-workflow-matrix |
| **AG-05** | 运营链路 | P0 | inbox · official · onboarding ops | operations-workflow-matrix |
| **AG-06** | 风控链路 | P0 | anti-fraud · compliance · alerts | risk-control-matrix |
| **AG-07** | 治理链路 | P0 | governance · steward applications | governance-control-matrix |
| **AG-08** | 内容审核 | P1 | community moderation · content publish | content admin routes |
| **AG-09** | 用户管理 | P1 | users read/write 边界 | admin.users.* |
| **AG-10** | 订单/争议管理 | P0 | orders · disputes write | dangerous-action-matrix |
| **AG-11** | 举报管理 | P1 | community reports | community/reports |
| **AG-12** | 治理提案管理 | P1 | governance execution UAT | governance routes |
| **AG-13** | 早鸟与激励 | P1 | early-bird stages | early-bird-incentive-matrix |
| **AG-14** | 邀请码/增长 | P1 | referral · airdrop · KOL | growth admin |
| **AG-15** | 风控策略 | P0 | GROWTH_FRAUD · anti-fraud rules | risk-control-matrix |
| **AG-16** | 审计日志 | P0 | audit logs 100% AMWA | D36 · /admin/audit |
| **AG-17** | 危险操作 | P0 | publish/suspend/super | dangerous-action-matrix |
| **AG-18** | 权限继承/膨胀 | P0 | permission-escalation-report | PF-09 · rbac-boundary |
| **AG-19** | Admin L5 UX/IA | P0 | 视觉/CTA/密度/导航/空态 | admin-l5-design-score |
| **AG-20** | Executive 治理健康 | P0 | Governance Health 报告 | EXECUTIVE-GOVERNANCE-HEALTH |

### AG-01 · 六类业务主体边界 {#ag-01}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Traveler/Guide/Merchant/Acquisition/Steward/Admin 职责 |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | 87 · admin README |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-01-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-01-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-01-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-02 · 管理员角色 taxonomy {#ag-02}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Super/Ops/Content/Gov/Support/Risk/Finance |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | admin-role-responsibility-matrix |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-02-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-02-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-02-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-03 · RBAC 权限矩阵 {#ag-03}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | route-matrix ↔ UI ↔ API |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | smoke-admin-rbac-matrix |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-03-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-03-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-03-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-04 · 审批链路 {#ag-04}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | /admin/approvals 工作流 |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | approval-workflow-matrix |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-04-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-04-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-04-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-05 · 运营链路 {#ag-05}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | inbox · official · onboarding ops |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | operations-workflow-matrix |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-05-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-05-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-05-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-06 · 风控链路 {#ag-06}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | anti-fraud · compliance · alerts |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | risk-control-matrix |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-06-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-06-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-06-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-07 · 治理链路 {#ag-07}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | governance · steward applications |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | governance-control-matrix |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-07-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-07-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-07-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-08 · 内容审核 {#ag-08}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | community moderation · content publish |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | content admin routes |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-08-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-08-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-08-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-09 · 用户管理 {#ag-09}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | users read/write 边界 |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | admin.users.* |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-09-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-09-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-09-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-10 · 订单/争议管理 {#ag-10}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | orders · disputes write |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | dangerous-action-matrix |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-10-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-10-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-10-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-11 · 举报管理 {#ag-11}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | community reports |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | community/reports |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-11-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-11-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-11-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-12 · 治理提案管理 {#ag-12}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | governance execution UAT |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | governance routes |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-12-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-12-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-12-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-13 · 早鸟与激励 {#ag-13}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | early-bird stages |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | early-bird-incentive-matrix |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-13-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-13-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-13-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-14 · 邀请码/增长 {#ag-14}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | referral · airdrop · KOL |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P1** |
| 6 | **SSOT** | growth admin |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-14-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-14-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-14-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-15 · 风控策略 {#ag-15}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | GROWTH_FRAUD · anti-fraud rules |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | risk-control-matrix |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-15-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-15-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-15-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-16 · 审计日志 {#ag-16}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | audit logs 100% AMWA |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | D36 · /admin/audit |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-16-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-16-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-16-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-17 · 危险操作 {#ag-17}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | publish/suspend/super |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | dangerous-action-matrix |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-17-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-17-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-17-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-18 · 权限继承/膨胀 {#ag-18}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | permission-escalation-report |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | PF-09 · rbac-boundary |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-18-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-18-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-18-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-19 · Admin L5 UX/IA {#ag-19}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | 视觉/CTA/密度/导航/空态 |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | admin-l5-design-score |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-19-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-19-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-19-3 | 裁决已登记 | ☐ | ☐ | ☐ |


### AG-20 · Executive 治理健康 {#ag-20}

| # | 八件套 | 内容 |
|---|--------|------|
| 1 | **审计目标** | Governance Health 报告 |
| 2 | **检查清单** | 每 admin 路由/菜单/按钮/批量操作/看板 |
| 3 | **机读** | `run-admin-governance-audit-gate.sh` |
| 4 | **人工验收** | registry ****KEEP** · **MERGE** · **RETIRE** · **REFACTOR** · **UPDATE** · **DEPRECATE** · **REMOVE**** |
| 5 | **风险** | **P0** |
| 6 | **SSOT** | EXECUTIVE-GOVERNANCE-HEALTH |
| 7 | **①②③ GO** | ① AG gate；② AFDA staging；③ Executive 签字 |
| 8 | **证据** | `evidence/admin-governance-audit/<stamp>/` |

| # | 检查项 | ① | ② | ③ |
|---|--------|---|---|---|
| AG-20-1 | gate PASS | ☐ | ☐ | ☐ |
| AG-20-2 | 无 open P0 | ☐ | ☐ | ☐ |
| AG-20-3 | 裁决已登记 | ☐ | ☐ | ☐ |


---

## §29 · 管理员与平台治理 · 统一产出 {#tt-admin-governance-unified}

> **DOMAIN-AG 交付物索引** — 与 §27 PGX · §13 PF · §14 DOA · §19 UXA **并联**。

### §29.1 · 产出矩阵 {{#tt-ag-deliverables}}

| 产出 | 文件 |
|------|------|
| Admin Role Responsibility Matrix | `admin-role-responsibility-matrix.v1.json` |
| RBAC Boundary Matrix | `rbac-boundary-matrix.v1.json` |
| Approval Workflow Matrix | `approval-workflow-matrix.v1.json` |
| Operations Workflow Matrix | `operations-workflow-matrix.v1.json` |
| Risk Control Matrix | `risk-control-matrix.v1.json` |
| Governance Control Matrix | `governance-control-matrix.v1.json` |
| Early Bird & Incentive Matrix | `early-bird-incentive-matrix.v1.json` |
| Admin Capability Matrix | `admin-capability-matrix.v1.json` |
| Dangerous Action Matrix | `dangerous-action-matrix.v1.json` |
| Permission Escalation Report | `permission-escalation-report.v1.json` |
| Admin Complexity / Efficiency / UX / L5 / IA / A11y Scores | `admin-*-score.v1.json` |
| Admin Mobile Audit | `admin-mobile-audit.v1.json` |
| Admin Product Weight Report | `admin-product-weight-report.v1.json` |
| Executive Governance Health | `EXECUTIVE-GOVERNANCE-HEALTH-REPORT.md` |
| Registry | `admin-governance-registry.v1.json` |

```bash
bash scripts/dev/run-admin-governance-audit-gate.sh
# → TT_ADMIN_GOVERNANCE_AUDIT: OK
```

**grep：** `TT_ADMIN_GOVERNANCE_ARTIFACTS: OK` · `TT_ADMIN_GOVERNANCE_EXECUTIVE: OK`

---


## §30 · DOMAIN-MA · META_AUDIT · 治理标准审计 {#domain-ma-meta}

> **不新增业务检查维** — 审计 **本标准** 的结构 · 顺序 · 权重 · 输出 · 升级闸 · 可维护性 · AI 可读性。  
> **目标：** 收口冻结前 **最终企业级治理标准**（阅读 / 执行 / 推理 / 决策一致性）。

### §30.0 · MA-01～MA-20 {#tt-ma-map}

| ID | 子维 | 风险 | 目标 |
|----|------|------|------|
| **MA-01** | Layer 分层架构 | P0 | L1–L6 覆盖无孤儿域 |
| **MA-02** | 章节顺序与层级 | P1 | §0→§3→域→§7 读序 |
| **MA-03** | P0/P1/P2/P3 权重 | P0 | §2 与域内 P0 一致 |
| **MA-04** | U12 升级闸逻辑 | P0 | U12 行 ↔ MASTER 包 |
| **MA-05** | U23 升级闸逻辑 | P1 | ②→③ 硬闸完整 |
| **MA-06** | MASTER 链效率 | P0 | gate 脚本可发现 |
| **MA-07** | Executive Summary 模板 | P0 | 统一输出头 |
| **MA-08** | Unified Findings 模型 | P0 | 全域同一 schema |
| **MA-09** | 裁决模型一致 | P0 | 七词无分叉 |
| **MA-10** | NOW/NEXT/LATER 队列 | P1 | 执行优先级 |
| **MA-11** | Phase① Readiness | P0 | 进 ② 宽表分 |
| **MA-12** | Phase② Readiness | P1 | staging 预备分 |
| **MA-13** | Top Blockers 排名 | P0 | P0 优先序 |
| **MA-14** | Coverage Heat Map | P1 | 层覆盖可视化 |
| **MA-15** | Governance Efficiency | P0 | 标准自身效率分 |
| **MA-16** | grep 锚完整 | P1 | §8 机读锚 |
| **MA-17** | 域重叠去重 | P1 | PGX/AG/PF 读者索引 |
| **MA-18** | AI 推理友好 | P0 | §0+读前+Layer |
| **MA-19** | 可维护性 | P1 | §9 版本链 |
| **MA-20** | 收口冻结就绪 | P0 | 企业级最终标准 |

### MA-01 · Layer 分层架构 {#ma-01}

| 目标 | L1–L6 覆盖无孤儿域 |
|------|--------|
| 风险 | **P0** |
| SSOT | layer-architecture.v1.json |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-02 · 章节顺序与层级 {#ma-02}

| 目标 | §0→§3→域→§7 读序 |
|------|--------|
| 风险 | **P1** |
| SSOT | checklist-structure-report |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-03 · P0/P1/P2/P3 权重 {#ma-03}

| 目标 | §2 与域内 P0 一致 |
|------|--------|
| 风险 | **P0** |
| SSOT | risk-weight-matrix |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-04 · U12 升级闸逻辑 {#ma-04}

| 目标 | U12 行 ↔ MASTER 包 |
|------|--------|
| 风险 | **P0** |
| SSOT | §3.1.1–3.1.9 |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-05 · U23 升级闸逻辑 {#ma-05}

| 目标 | ②→③ 硬闸完整 |
|------|--------|
| 风险 | **P1** |
| SSOT | §3.1.2 · U23-* |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-06 · MASTER 链效率 {#ma-06}

| 目标 | gate 脚本可发现 |
|------|--------|
| 风险 | **P0** |
| SSOT | meta-gate-inventory |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-07 · Executive Summary 模板 {#ma-07}

| 目标 | 统一输出头 |
|------|--------|
| 风险 | **P0** |
| SSOT | EXECUTIVE-SUMMARY-TEMPLATE.md |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-08 · Unified Findings 模型 {#ma-08}

| 目标 | 全域同一 schema |
|------|--------|
| 风险 | **P0** |
| SSOT | unified-finding-model.v1.json |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-09 · 裁决模型一致 {#ma-09}

| 目标 | 七词无分叉 |
|------|--------|
| 风险 | **P0** |
| SSOT | unified-verdict-model.v1.json |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-10 · NOW/NEXT/LATER 队列 {#ma-10}

| 目标 | 执行优先级 |
|------|--------|
| 风险 | **P1** |
| SSOT | execution-queue.v1.json |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-11 · Phase① Readiness {#ma-11}

| 目标 | 进 ② 宽表分 |
|------|--------|
| 风险 | **P0** |
| SSOT | phase1-readiness-score |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-12 · Phase② Readiness {#ma-12}

| 目标 | staging 预备分 |
|------|--------|
| 风险 | **P1** |
| SSOT | phase2-readiness-score |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-13 · Top Blockers 排名 {#ma-13}

| 目标 | P0 优先序 |
|------|--------|
| 风险 | **P0** |
| SSOT | top-blockers.v1.json |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-14 · Coverage Heat Map {#ma-14}

| 目标 | 层覆盖可视化 |
|------|--------|
| 风险 | **P1** |
| SSOT | audit-coverage-heat-map |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-15 · Governance Efficiency {#ma-15}

| 目标 | 标准自身效率分 |
|------|--------|
| 风险 | **P0** |
| SSOT | governance-efficiency-score |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-16 · grep 锚完整 {#ma-16}

| 目标 | §8 机读锚 |
|------|--------|
| 风险 | **P1** |
| SSOT | TT_META_AUDIT |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-17 · 域重叠去重 {#ma-17}

| 目标 | PGX/AG/PF 读者索引 |
|------|--------|
| 风险 | **P1** |
| SSOT | Layer L4 互指 |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-18 · AI 推理友好 {#ma-18}

| 目标 | §0+读前+Layer |
|------|--------|
| 风险 | **P0** |
| SSOT | AGENTS 同源 |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-19 · 可维护性 {#ma-19}

| 目标 | §9 版本链 |
|------|--------|
| 风险 | **P1** |
| SSOT | patch scripts |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### MA-20 · 收口冻结就绪 {#ma-20}

| 目标 | 企业级最终标准 |
|------|--------|
| 风险 | **P0** |
| SSOT | MA gate + MA-11≥50 |
| 机读 | `run-meta-audit-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


---

## §31 · 治理标准 · 统一模型与收口冻结 {#tt-meta-governance-unified}

> **v1.11.0 · 企业级最终标准** — 全域 **并联** L1–L6；**MA 末闸** 验证标准自身。

### §31.1 · 统一产出

| 产出 | 文件 |
|------|------|
| Layer Architecture | `layer-architecture.v1.json` |
| Risk Weight Matrix | `risk-weight-matrix.v1.json` |
| Unified Finding Model | `unified-finding-model.v1.json` |
| Unified Verdict Model | `unified-verdict-model.v1.json` |
| Execution Queue NOW/NEXT/LATER | `execution-queue.v1.json` |
| Phase①/② Readiness Score | `phase1-readiness-score.v1.json` 等 |
| Top Blockers | `top-blockers.v1.json` |
| Audit Coverage Heat Map | `audit-coverage-heat-map.v1.json` |
| Governance Efficiency Score | `governance-efficiency-score.v1.json` |
| Executive Summary Template | `EXECUTIVE-SUMMARY-TEMPLATE.md` |

```bash
bash scripts/dev/run-meta-audit-gate.sh
# → TT_META_AUDIT: OK（建议 MASTER 最后一包）
```

**grep：** `TT_META_AUDIT_ARTIFACTS: OK` · `TT_META_AUDIT_EXECUTIVE: OK`

---

## §32 · DOMAIN-FZ · FREEZE_GOVERNANCE · 收尾冻结治理 {#domain-fz-freeze}

> **收口层（非一级治理域）** — **停止新增检查维**；建立 **Closure Readiness Gate** 与 **Phase① 冻结建议**。  
> **Readiness 冻结分档（写死）：** **<80 NO_GO** · **80–89 HOLD** · **90–94 FREEZE_CANDIDATE** · **95+ PHASE1_EXIT_READY**

### §32.0 · FZ-01～FZ-12 {#tt-fz-map}

| ID | 子维 | 风险 | 目标 |
|----|------|------|------|
| **FZ-01** | Closure Readiness Gate | P0 | Readiness 冻结分档 |
| **FZ-02** | Domain Completion Matrix | P0 | COMPLETE/ACTIVE/PARTIAL |
| **FZ-03** | Phase1 Closure Backlog | P0 | 技术/产品/UX/优化债登记 |
| **FZ-04** | Executive Freeze Report | P0 | 冻结建议报告 |
| **FZ-05** | Heat Map 收口 | P1 | 层覆盖热力 |
| **FZ-06** | Top Blockers 收口 | P0 | P0 阻塞排序 |
| **FZ-07** | Execution Priority Matrix | P1 | P0–P3 执行矩阵 |
| **FZ-08** | Domain Coverage Matrix | P1 | 域覆盖率 |
| **FZ-09** | 收敛阶段政策 | P0 | 停止新增一级域 |
| **FZ-10** | U12-FZ 闸对齐 | P0 | FZ gate ↔ U12-23 |
| **FZ-11** | Phase② 入口宽表 | P1 | FREEZE_CANDIDATE+ 才建议进② |
| **FZ-12** | Owner 冻结签字位 | P1 | PHASE1_EXIT_READY 须 Owner |

### FZ-01 · Closure Readiness Gate {#fz-01}

| 目标 | Readiness 冻结分档 |
|------|--------|
| 风险 | **P0** |
| SSOT | closure-readiness-score.v1.json |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-02 · Domain Completion Matrix {#fz-02}

| 目标 | COMPLETE/ACTIVE/PARTIAL |
|------|--------|
| 风险 | **P0** |
| SSOT | domain-completion-matrix.v1.json |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-03 · Phase1 Closure Backlog {#fz-03}

| 目标 | 技术/产品/UX/优化债登记 |
|------|--------|
| 风险 | **P0** |
| SSOT | phase1-closure-backlog-registry.v1.json |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-04 · Executive Freeze Report {#fz-04}

| 目标 | 冻结建议报告 |
|------|--------|
| 风险 | **P0** |
| SSOT | PHASE1-FREEZE-RECOMMENDATION-REPORT.md |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-05 · Heat Map 收口 {#fz-05}

| 目标 | 层覆盖热力 |
|------|--------|
| 风险 | **P1** |
| SSOT | closure-heat-map.v1.json |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-06 · Top Blockers 收口 {#fz-06}

| 目标 | P0 阻塞排序 |
|------|--------|
| 风险 | **P0** |
| SSOT | closure-top-blockers.v1.json |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-07 · Execution Priority Matrix {#fz-07}

| 目标 | P0–P3 执行矩阵 |
|------|--------|
| 风险 | **P1** |
| SSOT | execution-priority-matrix.v1.json |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-08 · Domain Coverage Matrix {#fz-08}

| 目标 | 域覆盖率 |
|------|--------|
| 风险 | **P1** |
| SSOT | domain-coverage-matrix.v1.json |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-09 · 收敛阶段政策 {#fz-09}

| 目标 | 停止新增一级域 |
|------|--------|
| 风险 | **P0** |
| SSOT | §0.2 |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-10 · U12-FZ 闸对齐 {#fz-10}

| 目标 | FZ gate ↔ U12-23 |
|------|--------|
| 风险 | **P0** |
| SSOT | §3.1.10 |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-11 · Phase② 入口宽表 {#fz-11}

| 目标 | FREEZE_CANDIDATE+ 才建议进② |
|------|--------|
| 风险 | **P1** |
| SSOT | closure-readiness band |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### FZ-12 · Owner 冻结签字位 {#fz-12}

| 目标 | PHASE1_EXIT_READY 须 Owner |
|------|--------|
| 风险 | **P1** |
| SSOT | §7 模板 |
| 机读 | `run-freeze-governance-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


---

## §33 · DOMAIN-QA2 · AUDIT_QUALITY · 审计质量审计 {#domain-qa2-quality}

> **收口层（非一级治理域）** — **压缩重复 Findings · 合并根因 · 削减审计噪音 · 提升 AI 推理效率**。  
> **目标：** Top100 Findings → **Top10 Root Causes** 可执行压缩分析。

### §33.0 · QA2-01～QA2-12 {#tt-qa2-map}

| ID | 子维 | 风险 | 目标 |
|----|------|------|------|
| **QA2-01** | Duplicate Findings | P0 | 重复项合并 |
| **QA2-02** | Conflicting Findings | P0 | 冲突项裁决 |
| **QA2-03** | Root Cause Compression | P0 | Top100→Top10 压缩 |
| **QA2-04** | Top10 Root Causes | P0 | 根因清单 |
| **QA2-05** | Audit Efficiency Score | P0 | 审计效率 |
| **QA2-06** | AI Output Efficiency | P0 | AI 输出效率 |
| **QA2-07** | Execution Priority Matrix | P1 | 根因队列 NOW/NEXT/LATER |
| **QA2-08** | Governance Coverage Matrix | P1 | 域覆盖矩阵 |
| **QA2-09** | 审计噪音削减 | P0 | 压缩比 ≥ 1.5 |
| **QA2-10** | 输出格式统一 | P1 | Executive 模板对齐 MA/FZ |
| **QA2-11** | QA2 末闸位置 | P0 | MASTER 最后一包 |
| **QA2-12** | 收敛完成判定 | P0 | QA2 gate + FZ band |

### QA2-01 · Duplicate Findings {#qa2-01}

| 目标 | 重复项合并 |
|------|--------|
| 风险 | **P0** |
| SSOT | duplicate-findings-report.v1.json |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-02 · Conflicting Findings {#qa2-02}

| 目标 | 冲突项裁决 |
|------|--------|
| 风险 | **P0** |
| SSOT | conflicting-findings-report.v1.json |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-03 · Root Cause Compression {#qa2-03}

| 目标 | Top100→Top10 压缩 |
|------|--------|
| 风险 | **P0** |
| SSOT | root-cause-compression.v1.json |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-04 · Top10 Root Causes {#qa2-04}

| 目标 | 根因清单 |
|------|--------|
| 风险 | **P0** |
| SSOT | top10-root-causes.v1.json |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-05 · Audit Efficiency Score {#qa2-05}

| 目标 | 审计效率 |
|------|--------|
| 风险 | **P0** |
| SSOT | audit-efficiency-score.v1.json |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-06 · AI Output Efficiency {#qa2-06}

| 目标 | AI 输出效率 |
|------|--------|
| 风险 | **P0** |
| SSOT | ai-output-efficiency-score.v1.json |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-07 · Execution Priority Matrix {#qa2-07}

| 目标 | 根因队列 NOW/NEXT/LATER |
|------|--------|
| 风险 | **P1** |
| SSOT | execution-priority-matrix.v1.json |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-08 · Governance Coverage Matrix {#qa2-08}

| 目标 | 域覆盖矩阵 |
|------|--------|
| 风险 | **P1** |
| SSOT | governance-domain-coverage-matrix.v1.json |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-09 · 审计噪音削减 {#qa2-09}

| 目标 | 压缩比 ≥ 1.5 |
|------|--------|
| 风险 | **P0** |
| SSOT | root-cause ratio |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-10 · 输出格式统一 {#qa2-10}

| 目标 | Executive 模板对齐 MA/FZ |
|------|--------|
| 风险 | **P1** |
| SSOT | AUDIT-QUALITY-EXECUTIVE-SUMMARY.md |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-11 · QA2 末闸位置 {#qa2-11}

| 目标 | MASTER 最后一包 |
|------|--------|
| 风险 | **P0** |
| SSOT | run-audit-quality-gate.sh |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### QA2-12 · 收敛完成判定 {#qa2-12}

| 目标 | QA2 gate + FZ band |
|------|--------|
| 风险 | **P0** |
| SSOT | TT_AUDIT_QUALITY: OK |
| 机读 | `run-audit-quality-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


---

## §34 · 收敛收口 · 统一产出与 Phase① 冻结决策 {#tt-closure-convergence-unified}

> **v1.12.0 · 收敛优化阶段** — **一级治理域已冻结**；**FZ + QA2 末闸** 产出 **Phase① 收尾冻结建议报告**。

### §34.1 · Closure Readiness Gate（冻结标准）

| Band | Score | 含义 | Phase ② 宽表 |
|------|-------|------|--------------|
| **NO_GO** | <80 | 继续收口 | ❌ 不建议 |
| **HOLD** | 80–89 | 收敛中 · 消 Blockers | ⚠️ 仅维护 |
| **FREEZE_CANDIDATE** | 90–94 | 冻结候选 | ✅ 可启动 U12+G 闸评审 |
| **PHASE1_EXIT_READY** | 95+ | Phase① 退出就绪 | ✅ Owner 签字后可进 ② 实施 |

### §34.2 · 统一产出

| 产出 | 文件 | 层 |
|------|------|-----|
| Closure Readiness Score | `closure-readiness-score.v1.json` | FZ |
| Domain Completion Matrix | `domain-completion-matrix.v1.json` | FZ |
| Phase1 Closure Backlog | `phase1-closure-backlog-registry.v1.json` | FZ |
| Executive Freeze Report | `PHASE1-FREEZE-RECOMMENDATION-REPORT.md` | FZ |
| Duplicate / Conflict Reports | `duplicate-findings-report.v1.json` 等 | QA2 |
| Root Cause Compression | `root-cause-compression.v1.json` | QA2 |
| Audit / AI Efficiency | `audit-efficiency-score.v1.json` 等 | QA2 |

```bash
bash scripts/dev/run-freeze-governance-gate.sh    # → TT_FREEZE_GOVERNANCE: OK
bash scripts/dev/run-audit-quality-gate.sh        # → TT_AUDIT_QUALITY: OK（MASTER 末闸）
```

**grep：** `TT_FREEZE_GOVERNANCE_ARTIFACTS: OK` · `TT_AUDIT_QUALITY_ARTIFACTS: OK` · `TT_PHASE1_CLOSURE_CONVERGENCE: OK`

**诚实边界：** FZ **FREEZE_CANDIDATE / PHASE1_EXIT_READY** = **① 宽表就绪**；**≠** ② staging GO · **≠** ③ Production GO。

---

## §35 · PHASE1_EXECUTIVE_BOARD · 第一阶段执行驾驶舱 {#phase1-executive-board}

> **收口层（非一级治理域 · 非新检查维）** — **统一汇总** FZ · QA2 · PF · DOA · CA · UXA · AG · CX 等 **全部治理域结果**；  
> **单页 Executive Freeze Dashboard** = Owner **Phase① 冻结签字 · Phase② 测试网评审 · 最终决策** 的 **唯一管理视图**。

### §35.0 · PEB-01～PEB-12 {#tt-peb-map}

| ID | 子维 | 风险 | 目标 |
|----|------|------|------|
| **PEB-01** | Executive Dashboard | P0 | 单页 Owner 决策视图 |
| **PEB-02** | Readiness Score / Band | P0 | 统一收口分档 |
| **PEB-03** | Domain Completion Matrix | P0 | 全域 COMPLETE/ACTIVE/PARTIAL |
| **PEB-04** | Open P0 / P1 | P0 | 未闭高危项 |
| **PEB-05** | Top10 Root Causes | P0 | QA2 压缩根因 |
| **PEB-06** | Top20 Blockers | P0 | 阻塞排序 |
| **PEB-07** | Closure Sprint Queue | P0 | Sprint-A/B/C |
| **PEB-08** | Freeze Recommendation | P0 | GO/HOLD/NO_GO |
| **PEB-09** | Estimated Closure | P1 | 预计收尾时间 |
| **PEB-10** | Execution Rate | P1 | 问题关闭率 |
| **PEB-11** | Governance / Audit / AI Efficiency | P1 | 三效率分 |
| **PEB-12** | Owner 签字位 | P0 | Phase① 冻结 · Phase② 评审 |

### PEB-01 · Executive Dashboard {#peb-01}

| 目标 | 单页 Owner 决策视图 |
|------|--------|
| 风险 | **P0** |
| SSOT | EXECUTIVE-FREEZE-DASHBOARD.md |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-02 · Readiness Score / Band {#peb-02}

| 目标 | 统一收口分档 |
|------|--------|
| 风险 | **P0** |
| SSOT | phase1-readiness-score.v1.json |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-03 · Domain Completion Matrix {#peb-03}

| 目标 | 全域 COMPLETE/ACTIVE/PARTIAL |
|------|--------|
| 风险 | **P0** |
| SSOT | domain-completion-matrix.v1.json |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-04 · Open P0 / P1 {#peb-04}

| 目标 | 未闭高危项 |
|------|--------|
| 风险 | **P0** |
| SSOT | open-p0-findings.v1.json |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-05 · Top10 Root Causes {#peb-05}

| 目标 | QA2 压缩根因 |
|------|--------|
| 风险 | **P0** |
| SSOT | top10-root-causes.v1.json |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-06 · Top20 Blockers {#peb-06}

| 目标 | 阻塞排序 |
|------|--------|
| 风险 | **P0** |
| SSOT | top20-blockers.v1.json |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-07 · Closure Sprint Queue {#peb-07}

| 目标 | Sprint-A/B/C |
|------|--------|
| 风险 | **P0** |
| SSOT | closure-sprint-queue.v1.json |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-08 · Freeze Recommendation {#peb-08}

| 目标 | GO/HOLD/NO_GO |
|------|--------|
| 风险 | **P0** |
| SSOT | freeze-recommendation.v1.json |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-09 · Estimated Closure {#peb-09}

| 目标 | 预计收尾时间 |
|------|--------|
| 风险 | **P1** |
| SSOT | estimated-closure.v1.json |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-10 · Execution Rate {#peb-10}

| 目标 | 问题关闭率 |
|------|--------|
| 风险 | **P1** |
| SSOT | execution-rate.v1.json |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-11 · Governance / Audit / AI Efficiency {#peb-11}

| 目标 | 三效率分 |
|------|--------|
| 风险 | **P1** |
| SSOT | efficiency-scores.v1.json |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |

### PEB-12 · Owner 签字位 {#peb-12}

| 目标 | Phase① 冻结 · Phase② 评审 |
|------|--------|
| 风险 | **P0** |
| SSOT | §35 Owner Actions |
| 机读 | `run-phase1-executive-board-gate.sh` |

| ① | ② | ③ |
|---|---|---|
| ☐ | ☐ | ☐ |


### §35.1 · Owner 决策口径（写死）

| Freeze Recommendation | Readiness | Owner 动作 |
|---------------------|-----------|------------|
| **NO_GO** | <80 | 继续 Sprint-A · **禁止** Phase① 冻结签字 |
| **HOLD** | 80–89 | 消 Top Blockers · 提升关闭率 |
| **GO** | ≥90 | **可** Phase① 冻结签字 · 启动 Phase② **宽表评审**（仍须 U12-2 + G-1/G-2） |

```bash
bash scripts/dev/run-phase1-executive-board-gate.sh
# → TT_PHASE1_EXECUTIVE_BOARD: OK
# → evidence/phase1-executive-board/<stamp>/EXECUTIVE-FREEZE-DASHBOARD.md
```

**grep：** `TT_PHASE1_EXECUTIVE_BOARD_ARTIFACTS: OK` · `TT_PHASE1_EXECUTIVE_BOARD_DASHBOARD: OK`
### §35.2 · EXECUTION_AUDIT (EX) · PEB 子模块 · 执行收敛 {#execution-audit-ex}

> **非新 DOMAIN · 非新检查维** — **PEB 子模块**；审计 **治理执行能力 · 问题关闭能力**。  
> **目标：** Owner 可见 **先修什么 · Δ Readiness · 多久 FREEZE_CANDIDATE / PHASE1_EXIT_READY**。

#### §35.2.0 · EX-01～EX-16

| ID | 子维 | 风险 | 目标 |
|----|------|------|------|
| **EX-01** | Open Findings 年龄 | P0 | age analysis |
| **EX-02** | P0/P1/P2 积压 | P0 | backlog analysis |
| **EX-03** | Domain Backlog Ranking | P0 | 域积压排序 |
| **EX-04** | Root Cause Impact | P0 | 根因影响排序 |
| **EX-05** | RC→Findings 映射 | P0 | 根因映射 |
| **EX-06** | Top Closure Opportunities | P0 | 修 1 消 N |
| **EX-07** | Top Execution Blockers | P0 | 执行阻塞 |
| **EX-08** | Sprint A/B/C 完成率 | P1 | Sprint 完成 |
| **EX-09** | Governance ROI | P1 | 治理投资回报 |
| **EX-10** | Complexity / Redundancy ↓ | P1 | 复杂度/冗余下降 |
| **EX-11** | Execution Efficiency | P0 | 执行效率分 |
| **EX-12** | Closure Velocity | P0 | 关闭速度分 |
| **EX-13** | Backlog Burn-down | P0 | 积压燃尽分 |
| **EX-14** | Phase① Exit Forecast | P0 | 90/95 预测 |
| **EX-15** | Execution Dashboard | P0 | 执行驾驶舱 |
| **EX-16** | Executive Closure Report | P0 | 收口报告 |

#### EX-01 · Open Findings 年龄 {#ex-01}

| SSOT | open-findings-age-analysis.v1.json · `run-execution-audit-gate.sh` |

#### EX-02 · P0/P1/P2 积压 {#ex-02}

| SSOT | backlog-analysis-p0-p1-p2.v1.json · `run-execution-audit-gate.sh` |

#### EX-03 · Domain Backlog Ranking {#ex-03}

| SSOT | domain-backlog-ranking.v1.json · `run-execution-audit-gate.sh` |

#### EX-04 · Root Cause Impact {#ex-04}

| SSOT | root-cause-impact-ranking.v1.json · `run-execution-audit-gate.sh` |

#### EX-05 · RC→Findings 映射 {#ex-05}

| SSOT | root-cause-findings-map.v1.json · `run-execution-audit-gate.sh` |

#### EX-06 · Top Closure Opportunities {#ex-06}

| SSOT | top-closure-opportunities.v1.json · `run-execution-audit-gate.sh` |

#### EX-07 · Top Execution Blockers {#ex-07}

| SSOT | top-execution-blockers.v1.json · `run-execution-audit-gate.sh` |

#### EX-08 · Sprint A/B/C 完成率 {#ex-08}

| SSOT | sprint-completion-rates.v1.json · `run-execution-audit-gate.sh` |

#### EX-09 · Governance ROI {#ex-09}

| SSOT | governance-roi.v1.json · `run-execution-audit-gate.sh` |

#### EX-10 · Complexity / Redundancy ↓ {#ex-10}

| SSOT | complexity-reduction-rate.v1.json · `run-execution-audit-gate.sh` |

#### EX-11 · Execution Efficiency {#ex-11}

| SSOT | execution-efficiency-score.v1.json · `run-execution-audit-gate.sh` |

#### EX-12 · Closure Velocity {#ex-12}

| SSOT | closure-velocity-score.v1.json · `run-execution-audit-gate.sh` |

#### EX-13 · Backlog Burn-down {#ex-13}

| SSOT | backlog-burndown-score.v1.json · `run-execution-audit-gate.sh` |

#### EX-14 · Phase① Exit Forecast {#ex-14}

| SSOT | phase1-exit-forecast.v1.json · `run-execution-audit-gate.sh` |

#### EX-15 · Execution Dashboard {#ex-15}

| SSOT | EXECUTION-DASHBOARD.md · `run-execution-audit-gate.sh` |

#### EX-16 · Executive Closure Report {#ex-16}

| SSOT | EXECUTIVE-CLOSURE-REPORT.md · `run-execution-audit-gate.sh` |


**产出（自动）：** Execution Dashboard · Top10 Root Causes · Top20 Highest Impact Fixes · Domain Backlog Matrix · Closure Roadmap · P0 Elimination Plan · Executive Closure Report

```bash
bash scripts/dev/run-execution-audit-gate.sh
# 由 run-phase1-executive-board-gate.sh 自动调用并汇入 EXECUTIVE-FREEZE-DASHBOARD
```

**grep：** `TT_EXECUTION_AUDIT: OK` · `TT_EXECUTION_AUDIT_ARTIFACTS: OK`



---

## §7 · 审计记录模板 {#tt-full-audit-record-template}

```markdown
## Phase ① 收尾治理轮次 · YYYY-MM-DD

- **阶段：** ① | ② | ③
- **环境：** local | staging | prod
- **executor：** 
- **git sha：** 
- **范围：** Phase ① 总收尾 | 维度 Dxx | DOMAIN-* | 旅程 Jx | U12/U23

### 阶段升级判定（若本轮为升阶审计）
| 闸 | 结论 | 未满足项 |
|----|------|----------|
| U12 ①→② | GO / NO-GO | **须 D01–D76 + DX-01 ① P0 全 PASS** + U12-PF + U12-DOA + U12-LFC + U12-PGX + U12-AG + U12-MA + U12-FZ + U12-QA2 + **U12-PEB** + `TT_FULL_SYSTEM_AUDIT_MASTER: READY` |
| U23 ②→③ | GO / NO-GO | **须 D70 Executive GO 包** |

### 企业级 P0 汇总（D26–D45）
| 维 | 维内 GO | P0 FAIL |
|----|---------|---------|
| D26 | | |
| … | | |

### 极限边界 P0 汇总（D46–D60）
| 维 | 维内 GO | P0 FAIL |
|----|---------|---------|
| D46 | | |
| … | | |
| D60 | | **须附真人手验矩阵签字** |

### 发布治理 P0 汇总（D61–D76 + DX-01）
| 维 | 维内 GO | P0 FAIL | 升级闸 |
|----|---------|---------|--------|
| D61 | | | U12-13 |
| … | | | |
| D70 | | | U23-11 |
| DX-01 | | | | U12-14 |

### DOMAIN-X PF 汇总（PF-01～PF-20）
| PF | 裁决摘要 | 域内 GO | P0 FAIL | 备注 |
|----|----------|---------|---------|------|
| PF-04 | | | | 重复功能 |
| PF-11 | | | | 导航理性 |
| PF-18 | | | | 功能下线 |
| PF-20 | | | | 权重 delta |
| … | | | | |

**PF 机读：** `TT_PRODUCT_FORENSIC_AUDIT: OK` · `TT_PRODUCT_FORENSIC_ARTIFACTS: OK` · `TT_PRODUCT_FORENSIC_EXECUTIVE: OK` · `TT_PRODUCT_FORENSIC_PHASE23: GO`

### DOMAIN-Z DOA 汇总（DOA-01～DOA-20）
| DOA | 裁决摘要 | 域内 GO | P0 FAIL | Health 贡献 |
|-----|----------|---------|---------|-------------|
| DOA-03 | | | | SSOT |
| DOA-10 | | | | API |
| DOA-12 | | | | ABI |
| DOA-15 | | | | RBAC |
| DOA-16 | | | | Scripts |
| … | | | | |

**DOA 机读：** `TT_DOA_AUDIT: OK` · `TT_DOA_ARTIFACTS: OK` · `TT_DOA_OPERATIONAL_READINESS: OK` · `TT_DOA_PHASE23: GO`

### Lifecycle Forensic 汇总（R/K/E/CA/UXA）
| 域 | 裁决摘要 | P0 FAIL | 关键产出 |
|----|----------|---------|----------|
| DOMAIN-R | | | requirement-trace-matrix |
| DOMAIN-K | | | bus-factor-score |
| DOMAIN-E | | | unit-economics-report |
| DOMAIN-CA | | | architecture-score |
| DOMAIN-UXA | | | l5-ux-score |

**LFC 机读：** `TT_LIFECYCLE_FORENSIC_AUDIT: OK` · `TT_LIFECYCLE_FORENSIC_ARTIFACTS: OK` · `TT_LIFECYCLE_FORENSIC_EXECUTIVE: OK` · `TT_LIFECYCLE_FORENSIC_PHASE23: GO`

### Platform Governance 汇总（CX/BA/OPS/TRUST/ADMIN/CS）
| 域 | 关键产出 | P0 |
|----|----------|----|
| CX | user-success · top-50-ux | CX-03/16 |
| BA | conversion-funnel · liquidity | BA-01/07 |
| OPS | operational-efficiency | OPS-03/15 |
| TRUST | trust-health | TRUST-01/20 |
| ADMIN | admin-capability · dangerous-perm | ADMIN-09/11 |
| CS | cold-start-readiness | CS-01/12 |

**PGX 机读：** `TT_PLATFORM_GOVERNANCE_AUDIT: OK` · …

### DOMAIN-AG 汇总
| 项 | 产出 |
|----|------|
| RBAC | rbac-boundary-matrix |
| 危险操作 | dangerous-action-matrix |
| L5 | admin-l5-design-score |
| Executive | EXECUTIVE-GOVERNANCE-HEALTH |

**MA 机读：** `TT_META_AUDIT: OK` · `TT_META_AUDIT_ARTIFACTS: OK` · `TT_META_AUDIT_EXECUTIVE: OK`

**FZ 机读：** `TT_FREEZE_GOVERNANCE: OK` · `TT_FREEZE_GOVERNANCE_ARTIFACTS: OK` · `TT_FREEZE_GOVERNANCE_EXECUTIVE: OK`

**QA2 机读：** `TT_AUDIT_QUALITY: OK` · `TT_AUDIT_QUALITY_ARTIFACTS: OK` · `TT_AUDIT_QUALITY_EXECUTIVE: OK`

**PEB 机读：** `TT_PHASE1_EXECUTIVE_BOARD: OK` · `TT_PHASE1_EXECUTIVE_BOARD_ARTIFACTS: OK` · `TT_PHASE1_EXECUTIVE_BOARD_DASHBOARD: OK`

**EX 机读（PEB 子模块）：** `TT_EXECUTION_AUDIT: OK` · `TT_EXECUTION_AUDIT_ARTIFACTS: OK` · `TT_EXECUTION_AUDIT_DASHBOARD: OK`

**AG 机读：** `TT_ADMIN_GOVERNANCE_AUDIT: OK` · `TT_ADMIN_GOVERNANCE_ARTIFACTS: OK` · `TT_ADMIN_GOVERNANCE_EXECUTIVE: OK` · `TT_ADMIN_GOVERNANCE_PHASE23: GO`

### 结论（一句）
…

### 维度摘要
| 维 | ① | ② | ③ | 备注 |
|----|---|---|---|------|

### 证据路径
- 

### 未闭项 → 96-18 / issue
- 
```

**建议存放：** `frontend/evidence/GO_local_phase1/` 或 `evidence/GO_YYYYMMDD/full-system-audit/`

---

## §8 · 机读锚（grep）

| 锚 | 用途 |
|----|------|
| `TT_PHASE1_CLOSURE_GOVERNANCE` | **Phase ① 收尾治理总标准** · `ACTIVE`（文档）/ `MASTER_READY`（进 ② 宽表依据） |
| `TT_FULL_SYSTEM_AUDIT_CHECKLIST` | 历史文件名 / 版本标识（兼容） |
| `TT_GO_LOCAL_PHASE1: OK` | ① Phase1 总验收 |
| `TT_ENTERPRISE_SITE_10_LOCAL: OK` | ① 全站 10 |
| `TT_PUBLISH_HUB_LOCAL: OK` | ① 发布中心 |
| `TT_PHASE2_GO_VERDICT` | ② 宽轨 GO（当前 NOT_MET） |
| `PRODUCTION_GO_DECISION` | ③ 签字包 |
| `FINAL_SYSTEM_AUDIT` | 五域深度汇总 |
| `TT_FULL_SYSTEM_AUDIT_ENTERPRISE` | D26–D45 企业宽扫留痕 |
| `TT_FULL_SYSTEM_AUDIT_EXTREME` | D46–D60 极限边界宽扫留痕 |
| `TT_FULL_SYSTEM_AUDIT_PHASE12` | ①→② 极限边界子集（D46–D60） |
| `TT_FULL_SYSTEM_AUDIT_GOVERNANCE` | D61–D76 + DX-01 发布治理宽扫 |
| `TT_FULL_SYSTEM_AUDIT_MASTER` | Phase ① **MASTER GATE** READY（兼容 grep） |
| `TT_FULL_SYSTEM_AUDIT_PHASE23` | ②→③ / Production GO |
| `TT_PRODUCT_FORENSIC_AUDIT` | DOMAIN-X 法证机读基线 gate |
| `TT_PRODUCT_FORENSIC_ARTIFACTS` | 矩阵 · Top100 · scores · roadmap |
| `TT_PRODUCT_FORENSIC_EXECUTIVE` | Executive Product Health Report |
| `TT_PRODUCT_FORENSIC_WEIGHT` | PF-20 权重快照 |
| `TT_PRODUCT_FORENSIC_ROADMAP` | Simplification Roadmap |
| `TT_PRODUCT_FORENSIC_PHASE23` | ③ Production GO 前 PF 硬闸 |
| `TT_DOA_AUDIT` | DOMAIN-Z 对齐机读 gate |
| `TT_DOA_ARTIFACTS` | drift reports · health score |
| `TT_DOA_OPERATIONAL_READINESS` | Operational Readiness Report |
| `TT_DOA_PHASE23` | ③ Production GO 前 DOA 硬闸 |
| `TT_LIFECYCLE_FORENSIC_AUDIT` | R/K/E/CA/UXA 生命周期 gate |
| `TT_LIFECYCLE_FORENSIC_ARTIFACTS` | 统一法证产出矩阵 |
| `TT_LIFECYCLE_FORENSIC_EXECUTIVE` | Executive Product Health |
| `TT_LIFECYCLE_FORENSIC_ROADMAP` | Simplification Roadmap |
| `TT_LIFECYCLE_FORENSIC_PHASE23` | ③ Production GO 前 LFC 硬闸 |
| `TT_PLATFORM_GOVERNANCE_AUDIT` | CX/BA/OPS/TRUST/ADMIN/CS gate |
| `TT_PLATFORM_GOVERNANCE_ARTIFACTS` | 平台治理产出矩阵 |
| `TT_PLATFORM_GOVERNANCE_EXECUTIVE` | Executive Platform Health |
| `TT_PLATFORM_GOVERNANCE_PHASE23` | ③ PGX 硬闸 |
| `TT_ADMIN_GOVERNANCE_AUDIT` | DOMAIN-AG gate |
| `TT_ADMIN_GOVERNANCE_ARTIFACTS` | 后台治理产出矩阵 |
| `TT_ADMIN_GOVERNANCE_EXECUTIVE` | Executive Governance Health |
| `TT_ADMIN_GOVERNANCE_PHASE23` | ③ AG 硬闸 |
| `TT_META_AUDIT` | DOMAIN-MA 标准自审 gate |
| `TT_META_AUDIT_ARTIFACTS` | Layer/Readiness/HeatMap/Efficiency |
| `TT_META_AUDIT_EXECUTIVE` | Executive Summary 模板 |

---

## §9 · 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-06-13 | 首版：25 维 × 三阶 · 8 条业务旅程 · 深度报告索引 · ① 一键命令 |
| 1.1.0 | 2026-06-13 | **+D26–D45 企业级 20 维** · §3.1 阶段升级总闸 · 维内 GO/NO-GO · §10 机读 bundle |
| 1.2.0 | 2026-06-13 | **+D46–D60** · U12/U23 · §11 · `run-full-system-audit-phase12-gate.sh` |
| 1.3.0 | 2026-06-13 | **+D61–D76 + DX-01 发布治理/运维/开发体验** · 升格为 **唯一总审计标准** · §12 · `run-full-system-audit-master-gate.sh` · U12/U23 扩至全维 |
| 1.4.0 | 2026-06-13 | **+DOMAIN-X PF-01～PF-20 产品法证** · §13 · §3.1.4 U12/U23-PF · `run-product-forensic-audit-gate.sh` · PF 裁决词 KEEP/MERGE/RETIRE/REFACTOR |
| 1.5.0 | 2026-06-13 | **DOMAIN-X 法证产出体系** · §13.3–§13.7 裁决/证据/八件套/Executive · `generate-product-forensic-artifacts.py` · 16 项矩阵与 Top100/Top20 清单 |
| 1.6.0 | 2026-06-13 | **+DOMAIN-Z DOA-01～DOA-20 文档运维对齐** · §14 · §3.1.5 U12/U23-DOA · `run-doa-audit-gate.sh` · 八份 drift 报告 · MASTER 含 PF+DOA |
| 1.7.0 | 2026-06-13 | **+DOMAIN-R/K/E/CA/UXA 全生命周期法证** · §15–§20 · §3.1.6 U12/U23-LFC · 统一产出矩阵 + Executive/Roadmap |
| 1.8.0 | 2026-06-13 | **重新定位为 Phase ① 收尾治理总标准** · §0 · U12/MASTER · `TT_PHASE1_CLOSURE_GOVERNANCE` |
| 1.9.0 | 2026-06-13 | **+DOMAIN-CX…CS（PGX）** · §21–§27 · §3.1.7 |
| 1.10.0 | 2026-06-13 | **+DOMAIN-AG** · §28–§29 · §3.1.8 U12/U23-AG · L5 Admin UX 评分矩阵 · Executive Governance Health · MASTER+PF+DOA+UXA 并联 |
| 1.11.0 | 2026-06-13 | **+DOMAIN-MA 治理标准自审** · §0.1 Layer L1–L6 · §30–§31 统一模型 · §3.1.9 · 收口冻结前最终企业级标准 |
| 1.12.0 | 2026-06-13 | **收敛优化阶段** · **停止新增一级域** · **+FZ+QA2 收口层** · §0.2 · §32–§34 · Closure Readiness Gate · QA2 根因压缩 · §3.1.10–11 |
| 1.13.0 | 2026-06-13 | **+PHASE1_EXECUTIVE_BOARD** · §0.3 · §35 · §3.1.12 · Executive Freeze Dashboard · Owner 唯一管理视图 · Sprint A/B/C · GO/HOLD/NO_GO |
| 1.14.0 | 2026-06-13 | **+EXECUTION_AUDIT (EX)** PEB 子模块 · §0.4 执行收敛 · §35.2 · 关闭率/根因/Forecast · 可执行 Phase① 收尾计划 |

**维护规则：** 本文 = **Phase ① 唯一收尾治理总标准**；**v1.12+ 停止新增一级域**；**EX = PEB 子模块非 DOMAIN**；文件名 **不迁移**。