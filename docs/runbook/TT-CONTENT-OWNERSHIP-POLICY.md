# TT-CONTENT-OWNERSHIP-POLICY · 媒体资产归属与 L5 治理

**Version:** 1.1.0 · **生效：** 2026-07-05  
**阶段口径：** ① 本地 → ② Staging → ③ Production  
**状态：** **ACTIVE** — OCS Content L5 **CLOSED** · CMS Content L5 **BASELINE_ESTABLISHED**

**一句话：** 生产环境所有公众可见媒体 **必须来自自有资产库**。四层体系：**OCS → CMS → Public Ops → Media Platform**；禁止 Production 长期依赖 Unsplash/Pexels。

---

## 0 · 机读键

```text
TT_CONTENT_OWNERSHIP_POLICY: ACTIVE
TT_CONTENT_PRIORITY_A: OCS_OFFICIAL_CONTENT
TT_CONTENT_PRIORITY_B: CMS_OPERATIONAL_CONTENT
TT_CONTENT_PRIORITY_C: PUBLIC_OPERATIONS
TT_CONTENT_PRIORITY_D: MEDIA_PLATFORM
TT_PRODUCTION_EXTERNAL_IMAGE_URLS: FORBIDDEN
TT_DEV_DEMO_PLACEHOLDER_EXTERNAL: ALLOWED
TT_CATALOG_OWNED_CDN_TARGET: REQUIRED_FOR_PRODUCTION_GO
TT_CMS_CONTENT_L5: BASELINE_ESTABLISHED
```

**交叉 SSOT：**

| 轨 | 文档 |
|----|------|
| Priority A · OCS | [TT-OCS-CONTENT-L5.md](./TT-OCS-CONTENT-L5.md) |
| Priority B · CMS | [TT-CMS-CONTENT-L5.md](./TT-CMS-CONTENT-L5.md) · [101-CMS 蓝图](../handbook/engineering/101-CMS与内容运营中心实施蓝图.md) |
| Priority C · Public Ops | [TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md](./TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md) |
| Priority D · Media Platform | [TT-MEDIA-PLATFORM-ARCHITECTURE.md](./TT-MEDIA-PLATFORM-ARCHITECTURE.md) |
| **全站只读盘点** | [content-ownership-inventory.v1.yaml](../../data/catalog/content-ownership-inventory.v1.yaml) · v2 含 `current_status` · `business_criticality` · PER P0 入口 |
| Catalog 迁移 | [registry/catalog-asset-migration.v1.yaml](../../registry/catalog-asset-migration.v1.yaml) |

---

## 1 · 四层内容体系（长期架构）

```text
Priority A  Official Content（OCS）
            60 格官方实体 · Manifest · Bootstrap
            ─────────────────────────────────────
Priority B  CMS
            Destination Ambient · POI · Hotel · Transport · Marketing
            Brief → Asset Matrix → Catalog → Publish → Verify → Evidence
            ─────────────────────────────────────
Priority C  Public Operations
            Campaign · Featured · Schedule · Surface（不存二进制）
            ─────────────────────────────────────
Priority D  Media Platform（架构预定义 · 未实施）
            Image · Video · Poster · CDN · Compression · Derivative · Audit
            CMS/OCS 只引用 media_asset_id
```

---

## 2 · OCS vs CMS · 同等级标准

| 标准 | OCS | CMS |
|------|-----|-----|
| 图片质量 | ✅ | ✅ |
| 品牌一致性 | ✅ | ✅ |
| 国家真实性 | ✅ | ✅ |
| 多样性 | ✅ | ✅ |
| WCAG | ✅ | ✅ |
| Manifest | ✅ | ❌（Catalog） |
| Matrix | ✅ 60 行 | ✅ Asset Matrix（按族） |
| Revision | 简单 | ✅ **必须** |
| Publish | Bootstrap | ✅ CMS Publish |

**Runbook：** [TT-CMS-CONTENT-L5.md](./TT-CMS-CONTENT-L5.md)

---

## 3 · Destination Ambient（原 Landing Ambient）

| 层 | 名称 |
|----|------|
| 产品 / Matrix | **Destination Ambient** |
| Catalog `asset_kind`（legacy） | `landing_ambient` |
| Admin（legacy） | `/admin/content/landing-ambient` |
| Matrix SSOT | `data/catalog/destination-ambient-matrix.v1.yaml` |

消费面扩展：**Home · Discover · Travel · Market · Escrow · Guide Detail**（Matrix 逐面增行）。

---

## 4 · 禁止与允许（Production vs Dev）

| 环境 | 第三方图床 URL | 自有 OCS / Catalog / CDN |
|------|----------------|---------------------------|
| **① Dev / Demo** | 允许 Temporary Placeholder | 推荐 Catalog 联调 |
| **② Staging** | Expected Difference · 须有 CMS 替换计划 | OCS 60 + CMS Matrix 推进 |
| **③ Production** | **禁止** 持续依赖 | **必须** 100% |

---

## 5 · UX 优先级（Product backlog）

| 优先级 | 工作 | 归属 |
|--------|------|------|
| **P1** | Destination Ambient（10 国 · Home） | CMS L5 Phase 1 |
| **P1** | Market Listing fallback 清理 | Priority D + API |
| **P2** | POI / Hotel / Transport Matrix | CMS L5 扩展族 |
| **P2** | Catalog Owned CDN | Media Platform |
| **P3** | TravelTrust Cinematic · Rank Avatar | 独立轨 |

**Phase 0：** CMS L5 Baseline — **禁止** `upload → 直接 live`  
**Phase 1 国别顺序：** JP → KR → TH → SG → FR → US → AU → ES → AE → CN（与 OCS 链顺序对齐）

**Asset Lifecycle：** `draft → review → approved → published → live → archived` — 见 [TT-CMS-CONTENT-L5.md](./TT-CMS-CONTENT-L5.md) §4

**Asset Version：** `revision_number` · `revision_label` · `published_by/at` · `rollback_target_revision` — Catalog `catalog_content_revisions` 真源

**Phase 1 单行模板（10 国复用）：** [TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md](./TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md)

**CMS Change Policy：** [TT-CMS-CHANGE-POLICY.md](./TT-CMS-CHANGE-POLICY.md) — Fix / Refresh / Structural Change 三型 · Wave 1 JP · Wave 2 KR

---

## 6 · PER 边界

| 允许 | 禁止（PER 内） |
|------|----------------|
| CMS Brief / Matrix / Registry / Verify 脚本 / Evidence | 改 API `asset_kind` 命名 |
| Admin Catalog 上传（Phase 1 起） | 删 fallback 代码 · OCS reopen |

---

## 7 · 诚实边界

- **CMS L5 Baseline ESTABLISHED** ≠ Destination Ambient **CLOSED** ≠ **Production GO**
- **Media Platform** = 架构 only · **NOT_STARTED**
- OCS 60 格 **继续 CLOSED**

---

*TT-CONTENT-OWNERSHIP-POLICY v1.1.0 · 2026-07-05*
