# TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE · CMS Phase 1 单行执行模板（固定 · 10 国复用）

**Version:** 1.0.0 · **生效：** 2026-07-05  
**阶段口径：** ① 本地 → ② Staging → ③ Production  
**本轮范围：** CMS Content L5 · Phase 1 · **禁止** 修改 Runtime / API / DB Schema / UI

**上级：** [TT-CMS-CONTENT-L5.md](./TT-CMS-CONTENT-L5.md) · [TT-CONTENT-OWNERSHIP-POLICY.md](./TT-CONTENT-OWNERSHIP-POLICY.md)

**用途：** 每一个 Matrix 行（如 `DA-JP-HOME` … `DA-CN-HOME`）**复用同一套 6 步流程** — **禁止** 按国别重新设计流程。

---

## 0 · 机读键

```text
TT_CMS_PHASE1_SINGLE_ASSET_TEMPLATE: ACTIVE
TT_CMS_PHASE1_SINGLE_ASSET_TEMPLATE_RUNBOOK: docs/runbook/TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md
TT_CMS_PHASE1_EVIDENCE_SCHEMA: traveltrust.cms_phase1_single_asset_evidence.v1
TT_CMS_PHASE1_EVIDENCE_TEMPLATE: data/catalog/templates/cms-phase1-single-asset-evidence.v1.json
TT_CMS_PHASE1_SCAFFOLD_SCRIPT: scripts/dev/scaffold-cms-phase1-single-asset-evidence.cjs
TT_CMS_PHASE1_DOD_SCRIPT: scripts/dev/run-cms-phase1-single-asset-dod.cjs
```

**开工前（每一行）：**

```bash
node scripts/dev/scaffold-cms-phase1-single-asset-evidence.cjs --matrix-id DA-XX-HOME
```

---

## 1 · 固定工作流（禁止跳步）

```text
Brief Review
    ↓
Designer Upload
    ↓
CMS Review
    ↓
Approved
    ↓
Catalog Publish
    ↓
Verify
    ↓
Evidence
    ↓
Matrix PASS
```

**禁止：**

| 禁止项 | 机读键 |
|--------|--------|
| Upload → Live | `upload_direct_to_live` |
| 跳过 Review | `skip_review` |
| 跳过 Verify | `skip_verify` |
| 批量上传后统一验收 | `batch_upload_then_accept` |
| 未生成 Evidence 即标记 PASS | `mark_pass_without_evidence` |

**国别顺序（Phase 1 · 逐行闭环后再下一行）：** JP → KR → TH → SG → FR → US → AU → ES → AE → CN

---

## 2 · Step 1 · Brief Review（设计确认）

**输入：** Matrix 行 + [cms-content-brief.v1.yaml](../../data/catalog/cms-content-brief.v1.yaml) · `destination_ambient`

**确认清单：**

| 项 | 来源 |
|----|------|
| Destination（国家/城市） | Matrix `country_iso` · `scene` |
| Business Theme（主题） | Matrix `scene` · Brief |
| Brand Tone（品牌风格） | Brief `brand_visual` |
| Composition（构图） | Brief · Matrix `surface` |
| Lighting（光线） | Brief `prefer` / `avoid` |
| 禁止元素 | 其他国家地标 · 水印 · Logo · AI 缺陷 · 图内大段文字 |

**输出（Matrix + Evidence）：**

```yaml
asset_lifecycle: draft
execution_gates.brief_review: PASS
```

---

## 3 · Step 2 · Designer Upload

**动作：** 上传 CMS 高质量原图 · 登记 **CMS Asset ID** · **不** Publish

**要求：**

- 原始高质量（≥1920×1080 · Hero 推荐 3840×2160 · >16KB）
- 格式 JPEG / WebP
- Matrix 填 `catalog_asset_id`（Admin 分配后）

**输出：**

```yaml
asset_lifecycle: review
```

Evidence · `step_2_designer_upload.status: COMPLETE`

---

## 4 · Step 3 · CMS Review

**审核维度：**

| 维度 | 机读 gate |
|------|-----------|
| 图片质量 | `cms_review` |
| Destination Authenticity | `destination_authenticity` |
| Brand Consistency | `brand_consistency` |
| WCAG 视觉 | （含于 cms_review 证据备注） |
| Consumer Experience | （含于 cms_review 证据备注） |
| 构图 · 色彩 | （含于 cms_review 证据备注） |
| Destination Ambient L5 符合性 | 全部通过后 `cms_review: PASS` |

**全部通过：**

```yaml
asset_lifecycle: approved
execution_gates.cms_review: PASS
execution_gates.destination_authenticity: PASS
execution_gates.brand_consistency: PASS
```

---

## 5 · Step 4 · Catalog Publish

**动作：** Admin Content Center → Publish（legacy 路由 `/admin/content/landing-ambient`）

**自动 / 必填记录（`asset_version` 块）：**

| 字段 | 说明 |
|------|------|
| `revision_number` | Catalog `catalog_countries.version` |
| `revision_label` | v1 / v2 / v3 |
| `published_by` | 发布 actor |
| `published_at_utc` | ISO-8601 UTC |
| `rollback_target_revision` | 上一 live revision · 回滚目标 |

**输出：**

```yaml
asset_lifecycle: published
execution_gates.catalog_publish: PASS
current_source: catalog_api   # Publish 后更新
```

---

## 6 · Step 5 · Verify

**命令：**

```bash
node scripts/dev/run-cms-content-l5-destination-ambient-verify.cjs --matrix-id DA-XX-HOME
# ② Staging：API=https://tt-api-staging.fly.dev node ... --matrix-id DA-XX-HOME
```

**验证面：**

| 面 | 检查 |
|----|------|
| Catalog | `asset_kind=landing_ambient` · country_iso |
| API | `/api/v1/catalog/media` |
| 字节 | HEAD · >16KB |
| MIME | image/jpeg · image/webp |
| 分辨率 | Brief 最小尺寸（人工 + 元数据） |
| L5 | 无 Unsplash/Pexels 长期 URL |
| Matrix | `asset_lifecycle` · `asset_version` · gates |

**全部 PASS 后（人工更新 Matrix）：**

```yaml
asset_lifecycle: live
execution_gates.verify: PASS
matrix_row_status: pass
```

Verify 脚本写入 Evidence · `step_5_verify` 段。

---

## 7 · Step 6 · Evidence

**产物：** `evidence/GO_cms_content_l5/destination-ambient/rows/<matrix_id>.EVIDENCE.json`

**须包含：**

| 段 | 内容 |
|----|------|
| **Review** | Step 1–3 门禁 · 审核备注 |
| **Publish** | Step 4 Admin 动作 · actor · 时间 |
| **Revision** | `asset_version` 全字段 |
| **Verify** | Step 5 checks · API/HEAD 结果 |
| **Matrix** | 行快照 · `execution_gates` |

**完成 Evidence：**

```yaml
execution_gates.evidence_complete: PASS
```

**DoD 终验：**

```bash
node scripts/dev/run-cms-phase1-single-asset-dod.cjs --matrix-id DA-XX-HOME
# 末行：TT_CMS_PHASE1_SINGLE_ASSET_ROW: COMPLETE
```

---

## 8 · Definition of Done（单行完成 · 全部满足）

| # | 条件 | Matrix / Evidence |
|---|------|-------------------|
| 1 | Brief Review PASS | `execution_gates.brief_review: PASS` |
| 2 | CMS Review PASS | `execution_gates.cms_review: PASS` |
| 3 | Destination Authenticity PASS | `execution_gates.destination_authenticity: PASS` |
| 4 | Brand Consistency PASS | `execution_gates.brand_consistency: PASS` |
| 5 | Catalog Publish PASS | `execution_gates.catalog_publish: PASS` |
| 6 | Verify PASS | `execution_gates.verify: PASS` · verify script exit 0 |
| 7 | Evidence Complete | `execution_gates.evidence_complete: PASS` · `.EVIDENCE.json` 存在 |
| 8 | Matrix Row PASS | `matrix_row_status: pass` |
| 9 | Lifecycle Live | `asset_lifecycle: live` |

**机读完成键：** `TT_CMS_PHASE1_SINGLE_ASSET_ROW: COMPLETE`

**10/10 族闭包后（单独闸）：** `TT_CMS_CONTENT_L5_DESTINATION_AMBIENT: CLOSED`

---

## 9 · Matrix 行字段速查（每一国相同）

```yaml
matrix_id: DA-XX-HOME
execution_order: <1-10>
asset_lifecycle: draft | review | approved | published | live | archived
matrix_row_status: pending | pass | fail
execution_gates:
  brief_review: null | PASS | FAIL
  cms_review: null | PASS | FAIL
  destination_authenticity: null | PASS | FAIL
  brand_consistency: null | PASS | FAIL
  catalog_publish: null | PASS | FAIL
  verify: null | PASS | FAIL
  evidence_complete: null | PASS | FAIL
asset_version:
  revision_number: ...
  revision_label: ...
  published_by: ...
  published_at_utc: ...
  rollback_target_revision: ...
catalog_asset_id: ...
public_url: ...
current_source: catalog_api
```

---

## 10 · Phase 1 三波试点（禁止批量 10 国）

**SSOT 联动：** [TT-CMS-CHANGE-POLICY.md](./TT-CMS-CHANGE-POLICY.md) §4 · Matrix `phase_1_pilot_discipline`

| 波次 | Matrix 行 | 完成标准 |
|------|-----------|----------|
| **Wave 1** | `DA-JP-HOME` | 完整单行闭环 Draft→Live · `TT_CMS_PHASE1_SINGLE_ASSET_ROW: COMPLETE` |
| **Wave 2** | `DA-KR-HOME` | 确认流程 **无需调整** · 同上 COMPLETE |
| **Wave 3+** | TH → … → CN | **仅** Wave 1+2 均 COMPLETE 后 · 逐行推进 |

**禁止：** 10 国批量上传 · 跳过 Wave 1/2 · 未 COMPLETE 即开 Wave 3

若 Wave 1/2 暴露 **Structural Change** 需求 → Architecture Review — **禁止** 带缺陷流程规模化。

---

## 11 · 诚实边界

- 本模板 **= Phase 1 流程 SSOT** · **≠** 已开始执行 · **≠** Production GO
- ① 本地 verify **≠** ② Staging 全链路已验 · ② **≠** ③ Production GO
- 改 API 字段名 `landing_ambient` **另立项** · PER 内不做

---

*TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE v1.0.0 · 固定模板 · 2026-07-05*
