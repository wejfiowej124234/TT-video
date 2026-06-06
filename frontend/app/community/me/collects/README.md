# `/community/me/collects` · ① 本地 · 我的收藏（独立页）

**阶段：① 本地** — 全量管理 **收藏帖**；Hub 玻璃抽屉为预览，已登录用户由 Hub `?tab=collects` **redirect** 至本页。

**L5 冻结 SSOT：** [`evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md`](../../../evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md) · Hub [`../README.md`](../README.md)

---

## 路由与 AuthGate

| 项 | 值 |
|----|-----|
| **规范路径** | `/community/me/collects` |
| **机读** | `data-tt-community-me-collects-page="1"` |
| **AuthGate** | `CommunityMeDedicatedPageAuthGate` · `community_me_collects_auth_gate` |
| **login `returnUrl`** | `/community/me/collects` |

## 与 Hub 抽屉 parity

| 面 | 实现 |
|----|------|
| **独立页** | `useCommunityMeCollectsPage` → `CommunityMeCollectsPageMain` + `CommunityMeCollectsPortals` |
| **Hub 抽屉** | `CommunityMeCollectsExperience`（**同一 VM**） |
| **PostDetailDrawer** | 内联 · **禁止** `/community/post/` 导航 |
| **partialHint** | hydrate 部分失败时 status 条（与 Likes 同族） |

## 导航入口（均 → 本路径）

| 入口 | href |
|------|------|
| **顶栏用户菜单** | `/community/me/collects` |
| **资料卡笔记分段** | `CommunityMeAccountPanelNotesNav` |
| **Hub 抽屉「全页」链** | `fullPageHref="/community/me/collects"` |
| **QuickLinks** | `MeQuickLinksSection` · `CommunityMeQuickLinksDrawer` |

## 代码地图

| 文件 | 职责 |
|------|------|
| `page.tsx` | AuthGate + VM |
| `useCommunityMeCollectsPage.ts` | VM · uncollect 流 |
| `lib/useCommunityMeCollectsHydratedList.ts` | `getMeCollects` + 分批 hydrate |
| `CommunityMeCollectsPageMain.tsx` | thumb grid · partialHint |
| `CommunityMeCollectsPortals.tsx` | PostDetailDrawer · 取消收藏确认 |

## 已知限制（①）

- **`GET …/me/collects` ID 顶 100**（`COMMUNITY_ME_DRAWER_LIST_ID_CAP`）
- hydrate **24** / 批（`COMMUNITY_ME_COLLECTS_HYDRATE_PAGE_SIZE`）

## ① 机读绿集

```bash
cd frontend
npx vitest run app/community/me/posts/communityMePostsPage.contract.test.ts
npx playwright test e2e/community-me-l5-parity-closeout.spec.ts --project=chromium -g "collects"
```
