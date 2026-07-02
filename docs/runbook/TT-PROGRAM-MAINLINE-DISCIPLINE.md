# TT-PROGRAM-MAINLINE-DISCIPLINE · 项目最高治理原则

**生效：** 2026-07-01  
**优先级：** **最高** — 覆盖一切新增开发决策  
**阶段：** **Product Delivery（交付产品）** · 非 Product Development（研发功能）  
**机读：** [`registry/traveltrust-three-dimension-status.v1.yaml`](../../registry/traveltrust-three-dimension-status.v1.yaml)

**最高裁决入口：** [`TT-DELIVERY-DECISION-POLICY.md`](TT-DELIVERY-DECISION-POLICY.md) · `TT_DELIVERY_DECISION_POLICY: ENFORCED`

**互指：** [`TT-ADMIN-PLATFORM-GOVERNANCE-DISCIPLINE.md`](TT-ADMIN-PLATFORM-GOVERNANCE-DISCIPLINE.md)（纪律 ①～③）· [`PHASE3-PRODUCTION-PREPARATION.md`](PHASE3-PRODUCTION-PREPARATION.md)

---

## 0 · 机读键

```text
TT_PROGRAM_MAINLINE_DISCIPLINE: ENFORCED
TT_PROJECT_PHASE: PRODUCT_DELIVERY
TT_PREVIOUS_PHASE: PRODUCT_DEVELOPMENT
TT_CURRENT_MAINLINE: DISPLAY_DATA_GOVERNANCE,BUSINESS_MANUAL_UAT,PI3,PRODUCTION_READINESS,MAINNET,PRODUCTION_GO
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
| **③** | **Business Manual UAT** | ✅ **PASS**（2026-07-02 · 展示数据治理后探针） | 真人验收阻断 → ✅ 立即处理 |
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

## 3 · Current Mainline（执行顺序）

```
Admin Platform Complete
    ↓
Display Data Governance
    ↓
Business Manual UAT
    ↓
PI3
    ↓
Production Readiness
    ↓
Mainnet
    ↓
Production GO
    ↓
（Post-GO）Official Ops 1.1 · Feature Level STANDARD
```

**展示数据治理**（[`TT-DISPLAY-DATA-GOVERNANCE.md`](TT-DISPLAY-DATA-GOVERNANCE.md)）为 **Business Manual UAT 前强制门禁** · `TT_DISPLAY_DATA_GOVERNANCE: ENFORCED` · **非 Admin 开发 · 非 PI3 · 非 Bug 修复**。

---

## 3b · Legacy 队列参考（Production 轨内）

```
PI3
    ↓
Production Readiness
    ↓
Mainnet
    ↓
Business Manual UAT
    ↓
Production GO
```

*Display Data Governance 在 Business Manual UAT 之前完成；PI3 / Mainnet 与 UAT 并行度以 [`TT-DELIVERY-DECISION-POLICY.md`](TT-DELIVERY-DECISION-POLICY.md) 为准。*

---

## 4 · 统一汇报格式（强制 · 2026-07-02 起固定）

**每次项目汇报只采用以下结构。**  
**禁止**单独汇报「Admin 今天怎么样」「Official Ops 今天怎么样」「CMS 今天怎么样」— 上述域已 **Product Capability Complete · CLOSED**，除非 **重新成为 Production 阻断项**（极 unlikely）。

### 4.1 · 固定模板（复制即用）

```markdown
## Product Capability
Enterprise Complete

（含：前端 · 后端 · DB · Admin · 四大中心 · RBAC · Official Ops · Content Center · Business Flow · Operational Scenario）

## Production Capability
In Progress

（唯一剩余工程 — 与 Admin 无关）

## Evidence Completeness
Product Evidence      Complete
Production Evidence   In Progress

## Current Mainline
Display Data Governance
  ↓
Business Manual UAT
  ↓
PI3
  ↓
Production Readiness
  ↓
Mainnet
  ↓
Production GO

## Current Blocking Items
（只列 PI3-001～006 · Mainnet · Business UAT · Go-Live · 生产证据缺口）

## Release Decision
NO-GO | GO
```

### 4.2 · 机读键（汇报闸）

```text
TT_PROJECT_REPORTING_TEMPLATE: FIXED_20260702
TT_DISPLAY_DATA_GOVERNANCE: PASS
TT_BUSINESS_MANUAL_UAT: PASS
TT_PRODUCT_CAPABILITY: ENTERPRISE_COMPLETE
TT_PRODUCTION_CAPABILITY: IN_PROGRESS
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
