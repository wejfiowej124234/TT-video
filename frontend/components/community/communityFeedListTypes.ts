import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";

export interface CommunityFeedListProps {
  t: (key: string) => string;
  feedLoading: boolean;
  isEmpty: boolean;
  isEmptySearch: boolean;
  feedTab: "recommend" | "following";
  isLoggedIn: boolean;
  postsToShow: CommunityPost[];
  localCommentsByPostId: Record<string, CommunityComment[]>;
  /** 与 **`useCommunityDrawerCommentsQuery`** 同源：抽屉已拉取的线程，用于卡片评论数与分页 / 快照对齐 */
  apiCommentsByPostId?: Record<string, CommunityComment[]>;
  hasMore: boolean;
  feedLoadingMore: boolean;
  tagFilter: string | null;
  setTagFilter: (v: string | null) => void;
  setFeedTab: (v: "recommend" | "following") => void;
  setSearchQuery: (v: string) => void;
  likedPostIds?: Set<string>;
  collectedPostIds?: Set<string>;
  onLike?: (postId: string) => void;
  onCollect?: (postId: string) => void;
  onLoadMore: () => void;
  onViewFull: (post: CommunityPost, trigger?: HTMLElement | null) => void;
  onCommentClick: (post: CommunityPost, trigger?: HTMLElement | null) => void;
  onPlayVideo: ((post: CommunityPost, trigger?: HTMLElement | null) => void) | undefined;
  onReport: (post: CommunityPost) => void;
  /** 空列表「发帖」：传入 `SubmitEvent.submitter` 以恢复焦点 */
  onPublishClick: (trigger?: HTMLElement | null) => void;
  /** 大屏单列卡：与 `getMeFollowing` + follow API 对齐（04 §3.4） */
  meUserId?: string | null;
  followingAuthorIds?: ReadonlySet<string>;
  followBusyAuthorId?: string | null;
  onAuthorFollowToggle?: (authorId: string) => void;
  /** 31 §2.1：话题筛选时展示当前列表匹配总数（与 searchFilteredPosts 一致） */
  tagTopicMatchCount?: number;
  /** B-077：紧凑卡话题链与 Feed `sort=` 一致 */
  topicTagHref?: (tag: string) => string;
  /** 推荐流排序（瀑布 promo 插槽显隐） */
  sortBy?: "latest" | "hot";
  /** 侧栏/发现页同源热门目的地（瀑布热榜插槽） */
  hotDestinations?: readonly string[];
  /** 未登录 + 关注 Tab 空态：打开登录弹层（与 04「`mode=follow` 需登录」同源） */
  onFollowingEmptyGuestLogin?: () => void;
  /** 附近 / 1km 筛选 · 空列表专用文案 */
  proximityFilter?: "none" | "nearby" | "nearby_1km";
  setProximityFilter?: (v: "none" | "nearby" | "nearby_1km") => void;
}
