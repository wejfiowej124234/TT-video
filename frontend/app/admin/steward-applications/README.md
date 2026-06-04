# `/admin/steward-applications` — Admin 区域主理人审核队列（①）

**阶段：** **① 本地**（与 [`/admin/provider-applications`](../provider-applications/README.md) 对称）

| 项 | 路径 |
|----|------|
| 列表 API | `GET /api/v1/admin/steward-applications?status=` |
| 单用户 | `GET /api/v1/admin/users/:id/steward-application` |
| 审核 API | `PATCH /api/v1/admin/users/:id/steward-application-review` |
| 审核 UI | **`/admin/users/[id]`** · **`AdminStewardApplicationReviewCard`** · **`data-testid="admin-steward-application-review"`** |

**状态枚举（SSOT）：** `stake_pending` · `under_review` · `approved` · `rejected`
