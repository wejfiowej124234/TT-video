# `/me/settings` · ① 本地 L5 设置 Hub 收口冻结（2026-06-02）

**阶段：① 本地** — 小红书式分组设置；**非**五主路由冻结。

**文档从代码同步：** Hub 分组 / 折叠 / href **以 `meSettingsNavModel.ts` + `MeSettingsPageInner.tsx` 为 SSOT**；改 IA 须先改代码，再回写本文 + tracker + 绿集。

**互指：** [HEADER-UTILITY-MENU-L5-FREEZE](./HEADER-UTILITY-MENU-L5-FREEZE.md) · [ME-SETTINGS-PROFILE-L5-FREEZE](./ME-SETTINGS-PROFILE-L5-FREEZE.md) · [ME-IDENTITIES-UI-FREEZE](./ME-IDENTITIES-UI-FREEZE.md) · [ACCOUNT-NAV-NAMING-P3](./ACCOUNT-NAV-NAMING-P3.md) · 统一追踪 `lib/accountNav/accountNavPageTracker.v1.ts`

---

## 收口结论

| 项 | 状态 |
|----|------|
| **Hub 路径** | `/me/settings` · `data-tt-me-settings-route="hub"` |
| **初冻** | 2026-05-28 批次（L5 分组 Hub） |
| **收口冻结** | **2026-06-02**（与顶栏 IA 对拍 · profile 子页独立 · 无 Hub 状态条组件） |
| **版式** | `max-w-3xl` · `mx-auto` · `titleCompact`；**不含** `/pay`、`ProductCrossNav` |
| **机读** | `meSettingsPageTracker` · `meSettingsFamilyFullScore` · `me-settings-l5-local-gate.v1.json` |

---

## 代码 SSOT（设置 Hub）

| 层级 | 路径 | 职责 |
|------|------|------|
| **Hub 页身** | `app/me/settings/MeSettingsPageInner.tsx` | 顶返回 · 标题 · profile 卡 · 分组 · 退出 |
| **分组模型** | `lib/me/meSettingsNavModel.ts` | `meSettingsNavSections` · `ME_SETTINGS_HUB_COLLAPSED_SECTIONS` |
| **分组渲染** | `components/me/MeSettingsHubSection.tsx` | 折叠组 · `MeSettingsL5Row` 列表 |
| **动态副文案** | `lib/me/meSettingsNavEnrich.ts` | 安全会话数 · 钱包验证态（**非**独立 status strip） |
| **Profile 顶卡** | `components/me/MeSettingsProfileCard.tsx` | → `/me/settings/profile` · `data-tt-me-settings-profile-card` |
| **顶返回** | `components/me/MeSettingsL5BackLink.tsx` | 见下表 |
| **底栏** | `components/me/MeSettingsL5MinimalFooter.tsx` | 单链 → 社区 Feed（`COMMUNITY_FEED_PATH`） |
| **退出** | `components/me/MeSettingsLogoutButton.tsx` | `MeLogoutL5Button` + `MeSettingsL5ConfirmDialog` |
| **L5 token** | `lib/me/meSettingsL5.ts` | 页壳 / 行 / 确认框（含 `confirmBtnCancel` 次要钮） |
| **机读追踪** | `lib/me/meSettingsPageTracker.v1.ts` | 设置族 + 顶栏去重 `mustContain` |

### Hub 页结构（自上而下 · `MeSettingsPageInner`）

1. **`MeSettingsL5BackLink`** — 上下文返回（见下）
2. **标题区** — `me_settings_eyebrow` · `me_settings_pageTitle` · `me_settings_subtitle`
3. **`MeSettingsHubFlashBanner`** — `?flash=` 成功条（钱包/会话等）
4. **`MeSettingsProfileCard`** — 链 `/me/settings/profile`（与顶栏 profile strip 同路径）
5. **分组列表** — `meSettingsNavSections({ showGuideHub })` × `MeSettingsHubSection`
6. **`MeSettingsLogoutButton`**
7. **`MeSettingsL5MinimalFooter`** — `me_settings_footer_back_community` → 社区 Feed

**禁止在 Hub 挂载：** `MeSettingsHubStatusStrip` · `ProductCrossNav` · 顶栏「我的」href 重复项。

### 顶返回（`MeSettingsL5BackLink` · query `from`）

| `from` | href | labelKey |
|--------|------|----------|
| （缺省） | `COMMUNITY_FEED_PATH` | `me_settings_back_community` |
| `identities` | `/me/identities` | `me_settings_back_identities` |
| `community` | `/me/settings/profile` | `me_settings_back_community` |
| `settings` | `/me/settings` | `me_settings_back_hub` |

### 分组（`meSettingsNavModel.ts` · `BASE_SECTIONS`）

**默认展开：** `account` · `travel` · `support`  
**默认折叠：** `privacy` · `general`（`ME_SETTINGS_HUB_COLLAPSED_SECTIONS`）

| section id | labelKey | items（id → href） |
|------------|----------|---------------------|
| **account** | `me_settings_section_account_security` | `password` → `/me/password` · `security` → `/me/security` |
| **travel** | `me_settings_section_travel` | `disputes` → `/disputes?from=settings` · `wallet` → `/me/security?focus=wallet`；**role=guide** 时前置 `guide_hub` → `/guide?from=settings` |
| **support** | `me_settings_section_support` | `feedback` → `/community/feedback?from=settings` |
| **privacy** | `me_settings_section_privacy` | `privacy_hub` · `community_visibility` → `/me/settings/privacy` · `privacy`/`terms`/`guidelines` 外链文档 · `notification_prefs` → `/me/settings/notifications-prefs` · `security_events` → `/me/security?focus=notifications` |
| **general** | `me_settings_section_general` | `language` → `/me/settings/language` · `data_rights` → `/me/settings/data` · `help` · `trust`（`meSettingsNavExtensionHref`） |

**Hub 不重复顶栏 href：** `/orders` · `/me/identities` · `/community/me/posts|collects|likes|reports` · `/me/settings/profile`（顶卡 + 顶栏 strip 已覆盖）。

---

## 路由族（设置 + 扩展壳）

| 路径 | 说明 |
|------|------|
| `/me/settings` | 设置 Hub |
| `/me/settings/profile` | 个人资料 → [ME-SETTINGS-PROFILE-L5-FREEZE](./ME-SETTINGS-PROFILE-L5-FREEZE.md) |
| `/me/settings/privacy` | 隐私与可见性 |
| `/me/settings/language` | 显示语言 |
| `/me/settings/data` | 账户与数据（导出 · 删号工单） |
| `/me/settings/notifications-prefs` | 通知偏好 |
| `/me/settings/trust` | 信任与 KYC |
| `/me/password` | 修改密码 |
| `/me/security` | 账号安全中心 |
| `/me/onboarding?from=settings` | 96-18 准入 |
| `/auth/verify-email?from=settings` | 邮箱验证（profile 详情区亦可链入） |
| `/community/feedback?from=settings` | 建议与反馈 |
| `/help?from=settings` · `/privacy?from=settings` · `/terms?from=settings` · `/terms/community-guidelines?from=settings` | L5 文档壳 |
| `/disputes?from=settings` · `/disputes/[id]` | 争议 L5 壳 |
| `/provider/register?from=settings` · `/steward/register?from=settings` · `/guide?from=settings` · `/trust?from=settings` | 扩展 ingress |

`/community/me` 裸路径 **redirect** → `/me/settings/profile`（保留 `?tab=` 深链）；编辑 Hub **不在** `/community/me`。

---

## 与顶栏分工

顶栏下拉 = **profile strip** + 账户 + **我的** + 工具 + 退出 — [HEADER-UTILITY-MENU-L5-FREEZE](./HEADER-UTILITY-MENU-L5-FREEZE.md)。Hub = **全量目录** + profile 顶卡；**不**重复顶栏高频 href。

---

## 逐页追踪（满分 SSOT）

机读清单：`lib/me/meSettingsPageTracker.v1.ts` · `meSettingsPageTracker.contract.test.ts`（设置族 + 顶栏 `ACCOUNT_NAV_HEADER_PAGE_TRACKER_V1` · Hub 去重断言）。

**机读闸 JSON：** `evidence/GO_local_auth_l5/me-settings-l5-local-gate.v1.json` · `meSettingsL5LocalGate.contract.test.ts`

---

## ① 机读绿集

```bash
bash scripts/dev/smoke-me-settings-local.sh
bash scripts/dev/smoke-account-nav-full-local.sh
```

（等价 vitest：`meSettingsL5` · `meSettingsPageTracker` · `meSettingsFamilyFullScore` · `meSettingsPageI18nKeys` · …）

**破坏性操作：** 须 `MeSettingsL5ConfirmDialog`（`data-tt-me-settings-confirm`）— **禁止** `window.confirm`。顶栏 / Hub 登出同源 L5 确认框。

**偏好 API（① chain_off）：** `PUT/GET /api/v1/me` · `settings_preferences`；`meSettingsPreferencesApi.ts` + `useMeSettingsUserPreferences`。

**设置族顶栏高亮：** `/me/settings` · `/me/password` · `/me/security` · `/me/settings/*`（`headerUserMenuNavActive.ts`）

**错误边界：** `app/me/settings/error.tsx` L5 暖金壳；`/me/password/error` · `/me/security/error` 复用同源。

**Hub 刷新：** `useMeSettingsHubPathnameReload` — 回到 Hub 时重拉 `GET /me` + 安全状态。

**操作反馈：** `?flash=wallet|sessions|…` → `MeSettingsHubFlashBanner`；dismiss 后 `router.replace` 清 query。

---

## 变更边界

| 允许 | 禁止 |
|------|------|
| i18n · href · 分组项增删 · ① 偏好 / 安全数据链 | 回 Console 白底孤立改密卡 |
| 与 `meSettingsL5` token 对齐 · L5 `alertdialog` | `window.confirm` · `MeSettingsHubStatusStrip` 回 Hub |
| bugfix · a11y（含确认框对比度） | 未跑绿集的 L5 视觉回流 · Hub 重复顶栏「我的」项 |
