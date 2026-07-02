# TT-PROGRAM-MAINLINE-DISCIPLINE · 项目最高治理原则

**生效：** 2026-07-01  
**优先级：** **最高** — 覆盖一切新增开发决策  
**阶段：** **Product Delivery（交付产品）** · 非 Product Development（研发功能）  
**机读：** [`registry/traveltrust-three-dimension-status.v1.yaml`](../../registry/traveltrust-three-dimension-status.v1.yaml)

**最高裁决入口：** [`TT-DELIVERY-DECISION-POLICY.md`](TT-DELIVERY-DECISION-POLICY.md) · `TT_DELIVERY_DECISION_POLICY: ENFORCED`

**互指：** [`TT-RELEASE-PIPELINE.md`](TT-RELEASE-PIPELINE.md)（每次发布强制流程）· [`TT-ADMIN-PLATFORM-GOVERNANCE-DISCIPLINE.md`](TT-ADMIN-PLATFORM-GOVERNANCE-DISCIPLINE.md)（纪律 ①～③）· [`PHASE3-PRODUCTION-PREPARATION.md`](PHASE3-PRODUCTION-PREPARATION.md)

---

## 0 · 机读键

```text
TT_PROGRAM_MAINLINE_DISCIPLINE: ENFORCED
TT_PROJECT_PHASE: PRODUCT_DELIVERY
TT_PREVIOUS_PHASE: PRODUCT_DEVELOPMENT
TT_CURRENT_MAINLINE: PI3,PRODUCTION_READINESS,MAINNET,PRODUCTION_GO
TT_RELEASE_PIPELINE: ENFORCED
TT_PHASE_1_LOCAL: CLOSED
TT_PHASE_2_TESTNET_STAGING: CLOSED
TT_ADMIN_PLATFORM: CLOSED
TT_DISPLAY_DATA_GOVERNANCE: PASS
TT_BUSINESS_MANUAL_UAT: PASS
TT_MAINLINE_QUEUE: SINGLE
TT_CROSS_MAINLINE_DEVELOPMENT: FORBIDDEN
```

---

## 1 · 阶段切换裁定

| 以前（Product Development） | 现在（Product Delivery） |
|---------------------------|-------------------------|
| 有没有功能 | 能不能恢复数据库 |
| 页面好不好 | 能不能回滚 |
| 架构漂不漂亮 | 能不能上线 |
| 后台/CMS 进度 | 能不能稳定运行 |
| | 能不能通过人工验收 |

**项目已从研发阶段进入交付阶段。**

---

## 2 · 纪律 ④（最高优先级）· 单主线执行队列

**任何新的开发需求，必须先判断属于哪一条主线，禁止跨主线开发。**

```text
TT_PROGRAM_MAINLINE_DISCIPLINE: ENFORCED
```

### 2.1 五条合法主线（新增工作唯一归类）

| # | 主线 | 当前状态 | 示例 |
|---|------|----------|------|
| **①** | **Production Infrastructure（PI3）** | 🟡 **IN_PROGRESS** | PI3-001 备份缺失 → ✅ 立即处理 |
| **②** | **Mainnet** | ⏳ PENDING | 合约部署问题 → ✅ 立即处理 |
| **③** | **Business Manual UAT** | ✅ **PASS**（2026-07-02 · 已纳入发布流程 · 每次发布必跑） | 阻断 → ✅ 立即处理 |
| **④** | **Production GO** | ⏳ PENDING | Go-Live Checklist 未闭 → ✅ 立即处理 |
| **⑤** | **Post-GO Feature Roadmap** | 🔒 DEFERRED | Official Ops 1.1+ · **Production GO 后** |

**禁止**因发现非阻断问题而离开当前主线。

### 2.2 归类示例（写死）

| 需求 | 判定 | 动作 |
|------|------|------|
| 后台按钮不好看 | Post-GO · Official Ops 1.1 | ❌ **不做** |
| 想优化 CMS | Post-GO | ❌ **不做** |
| 想新增运营功能（Publish/Featured/…） | Official Ops 1.1 | ❌ **不做** |
| PI3-001 缺备份 | ① PI3 | ✅ **立即处理** |
| Mainnet 合约问题 | ② Mainnet | ✅ **立即处理** |
| Admin 安全漏洞 | Security 例外（见 Admin 纪律 ①） | ✅ **立即处理** |

**整个项目只有一条执行队列 — 不得来回切换主线。**

---

## 3 · 生命周期与 Current Mainline

### 3.1 · v1.0 阶段 ladder（历史 + 当前）

```text
✅ Phase ① Local Development               CLOSED
✅ Phase ② Testnet / Staging              CLOSED
✅ Admin Platform Enterprise Complete     CLOSED
✅ Display Data Governance                PASS
✅ Business Manual UAT                    PASS
────────────────────────────────────
🟡 Phase ③ Production Infrastructure（PI3）← 当前主线
        ▼
Production GO
```

### 3.2 · 每次 Production 发布固定流程（v1.0+ · v1.1+ · 未来版本）

见 [`TT-RELEASE-PIPELINE.md`](TT-RELEASE-PIPELINE.md) · [`TT-FRONTEND-API-CONSISTENCY-AUDIT.md`](TT-FRONTEND-API-CONSISTENCY-AUDIT.md) · `TT_RELEASE_PIPELINE: ENFORCED`

```text
Product Capability Complete
        ▼
Frontend ↔ API Consistency Audit
        ▼
Display Data Governance
        ▼
Business Manual UAT
        ▼
Production Infrastructure（PI3）
        ▼
Production GO
```

### 3.3 · Current Mainline（唯一剩余工程）

```text
PI3（PI3-001～006）
    ↓
Production Readiness
    ↓
Mainnet
    ↓
Production GO
```

**Product Capability = Enterprise Complete** · **Production Capability = PI3 In Progress** · 不再补页面/后台/运营功能。

---

## 4 · 统一汇报格式（强制 · 2026-07-02 起固定）

**每次项目汇报只采用以下结构。**  
**禁止**单独汇报「Admin 今天怎么样」「Official Ops 今天怎么样」「CMS 今天怎么样」— 上述域已 **Product Capability Complete · CLOSED**，除非 **重新成为 Production 阻断项**（极 unlikely）。

### 4.1 · 固定模板（复制即用）

```markdown
## Product Capability
Enterprise Complete

（含：前端 · 后端 · DB · Admin · 四大中心 · Official Ops · Content · Business Flow · Operational Scenario · 测试网对齐 · Display Data Governance · Business Manual UAT）

## Production Capability
In Progress — **唯一剩余：Production Engineering（PI3-001～006）**

## Evidence Completeness
Product Evidence      Complete
Production Evidence   In Progress

## Current Mainline
PI3（Production Infrastructure）
  ↓
Production Readiness
  ↓
Mainnet
  ↓
Production GO

## Pre-Production Gates（每次发布必跑）
Display Data Governance → Business Manual UAT
（见 TT-RELEASE-PIPELINE.md）

## Current Blocking Items
（只列 PI3-001～006 · Go-Live · 生产证据缺口）

## Release Decision
NO-GO | GO
```

### 4.2 · 机读键（汇报闸）

```text
TT_PROJECT_REPORTING_TEMPLATE: FIXED_20260702
TT_RELEASE_PIPELINE: ENFORCED
TT_DISPLAY_DATA_GOVERNANCE: PASS
TT_BUSINESS_MANUAL_UAT: PASS
TT_PRODUCT_CAPABILITY: ENTERPRISE_COMPLETE
TT_PRODUCTION_CAPABILITY: IN_PROGRESS
TT_PRODUCTION_ENGINEERING_ONLY: true
TT_EVIDENCE_PRODUCT_TRACK: COMPLETE
TT_EVIDENCE_PRODUCTION_TRACK: IN_PROGRESS
TT_FORBIDDEN_REPORT_TOPICS: ADMIN_DAILY_PROGRESS,OFFICIAL_OPS_DAILY,CMS_DAILY,CONTENT_CENTER_DAILY
```

### 4.3 · Evidence Completeness（固定两句）

| 轨 | 状态 | 说明 |
|----|------|------|
| **Product Evidence** | **Complete** | Admin 自动化 · 人工 · Sign-off 已齐（40/40 · Phase② 26/26 · ADM-U01/U02 · Staging UAT · Closure） |
| **Production Evidence** | **In Progress** | Backup · Mainnet · Business UAT · Go-Live 证据未齐 |

**纪律：** Product Evidence Complete **不**代表 Production GO；**Release Decision** 只看 Production 轨 + 七维审计。

### 4.4 · 禁止汇报（除非成为 Production 阻断项）

- Admin 今天进度 / 还差什么功能
- Official Ops / CMS / Content Center 日常进展
- 「要不要继续完善后台」类议题

### 4.5 · 合法汇报内容（Production Capability 内）

| 主线段 | 报什么 |
|--------|--------|
| **PI3** | PI3-001～006 开/关 · 脚本 · 证据路径 |
| **Production Readiness** | Convergence · prod 域/TLS/CORS · 监控/告警演练 |
| **Mainnet** | §9 shadow · 合约登记 · 链上 UAT |
| **Business Manual UAT** | 手验计划 · sign-off |
| **Production GO** | go-live checklist · **Release Decision** |

---

## 5 · 与 Admin 纪律 ①～③ 的关系

| 纪律 | 范围 |
|------|------|
| **④ 本文件** | **全项目** · 新增工作归类 · 单队列 |
| **① Admin 退出主战场** | Admin 域 |
| **② 禁止甩锅 Admin** | Production GO 归因 |
| **③ 版本演进** | Official Ops 1.1→2.0 |

纪律 **④ 优先级最高** — 所有 PR / 任务 / 日报须先回答：**属于五条主线中的哪一条？**

---

## 6 · 已冻结域（不阻断 · 不进日报主线）

| 域 | Architecture | 阻断 GO？ |
|----|--------------|-----------|
| Admin Platform | STABLE_FINAL | **否** |
| Official Ops | STABLE | **否** |
| Content Center | STABLE | **否** |
| Test Accounts / SSOT | STABLE | **否** |

---

**TT_PROGRAM_MAINLINE_DISCIPLINE: ENFORCED**
