# `/me/identities` · ① 本地 UI 收口锁死（2026-05-26 · L5 暖金暗玻璃 · 硬闸）

**阶段：① 本地** — 多重身份 Hub 为 **UI SSOT**；**不**表示 ② 测试网、③ 生产 GO；**非**五主路由冻结范围。

**互指：** [本目录 README](../../app/me/identities/README.md) · [IA 收口任务清单](./MULTI-IDENTITY-IA-CLOSURE-TASK-LIST.md) · [企业级审计 100/100 ①](./MULTI-IDENTITY-IA-ENTERPRISE-AUDIT.md) · [社区资料 `/me/settings/profile`](../../app/me/settings/profile/README.md) · [账户导航命名 P3](./ACCOUNT-NAV-NAMING-P3.md) · [Auth L5 族](../GO_local_auth_l5/README.md) · [顶栏 utility 下拉 L5](../GO_local_auth_l5/HEADER-UTILITY-MENU-L5-FREEZE.md)

---

## 收口结论

| 项 | 状态 |
|----|------|
| **路由** | `/me/identities` |
| **视觉族** | Auth L5 同族 · `data-tt-auth-visual="l5"` · `data-tt-me-identities-l5="1"` |
| **冻结日** | **2026-05-26**（IA 数据链收口 **2026-06-12** · 见任务清单） |
| **顶栏** | `isAuthL5DarkHeaderPath` → authL5 utility 胶囊 + premium 深顶栏 |
| **机读** | `data-tt-me-identities-ui-frozen="1"` · `meIdentitiesUiFreeze` **绿集必过** |

**默认禁止：** Console 浅壳（`bg-bg-main` / 白卡）、`ProductCrossNav` 蓝链、cyan/market chrome、删 `AuthL5PageBackdrop` / 玻璃卡层次。

---

## 页面结构锁（不得重排 · 2026-06-12 对拍）

1. `<main>` · `TT_ME_IDENTITIES_L5.pageShell` · `meIdentitiesL5MainDataAttrs(true)`
2. `AuthL5PageBackdrop`
3. **Header**：eyebrow · **`titleLogin` 渐变 `h1`** · 副标题
4. **能力区** `me_identities_capabilities_section_title`：旅行者 callout + 收购能力卡
5. **经营身份区** `me_identities_operator_section_title` · **`me_identities_operator_section_hint` 常显** · **三卡（商家/主理人/向导）首屏可见**（HU-036 · **禁止**纯旅行者 `<details>` 折叠藏申请入口）· `gridHalo` + `MeIdentitiesL5IdentityCard`（CTA **仅** `deriveMeIdentitiesCoreCardView` · 禁止 slot 覆盖）
6. **身份资料区** `MeIdentitiesProfileLinksNav`（**仅** active/role · **L5 横向媒体行** 左通高 cover · 右文案 · 非纵卡小 icon）
7. **页脚说明** `me_identities_hub_footer_note` + 链 `/me/settings/profile`（社区资料）
8. **`AuthL5CrossNavFooter`**

**段级态：** `loading.tsx` → `MeIdentitiesRouteLoading` · `error.tsx` → `MeIdentitiesRouteError`（均 L5 暗壳）。

**准入深链（数据链 · 非 layout）：**

| 身份 | 待付费/确认 | SSOT |
|------|-------------|------|
| 商家 | `/me/onboarding?role=provider&from=identities_hub` | Console 浅色 |
| 主理人 | `/governance?view=region&from=identities_hub#steward-b-track-admission` | 工作台 A 轨 · [`stewardAdmissionNav.ts`](../../lib/steward/stewardAdmissionNav.ts) |

---

## 文件边界（`app/me/identities/`）

| 文件 | 角色 |
|------|------|
| `page.tsx` | 页身 SSOT |
| `layout.tsx` | metadata |
| `loading.tsx` / `error.tsx` | L5 段态 |
| `README.md` | 路由读序 |
| `meIdentitiesPage.contract.test.ts` | Hub 链路契约 |
| `meIdentityP2Settings.contract.test.ts` | P2 四轨 settings |

**P2 settings 子路由：** 见 [IDENTITY-CENTER-PHASE2-FREEZE](./IDENTITY-CENTER-PHASE2-FREEZE.md)

---

## ① 机读绿集

```bash
cd frontend
npm run test:i18n:ci
npm run test -- meIdentitiesIaClosure accountNavNamingP3 meIdentitiesUiFreeze meIdentityP2Settings meIdentitiesL5 meIdentitiesPage uiSystem --run
bash scripts/dev/smoke-multi-identity-ia-closure-local.sh   # 仓库根
PLAYWRIGHT_MULTI_IDENTITY_IA=1 bash scripts/dev/smoke-multi-identity-ia-closure-local.sh  # 可选 E2E
```

**P3 命名：** Hub `me_identities_hub_title` · 顶栏 profile strip / 页脚 → **`/me/settings/profile`**（`nav_community_profile`）· 见 [ACCOUNT-NAV-NAMING-P3](./ACCOUNT-NAV-NAMING-P3.md)。

---

## 后续变更边界

| 允许 | 禁止 |
|------|------|
| href / returnUrl / i18n / 状态徽章（`GET /me`） | 删能力区/经营区分区或改回单一 2×2 网格 |
| P2 settings 子页数据链 | 顶栏身份 switcher（**②** 单独立项） |
| 契约对拍 | 未跑绿集的 layout/token 回流 |

**未纳入本冻结：** `/auth/register?role=*` · `/guide/register` · `/market/acquisition` — 各 README + 对应 FREEZE。
