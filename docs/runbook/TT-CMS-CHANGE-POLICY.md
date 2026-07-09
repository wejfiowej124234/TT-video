# TT-CMS-CHANGE-POLICY · CMS 内容变更策略

**Version:** 1.0.0 · **生效：** 2026-07-05  
**阶段口径：** ① 本地 → ② Staging → ③ Production  
**状态：** **ACTIVE** — 与 CMS Content L5 Baseline 同批冻结

**上级：** [TT-CMS-CONTENT-L5.md](./TT-CMS-CONTENT-L5.md) · [TT-CONTENT-OWNERSHIP-POLICY.md](./TT-CONTENT-OWNERSHIP-POLICY.md) · [TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md](./TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md)

**一句话：** 规定 **什么时候可以改内容** — 运营 **只能换图**；**不能** 改治理结构。

---

## 0 · 机读键

```text
TT_CMS_CHANGE_POLICY: ACTIVE
TT_CMS_CHANGE_POLICY_RUNBOOK: docs/runbook/TT-CMS-CHANGE-POLICY.md
TT_CMS_CHANGE_TYPE_ENUM: content_fix,content_refresh,structural_change
TT_CMS_CONTENT_HEALTH_SCORE_SCRIPT: scripts/dev/run-cms-content-health-score.cjs
TT_CMS_CONTENT_HEALTH_SCORE_LATEST: evidence/GO_cms_content_l5/CMS-CONTENT-HEALTH-SCORE-LATEST.json
```

---

## 1 · 三种变更类型（写死）

| 类型 | 机读键 | 普通运营 | 流程 |
|------|--------|----------|------|
| **Content Fix** | `content_fix` | ✅ 允许 | Review → Publish → Verify → Evidence |
| **Content Refresh** | `content_refresh` | ✅ 允许 | **新 Revision** · **不覆盖**历史版本 → Verify → Evidence |
| **Structural Change** | `structural_change` | ❌ **禁止** | **必须 Architecture Review** |

### 1.1 Content Fix（内容修正）

**适用：**

- 错图 · 错国家 · 构图不符 Brief
- 版权 / 合规问题 · 水印残留
- WCAG / 消费体验缺陷

**流程（缩短版单行模板 · 仍禁止 upload→live）：**

```text
CMS Review（确认 fix 类型）
    ↓
Catalog Publish（新 revision · 填 rollback_target）
    ↓
Verify
    ↓
Evidence（标注 change_type: content_fix）
```

**禁止：** 借 Fix 之名改 Matrix 结构 · 改 lifecycle 枚举 · 增删 asset 族。

### 1.2 Content Refresh（内容刷新）

**适用：**

- 季度视觉更新 · 节日 / 活动氛围
- 品牌升级（仍须 Brief `brand_visual` 对齐）
- A/B 轮换（保留旧 revision 可回滚）

**纪律：**

- **必须** `catalog_content_revisions` **追加** revision — **禁止** 覆盖删除历史
- 旧 live 版本 → `asset_lifecycle: archived`（Matrix 同步）
- `rollback_target_revision` 指向上一 live

**流程：**

```text
Brief delta 确认（可选 · 大刷新时）
    ↓
Designer Upload → CMS Review → Approved
    ↓
Catalog Publish（revision_number++）
    ↓
Verify → Evidence（change_type: content_refresh）
```

### 1.3 Structural Change（结构变更）

**适用（示例 · 普通运营不可自批）：**

- 新增 Asset 类型 / Matrix 文件 / 新 `asset_kind`
- 修改 Matrix 列结构 · lifecycle 枚举 · execution_gates
- 改 Verify 脚本契约 · Registry schema · Runbook 治理层级
- API / DB Schema / Admin 路由重命名

**流程：**

```text
Architecture Review（Owner + 工程）
    ↓
ADR / Runbook / Registry 同批
    ↓
Baseline pack + Health Score 回归
    ↓
（可选）Phase 1 试点行验证
```

**禁止：** 运营在 Admin 内「顺手」改 YAML · Registry · 脚本。

---

## 2 · 角色边界

| 角色 | Content Fix | Content Refresh | Structural Change |
|------|-------------|-----------------|-------------------|
| 设计 | 供稿 | 供稿 | 需求输入 |
| 运营 | Review · Publish | Review · Publish | ❌ |
| Content Owner | 审批 Fix | 审批 Refresh | 发起 AR |
| 工程 | Verify 支持 | Verify 支持 | **唯一** 实施结构变更 |

---

## 3 · Evidence 标注（机读）

每一行 `.EVIDENCE.json` 在变更时应填：

```json
"change_record": {
  "change_type": "content_fix | content_refresh | initial_publish | structural_change",
  "change_reason": "...",
  "previous_revision": 6,
  "new_revision": 7,
  "approved_by": "..."
}
```

`initial_publish` = Phase 1 首次 live（非 Fix/Refresh）。

---

## 4 · Phase 1 试点纪律（与变更策略联动）

**禁止** 10 国批量上传。固定三波：

| 波次 | Matrix 行 | 目的 |
|------|-----------|------|
| **Wave 1** | `DA-JP-HOME` | 完整单行闭环 Draft→Live · 验证流程 |
| **Wave 2** | `DA-KR-HOME` | 第二国 · 确认流程无需调整 |
| **Wave 3+** | TH → … → CN | **仅** Wave 1+2 均 `COMPLETE` 后 · 逐行推进 |

若 Wave 1/2 暴露流程缺陷 → 走 **Structural Change** 闸（Architecture Review）— **禁止** 带着错误流程批量发布。

详见 Matrix `phase_1_pilot_discipline` · [TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md](./TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md) §11。

---

## 5 · CMS Content Health Score（全局 KPI）

**脚本：**

```bash
node scripts/dev/run-cms-content-health-score.cjs
# 可选：--stamp 20260705T010000Z
```

**指标：**

| 指标 | 含义 |
|------|------|
| **Live Assets** | `asset_lifecycle=live` / Matrix 总行数 |
| **Review SLA** | review 态行 · 未超 SLA 占比 |
| **Verify Pass Rate** | Evidence 中 verify PASS / 有 verify 记录行 |
| **Revision Rollback Success** | live 行具备 `rollback_target_revision` 占比 |
| **Evidence Completeness** | live 行 `TT_CMS_PHASE1_SINGLE_ASSET_ROW=COMPLETE` 占比 |
| **Overall** | `BASELINE_ESTABLISHED` · `IN_PROGRESS` · `HEALTHY` · `DEGRADED` |

**Phase 0 示例（当前）：**

| 指标 | 值 |
|------|-----|
| Live Assets | 0/10 |
| Review SLA | 100% |
| Verify Pass Rate | 100% |
| Evidence Completeness | 100% |
| Rollback Readiness | 100% |
| **Overall** | **BASELINE ESTABLISHED** |

JP/KR 逐步 live 后，Score **自动**随 Matrix + Evidence 更新。

**产物：** `evidence/GO_cms_content_l5/CMS-CONTENT-HEALTH-SCORE-LATEST.json`

---

## 6 · 诚实边界

- 本策略 **≠** Production GO · **≠** 已执行 Phase 1
- Content Fix/Refresh **仍须** Catalog Revision — **禁止** 直链改生产读面绕过 Publish
- Structural Change **不**因 PER 紧急而默认豁免

---

*TT-CMS-CHANGE-POLICY v1.0.0 · CMS 内容变更策略 · 2026-07-05*
