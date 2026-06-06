# `/community/me/likes` · ① 本地 · 赞过（独立页）

**阶段：① 本地** — 全量 **赞过帖列表**；Hub 访客可用 `?tab=likes` 开抽屉预览；**已登录 redirect** 至本页。

**L5 冻结 SSOT：** [`evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md`](../../../evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md) · Hub [`../README.md`](../README.md)

---

## 路由与 AuthGate

| 项 | 值 |
|----|-----|
| **规范路径** | `/community/me/likes`（**非** `/community/me?tab=likes` 管理入口） |
| **机读** | `data-tt-community-me-likes-page="1"` |
| **Feature Flag** | `NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST` 关 → `page.tsx` **redirect** `/community/me` |
| **AuthGate** | `CommunityMeDedicatedPageAuthGate` · `community_me_likes_auth_gate` |
| **login `returnUrl`** | `/community/me/likes` |

## Hub `?tab=likes` vs 独立页（ME-P1-4 · 导航决策）

| 场景 | 行为 |
|------|------|
| **访客 + `?tab=likes`** | 停留 Hub URL · 玻璃抽屉 + AuthGate · 抽屉「全页」→ **`/community/me/likes`** |
| **已登录 + `?tab=likes`** | Hub **replace** → **`/community/me/likes`**（Scheme A） |
| **顶栏 / 资料卡 / QuickLinks** | 直链 **`/community/me/likes`**（与 posts/collects 同族） |

## 与 Hub 抽屉 parity

| 面 | 实现 |
|----|------|
| **独立页** | `useCommunityMeLikesPage` → `CommunityMeLikesPageMain` + `CommunityMeLikesPortals` |
| **Hub 抽屉** | `CommunityMeLikesExperience`（**同一 VM**） |
| **PostDetailDrawer** | 内联 · **禁止** `/community/post/` 导航 |

## 导航入口（href SSOT = `/community/me/likes`）

| 入口 | 实现 |
|------|------|
| **顶栏用户菜单** | `headerUserMenuNavModel.ts` · flag 关时隐藏 |
| **资料卡笔记分段** | `CommunityMeAccountPanelNotesNav` |
| **Hub 抽屉「全页」** | `communityMeNotes/CommunityMeNotesDrawerStack` · `fullPageHref="/community/me/likes"` |
| **QuickLinks** | `MeQuickLinksSection` · `showLikesList` |

## 代码地图

| 文件 | 职责 |
|------|------|
| `page.tsx` | flag 闸 + redirect |
| `CommunityMeLikesPageClient.tsx` | AuthGate 薄壳 |
| `useCommunityMeLikesPage.ts` | VM |
| `lib/useCommunityMeLikesHydratedList.ts` | `getMeLikes` + hydrate |

## 已知限制（①）

- ID 列表顶 **100** · hydrate **24** / 批（与 collects 同源）

## ① 机读绿集

```bash
cd frontend
npx vitest run app/community/me/posts/communityMePostsPage.contract.test.ts
npx playwright test e2e/community-me-hub-notes-drawer-ia.spec.ts e2e/community-me-dedicated-l5.spec.ts --project=chromium -g "likes"
```
