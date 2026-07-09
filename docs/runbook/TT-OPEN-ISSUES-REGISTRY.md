# TT-OPEN-ISSUES-REGISTRY · 问题总账（统一 Issue Registry）

**机读 SSOT：** [`registry/open-issues.v1.yaml`](../../registry/open-issues.v1.yaml)  
**Dashboard 引用：** [`registry/executive-dashboard.v1.yaml`](../../registry/executive-dashboard.v1.yaml) → `open_issues`  
**原则：** 一个问题 ID · 一条总账 · 模块 Registry 只放细节

```text
TT_OPEN_ISSUES_REGISTRY: ENFORCED
```

---

## 字段（每条 Issue 必填）

| 字段 | 说明 |
|------|------|
| **id** | 全局唯一，如 `CI-BUILD-20260703-V49-OOM` |
| **category** | Build Infrastructure · Frontend Runtime · Security · PI3 Owner Live … |
| **severity** | LOW · MEDIUM · HIGH · CRITICAL |
| **owner** | 负责团队/角色 |
| **status** | OPEN · IN_PROGRESS · CLOSED · WONTFIX |
| **blocking** | 是否阻挡 `target_gate` / Release Decision |
| **target_gate** | 归属门禁或轨道 |
| **evidence** | 证据路径 |
| **closed_utc** | 关闭时间；OPEN 时为 `null` |
| **opened_utc** | 登记时间 |
| **summary** | 一句话摘要 |

可选：`module_registry` · `runbook`（模块深度文档）

---

## 与模块 Registry 的关系

```text
open-issues.v1.yaml          ← 总账（Dashboard / 发布决策一眼）
        │
        ├── registry/ci-build-stability.v1.yaml   ← Build 细节
        ├── registry/phase3-production-infrastructure.v1.yaml
        └── …
```

**禁止** 只在模块 Registry 登记、总账缺失。  
**允许** 模块 Registry 保留 mitigation/env 等细节，但必须 `id` 与总账一致。

---

## 当前开放项（2026-07-03）

### Dashboard · PI3 双轨

```text
PI3-MEDIA-INFRASTRUCTURE     ← 上传/存储/CDN/播放（与 Catalog 解耦）
PI3-CATALOG-ASSET-MIGRATION  ← 运营素材 Unsplash→自有（不挡 Infra 关闭）
```

| Issue / Track | 状态 |
|---------------|------|
| `PI3-MEDIA-PERSISTENT-STAGING` | ✅ **CLOSED**（Infra 轨道） |
| `PI3-MEDIA-R2-CDN-FINAL` | ⏳ **WAITING_OWNER_CF**（Infra） |
| `MEDIA_CDN_PRODUCTION_ACCEPTANCE` | ⏳ **PENDING**（Infra 验收） |
| `PI3-CATALOG-ASSET-MIGRATION` | ⏸ **DEFERRED**（Catalog · **不挡 Infra**） |
| `CI-BUILD-20260703-V49-OOM` | 🟡 **OPEN (Low)** |

| id | Category | Severity | Blocking | Target Gate | Display |
|----|----------|----------|----------|-------------|---------|
| `PI3-MEDIA-R2-CDN-FINAL` | Production Infrastructure | **MEDIUM** | **false** | `PI3_PRODUCTION_INFRASTRUCTURE` | **WAITING_OWNER_CF** |
| `MEDIA_CDN_PRODUCTION_ACCEPTANCE` | Production Validation | **MEDIUM** | **false** | `PI3_PRODUCTION_INFRASTRUCTURE` | **PENDING** |
| `PI3-CATALOG-ASSET-MIGRATION` | Catalog Operations | **LOW** | **false** | `PI3_PRODUCTION_INFRASTRUCTURE` | **DEFERRED** |
| `CI-BUILD-20260703-V49-OOM` | Build Infrastructure | **LOW** | **false** | `CI_BUILD_STABILITY` | OPEN |

**已关闭（Infra · Phase ② interim）：** `PI3-MEDIA-PERSISTENT-STAGING` — Fly Tigris · off `loca.lt`（**非 R2 最终态**）

**Infra 待 Owner：** `PI3-MEDIA-R2-CDN-FINAL` — R2 + `cdn.traveltrust.app`

**Infra 验收：** `MEDIA_CDN_PRODUCTION_ACCEPTANCE` — **仅社区上传管道** · Catalog Unsplash **不阻塞** PASS

**Catalog 素材（独立轨道）：** `PI3-CATALOG-ASSET-MIGRATION` — Unsplash 为**早期运营素材选择**，非 Infra 缺陷 · [`TT-PI3-CATALOG-ASSET-MIGRATION.md`](TT-PI3-CATALOG-ASSET-MIGRATION.md)

**Owner Infra 清单：** [`TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md`](TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md)

**Infra 状态机：**

```text
WAITING_OWNER_CF → MEDIA_CDN_PRODUCTION_ACCEPTANCE PASS → PI3-MEDIA-INFRASTRUCTURE CLOSED
(Catalog 仍 Unsplash 允许 Infra CLOSED)
```

**Enterprise SSOT Alignment：** [`TT-ENTERPRISE-SSOT-ALIGNMENT.md`](TT-ENTERPRISE-SSOT-ALIGNMENT.md) · **Overall PASS** `20260703T154232Z`

**Dashboard · Enterprise Alignment 树（与 SSOT 同名）：**

```text
Enterprise Alignment
├── Configuration Alignment      PASS
├── Local Runtime Validation     SKIPPED
├── Staging Runtime Validation   PASS
└── Overall Enterprise Alignment PASS
```

**配置对齐 ≠ 运行态：** `Configuration Alignment PASS` 不表示 Local API 当时已启动 — Local 未跑 → `Local Runtime Validation=SKIPPED` → Overall 仍可为 PASS。

### 项目阶段总览

**Phase ① Local：** 产品 ✅ · 数据治理 ✅ · 企业治理 ✅ · SSOT ✅ · Runtime 按需复验  
**Phase ② Staging：** Staging ✅ · OCS ✅ · Workflow ✅ · Operations ✅ · Enterprise Alignment ✅  
**Phase ③ PI3（推进中）：** 品牌域/DNS/TLS · R2+CDN · Stripe Live · Security · Observability · Performance · Browser UAT · Go-Live

**企业三层媒体 SSOT：** [`TT-MEDIA-THREE-TIER-ARCHITECTURE.md`](TT-MEDIA-THREE-TIER-ARCHITECTURE.md)

**已关闭（基础设施 · 20260703T133800Z）：**

| Issue | 修复 | Evidence |
|-------|------|----------|
| `C4-MEDIA-TUNNEL-UNAVAILABLE` | MinIO + localtunnel → Fly secrets 短期恢复 | `evidence/GO_staging_infra_fix/20260703T133800Z/c4-media-restore.json` |
| `STAGING_API_DB_TRANSIENT_503` | 连接池 + retry + `/health/ready` + metrics | `evidence/GO_staging_infra_fix/20260703T133800Z/staging-api-db-fix.json` |

**Market Runtime（Default Filter + Subsite Race）：** **CLOSED** — **不重开** OCS / DDG / SOPCP。

Sign-off：`evidence/manual-uat/signoff/STAGING-INFRA-FIX-SIGNOFF-20260703T133800Z.md`

---

## 程序阶段（与 Dashboard 对齐）

**工程治理层次（2026-07-03）：**

```text
Product（产品）
        │
Operations（运营）
        │
Data Governance（DDG / OCS / SOPCP / OCIP）
        │
PI3 Production Engineering
        ├── Media Infrastructure        ← 媒体系统能不能稳定运行？
        ├── Production Infrastructure
        ├── Security
        ├── Observability
        ├── Performance
        └── Go-Live
        │
Catalog Assets（运营素材）              ← 用户看到的是不是正式运营素材？
        └── PI3-CATALOG-ASSET-MIGRATION（与 Media Infra 独立推进）
```

**验收解耦原则（ENFORCED）：**

> Media Infrastructure 验收仅验证媒体服务能力，不验证运营素材来源；  
> Catalog Asset Migration 验收仅验证素材来源、版权与运营内容，不重新验收媒体基础设施。

**Phase ② — CLOSED**

- Product · Operations · Governance · Alignment

**Phase ③ — Production Engineering（当前主线）**

```text
Production Infrastructure
        ↓
Security
        ↓
Observability
        ↓
Performance
        ↓
Production Validation
        ↓
Production GO
```

后续工作重点：**生产可靠性 · 运维 · 安全 · 发布** — 非新功能扩张。

---

## 登记 / 关闭流程

1. 在 `registry/open-issues.v1.yaml` → `issues[]` 追加完整一行  
2. 写入 `evidence/GO_<category>/`  
3. 若有模块细节，更新对应 `registry/*.v1.yaml` 并引用同一 `id`  
4. 更新 `executive-dashboard.v1.yaml` → `open_issues.rollup`  
5. 关闭时：`status: CLOSED` · `closed_utc` · 更新 `rollup` · 可选移入 `closed_issues[]`
