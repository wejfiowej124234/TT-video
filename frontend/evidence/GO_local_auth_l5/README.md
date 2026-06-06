# Auth L5 暗壳 · ① 本地验收（全 `/auth/*` 主链）

**总验收包：** [`GO_local_phase1`](../GO_local_phase1/README.md)（Hub · returnUrl · 社区资料命名 P3 · 与 onboarding 全链路同批 **①** 总闸）

**阶段**：① 本地 · **非** ② 测试网 / ③ 生产 GO。

## Auth L5 UI 已收口锁死（2026-05-26 · ①）

| 路由 | SSOT | 状态 |
|------|------|------|
| **`/auth/login`** | [`AUTH-LOGIN-UI-FREEZE.md`](./AUTH-LOGIN-UI-FREEZE.md) | **锁死** |
| **`/auth/register`** | [`AUTH-REGISTER-UI-FREEZE.md`](./AUTH-REGISTER-UI-FREEZE.md) | **锁死** |

```bash
cd frontend && npm run test -- authLoginUiFreeze authRegisterUiFreeze loginPageL5 authRegisterL5 registerPage authL5FullScore uiSystem acquisitionL5 acquisitionL5FullScore meTrust meIdentitiesPage --run
```

**旅行收购 PD-009（① · 非五主 · Hub UI 已锁）**：全链烟测 **`bash scripts/dev/smoke-acquisition-pd009-local.sh`**（须 **`DATABASE_URL`** · **`SEED_TEST_ACCOUNTS=1`**；**非 ②③ GO**）；规则 **[acquisition-publish-trust-rules §8.1](../../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27)**。

**其它 `/auth/*`（找回/重置/验证）** 仍可按需演进；动共享 `AuthL5*` / globals L5 时须上表绿集全过。

## 范围

| 路由 / 态 | 内容 |
|-----------|------|
| `/auth/login` | **UI 冻结** · 暖金玻璃卡 + `AuthL5Card` + 自定义勾选 |
| `/auth/register` | **UI 冻结** · `titleLogin` + 信任条折叠摘要 + `loginHref` |
| `/auth/forgot-password` · `reset` · `verify` | `AuthL5FlowPage` + 玻璃卡 |
| **Loading** | `AuthRouteLoading` 暗底暖金骨架（无浅灰闪屏） |
| **Error** | `AuthRouteErrorShell` / `app/auth/error.tsx` L5 卡 |
| **顶栏** | auth 路由暖金 utility 胶囊 + 导航条 `ref-sun`（非 travel-500） |
| **`/me/identities`** | 多重身份 Hub · **UI 已锁** → [ME-IDENTITIES-UI-FREEZE](./ME-IDENTITIES-UI-FREEZE.md)；收购 **「进入子站」** → **`/market/acquisition`**（**PD-009 · ① 数据链 SSOT** → [`app/market/acquisition/README.md`](../../app/market/acquisition/README.md) · [`app/me/identities/README.md`](../../app/me/identities/README.md)） |
| **`/community/me`** | **社区资料**（TT 社区「我」）· **L5 独立冻结** → [COMMUNITY-ME-L5-FREEZE](../GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md) · P3 命名 → [`app/community/me/README.md`](../../app/community/me/README.md) · [ACCOUNT-NAV-NAMING-P3](./ACCOUNT-NAV-NAMING-P3.md) |
| **`/me/onboarding`** | 准入费 Console · **UI 已锁** → [ME-ONBOARDING-CONSOLE-L5-FREEZE](./ME-ONBOARDING-CONSOLE-L5-FREEZE.md) |
| **顶栏 utility 下拉** | 用户 / 语言 / 钱包 Auth L5 → [HEADER-UTILITY-MENU-L5-FREEZE](./HEADER-UTILITY-MENU-L5-FREEZE.md)（**2026-06-02 收口** · 代码 SSOT `headerUserMenuNavModel.ts`） |
| **账户导航命名 P3** | 个人资料 / 多重身份 Hub i18n + E2E 断言 SSOT → [ACCOUNT-NAV-NAMING-P3](./ACCOUNT-NAV-NAMING-P3.md) |
| **`/me/settings` L5 Hub** | 分组设置 · 逐页 tracker → [ME-SETTINGS-L5-FREEZE](./ME-SETTINGS-L5-FREEZE.md)（**2026-06-02 收口** · 代码 SSOT `meSettingsNavModel.ts`） |

## 推送前建议命令

```bash
cd frontend && npm run test:i18n:ci && npm run test -- accountNavNamingP3 authLoginUiFreeze authRegisterUiFreeze loginPageL5 authRegisterL5 authFlowL5 authRouteL5 authL5FullScore uiSystem authHelpBridgeTheme meIdentitiesUiFreeze meIdentitiesL5FullScore meIdentitiesL5 meIdentitiesPage acquisitionL5 acquisitionL5FullScore meTrust headerUtilityMenuUiFreeze headerUtilityMenuL5 headerUserMenuL5 Header.test --run
```

## 机读锚点

- `data-tt-auth-login-ui-frozen="1"` · `data-tt-auth-register-ui-frozen="1"`
- `lib/auth/authRegisterUiFreeze.contract.test.ts`
- `data-tt-auth-visual="l5"`
- `lib/auth/authLoginUiFreeze.contract.test.ts`
- `lib/auth/loginPageL5.contract.test.ts`
- `lib/auth/authRegisterL5.contract.test.ts`
- `lib/auth/authFlowL5.contract.test.ts`
- `lib/auth/authRouteL5.contract.test.ts`

## 满分抛光（① · 机读 + 人工）

| 项 | 验收 |
|----|------|
| 玻璃层次 | `blur(28px)` + `auth-l5-card-ambient` + `auth-l5-glass-vignette` |
| 记住邮箱 | 整行 `min-h-[44px]` · `label htmlFor` 可点 |
| Autofill | `-webkit-autofill` + `-internal-autofill-selected` → `#14100d` |
| 顶栏登录 | `/auth/login` 上「登录」`text-ref-sun` 当前态 |

## 人工扫一眼（60s）

1. `/auth/login`：输入框**暗底**（含已保存邮箱 autofill 无浅蓝）；卡缘有外晕+内 vignette；勾选行点文字可切换  
2. 快速切换 `/auth/forgot-password`：无整页浅灰 loading 闪一下  
3. 注册页信任条与暗卡同族；`/auth/register` 顶栏「注册」胶囊高亮  
4. Tab 焦点：输入框/勾选/主按钮均有暖金 ring  
5. 硬刷新：`Ctrl+Shift+R`
