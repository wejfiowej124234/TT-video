# `/me/identities` · ① 本地 UI 收口锁死（2026-05-26 · L5 暖金暗玻璃 · 硬闸）

**阶段：① 本地** — 多重身份 Hub 为 **UI SSOT**；**不**表示 ② 测试网、③ 生产 GO；**非**五主路由冻结范围。

**互指：** [本目录 README](../../app/me/identities/README.md) · [社区资料 `/community/me`](../../app/community/me/README.md) · [账户导航命名 P3](./ACCOUNT-NAV-NAMING-P3.md) · [Auth L5 族](../GO_local_auth_l5/README.md) · [顶栏 utility 下拉 L5](../GO_local_auth_l5/HEADER-UTILITY-MENU-L5-FREEZE.md) · [登录 UI 冻结](../GO_local_auth_l5/AUTH-LOGIN-UI-FREEZE.md) · [注册 UI 冻结](../GO_local_auth_l5/AUTH-REGISTER-UI-FREEZE.md)

---

## 收口结论

| 项 | 状态 |
|----|------|
| **路由** | `/me/identities` |
| **视觉族** | Auth L5 同族 · `data-tt-auth-visual="l5"` · `data-tt-me-identities-l5="1"` |
| **冻结日** | **2026-05-26** |
| **顶栏** | `isAuthL5DarkHeaderPath` → authL5 utility 胶囊 + premium 深顶栏 |
| **机读** | `data-tt-me-identities-ui-frozen="1"` · `meIdentitiesUiFreeze` **绿集必过** |

**默认禁止：** Console 浅壳（`bg-bg-main` / 白卡）、`ProductCrossNav` 蓝链、cyan/market  chrome、删 `AuthL5PageBackdrop` / 玻璃卡层次。

---

## 页面结构锁（不得重排）

1. `<main>` · `TT_ME_IDENTITIES_L5.pageShell` · `meIdentitiesL5MainDataAttrs(true)`
2. `AuthL5PageBackdrop`
3. **Header**：eyebrow · **`titleLogin` 同级渐变 `h1`** · 副标题
4. **旅行者 callout**（`auth-l5-callout-surface` · 注册/登录链）
5. **申请网格区**（`gridHalo` + 2×2 `MeIdentitiesL5IdentityCard`）
6. 底栏入驻/社区资料链（`nav_community_profile` → `/community/me`）
7. **`AuthL5CrossNavFooter`**

**段级态：** `loading.tsx` → `MeIdentitiesRouteLoading` · `error.tsx` → `MeIdentitiesRouteError`（均 L5 暗壳）。

---

## 文件边界（`app/me/identities/`）

| 文件 | 角色 |
|------|------|
| `page.tsx` | 页身 SSOT |
| `layout.tsx` | metadata |
| `loading.tsx` | L5 骨架 |
| `error.tsx` | L5 错误壳 |
| `README.md` | 路由读序 |
| `meIdentitiesPage.contract.test.ts` | 链路契约 |

**共享组件 / token：** `lib/me/meIdentitiesL5.ts` · `components/me/MeIdentitiesL5IdentityCard.tsx` · `MeIdentitiesRouteLoading.tsx` · `MeIdentitiesRouteError.tsx` · `AuthL5CrossNavFooter` · `globals.css` `[data-tt-auth-visual="l5"]` 块。

---

## ① 机读绿集

```bash
cd frontend
npm run test:i18n:ci
npm run test -- accountNavNamingP3 meIdentitiesUiFreeze meIdentitiesL5 meIdentitiesPage uiSystem --run
```

**P3 命名（2026-05-27）：** Hub 标题 `me_identities_hub_title`；底栏回链 `nav_community_profile` → `/community/me`（社区资料）；见 [ACCOUNT-NAV-NAMING-P3](./ACCOUNT-NAV-NAMING-P3.md)。

---

## 后续变更边界

| 允许 | 禁止 |
|------|------|
| 各身份 **href / returnUrl** 链路、i18n 文案 | 删旅行者 callout 或改回 3 卡 Console 布局 |
| 卡片 **描述**诚实化（非改壳） | `titleCompact` 顶替 `titleLogin` |
| **`GET /me` `identity_slots` 状态徽章**（非伪造列表） | 去掉 `gridHalo` / `auth-l5-callout-surface` |
| 契约对齐真值 | 未跑绿集的视觉 diff |

**未纳入本冻结：** `/auth/register?role=*` 见 [AUTH-REGISTER-UI-FREEZE](./AUTH-REGISTER-UI-FREEZE.md)；**`/guide/register`** 见 [GUIDE-REGISTER-UI-FREEZE](./GUIDE-REGISTER-UI-FREEZE.md)（2026-05-26 三步 L5 收口）；**`/market/acquisition`** **数据链 / 门闸 / 烟测** 见 **[`app/market/acquisition/README.md`](../../app/market/acquisition/README.md)**（**PD-009 · ①** · **[acquisition-publish-trust-rules §8.1](../../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27)**）；Hub 收购卡片 **「进入子站」** CTA 与 **`/me/identities`** 回链 **仅允许** 数据链路变更（**非** layout lock 回流）。
