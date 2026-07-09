# CMS P1 Content Family Standard · P1 内容族统一规范

**Version:** 1.1.0 · **生效：** 2026-07-07  
**阶段口径：** ② Staging · **禁止** ③ Production GO  
**状态：** **FROZEN** — Review PASS · P1 四模块共用 · **变更须 Architecture Review**

**Review Evidence：** `evidence/GO_cms_operation/CMS-P1-STANDARD-REVIEW-LATEST.json`

**上级：** [TT-CMS-CONTENT-L5.md](./TT-CMS-CONTENT-L5.md) · [TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md](./TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md) · [TT-CONTENT-OWNERSHIP-POLICY.md](./TT-CONTENT-OWNERSHIP-POLICY.md)

**P0 已证明：** JP → KR → TH → … → CN 模板复制成功。P1 **先有本规范，再复制模块**。

---

## 0 · 机读键

```text
TT_CMS_P1_CONTENT_FAMILY_STANDARD: FROZEN
TT_CMS_P1_STANDARD_REVIEW: PASS
TT_CMS_P1_STANDARD_VERSION: 1.1.0
TT_CMS_P1_STANDARD_RUNBOOK: docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md
TT_CMS_P1_STANDARD_REGISTRY: registry/cms-p1-content-family-standard.v1.yaml
TT_CMS_P1_STANDARD_EVIDENCE: evidence/GO_cms_operation/CMS-P1-CONTENT-FAMILY-STANDARD-LATEST.json
TT_CMS_P1_MODULES: city_hero, hotel, transport, listings
TT_CMS_P1_ROADMAP: P1_Standard → City_Hero → Hotel → Transport → Listings
```

**治理顺序（不变）：**

```text
Registry → Ownership Matrix → Brief + Asset Matrix → Admin → Catalog → Runtime → Verify → Evidence → Script
```

**刷新 Evidence：**

```bash
node scripts/dev/run-cms-p1-content-family-standard.cjs
```

---

## 1 · P1 四模块 · 范围

| Registry 模块 | asset_kind | 粒度 | Admin（现有/规划） | 当前 |
|---------------|------------|------|-------------------|------|
| **City Hero** | `city_hero` | city | `/admin/content/city-hero`（待建） | Catalog 0 · Pilot |
| **Hotel** | `hotel_tier_stock` | tier | `/admin/content/hotel-tiers` | Wave-1 单行 · Backlog |
| **Transport** | `transport_stock` | country/region | `/admin/content/transport-region-rules` | Wave-1 单行 · Backlog |
| **Listings** | **非 media kind** · `provider_listing` + `acquisition_listing` | listing | Studio + listing API | Backlog |

**asset_kind 最终命名（Review 确认 · 2026-07-07）：**

| 模块 | 最终命名 | API allowlist | Staging | 结论 |
|------|----------|---------------|---------|------|
| City Hero | `city_hero` | 待加入 | count=0 | ✅ **reserved** |
| Hotel | `hotel_tier_stock` | ✅ 已有 | count≥1 | ✅ **FROZEN** |
| Transport | `transport_stock` | ✅ 已有 | count≥1 | ✅ **FROZEN** |
| Listings | `provider_listing` / `acquisition_listing` | **不用** catalog/media kind | listing API | ✅ **确认** · ❌ 拒绝 `listing_cover` |

**≠ P0 已完成（勿混淆）：**

| P0 Frozen | asset_kind | 说明 |
|-----------|------------|------|
| Hero Assets | `landing_ambient` | **国家级** Home Hero |
| Destination Ambient | `landing_ambient` | 国家级氛围 |
| POI Content QA | `poi_hero` | **按 city 跑** POI 配图 · 330/330 LOCK |

---

## 2 · asset_kind 命名规则

| 规则 | 说明 |
|------|------|
| **格式** | `snake_case` · 全小写 · 名词短语 |
| **语义** | `{subject}_{role}` 或 `{domain}_stock` · 例 `poi_hero` · `hotel_tier_stock` |
| **冻结** | 一经 Catalog API 暴露 · **PER 前不改名**（Expected Difference 仅文档层可换 product_name） |
| **Legacy** | 产品名与 `asset_kind` 可分离 · 见 Destination Ambient ↔ `landing_ambient` |
| **禁止** | 复用 OCS 文件名 · 一 kind 多语义 · 无 Brief 先上 API |

**P1 冻结 kind（Review 后）：**

```yaml
city_hero:          # reserved · 实现时加入 API allowlist
hotel_tier_stock:   # FROZEN · tier_code 键
transport_stock:    # FROZEN · country_iso 键
# Listings 无统一 asset_kind — 见 §2.1
```

### 2.1 · Listings 特殊模式（须在 Brief 明确 · 不可临时扩展）

| 项 | 约定 |
|----|------|
| **Content Family** | `provider_listing` · `acquisition_listing`（两个族 · 一个 Registry 模块） |
| **Runtime** | `GET /api/v1/market/{provider\|acquisition}/listings` → `payload.cover_url` |
| **Catalog 绑定** | 可选 `payload.cover_catalog_asset_id` · `cover_source=catalog` |
| **禁止** |  invent `listing_cover` 作为 `catalog/media?asset_kind=` |

### 2.2 · Hotel 双读例外（须在 Brief 明确）

| 读面 | Endpoint |
|------|----------|
| **Primary** | `GET /api/v1/catalog/hotel-tiers` → `stock_image_url` |
| **Media index** | `GET /api/v1/catalog/media?asset_kind=hotel_tier_stock` |
| **规则** | Matrix 行须两读一致或文档化 Expected Difference |

---

## 3 · Catalog Schema（每族必填）

每个 P1 族在 `cms-content-brief.v1.yaml` 登记后，须具备：

| 层 | SSOT | 必填 |
|----|------|------|
| **Brief 块** | `data/catalog/cms-content-brief.v1.yaml` → `asset_families.{id}` | product_name · asset_kind · admin_route · matrix_ssot · ops_hierarchy |
| **Asset Matrix** | `data/catalog/{family}-matrix.v1.yaml` | rows · matrix_id · execution_gates · asset_lifecycle |
| **Catalog 表/载荷** | PG `catalog_*` + `catalog_content_revisions` | revision 必填 · 禁止 upload→live 短路 |
| **Media 索引** | `GET /api/v1/catalog/media?asset_kind=` | url · country_iso · city_id（如适用）· version |

**Matrix 行最低字段（与 P0 对齐）：**

```yaml
matrix_id: <FAMILY>-<SCOPE>-<SEQ>
asset_kind: <frozen_kind>
asset_lifecycle: draft | review | approved | published | live | archived
matrix_row_status: pending | pass | fail
execution_gates:
  brief_review: PASS | FAIL
  cms_review: PASS | FAIL
  destination_authenticity: PASS | FAIL
  brand_consistency: PASS | FAIL
  catalog_publish: PASS | FAIL
  verify: PASS | FAIL
  evidence_complete: PASS | FAIL
asset_version:
  revision_number: int
  revision_label: vN
  published_by: actor
  published_at_utc: ISO8601
  rollback_target_revision: int
catalog_asset_id: uuid
public_url: https://...
current_source: catalog_api
```

**ops_hierarchy（按族选一）：**

| 族 | hierarchy |
|----|-----------|
| City Hero | `[asset_family, country, city, asset]` |
| Hotel | `[asset_family, tier, asset]` |
| Transport | `[asset_family, country, asset]` |
| Listings | `[asset_family, variant, listing, asset]` |

---

## 4 · Runtime Contract（统一生命周期）

**所有 P1 模块共享：**

```text
Draft
  ↓
Review
  ↓
Publish（catalog_content_revisions++）
  ↓
Catalog
  ↓
Runtime（API 可读）
  ↓
Consumer（resolver / 页面）
  ↓
Verify
  ↓
Evidence
  ↓
Frozen（Registry Pilot → Frozen）
```

| 模块 | Runtime 读面 | 例外标注 |
|------|-------------|----------|
| City Hero | `GET /catalog/media?asset_kind=city_hero&city_id=` | 无 |
| Hotel | hotel-tiers API **+** catalog/media | **双读** · §2.2 |
| Transport | `GET /catalog/media?asset_kind=transport_stock&country_iso=` | 无 |
| Listings | market listing API · `payload.cover_url` | **非 media kind** · §2.1 |

**Consumer 完成定义：**

```text
Catalog published → API 可读 → Consumer 消费 CMS 源（非长期 TS/stock fallback）→ Verify PASS
```

---

## 5 · Admin（统一 Content Center 体验）

**所有 P1 模块共享同一后台体验：**

```text
Content Center
    ↓
Asset Upload
    ↓
Review
    ↓
Publish（写 revision）
    ↓
History（catalog_content_revisions）
```

| 统一项 | SSOT |
|--------|------|
| 壳 | Content Center · `adminShellContentNavLinks.ts` |
| 权限 | `CONTENT_READ` / publish 分离 |
| 流程 | Upload → Review → Approve → Publish |
| 禁止 | 每族自建一套 UI 流程 · 绕过 revision |

**族路由（可不同 · 流程相同）：**

| 族 | Route | 编辑对象 |
|----|-------|----------|
| City Hero | `/admin/content/city-hero` | city · hero 图 |
| Hotel | `/admin/content/hotel-tiers` | tier · stock_image |
| Transport | `/admin/content/transport-region-rules` | region · stock |
| Listings | Provider / Acquisition Studio | listing · cover |

---

## 6 · Publish 流程（固定 · 禁止跳步）

```text
Brief Review
    ↓
Designer Upload / Replace
    ↓
CMS Review
    ↓
Approved
    ↓
Catalog Publish（catalog_content_revisions++）
    ↓
Verify
    ↓
Evidence
    ↓
Matrix PASS → Live
```

**POI 同级扩展（Content QA · 可选 country 闭包）：**

```text
… → Live → Content QA 六维 → LOCK（若纳入 country closure）
```

**禁止：** `upload_direct_to_live` · `skip_verify` · `mark_pass_without_evidence`

---

## 7 · Verify（统一原则）

| 原则 | 说明 |
|------|------|
| **每族独立 script** | `run-cms-content-l5-{family}-verify.cjs` |
| **输出统一 schema** | 见下 |
| **Registry 只收 PASS/FAIL** | 细节在 Evidence · 不进 Registry 字段 |

**Verify Evidence 统一格式：**

```json
{
  "schema": "traveltrust.cms_p1_family_verify.v1",
  "family": "city_hero",
  "matrix_id": "CH-JP-TOKYO-001",
  "TT_CMS_{FAMILY}_ROW_VERIFY": "PASS",
  "gate_result": "PASS",
  "checks": { "catalog": "PASS", "api": "PASS", "runtime": "PASS", "l5": "PASS" }
}
```

**Evidence 路径约定：**

```text
evidence/GO_cms_operation/{family}/CMS-{FAMILY}-VERIFY-LATEST.json
evidence/GO_cms_content_l5/{family}/rows/{matrix_id}.EVIDENCE.json
```

**Registry 更新规则：** 仅当族级 pack 输出 `TT_CMS_{FAMILY}_MODULE: FROZEN` 或全 denominator PASS。

---

## 8 · Frozen Exit Gate（六门 · 全部 P1 一致）

模块 **Pilot/Backlog → Frozen** 须 **六门全 PASS**：

| 门 | 含义 | Registry 关心 |
|----|------|---------------|
| **Catalog Ready** | Brief + Matrix ACTIVE · publish 可写 revision | ❌ 细节在 Evidence |
| **Runtime Ready** | API 可读 · 键字段正确 | ❌ |
| **Consumer Ready** | 页面/resolver 消费 CMS 源 | ❌ |
| **Verify PASS** | 族 verify script exit 0 | ✅ PASS/FAIL |
| **Evidence PASS** | evidence 文件齐全 | ✅ PASS/FAIL |
| **L5 PASS** | 无 external stock · geo/质量达标 | ✅ → `l5_pass=true` |

```text
六门全 PASS → Registry: Pilot → Frozen · l5_pass=true
任一 FAIL  → 保持 Pilot/Backlog · 不得 Frozen
```

**诚实边界：** Catalog empty · Admin 不存在 · Consumer 未接 → **不得 Frozen**。

---

## 9 · 新 P1 族开工 Checklist（复制模板）

每个族开做前勾选：

- [ ] Registry 模块行存在 · Business Critical = P1
- [ ] Ownership Matrix 行 + Edit Policy
- [ ] `cms-content-brief.v1.yaml` 增加 `asset_families.{id}`
- [ ] `{family}-matrix.v1.yaml` 创建 · scope lock 脚本
- [ ] Admin route + nav link
- [ ] Catalog ingest / publish API
- [ ] Frontend resolver + consumer surface
- [ ] Verify + Evidence + scaffold 脚本
- [ ] Wave-1 单行 pilot → Wave-2 确认 → 规模化
- [ ] 不重复 P0 十国 POI/Hero Evidence

---

## 10 · P1 路线图（顺序）

```text
① P1 Standard Review + Freeze          ✅
② City Hero Brief + Asset Matrix       ← 下一步（仅文档）
③ City Hero Runtime / Admin / …
④ Hotel → Transport → Listings
```

**Registry 下一步（Standard 完成后）：**

| 模块 | 下一步 |
|------|--------|
| City Hero | **Brief + Asset Matrix**（仅文档） |
| Hotel | 补齐 brief · 退出 Wave-1 单行 → 全 tier |
| Transport | 补齐 brief · 退出 Wave-1 单行 → 全国 |
| Listings | 规划 listing cover 结构 · Studio 对齐 |

---

## 11 · 交叉 SSOT

| 文档 | 角色 |
|------|------|
| [cms-master-registry.v1.yaml](../../registry/cms-master-registry.v1.yaml) | 模块状态 |
| [cms-ownership-matrix.v1.yaml](../../registry/cms-ownership-matrix.v1.yaml) | Owner + Edit Policy |
| [cms-content-brief.v1.yaml](../../data/catalog/cms-content-brief.v1.yaml) | 族定义 |
| [CMS-CITY-HERO-SSOT-VERIFICATION-LATEST.json](../../evidence/GO_cms_operation/CMS-CITY-HERO-SSOT-VERIFICATION-LATEST.json) | City Hero ≠ P0 Hero |
| [TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md](./TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md) | 单行 6 步模板（P0） |

---

*TT-CMS-P1-CONTENT-FAMILY-STANDARD v1.1.0 · FROZEN · 2026-07-07*
