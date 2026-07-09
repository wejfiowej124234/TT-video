# TT-CMS-CONTENT-L5 · CMS Content L5 Standard

**Version:** 1.3.1 · **生效：** 2026-07-05  
**阶段口径：** ① 本地 → ② Staging → ③ Production  
**状态：** **BASELINE_ESTABLISHED** — 治理体系就绪 · **未**开始批量上传 · **≠** OCS CLOSED 复用

**一句话：** **CMS Content L5** 与 **OCS Content L5** **同等级企业标准**、**不同职责** — OCS 管官方实体 60 格；CMS 管运营内容（Destination Ambient · POI · Hotel · Transport …）经 **Catalog + Revision + Publish**。

**上级架构：** [TT-CONTENT-OWNERSHIP-POLICY.md](./TT-CONTENT-OWNERSHIP-POLICY.md)（四层 A/B/C/D）  
**Media Platform（Priority D · 架构预定义）：** [TT-MEDIA-PLATFORM-ARCHITECTURE.md](./TT-MEDIA-PLATFORM-ARCHITECTURE.md)

---

## 0 · 机读键

```text
TT_CMS_CONTENT_L5: BASELINE_ESTABLISHED
TT_CMS_CONTENT_L5_EXECUTION: NOT_STARTED
TT_CMS_CONTENT_L5_READY: NO
TT_CMS_DESTINATION_AMBIENT_MATRIX: ACTIVE
TT_CMS_CONTENT_BRIEF: data/catalog/cms-content-brief.v1.yaml
TT_CMS_DESTINATION_AMBIENT_MATRIX_PATH: data/catalog/destination-ambient-matrix.v1.yaml
TT_CMS_CONTENT_L5_RUNBOOK: docs/runbook/TT-CMS-CONTENT-L5.md
TT_CMS_CONTENT_L5_EVIDENCE_ROOT: evidence/GO_cms_content_l5/
TT_CMS_CONTENT_L5_REGISTRY: registry/cms-content-l5.v1.yaml
TT_CMS_PHASE1_SINGLE_ASSET_TEMPLATE: docs/runbook/TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md
TT_CMS_CHANGE_POLICY: docs/runbook/TT-CMS-CHANGE-POLICY.md
TT_CMS_CONTENT_HEALTH_SCORE: evidence/GO_cms_content_l5/CMS-CONTENT-HEALTH-SCORE-LATEST.json
```

---

## 1 · OCS vs CMS · 同等级对照

| 标准 | OCS（Priority A · 官方内容） | CMS（Priority B · 运营内容） |
|------|-------------------------------|------------------------------|
| 图片质量 | ✅ | ✅ |
| 品牌一致性 | ✅ | ✅ |
| 国家/场景真实性 | ✅ | ✅ |
| 多样性 | ✅ | ✅ |
| WCAG 视觉 | ✅ | ✅ |
| **Manifest** | ✅ `dataset.v1.json` | ❌ — 用 **Catalog** |
| **Matrix** | ✅ 60 行 Production Matrix | ✅ **Asset Matrix**（按族扩展） |
| **Revision** | 简单（manifest 字段） | ✅ **必须** `catalog_content_revisions` |
| **Publish** | Bootstrap / rebootstrap | ✅ **CMS Publish**（Admin workflow） |
| **Verify** | `run-ocs-content-l5-row-verify.cjs` | `run-cms-content-l5-destination-ambient-verify.cjs` |
| **Evidence** | `evidence/GO_official_cold_start_dataset/ocs-content-l5/` | `evidence/GO_cms_content_l5/` |
| **控制面** | Content Engineering | **Content Center Admin** |

```text
OCS L5  →  官方内容（Guide / Provider / … 60 格）
CMS L5  →  运营内容（Destination Ambient / POI / Hotel / …）
```

---

## 2 · 四层内容体系（长期冻结 · 几年不重构）

| Priority | 名称 | 职责 | SSOT |
|----------|------|------|------|
| **A** | **Official Content（OCS）** | 60 格官方实体 · Campaign 继承 | `data/official-cold-start/` |
| **B** | **CMS** | Destination Ambient · POI · Hotel · Transport · Marketing Images | `data/catalog/` · Content Center Admin |
| **C** | **Public Operations** | Campaign · Featured · Schedule · Surface | Official Ops Admin |
| **D** | **Media Platform** | Image · Video · CDN · Compression · Derivative · Audit | [TT-MEDIA-PLATFORM-ARCHITECTURE.md](./TT-MEDIA-PLATFORM-ARCHITECTURE.md) |

**纪律：**

- CMS **只负责引用**（`image_asset_id` · catalog media id）— 二进制最终归 **Media Platform（D）**。
- Public Ops **不**存 Ambient 二进制 — 仅排期/分发 **已有** CMS/OCS 引用。
- 禁止 Production 长期依赖第三方 Unsplash/Pexels URL — 见 Ownership Policy §2。

---

## 3 · 产品命名：Destination Ambient

| 层 | 名称 |
|----|------|
| **产品 / Runbook / Matrix** | **Destination Ambient** |
| **Catalog `asset_kind`（legacy · 冻结 API）** | `landing_ambient` |
| **Admin 路由（legacy）** | `/admin/content/landing-ambient` |
| **countries.payload 字段（legacy）** | `landing_ambient` |

**原因：** 同一套国家氛围图将用于 **Home · Discover · Travel · Market · Escrow · Guide Detail** 等 — 「Landing」过窄。

**迁移纪律：** 文档与 Matrix 统一 **Destination Ambient**；代码/API 字段 **PER 前不改名**（Expected Difference · 仅 CONFIRM_DESIGN）。

---

## 4 · Asset Lifecycle（资产生命周期 · 每张图必达）

**机读字段：** `asset_lifecycle`（Matrix 行 · Admin 同步）

```text
Draft        Designer Upload · Matrix 登记
  ↓
Review       CMS Review 队列
  ↓
Approved     L5 人工/设计通过 · 待 Publish
  ↓
Published    Catalog Publish · catalog_content_revisions 写入
  ↓
Live         Verify PASS · 消费者 catalog_api
  ↓
Archived     被新版本取代 · 历史 revision 保留
```

| 阶段 | 责任方 | Catalog 映射 |
|------|--------|--------------|
| **draft** | 设计 | 本地/暂存 · 未写 revision |
| **review** | 运营+设计 | `submit` workflow（若启用） |
| **approved** | 运营 Owner | 待 `PATCH landing_ambient` |
| **published** | Admin | `patch_admin_country_landing_ambient` → **revision_number++** |
| **live** | Verify + ② staging | `publish` + catalog media 可读 |
| **archived** | 运营 | `archive` · 或新版本 live 后旧版置 archived |

**禁止：** `upload → 直接 live`（`forbidden_shortcut: upload_direct_to_live`）。

---

## 5 · Asset Version（Catalog Revision · 企业 CMS）

**禁止** 仅维护 `JP_HOME.jpg` 文件名；**必须** 维护版本块：

```yaml
asset_version:
  revision_number: 7          # catalog_countries.version
  revision_label: v3          # 人类可读
  published_by: <actor_id>
  published_at_utc: "2026-…"
  rollback_target_revision: 6 # 上一 live · 1 分钟回滚目标
```

**Catalog 真源（已实现 · 不改 schema）：**

- `catalog_countries.version` — 乐观锁 + 版本号
- `catalog_content_revisions` — `before_json` / `after_json` · `action: update_landing_ambient`
- Admin `list_admin_catalog_revisions` — 审计链

**回滚 Runbook（Staging 演练 · Phase 1）：**

1. 读 `rollback_target_revision` 对应 revision 的 `before_json.landing_ambient`
2. `PATCH` with `expected_version` = 当前 version
3. Matrix 行 `asset_lifecycle` → `published` → re-verify → `live`
4. Evidence 记 `CMS-DESTINATION-AMBIENT-ROLLBACK-DRILL.json`

---

## 6 · Phase 1 固定执行顺序（永久）

**国家顺序（与 OCS 国际城链一致）：**

```text
1 JP → 2 KR → 3 TH → 4 SG → 5 FR → 6 US → 7 AU → 8 ES → 9 AE → 10 CN
```

（CN 为产品国 Ambient 第 10 位 · OCS 60 格无 CN 城链 · `ocs_chain_ref: product_country_only`）

**固定工作流（禁止跳步）：**

```text
Destination Ambient Brief
        ↓
Asset Matrix（execution_order）
        ↓
Designer Upload          → asset_lifecycle: draft
        ↓
CMS Review               → review → approved
        ↓
Catalog Publish          → published · asset_version 写入
        ↓
Verify                   → live 判定
        ↓
Evidence
        ↓
Matrix PASS              → matrix_row_status: pass
```

**逐国闭环后再下一国** — 与 OCS row-complete 纪律同构。

**Phase 1 三波试点（禁止 10 国批量）：** Wave 1 `DA-JP-HOME` → Wave 2 `DA-KR-HOME` → Wave 3+ 顺序推进 — 见 [TT-CMS-CHANGE-POLICY.md](./TT-CMS-CHANGE-POLICY.md) §4。

---

## 7 · CMS Change Policy（内容变更策略）

**SSOT：** [TT-CMS-CHANGE-POLICY.md](./TT-CMS-CHANGE-POLICY.md)

| 类型 | 运营 | 流程 |
|------|------|------|
| **Content Fix** | ✅ | Review → Publish → Verify → Evidence |
| **Content Refresh** | ✅ | 新 Revision · 不覆盖历史 |
| **Structural Change** | ❌ | Architecture Review |

**纪律：** 运营 **只能换图** · **不能** 改 Matrix / lifecycle / Registry / API。

---

## 8 · CMS Content Health Score（全局 KPI）

```bash
node scripts/dev/run-cms-content-health-score.cjs
```

| 指标 | Phase 0 当前 |
|------|--------------|
| Live Assets | 0/10 |
| Review SLA | 100% |
| Verify Pass Rate | 100% |
| Rollback Readiness | 100% |
| Evidence Completeness | 100% |
| **Overall** | **BASELINE ESTABLISHED** |

**产物：** `evidence/GO_cms_content_l5/CMS-CONTENT-HEALTH-SCORE-LATEST.json` — baseline pack 同批刷新。

**Content Health（运营看板 · 非新治理）：** 同 JSON · `content_health` 段 — Live / Pending Review / Published / Rejected · 平均 Review/Publish 时长 · Last Publish/Verify · `ops_board` 按国别 ISO 分桶（供 CMS 后台首页消费）。

---

## 9 · CMS Content L5 数据生命周期（Catalog 层）

```text
Brief → Asset Matrix → Catalog → Publish → Verify → Evidence
```

与 §4–§6 合并为 **唯一 Phase 1 入口**。

---

## 10 · Phase 0 · Destination Ambient 基线

**目标：** 在上传 10 国图 **之前**，治理体系 **与 OCS 同等级就绪**。

| # | 交付物 | 路径 | 状态 |
|---|--------|------|------|
| 1 | CMS Content Brief | `data/catalog/cms-content-brief.v1.yaml` | ✅ |
| 2 | Destination Ambient Matrix（10 国 · Home 面） | `data/catalog/destination-ambient-matrix.v1.yaml` | ✅ · 全行 **pending** |
| 3 | Registry | `registry/cms-content-l5.v1.yaml` | ✅ |
| 4 | Verify 脚本 | `scripts/dev/run-cms-content-l5-destination-ambient-verify.cjs` | ✅ |
| 5 | Baseline pack | `scripts/dev/run-cms-content-l5-baseline-pack.cjs` | ✅ |
| 6 | Runbook | 本文 | ✅ |

**Baseline 验收：**

```bash
bash scripts/dev/run-cms-content-l5-baseline-pack.cjs
# 末行：TT_CMS_CONTENT_L5_BASELINE: ESTABLISHED
```

**Phase 1（未开始）：** 每一 Matrix 行复用 **[TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md](./TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md)** — scaffold → 6 步 → DoD — **须在 Baseline ESTABLISHED 之后**。

---

## 11 · Destination Ambient · 双维收口 + 资产规范（Brief 摘要）

**禁止混读：** Pipeline CLOSED ≠ Visual L5 CLOSED。

| 维度 | ② Staging 状态 | 含义 |
|------|----------------|------|
| **Pipeline** | **CLOSED** | CMS→Catalog→Publish→Runtime→Browser→Evidence 接线（Wave 1） |
| **Visual L5** | **OPEN** | 全屏 Hero 像素/构图/Decode · Ken Burns 124%×scale1.2 |

| Asset 族 | 尺寸 | 用途 |
|----------|------|------|
| OCS Card | 640×480 | Listing · Feed · Guide Card · **禁止** Landing Hero |
| Destination Ambient Hero | **3840×2160**（最低 1920×1080） | `/` Ken Burns · `da-hero-{iso}-home-vN.jpg` |

**Hero Matrix SSOT：** `data/catalog/destination-ambient-hero-matrix.v1.yaml`（10 国必去地标 · 换图轨）

| 项 | 标准 |
|----|------|
| 推荐尺寸 | **3840×2160** · 16:9 |
| 最低尺寸 | **1920×1080**（Verify 升级后 WARN） |
| 低于 1920 宽 | **FAIL**（含 OCS 640 卡片 upscale） |
| 最小字节 | **>16KB**（禁占位）+ **Decode 验宽高** |
| 格式 | JPEG / WebP |
| 品牌 | 暖色旅行纪实 · 与 OCS `brand_visual` 一致 |
| 国家真实性 | 必去地标与 `country_iso` 一致（见 Hero Matrix `landmark_zh`） |
| 构图 | 主体居中 · 左右/上下各留 Ken Burns 安全区 · 中下留给玻璃表单 |
| WCAG | Ken Burns + vignette 下 UI 可读；图内禁大段文字 |
| 消费面 | `home` — 后续 `discover` · `travel` · `market` · `escrow` · `guide_detail` |

Detail：`data/catalog/cms-content-brief.v1.yaml` → `asset_families.destination_ambient`

---

## 12 · Asset Matrix 扩展路线图

| Matrix 文件 | 资产族 | 状态 |
|-------------|--------|------|
| `destination-ambient-matrix.v1.yaml` | Pipeline · landing_ambient | **ACTIVE · Pipeline CLOSED** |
| `destination-ambient-hero-matrix.v1.yaml` | Hero · Visual L5 换图 | **ACTIVE · Visual L5 OPEN** |
| `poi-hero-matrix.v1.yaml` | POI | SCOPE_LOCKED |
| `hotel-stock-matrix.v1.yaml` | Hotel | PLANNED |
| `transport-stock-matrix.v1.yaml` | Transport | PLANNED |
| `airport-stock-matrix.v1.yaml` | Airport | PLANNED |
| `family-stock-matrix.v1.yaml` | Family | PLANNED |
| `museum-stock-matrix.v1.yaml` | Museum | PLANNED |

每个族复用同一生命周期：**Brief → Matrix → Catalog → Publish → Verify → Evidence**。

---

## 13 · Verify · Evidence

**Phase 1 单行模板（10 国复用 · SSOT）：** [TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md](./TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md)

```bash
# 1) 开工 scaffold
node scripts/dev/scaffold-cms-phase1-single-asset-evidence.cjs --matrix-id DA-XX-HOME

# 2) Steps 1–4 人工 + Matrix execution_gates 更新

# 3) Verify
node scripts/dev/run-cms-content-l5-destination-ambient-verify.cjs --matrix-id DA-XX-HOME

# 4) DoD 终验
node scripts/dev/run-cms-phase1-single-asset-dod.cjs --matrix-id DA-XX-HOME
```

**单行 verify（Destination Ambient · 按 matrix_id）：**

```bash
node scripts/dev/run-cms-content-l5-destination-ambient-verify.cjs --matrix-id DA-JP-HOME
# 可选：API=…  HEAD catalog 公网 URL
```

**Evidence 目录：**

```text
evidence/GO_cms_content_l5/
  baseline/<stamp>/CMS-CONTENT-L5-BASELINE.json
  destination-ambient/rows/<matrix_id>.EVIDENCE.json    # Phase 1 单行 SSOT
  destination-ambient/rows/<matrix_id>.REVIEW.json      # 无 EVIDENCE 时 verify 回落
  destination-ambient/<stamp>/CMS-DESTINATION-AMBIENT-CLOSURE.json   # 10/10 后
```

**Closure 四键（Destination Ambient 族 · 类比 OCS）：**

```text
TT_CMS_DESTINATION_AMBIENT_MATRIX: PASS
TT_CMS_DESTINATION_AMBIENT_READY: YES
TT_CMS_CONTENT_BRAND_CONSISTENCY: PASS   # 人工 review 包
TT_CMS_CONTENT_L5_DESTINATION_AMBIENT: CLOSED
```

---

## 14 · 与 PER / OCS 边界

| 项 | CMS L5 Baseline | PER |
|----|-----------------|-----|
| 写 YAML / Runbook / Registry / Verify 脚本 | ✅ | — |
| Admin Catalog 上传 | Phase 1 起 | ✅ 运营数据 |
| 改 `asset_kind` 命名 / API 字段 | ❌ 另立项 | ❌ |
| OCS 60 格 | 冻结 | 不 reopen |
| 删 TS Unsplash fallback | Phase 1 后 + 单闸 | ❌ PER 内不做 |

---

## 15 · 诚实边界

**阶段自然切换（不靠改规则 · 不靠改治理文档）：**

```text
Production Preparation              Post-GO Operations（PER 五项完成后自然切换）
        │                                      │
   PER（默认 P1）                          CMS
   CMS（默认 P2）                    Public Operations
                                       Growth
                                       Content Expansion
```

**Production Preparation 阶段 · 默认执行优先级：**

PER 五项完成后，重心自然切向 Post-GO Operations — **无需** 修改治理文档或重新设计流程。

| 阶段优先 | 主线 | 顺序 | 单项闭环标志 |
|----------|------|------|--------------|
| **1** | **PER** | Business Closed Loop → Recovery → Rollback → Monitoring → Production Configuration | **Evidence + 签收** |
| **2** | **CMS Operation** | Wave 1 → Wave 2 → Wave 3+ → 10 国 Live | **Publish · Verify · Evidence · Health Score** |

```text
Priority 1  PER  ──→  Production GO Decision
Priority 2  CMS  ──→  持续运营能力建设
```

**工作节奏：** 两问门禁 → 通过则直接执行 → 单项闭环 Evidence → 下一项 · **不回头设计流程**。

**决策门禁（每项工作开始前 · 两问）：**

1. **属于哪条主线？** `CMS Operation` · `PER` — 若两者都不是 → 很可能不是当前优先事项  
2. **是否直接提升运营或上线能力？** 是 → 执行 · 否 → 暂缓（避免重新进入治理设计）

**当前进度判断：**

| 项 | 状态 |
|----|------|
| OCS 官方内容资产 | ✅ 完成 |
| CMS 治理体系 | ✅ 完成 |
| CMS 运营执行 | ▶ 已开始（Wave 1 待首条闭环） |
| PER 执行准备 | ▶ 已开始 |

**后续关键词：** 执行 · 验证 · 发布 · 留证 — **不是** 新治理框架。  
**节奏：** 本阶段 PER 默认第一 · CMS 默认第二 · 两线各自闭环 Evidence · PER 达标 → Production GO 决策 · CMS 持续 Live/Health Score 增长。

**运营冻结 · 三条长期原则（2026-07-05）：**

| # | 原则 |
|---|------|
| **1** | **不为「设计更完美」暂停运营** — 新增前先问：能否**减少一次真实运营操作**？能→做 · 不能→不做（不新增 Review 类型 / Runbook / Registry 字段 / Checklist / 治理文档，除非现有流程无法覆盖真实业务） |
| **2** | **CMS 永远一条流程** — Destination Ambient · POI · Hotel · Transport · Future Video · Landing Hero 共用：**Brief → Upload → Review → Publish → Verify → Evidence → Live → Health Score** |
| **3** | **PER 与 CMS 永远解耦** — Production Preparation 下并行 · 互不阻塞 · PER=系统可上线 · CMS=内容可长期运营 |

**当前工作重心（Production Preparation · 不再讨论治理）：**

```text
Priority 1  PER
  Business Closed Loop → Recovery → Rollback → Monitoring → Production Config
  （每项：Evidence + 签收）

Priority 2  CMS Operation（并行 · 不阻塞 PER）
  Wave 1 → Wave 2 → Wave 3+ → 10 国 Live
  （每行：Publish · Verify · Evidence · Health Score）
```

- **CMS L5 Baseline ESTABLISHED** ≠ **Destination Ambient 10/10 CLOSED** ≠ **Production GO**。
- 当前 Matrix 全行 **pending** · `current_source: ts_unsplash_fallback` — **预期状态**。
- Media Platform（D）**暂不开发** — 架构已预定义；CMS 暂可 `image_url` + `image_asset_id` 双轨过渡。

---

*TT-CMS-CONTENT-L5 v1.3.1 · CMS Content L5 Standard · 2026-07-05*
