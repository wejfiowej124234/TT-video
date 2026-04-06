# Community

潮流社区：Feed 动态流、发帖、评论、详情抽屉、视频浮层、登录弹层等。43 阶段将 Feed 页逻辑抽至 useCommunityFeed，页面仅做组合。

## 入口与对外

- **页面**：`app/community/page.tsx`（约 244 行，消费 useCommunityFeed，组合 Header/FilterBar/List/抽屉/弹层）
- **Feed 逻辑**：`useCommunityFeed.ts`（状态、筛选、分页、评论/发帖/详情/视频/登录、焦点与 a11y）

## 主要模块

| 路径 | 职责 |
|------|------|
| `useCommunityFeed.ts` | Feed 状态、tab/排序/类型/地区/目的地/标签/搜索、分页、评论/发帖/详情/视频/登录、toast、焦点还原 |
| `communityFeedConstants.ts` | FeedTab、SortBy、RegionKey、DESTINATION_BY_REGION、FEED_PAGE_SIZE、TRAVEL_IMG |
| `CommunityFeedHeader.tsx` | 顶部标题、刷新 |
| `CommunityFeedFilterBar.tsx` | 推荐/关注、排序、类型、地区、目的地、标签、搜索、错误态与刷新/清空 |
| `CommunityFeedList.tsx` | 帖子列表、加载更多、空态、骨架、评论/详情/视频/发帖入口 |
| `PublishDrawer/` | 发帖抽屉（见 PublishDrawer/README.md） |
| `CommentDrawer.tsx` | 评论抽屉 |
| `PostDetailDrawer.tsx` | 帖子详情抽屉 |
| `CommunityLoginModal.tsx` | 未登录时发帖/评论触发的登录弹层 |
| `CommunityVideoOverlay.tsx` | 视频全屏浮层 |
| `CommunityAuthContext.tsx` | 社区登录态 |
| `CommunityPublishContext.tsx` | 注册「打开发帖」的全局入口（如底部导航） |

## 依赖方向

- app/community/page → useCommunityFeed、各 Header/FilterBar/List/抽屉/弹层
- useCommunityFeed → communityFeedConstants、communityMockData、CommunityAuthContext、CommunityPublishContext
- 各 UI 组件 → types、constants、i18n
