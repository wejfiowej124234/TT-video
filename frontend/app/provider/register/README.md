# 商家入驻（① 本地 · 代码真源）

**阶段：** **① 本地**（Docker / 本机 API + PG）。**② 测试网** / **③ 公网·生产** 见 [TT-9618](../../../../docs/runbook/TT-9618-onboarding-local-testnet.md) 与 [go-live-checklist](../../../../docs/go-live-checklist.md)；**不**以本文冒充 **②③** 已验收。

**UI 冻结：** [PROVIDER-REGISTER-UI-FREEZE.md](../../../evidence/GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md)

---

## 1. 产品链路（五步 · 与实现对拍）

| 步 | 用户路径 | 前端入口（代码） | 后端 / 数据 |
|----|----------|------------------|-------------|
| 1 | 注册商家意向 | `/auth/register?role=provider` → `RegisterPageMain`（`ProviderOnboardingProgress` step=1） | `POST /auth/register`；**`role=provider` 请求体在实现中落库为 `traveler`**（`registration_role_for_user_store`，见 `chain_off/auth.rs`） |
| 2 | 三步资质 + 钱包 | `/provider/register?step=1\|2\|3` → `useProviderRegisterPage` | 钱包：`POST …/me/wallet/verify/challenge` + `confirm`；提交：`POST /api/v1/provider-applications` |
| 3 | 准入费（96-18） | `/me/onboarding?role=provider`（**路由文件** `app/me/onboarding/page.tsx`） | `GET …/onboarding/quote` → `POST …/payment-intents` → 内网 webhook **`paid`** → `POST …/role-confirm` |
| 4 | Admin 审核 | **`/admin/provider-applications`**（列表 · **`status` 筛选**）→ **`/admin/users/[id]`**（**`AdminProviderApplicationReviewCard`** · **`data-testid="admin-provider-application-review"`**） | **`GET …/admin/provider-applications`** · **`GET …/admin/users/:id/provider-application`** · **`PATCH …/provider-application-review`** |
| 5 | 发橱窗 | `/market/provider` | `POST /api/v1/market/provider/listings`（三门闸，见 §5） |

**推荐顺序（① 烟测同源）：** 2 提交资质 → 3 准入费 → 4 审核 → 5 发布。步骤 3 与 4 **可并行**；**发橱窗**须 **paid + approved + role=provider** 齐备。

---

## 2. 前端代码地图

| 模块 | 路径 | 职责 |
|------|------|------|
| 注册 step1 | `app/auth/register/page.tsx` · `registerPageModel.ts` | `?role=provider` 解析；**`postRegister` 当前不传 `role`**（与 smoke 不同，见 §6） |
| 资质 step2 | `app/provider/register/*` | `page.tsx` → **`GuideRegisterRouteSuspense`** · **`ProviderRegisterPageMain`**（内联 **`ProviderRegisterDonePanel`**）· `useProviderRegisterPage` · `providerRegisterSubmitFlow` · `providerRegisterValidation` · **`layout.tsx`** metadata（`providerRegister_meta_*`） |
| 准入页（step 3） | `app/me/onboarding/page.tsx` | **`?role=provider`** · **`useMeOnboardingPage`** 读 URL；Console L5 见 [me/onboarding README](../../me/onboarding/README.md) |
| Admin step4 | `app/admin/provider-applications/page.tsx` | 见 [`admin/provider-applications/README.md`](../../admin/provider-applications/README.md) |
| 橱窗 step5 | `app/market/provider/*` | 见 [`market/provider/README.md`](../../market/provider/README.md) |

### 2.1 `/provider/register` 三步（FE 校验 · `providerRegisterValidation.ts`）

| Step | URL | 主要字段 / 动作 |
|------|-----|-----------------|
| **1** | `?step=1` | 法人名 · 主体类型（company/individual）· 注册号 · 营业执照 · **钱包地址 + EIP-191 验证**（`useGuideRegisterWalletVerify`） |
| **2** | `?step=2` | 十国 **`country_code`** + 预设 **`city`** · 注册/经营地址 · **CN/TH 旅行社许可证** · 联系人姓名/电话/邮箱 |
| **3** | `?step=3` | **`shop_name`** · **`categories`** / **`bio`**（可选）· 企业 **UBO**（`beneficial_owners[]`）或个体 **`legal_representative_id`** · 隐私同意 → **`runProviderRegisterSubmitFlow`**（**`uploadPhase`**: `uploading` → `submitting`）→ 证照 **`postGuideUploadDoc`**（复用向导 upload-doc；**`compressGuideRegisterImageFile`**）→ **`POST …/provider-applications`**（含可选 **`tax_id`** · **`insurance_url`**）→ **完成面板** 链 **`/me/onboarding?role=provider`** |

**门态面板（同页 · 优先于表单）：** `ProviderRegisterRejectedGate` · `ProviderRegisterPendingPanel` · `ProviderRegisterAlreadyPanel`（读 **`GET …/me/provider-application`** + **`GET /me` role/trust**；驳回码经 **`providerRejectionCodes.ts`** 映射 i18n）。**未登录：** **`GuideRegisterLoginGate`**（`loginReturnUrl` 保留 query）。

**提交成功后：** **`ProviderRegisterPageMain.tsx`** 内联 **`ProviderRegisterDonePanel`**（step3 进度条 + 链 **`/me/onboarding?role=provider`** · 可选 **`/staking`**）。

**草稿：** 本地 **`providerRegisterDraft`** + 登录后 debounce **`PUT …/me/provider-registration-draft`**（**无**文件 base64）；服务端草稿与本地合并 hydrate。

### 2.2 后端与共享库

| 模块 | 路径 | 职责 |
|------|------|------|
| KYB 规则（FE） | `lib/provider/providerKybRules.ts` | 与 `crates/api/src/chain_off/provider_kyb.rs` 对拍 |
| L5 token / 机读壳 | `lib/provider/providerRegisterL5.ts` | **`TT_PROVIDER_REGISTER_L5`** · **`data-tt-provider-register-page`** · **`data-tt-provider-register-l5`** |
| 驳回码 i18n | `lib/provider/providerRejectionCodes.ts` | Admin 驳回 **`rejection_codes[]`** → **`providerRegister_rejection_*`** 键 |
| 进度条（step 1–2） | `components/provider/ProviderOnboardingProgress.tsx` | register step1 · **`/provider/register`** step2 · DonePanel step3 展示 |
| API 客户端 | `lib/apiClient/providerApplications.ts` · `onboarding.ts` · `adminProviderApplication.ts` | 申请 / 准入费 / Admin |
| 钱包验证 | `app/guide/register/useGuideRegisterWalletVerify.ts` | 商家注册复用向导钱包流 |
| 草稿 | `lib/provider/providerRegisterDraft.ts` · `providerRegisterServerDraft.ts` | 本地 + `GET/PUT …/me/provider-registration-draft` |
| 发布资格提示 | `lib/provider/merchantPublishEligibility.ts` | **仅** role + 申请态；**不含** paid entitlement（与 API 门闸不同） |
| 准入页组件 | `MeOnboardingPageMain.tsx` · `useMeOnboardingPage.ts` | Console L5 · **`MeOnboardingConsoleProgress`** step=3 |

**Vitest（①）：** `lib/provider/providerRegisterValidation.test.ts` · `providerRegisterL5.contract.test.ts`

### 2.3 后端 Rust 模块（① · 与 FE 对拍）

| 模块 | 路径 | 职责 |
|------|------|------|
| 资质 HTTP | `crates/api/src/routes/provider_applications.rs` | **`POST /api/v1/provider-applications`** |
| KYB 逻辑 | `crates/api/src/chain_off/provider_application.rs` | 内存 **`provider_applications_by_user`** · 提交校验 · Admin 列表/审核 impl |
| KYB 规则 | `crates/api/src/chain_off/provider_kyb.rs` | **`entity_type`** · CN/TH 许可证 · UBO · 地址 |
| Admin HTTP | `crates/api/src/routes/admin/admin_provider_application_http.rs` | **`GET …/admin/provider-applications`** · **`PATCH …/provider-application-review`** |
| PG 双写 | `crates/api/src/db/role_identity/` | **`role_applications`** kind=`provider_onboarding` |
| 内存 role 同步 | `crates/api/src/chain_off/user_role.rs` | **`sync_user_role_in_memory_when_pg_matches`**（role-confirm / approve 后） |
| 市场三门闸 | `crates/api/src/routes/market_merchant_gate.rs` | **`ensure_provider_market_write_allowed`** |
| **`GET /me` trust** | `crates/api/src/chain_off/me.rs` | **`provider_registration_status`** · rejection codes/message |

### 2.4 Admin 审核（step 4 · 列表 vs 审核分离）

| 页面 | 路径 | 职责 |
|------|------|------|
| 队列列表 | `app/admin/provider-applications/page.tsx` | **`GET …/admin/provider-applications?status=`** · 链用户详情 |
| 审核卡片 | `components/admin/AdminProviderApplicationReviewCard.tsx` on **`app/admin/users/[id]/page.tsx`** | **`GET …/admin/users/:id/provider-application`** · **`PATCH …/provider-application-review`** · **`data-testid="admin-provider-application-review"`** |

---

## 3. 后端 API 与真源分层（Phase A · ①）

| 能力 | 路径 | **① 读/写真源** | PG 双写 |
|------|------|----------------|---------|
| 资质申请 | `POST /api/v1/provider-applications` | **chain_off 内存** `provider_applications_by_user` | `role_applications` kind=`provider_onboarding`（`db/role_identity`） |
| 我的申请 | `GET /api/v1/me/provider-application` | **内存**（已是 `provider` 时返回 synthetic approved） | — |
| Admin 列表/审核 | `GET …/admin/provider-applications` · `PATCH …/provider-application-review` | **内存** 申请单；**approve** 同时写内存 `users.role=provider` | `role_applications` + `update_user_role_if_safe` |
| 准入费 | `…/onboarding/*` | **PG** `onboarding_entitlements` / events | — |
| **`GET /api/v1/me`** | — | **`user.role` = chain_off 内存** | 登录/session 可落 PG |
| **role-confirm 后** | `POST …/onboarding/role-confirm` | PG 写 role 后 **`sync_user_role_in_memory_when_pg_matches`**（`chain_off/user_role.rs`）对齐内存 | ✓ |
| **市场发布门闸** | `POST …/market/provider/listings` | **PG** 查 role + entitlement + `role_applications`；内存申请可作 approved 旁路 | ✓ |

**Admin 开发提权（仅 ①）：** `POST /auth/seed-test-accounts` body `{ "promote_admin_email": "…" }`，须 `SEED_TEST_ACCOUNTS=1`（`seed_promote_user_to_admin_if_enabled`）。

---

## 4. KYB 字段（与 `provider_kyb.rs` 一致）

| 项 | 规则 |
|----|------|
| `entity_type` | `company` \| `individual` |
| **CN / TH** | `travel_agency_permit_url` **必填** |
| **company** | `beneficial_owners[]` ≥1；每项 `full_name` · `id_type`（`passport`/`national_id`）· `id_number` · **`id_doc_url`** |
| **individual** | `legal_representative_id_url` **必填**（无 UBO） |
| 地址 | `registered_address` 必填；`operating_same_as_registered` 或 `operating_address` |
| 提交硬闸 | `business_license_url` · 有效 `wallet_address` · `shop_name` 等（`provider_application.rs`） |
| 提交 API 错误码（FE 映射） | **`provider_application_pending`** · **`provider_application_already_provider`** · **`provider_application_travel_agency_permit_required`** · **`provider_application_beneficial_owners_required`** · **`provider_application_legal_representative_id_required`** |
| 证照上传 | **`providerRegisterSubmitFlow`** → **`postGuideUploadDoc`**（`content_base64` + `filename`）→ URL 写入申请体 |
| 可选 env | `TRAVELTRUST_PROVIDER_REQUIRE_EMAIL_VERIFIED=1` → PG `email_verified_at` |

---

## 5. 市场发布三门闸（`market_merchant_gate.rs`）

`POST /api/v1/market/provider/listings` 与 **`…/listings/drafts`** 须同时满足：

1. **PG** `users.role = provider`
2. **PG** `onboarding_entitlements` 存在 **`status=paid`** 且 **`role_target=provider`**
3. **PG** `role_applications`（`kind=provider_onboarding`, `status=approved`）**或** **内存** 申请 `status=approved`

错误码：**403** **`merchant_role_required`** · **`provider_application_not_approved`**；**400** **`onboarding_entitlement_required`**（**`market_merchant_gate.rs`** 与 **role-confirm** 同源键名，HTTP 语义按路由）

---

## 6. 环境变量（商家路径相关）

| 变量 | 作用 |
|------|------|
| `DATABASE_URL` | 准入费、双写、市场门闸（PG） |
| `INTERNAL_API_SECRET` | `POST /api/v1/internal/onboarding/payments/webhook` |
| `SEED_TEST_ACCOUNTS=1` | 测试账号 + Admin `promote_admin_email` |
| `STRICT_SESSION_GATE=1` | 须 `/auth/login` + Bearer；否则钱包 challenge **401** |
| `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` | 合并本地 onboarding 辅助路由 |
| `NEXT_PUBLIC_ONBOARDING_LOCAL_DEV_TOOLS=1` | 准入页「模拟已付」按钮（若 UI 暴露） |
| `TRAVELTRUST_PROVIDER_REQUIRE_EMAIL_VERIFIED=1` | 提交资质前须邮箱已验证 |
| `ONBOARDING_WEBHOOK_HMAC_SECRET` 等 | 见 [TT-9618 §1](../../../../docs/runbook/TT-9618-onboarding-local-testnet.md) |

---

## 7. ① 本地 API 全链烟测

```bash
bash scripts/dev/smoke-provider-onboarding-local.sh
# Windows: scripts\smoke-provider-onboarding-local.bat
```

**覆盖：** 注册 → 钱包 → 资质 → quote → payment-intent → 内网 webhook → entitlements paid → role-confirm → **`GET /me` role=provider（内存同步）** → Admin seed 提权 → 审核 → **POST/GET market listings**。

**前置：** API `/health` 200 · `DATABASE_URL` · `INTERNAL_API_SECRET`（可读 `.env`）· `SEED_TEST_ACCOUNTS=1` · API 二进制含 seed promote 能力。

**跳过：** `SMOKE_SKIP_ONBOARDING=1` · `SMOKE_SKIP_MARKET=1` · `SMOKE_SKIP_DOCKER_ADMIN=1`

---

## 8. 文档互指（多维）

| 维度 | 文档 |
|------|------|
| HTTP 契约 | [04 §3.4 · 商家入驻](../../../../docs/spec/04-后端与API.md) |
| 准入费 HTTP | [04-附录 · 96-18](../../../../docs/spec/04-附录-商家主理人准入费HTTP契约草案-配96-18.md) |
| 身份 / 槽位 | [96-17 §0.3.3 商家行](../../../../docs/spec/96-17-多重身份与钱包真值.md) · [identity-unified-model §3.3](../../../../docs/spec/artifacts/identity-unified-model.v1.md) |
| 页身 / UX（非五主） | [88 §1.2 商家入驻](../../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) · [13-1 表 1 Identity 行](../../../../docs/spec/13-1-UI产品级SSOT与页面规范.md) |
| 市场 listing | [94 · F-021](../../../../docs/spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md) |
| 产品角色 | [87 · provider/Shop](../../../../docs/spec/87-TravelTrust-角色体系技术文档-融合架构版.md) |
| 前端索引 | [`app/provider/README.md`](../README.md) |
| 本地烟测基线 | [dev-local-smoke-baseline §8](../../../../docs/dev-local-smoke-baseline.md) |
| 回归矩阵 | [93 §2.1 · B-MKT-004/005](../../../../docs/spec/93-全站功能验证矩阵-域别回归清单.md) · [70 §3 商家域](../../../../docs/spec/70-管理员系统开发文档.md) |
| 页面矩阵 | [96-20 §5.5/§5.6](../../../../docs/spec/96-20-前后端页面对齐与UI生产级审计报告.md) |
| 代码映射 | [62-补充 §4.5](../../../../docs/spec/code-maps/62-补充-05-剩余路由域逐文件代码映射-20260306.md) |
| handbook | [21-B 市场 listing 前置](../../../../docs/handbook/engineering/21-B-市场与托管机制.md) · [40-D Admin KYB 队列](../../../../docs/handbook/engineering/40-D-Admin机制.md) |
| 05 注册映射 | [05-补充 · auth-register-four-roles](../../../../docs/spec/code-maps/05-补充-前端实现细节与代码映射-20260306.md#auth-register-four-roles) |
| 前端总览 | [05 §九 · provider/register](../../../../docs/spec/05-前端总览.md) |
| 验收 / 走查 | [33 §二 商家行](../../../../docs/spec/33-前端页面实现顺序与验收清单.md) · [96-13 商家入驻行](../../../../docs/spec/96-13-UI-UX-i18n-a11y-性能走查.md) |
| 96-18 准入费设计 | [96-18](../../../../docs/spec/96-18-商家与主理人准入费用与治理币兑换设计.md) · [96-18-未完成 §0](../../../../docs/spec/96-18-未完成清单与多维检查.md#9618-one-page-priority) |
| 全页面矩阵 | [96-16 §0 商家全链行](../../../../docs/spec/96-16-全页面UI-UX优化方案总册.md) |
| Runbook / 金路径 | [TT-9618 §2.1](../../../../docs/runbook/TT-9618-onboarding-local-testnet.md) · [TT-9625 商家行](../../../../docs/runbook/TT-9625-golden-path-system-spine.md) · [PHASE1_5 §1 商铺行](../../../../docs/runbook/PHASE1_5-DATA-LINK-MODEL-GATE.md) |
| 索引 / 协作 | [spec/00 读前摘要](../../../../docs/spec/00-文档索引.md) · [96-索引](../../../../docs/spec/96-索引-全链路外生产验收分册.md) · [AI协作话术 §0.3a](../../../../docs/AI协作话术-减负与边界.md#ai-collab-provider-onboarding-doc-only) |
| 发版 / 贡献 | [95 §8.2 · B-MKT 编号防混读](../../../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md) · [CONTRIBUTING · 商家链烟测](../../../../CONTRIBUTING.md) · [solo-dev-rhythm §6.5](../../../../docs/solo-dev-rhythm.md) |
| 模块化审计 | [46 · provider/register 行](../../../../docs/spec/46-模块化审计与拆分登记表.md) |
| **③ 另闸** | [go-live-checklist · 商家注脚](../../../../docs/go-live-checklist.md)（**不**以 ① 烟测冒充 Production GO） |

---

## 9. 已知实现注意（① · 非 ②③ 缺口）

- **浏览器 MetaMask：** 须先登录（`STRICT_SESSION_GATE`）；challenge 失败时**不会弹签名**。
- **注册 UI 与 smoke：** UI `postRegister` **不传** `role`；smoke 传 `role=provider`；**二者均落库 `traveler`** 直至 role-confirm 或 Admin approve。
- **Admin 列表：** 读 **内存** 队列；与 PG `role_applications` 可能短暂不一致（双写失败仅日志，不阻断 ① 内存路径）。
- **Admin 审核 UX：** **`/admin/provider-applications`** 仅列表；**`PATCH …/provider-application-review`** 在 **`/admin/users/[id]`** · **`AdminProviderApplicationReviewCard`**。
- **烟测 **`seed-test-accounts`：** 重复 **`promote_admin_email`** 可能 **400**；脚本会注册新 admin 后重试（非失败）。
- **Playwright UI 全链：** 无专用 `/provider/register` E2E；API 烟测见 §7。
