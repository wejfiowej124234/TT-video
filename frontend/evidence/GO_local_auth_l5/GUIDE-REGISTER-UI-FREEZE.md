# `/guide/register` · ① 本地 UI 收口锁死（2026-05-26 · L5 暖金暗玻璃 · 硬闸）

**阶段：① 本地** — 向导申请页为 **UI SSOT**；**不**表示 ② 测试网、③ 生产 GO。

**互指：** [ME-IDENTITIES-UI-FREEZE](./ME-IDENTITIES-UI-FREEZE.md) · [AUTH-REGISTER-UI-FREEZE](./AUTH-REGISTER-UI-FREEZE.md) · [HEADER-UTILITY-MENU-L5-FREEZE](./HEADER-UTILITY-MENU-L5-FREEZE.md) · [GUIDE-ONBOARDING-STAKING-FLOW](../../lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md)

---

## 收口结论

| 项 | 状态 |
|----|------|
| **路由** | `/guide/register`（`?returnUrl=` · `?step=1\|2\|3`） |
| **视觉族** | Auth L5 · `data-tt-auth-visual="l5"` · `data-tt-guide-register-ui-frozen="1"` |
| **结构** | 三步：身份与证件 → 服务范围 → 确认提交 |
| **信任条** | `TrustGrowthMomentBanner` · `moment="guide_apply"` · `preferCollapsedSummary` |
| **① 完成度** | **100%（本地可验）** — 见下表；**不含** ② 测试网全链、③ 生产 GO |
| **机读** | `guideRegisterUiFreeze` + `guideRegisterL5` + `guideRegisterL5Complete` + `guideRegisterValidation` **绿集必过** |

### ① 本地 100% 能力清单（审计收口）

| 能力 | 实现要点 |
|------|----------|
| 登录门闸 / 预检态 | `GET /me` → pending / rejected / suspended / active |
| 拒绝后重申请 | `POST /guides` resubmit + `GuideRegisterRejectedGate` |
| 钱包签名验证 | `GuideRegisterWalletStepFlow`（连接→地址→签名）+ API `POST /me/wallet/verify/*`（chain_off 内存或 PG） |
| 首屏信息密度 | `GuideRegisterContextBanners` 折叠合并信任条/KYC/说明 |
| 证件压缩 | `compressGuideRegisterImageFile` 压至 ≤800KB |
| KYC 提示/阻断 | `GuideRegisterKycBanner` · `NEXT_PUBLIC_GUIDE_REGISTER_REQUIRE_KYC=1` 或 `REQUIRE_KYC_FOR_GUIDE=1` |
| 草稿双写 | session `traveltrust_guide_register_draft_v1` + `GET/PUT /api/v1/me/guide-registration-draft` |
| 注册页证件 URL | `/auth/register?role=guide` 上传后 `idPhotoUrl` / `languageCertUrl` 写入 pending |
| 字段级错误 | `fieldInlineError` + `GuideRegisterInlineFieldError` |
| 拒绝码人话 | `guideRejectionCodes.ts` |
| 文件预览 | `GuideRegisterFileField` blob 预览 |
| 上传阶段 UX | `uploadPhase` uploading → submitting |

**默认禁止：** 原生 checkbox、Console 浅壳、`ProductCrossNav` 页内主导航、单页无分步回流。

---

## ① 机读绿集

```bash
cd frontend
npm run test -- guideRegisterUiFreeze guideRegisterL5 guideRegisterL5Complete guideRegisterPage guideRegisterValidation --run
```

---

## 后续变更边界

| 允许 | 禁止 |
|------|------|
| `postGuide` / upload / i18n / `GET /me` 预检态 | 删三步导航或改回单页长表单 |
| 十国城市/语言 chip 数据对齐 `geoOptions` | 国家下拉出现非 `PRODUCT_COUNTRIES` 项 |
| 诚实化审核/质押文案（**申请不质押**；审核后工作台质押） | 护照标「选填」实必填 |
