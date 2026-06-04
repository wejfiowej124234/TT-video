# `/admin/provider-applications` — Admin 商家审核队列（①）

**阶段：** **① 本地**。**全链 SSOT：** [`/provider/register` README](../../provider/register/README.md)

## 页面职责（代码）

| 项 | 实现 |
|----|------|
| 本页 | **仅列表** — `page.tsx` · URL **`?status=`** 同步（默认 `submitted`）· `AdminQueueListPageChrome` · `data-tt-admin-queue-list=provider` · 链 **`/admin/users/[id]`** 审核 |
| 审核 UI | **`/admin/users/[id]`** 内嵌 **`AdminProviderApplicationReviewCard`**（`components/admin/AdminProviderApplicationReviewCard.tsx`） |
| 列表 API | `GET /api/v1/admin/provider-applications?status=` |
| 单用户快照 | `GET /api/v1/admin/users/:id/provider-application` |
| 审核 API | `PATCH /api/v1/admin/users/:id/provider-application-review`（body **`status`** · 可选 **`rejection_codes[]`** · **`rejection_message`**） |
| **① 读 SSOT** | **chain_off 内存** `provider_applications_by_user`（PG `role_applications` 双写） |

**驳回码（Admin FE 默认 `DOC_BLUR`）：** 经 **`providerRejectionCodes.ts`** 映射 i18n（`DOC_BLUR` · `LICENSE_INVALID` · `KYB_MISMATCH` 等）。

## 开发提权（① · 非生产）

烟测与本地 Admin：`SEED_TEST_ACCOUNTS=1` + `POST /auth/seed-test-accounts` body `{ "promote_admin_email": "…" }`（重复 promote 可能 **400**；脚本会重试注册 admin）。

## 验收

- **API 全链（含本页后端）：** `bash scripts/dev/smoke-provider-onboarding-local.sh`
- **浏览器 Admin UI：** 手工；无专用 Playwright（机读 **`data-testid="admin-provider-application-review"`** 在用户详情页）
