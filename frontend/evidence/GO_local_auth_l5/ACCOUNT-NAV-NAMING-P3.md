# 账户导航命名 · P3 收口（社区资料 / 多重身份 Hub）· ① 本地

**阶段：① 本地** — 产品入口 **i18n + 文档 + E2E** 与顶栏 / Hub 路由对齐；**不**表示 ② 测试网、③ 生产 GO。

**互指：** [HEADER-UTILITY-MENU-L5-FREEZE](./HEADER-UTILITY-MENU-L5-FREEZE.md) · [ME-IDENTITIES-UI-FREEZE](./ME-IDENTITIES-UI-FREEZE.md) · [`app/me/identities/README.md`](../../app/me/identities/README.md) · [`app/community/me/README.md`](../../app/community/me/README.md)

---

## 收口结论（2026-06-02 · P3 + 顶栏/Hub IA 对拍）

| 入口 | 路由 | 中文（zh） | 英文（en） | i18n 键（SSOT） |
|------|------|------------|------------|-----------------|
| **个人资料（编辑）** | `/me/settings/profile` | 个人资料 | Profile | `nav_community_profile`（顶栏 strip `aria-label`）· Hub 顶卡 `me_settings_profile_edit` |
| **社区 Feed** | `/community` | （动态 Feed） | （Feed） | `POST_AUTH_DEFAULT_RETURN_PATH` |
| **多重身份 Hub** | `/me/identities` | 多重身份 / 角色与入驻 | Multiple roles & onboarding | `header_multiIdentity` · `me_identities_hub_title` |
| **社区资料 legacy** | `/community/me` | 社区资料（页 title） | Community profile | `me_title` · 裸路径 **redirect** → `/me/settings/profile` |
| **`/me` 直链** | → `/me/identities` | （Hub） | （Hub） | `app/me/page.tsx` redirect |

**禁止回漂：** 用户可见 copy **不得**再使用「个人中心」指代上述入口；`zh.ts` 产品字符串 **零**「个人中心」。

**`/me` 与 `/me/settings/profile`：** 资料编辑在设置 profile 子页；入驻申请与槽位矩阵在 **`/me/identities`**。顶栏 **profile strip** 与 Hub **顶卡** 同链 `/me/settings/profile`（**非**账户组菜单行）。

**分场景名称（L5 · 2026-06-10）：** 账户 nickname **≠** 市场 `{city} 向导` 标题 — 见 [identity-multi-slot-naming-l5.v1.md](../../../docs/spec/artifacts/identity-multi-slot-naming-l5.v1.md)。**顶栏身份切换** 为 **P3 升级轨**，① 未实现。

---

## 统一逐页追踪（ME-P1-9）

| 子 SSOT | 路径 |
|---------|------|
| 设置族 | `lib/me/meSettingsPageTracker.v1.ts` |
| 社区资料族 | `lib/communityMePageTracker.v1.ts` |
| **合并索引** | `lib/accountNav/accountNavPageTracker.v1.ts` |
| **机读闸 JSON** | `account-nav-page-tracker.v1.json`（全站）· `me-settings-l5-local-gate.v1.json`（设置族） |

## 机读绿集（P3 · 推送前）

```bash
# 推荐（仓库根 · 窄统一烟测）
bash scripts/dev/smoke-account-nav-local.sh

# 全量（Vitest 一次 · 可选 Playwright 分层 / PLAYWRIGHT_FULL=1 全开）
bash scripts/dev/smoke-account-nav-full-local.sh

# 等价 frontend vitest 子集
cd frontend
npm run test:i18n:ci
npm run test -- accountNavPageTracker accountNavNamingP3 meSettingsPageTracker communityMePageTracker headerUserMenuNavModel headerUtilityMenuUiFreeze MeQuickLinksSection --run
```

**可选 Playwright（全栈 · 顶栏 + Hub 举报链）：**

```bash
# 前置：本机 Postgres + 根 `.env` `DATABASE_URL`；脚本默认 `PLAYWRIGHT_FULL_STACK=1` 起 API:8080 + Next:3012
PLAYWRIGHT_ACCOUNT_NAV=1 bash scripts/dev/smoke-account-nav-local.sh
# 或全量烟测分层：PLAYWRIGHT_ACCOUNT_NAV=1 bash scripts/dev/smoke-account-nav-full-local.sh
```

顶栏 / 设置 E2E 须在 **`GET /api/v1/me` 200** 后再断言 UI — `e2e/helpers/accountNavSession.ts`：`gotoWithHeaderNavSessionReady` · `gotoWithMeSettingsSessionReady`。

```bash
# 设置 Hub Playwright 单层
PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-account-nav-full-local.sh
# 社区 ME 全量 Playwright（SKIP 本子脚本已跑的 vitest/i18n）
PLAYWRIGHT_COMMUNITY_ME=1 bash scripts/dev/smoke-account-nav-full-local.sh
# 三层全开
PLAYWRIGHT_FULL=1 bash scripts/dev/smoke-account-nav-full-local.sh
```

**Playwright（可选 · 全栈 · 账户导航 IA）：**

```bash
cd frontend
PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/account-nav-header-ia.spec.ts e2e/community-me-hub-notes-drawer-ia.spec.ts --project=chromium
```

**E2E 断言 SSOT：** `e2e/helpers/communityMeLegacyRedirects.ts` → `communityMeMainAccessibleNameRe`（`/Community profile|社区资料/`）。

---

## 验收清单

| 域 | 通过条件 |
|----|----------|
| **顶栏** | profile strip → `/me/settings/profile` · 账户 → `/me/identities` · **我的** → 订单/发布/收藏/赞过 · **工具** → 举报 · 设置 |
| **独立页** | posts/collects/likes/reports → 各 [`app/community/me/*/README.md`](../../app/community/me/posts/README.md) · [FREEZE](../../evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md) |
| **Hub** | `/me/identities` `h1` 为 `me_identities_hub_title`；`/me/settings` 顶卡 + 底栏回 Feed |
| **个人资料** | `/me/settings/profile` · `data-tt-me-settings-profile`；**禁止** Hub/本页重复顶栏「我的」链 |
| **i18n gate** | `npm run test:i18n:ci` exit 0；zh/en 键parity |
| **契约** | `accountNavNamingP3.contract.test.ts` exit 0 |
| **E2E** | 烟雾 / `community-me-data-state` / `me-identities-core-hub` 使用上表语义，非 `/Me|我`、非「个人中心」 |

---

## 后续变更边界

| 允许 | 禁止 |
|------|------|
| 同语义下的 i18n 润色 | 顶栏再出现「个人中心」链 `/me` 冒充 Hub |
| 开发者注释对齐（非阻塞） | E2E 用旧 `/Me|我` 或 `Profile\|个人中心` 冒充绿 |
