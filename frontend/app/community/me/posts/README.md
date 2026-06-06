# `/community/me/posts` · ① 本地 · 我的社区帖子（独立页）

**阶段：① 本地** — 全量管理 **UGC 帖子**；Hub 玻璃抽屉为预览，已登录用户由 Hub `?tab=posts` **redirect** 至本页。

**L5 冻结 SSOT：** [`evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md`](../../../evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md) · Hub [`../README.md`](../README.md)

---

## 路由与 AuthGate

| 项 | 值 |
|----|-----|
| **规范路径** | `/community/me/posts` · `?vis=` 可见性筛选（`all` / `public` / `private` / `archived`） |
| **机读** | `data-tt-community-me-posts-page="1"` |
| **AuthGate** | `CommunityMeDedicatedPageAuthGate` · `community_me_posts_auth_gate` |
| **login `returnUrl`** | `/community/me/posts`（保留 query） |

## 与 Hub 抽屉 parity

| 面 | 实现 |
|----|------|
| **独立页** | `useCommunityMePostsPage` → `CommunityMePostsPageMain` + `CommunityMePostsPortals` |
| **Hub 抽屉** | `useCommunityMePostsExperience` → `CommunityMePostsExperiencePortals` |
| **PostDetailDrawer** | 内联 · **禁止** `router.push('/community/post/…')` |

## 导航入口（均 → 本路径）

| 入口 | href |
|------|------|
| **顶栏用户菜单** | `/community/me/posts` · `header_userMenuNavModel` |
| **资料卡笔记分段** | `CommunityMeAccountPanelNotesNav` |
| **Hub 抽屉「全页」链** | `CommunityMeNotesGlassDrawer` · `fullPageHref="/community/me/posts"` |
| **QuickLinks / 快捷抽屉** | `MeQuickLinksSection` · `CommunityMeQuickLinksDrawer`（非 `compactForCommunityMe` 时） |

## 代码地图

| 文件 | 职责 |
|------|------|
| `page.tsx` | AuthGate + VM 挂载 |
| `useCommunityMePostsPage.ts` | 页 VM · session pin · vis filter URL |
| `useCommunityMePostsPageMyPostsQuery.ts` | `getMyPosts` cursor 分页 |
| `CommunityMePostsPageMain.tsx` | 页身 grid |
| `CommunityMePostsPortals.tsx` | PostDetailDrawer · 删除确认 · 举报 |

## 已知限制（①）

- 首屏 **`limit=30`** · cursor load-more（`COMMUNITY_ME_POSTS_LIST_PAGE_SIZE`）
- API `limit` 顶 **100** · 触顶提示见 `community_me_posts_page_truncated_hint`

## ① 机读绿集

```bash
cd frontend
npx vitest run app/community/me/posts/communityMePostsPage.contract.test.ts
npx playwright test e2e/community-me-l5-parity-closeout.spec.ts e2e/community-me-dedicated-l5.spec.ts --project=chromium -g "posts"
```
