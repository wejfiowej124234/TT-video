# TravelTrust Operations Workflow (TTOW)

**机读 SSOT：** [`registry/traveltrust-operations-workflow.v1.yaml`](../../registry/traveltrust-operations-workflow.v1.yaml)  
**运营平台：** [`TT-TRAVELTRUST-OPERATIONS-PLATFORM.md`](TT-TRAVELTRUST-OPERATIONS-PLATFORM.md)  
**数据治理：** [`TT-OFFICIAL-COLD-START-DATASET.md`](TT-OFFICIAL-COLD-START-DATASET.md) · DDG · SOPCP · OCIP

## 三层企业栈

| 层 | 回答问题 | SSOT |
|----|----------|------|
| **L1 数据治理** | 数据该怎么管理？ | DDG · SOPCP · OCIP · OCS |
| **L2 运营平台** | 谁来运营？ | [`traveltrust-operations-platform.v1.yaml`](../../registry/traveltrust-operations-platform.v1.yaml) |
| **L3 运营流程** | 运营怎么做？ | **本 runbook + workflow registry** |

```text
Official Dataset → Identity → Public Catalog     （L1）
        ↓
Content · Catalog · Campaign · …                 （L2）
        ↓
Draft → Review → Publish → … → Archive         （L3）
```

**原则：** Admin 不是裸 CRUD；每个 Operations Domain 有 **Workflow 生命周期**。

## 六域 Workflow 速查

### Content Operations

```text
Draft → Review → Published → Archived
```

- 管：背景、Banner、Hero、文案、POI 图、官方攻略**正文**
- 实现：`publish_status` · `/admin/content/*` · C-S1 状态机

### Catalog Operations

```text
Draft → [Review] → Publish Queue → Published → Surface → Featured → Online → Retire
```

- 管：Guide / Provider / Acquisition / Official Guide **发布与展示**
- 实现：`display_status` · `display_surfaces` · `/admin/official/public-operations`
- 政策：**SOPCP**（唯一 Public Catalog）· **OCIP**（UUID 不变，Retire = unpublish 不删库）

### Campaign Operations

```text
Planning → Editing → Review → Deploy → Running → Completed → Archive
```

- 实现：`publish_status` + `status(deployed)` · `/admin/official/cold-start`

### Moderation Operations

```text
Submitted → Triage → In Review → Decision → Actioned → Closed
                                              ↘ Appealed → In Review
```

- 入驻审核、举报、违规、申诉

### Business Operations

```text
Onboarding → Active ⇄ Dispute Open → Resolved · Suspended → Offboarded
```

- 商家/向导/收购**业务走廊**（订单、争议）— 与 Moderation **分域**

### Analytics & Growth

```text
Planning → Configured → Running → Measuring → Completed → Archived
```

## 跨域实体流（Guide 示例）

运营「东京向导」**不是**「新增 Guide」，而是：

```text
OCIP 身份（tokyo-photo-guide · 固定 UUID）
  → Content：更新简介/头像（mutable）
  → Catalog：Publish Queue → Surface → Featured
  → Campaign：item_ref 引用同一 UUID
  → Analytics：衡量曝光与转化
```

## Evidence / Runbook 纪律

- 证据与验收 **引用 Workflow 状态名**，不写裸「创建了 X」
- OCS apply → `catalog_operations: published` + `campaign_operations: deploy`
- DDG → `catalog_operations: online` vs test `hidden`
- 新手册与 sign-off **必须**链接本 registry

## Workflow Validation（执行，不再新增 Registry）

用 live API 证明状态机跑通 — 不是再写一层抽象。

```bash
API=https://tt-api-staging.fly.dev \
STATE=evidence/GO_official_cold_start_dataset/20260703T044855Z/state.json \
OUT=evidence/GO_operations_workflow_validation/<UTC>/workflow-validation.json \
node scripts/dev/validate-operations-workflow.cjs
```

只读快检（不改 Staging 数据）：`SKIP_MUTATIONS=1`

**每步验证：** API 状态码 · `state_after` 字段 · 非法跳状态拒绝 · audit/history · 时间戳 · UI 路由目录 · RBAC 权限名（SuperAdmin 路径；六角色矩阵见 ADM-U01）

| 域 | 走通的转换 |
|----|------------|
| Content | draft → review → published → archived（非法 draft→published 由 API 拒绝） |
| Catalog | unpublish → illegal featured blocked → publish → surfaces → featured → public visible → restore |
| Campaign | create → illegal deploy blocked → review → deploy → rollback → archive |
| Moderation | reports list → in_review → dismissed（或 state catalog 只读） |
| Business | disputes/orders corridor read + dispute state samples |

**FSM 约束（API 层，2026-07-03）：**
- Content `publish` 仅允许 `in_review → published`（`invalid_status_transition`）
- Catalog `featured=true` 仅允许 `display_status=published`（`featured_requires_published`）

单元快检：`node scripts/dev/test-operations-workflow-fsm-unit.cjs`

**最近验证：** `PASS` · `20260703T064100Z` · `evidence/GO_operations_workflow_validation/20260703T064100Z/workflow-validation.json`

证据目录：`evidence/GO_operations_workflow_validation/<UTC>/`
