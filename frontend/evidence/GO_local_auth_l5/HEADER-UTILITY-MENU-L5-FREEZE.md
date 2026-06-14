# 顶栏 Utility 下拉（用户 / 语言 / 钱包）· ① 本地 UI 收口冻结（2026-06-02）

**阶段：① 本地** — 顶栏 utility 下拉为 **Auth L5 暖金玻璃族**；**不**表示 ② 测试网、③ 生产 GO；**非**五主路由页身冻结范围（仅顶栏 chrome）。

**文档从代码同步：** 本节 IA / 路由 / `data-tt` **以代码为 SSOT**；改菜单须先改 `headerUserMenuNavModel.ts`，再回写本文 + 绿集。

**互指：** [Auth L5 族 README](./README.md) · [ME-SETTINGS-L5-FREEZE](./ME-SETTINGS-L5-FREEZE.md) · [ME-SETTINGS-PROFILE-L5-FREEZE](./ME-SETTINGS-PROFILE-L5-FREEZE.md) · [ME-IDENTITIES-UI-FREEZE](./ME-IDENTITIES-UI-FREEZE.md) · [ACCOUNT-NAV-NAMING-P3](./ACCOUNT-NAV-NAMING-P3.md) · [PUBLISH-HUB-IA-BOUNDARY-SCORE.md](./PUBLISH-HUB-IA-BOUNDARY-SCORE.md)（**发布中心 / 我的帖子 / 我的订单** 三分 · 2026-06-13 冻结）

---

## 收口结论

| 项 | 状态 |
|----|------|
| **范围** | `HeaderUserMenu` · `HeaderLanguageSwitcher` · `WalletStatusMini`（`variant=authL5`） |
| **视觉族** | `auth-l5-glass-surface` · `HeaderUtilityMenuL5Chrome` · 暖金胶囊触发器 |
| **初冻** | **2026-05-26**（Auth L5 玻璃族） |
| **收口冻结** | **2026-06-02**（profile strip 方案 A · 与设置 Hub IA 对拍 · 登出确认 L5 次要钮） |
| **路由触发** | `isHeaderUtilityL5Path` → `headerUtilityVariant = "authL5"`；`header[data-tt-header-utility-l5="1"]` 启用玻璃 CSS |
| **机读** | `data-tt-header-user-menu-l5` · `data-tt-header-lang-menu-l5` · `data-tt-header-wallet-menu-l5` · `headerUtilityMenuUiFreeze` **绿集必过** |

**默认禁止：** 下拉容器 `relative` 覆盖 `absolute right-0 top-full`；Console 白底菜单；删 glass chrome / profile strip / 图标行 grid；账户组恢复单列「个人资料」菜单行。

---

## 代码 SSOT（顶栏用户菜单）

| 层级 | 路径 | 职责 |
|------|------|------|
| **导航模型** | `components/header/headerUserMenuNavModel.ts` | 分组 · href · `labelKey` · `iconId` · `HEADER_USER_MENU_PROFILE_HREF` |
| **渲染** | `components/header/HeaderUserMenuNavLinks.tsx` | Profile strip Link · authL5 分组 nav · `data-tt-header-user-menu-profile-strip` |
| **壳层** | `components/header/HeaderUserMenu.tsx` | 触发器 · 下拉 · `HeaderUserMenuL5Logout` |
| **登出确认** | `components/header/HeaderUserMenuL5Logout.tsx` · `components/me/MeSettingsL5ConfirmDialog.tsx` | L5 `alertdialog` · 取消钮 `TT_ME_SETTINGS_L5.confirmBtnCancel`（`secondaryButton` · 浅字可见） |
| **Token** | `lib/header/headerUserMenuL5.ts` · `lib/header/headerUtilityMenuL5.ts` | 暖金 item / strip / dropdown shell |
| **机读追踪** | `lib/me/meSettingsPageTracker.v1.ts` → `ACCOUNT_NAV_HEADER_PAGE_TRACKER_V1` | 顶栏直达页 `mustContain` / Hub 去重 |

### authL5 菜单结构（`headerUserMenuNavSections` · 不得重排语义）

**0 · Profile strip（非 nav 分组项）**

| 属性 | 值 |
|------|-----|
| href | `HEADER_USER_MENU_PROFILE_HREF` → `/me/settings/profile`（`ME_SETTINGS_PROFILE_PATH`） |
| 可见文案 | 昵称 + `header_identitySpine_*` spine（zh 旅行者 →「旅行者」） |
| a11y | `aria-label={t("nav_community_profile")}` |
| 机读 | `data-tt-header-user-menu-profile-strip="1"` |

**1 · 账户**（`header_userMenu_section_account`）

| href | labelKey | iconId |
|------|----------|--------|
| `/me/identities` | `header_multiIdentity` | `identities` |

**2 · 我的**（`header_userMenu_section_mine`）

| href | labelKey | iconId | 备注 |
|------|----------|--------|------|
| `/orders` | `header_myOrders` | `orders` | |
| `/community/me/posts` | `header_userMenu_my_posts` | `posts` | |
| `/community/me/collects` | `header_userMenu_my_collects` | `collects` | |
| `/community/me/likes` | `header_userMenu_my_likes` | `likes` | `isCommunityMeLikesListEnabled()` 关则隐藏 |

**3 · 工具与设置**（`header_userMenu_section_tools`）

| href | labelKey | iconId |
|------|----------|--------|
| `/community/me/reports` | `me_settings_item_reports` | `reports` |
| `/me/settings` | `header_settings` | `settings` |

**4 · 退出**（`HeaderUserMenuL5Logout` · 分隔后独立行）

| 机读 | `data-tt-header-logout-l5` · `MeSettingsL5ConfirmDialog` · **禁止** `window.confirm` |

### IA 分工（顶栏 ↔ 设置 Hub）

| 顶栏下拉（高频） | 设置 Hub（全量目录） |
|------------------|----------------------|
| profile strip → `/me/settings/profile` | 顶卡 `MeSettingsProfileCard` → 同路径 |
| 多重身份 · 我的（订单/发布/收藏/赞过） | **不重复** 上述 href |
| 举报 · 设置 | 分组见 [ME-SETTINGS-L5-FREEZE](./ME-SETTINGS-L5-FREEZE.md) |

**语言 / 钱包：** 共享 `headerUtilityMenuL5ShellClass` + `dropdownBody`；**禁止** `className={\`relative ${menuClass}\`}`。

---

## 文件边界

| 文件 | 角色 |
|------|------|
| `lib/header/headerUtilityMenuL5.ts` | 共享 glass / item / divider token |
| `lib/header/headerUserMenuL5.ts` | 用户菜单 token |
| `components/header/HeaderUtilityMenuL5Chrome.tsx` | 顶缘高光 |
| `components/header/HeaderUserMenu.tsx` | 用户下拉 SSOT |
| `components/header/HeaderUserMenuNavLinks.tsx` | Profile strip + 分组 nav |
| `components/header/headerUserMenuNavModel.ts` | 路由 / 分组模型（**IA 真源**） |
| `components/header/headerUserMenuNavActive.ts` | `/me/settings/*` · `/me/password` · `/me/security` active |
| `components/header/HeaderLanguageSwitcher.tsx` | 语言下拉 |
| `components/trust/WalletStatusMini.tsx` | 钱包下拉 |
| `lib/uiSystem.ts` | `isHeaderUtilityL5Path` |

---

## ① 机读绿集

```bash
# 顶栏 IA + 设置/社区并集（推荐 · 仓库根）
bash scripts/dev/smoke-account-nav-local.sh

cd frontend
npm run test:i18n:ci
npm run test -- accountNavNamingP3 headerUtilityMenuUiFreeze headerUtilityMenuL5 headerUserMenuL5 uiSystem Header.test WalletStatusMini meSettingsPageTracker --run
```

**P3 命名：** `nav_community_profile`（profile strip a11y）· `header_multiIdentity`（多重身份）；机读 [ACCOUNT-NAV-NAMING-P3](./ACCOUNT-NAV-NAMING-P3.md)。

---

## 后续变更边界

| 允许 | 禁止 |
|------|------|
| i18n · href · `identity_slots` spine 真值 · 数据链路 | 删 profile strip 或改回 Console 白盒列表 |
| **Workspace Context 下拉**（[ADR-20260613](../../../docs/adr/ADR-20260613-active-workspace-context-switcher.md) · W1-B1）· 工作台深链 CTA | 未跑绿集的 L5 视觉/layout 回流 |
| 契约对齐 `headerUserMenuNavModel` · `headerWorkspaceContextNavModel` | 账户组恢复 `labelKey: "nav_community_profile"` 菜单行 |
| 语言·钱包与用户菜单 **token 对齐** | 用户菜单再出现 `/guide/register` 或 `?role=` 直链 |
| 登出确认 a11y / 对比度 bugfix | 未跑绿集的 L5 视觉 diff |

**申请落地页回链（同批）：** `/auth/register` 全系 · `/guide/register` 页脚须保留「多重身份」→ `/me/identities`；`/market/acquisition` 在 market 冻结内仅数据链 + identities 回链。
