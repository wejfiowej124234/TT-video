# `/auth/register`

**UI 已收口锁死（2026-05-26 · ① 本地）** — 唯一 SSOT **[`AUTH-REGISTER-UI-FREEZE.md`](../../../evidence/GO_local_auth_l5/AUTH-REGISTER-UI-FREEZE.md)**。后续默认 **仅数据链路 / i18n / 实验**；**禁止**壳与 L5 视觉回流。

## 实现索引

| 块 | 路径 |
|----|------|
| 入口 | `page.tsx` → `RegisterPageMain.tsx` → `useRegisterPage.ts` |
| 游客/商家/主理人 | `RegisterTouristForm.tsx` |
| 向导 | `RegisterGuideForm.tsx` + `*Section.tsx` |
| L5 壳 | `registerBackgrounds.ts` · `AuthL5PageBackdrop` |
| 信任条 | `TrustGrowthMomentBanner` · `preferCollapsedSummary` · 实验 `register` v2 |

## 链路（允许演进 · 不改壳）

- `postRegister` · `registerApiCatch` · `safeInternalReturnPath` · `buildHeaderLoginHref` → `loginHref`
- P-GROW 实验权重/文案（**保持**默认折叠摘要）

## 商家入驻 step 1（`?role=provider` · ① 代码真源）

| 项 | 实现 |
|----|------|
| URL | **`/auth/register?role=provider`** — `ProviderOnboardingProgress` **step=1** |
| **`postRegister`** | **当前不传 `role`**；与 API **`registration_role_for_user_store`** 无关（注册后均为 **`traveler`** 直至后续开通） |
| 下一步 | **`/provider/register?step=1`** — 见 **[`/provider/register` README](../../provider/register/README.md)** |

**① API 全链烟测（含 step 2～5）：** `bash scripts/dev/smoke-provider-onboarding-local.sh`

## 提交前

```bash
cd frontend && npm run test -- authRegisterUiFreeze authRegisterL5 registerPage loginPageL5 authL5FullScore uiSystem --run
```

## 同族

| 路由 | UI 冻结 |
|------|---------|
| `/auth/login` | **是** — [AUTH-LOGIN-UI-FREEZE](../../../evidence/GO_local_auth_l5/AUTH-LOGIN-UI-FREEZE.md) |
| **`/auth/register`** | **是**（本页） |
| `/auth/forgot-password` 等 | **否** |
