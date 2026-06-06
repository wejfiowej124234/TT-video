import type { FormEvent, RefObject } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  CommunityPost,
  CommunityComment,
  CommunityPostAuthor,
  CommunityPostType,
} from "@/lib/communityMockData";
import type { FeedTab, SortBy, RegionKey } from "@/components/community/useCommunityFeedFilters";
import type { CommunityFeedPostDeepLinkAlert } from "@/components/community/communityFeedMainTypes";
import type { CommunityFeedAnchorPoiId } from "@/components/community/communityFeedAnchorPoi";
import type { CommunityFeedProximityFilter } from "@/components/community/communityFeedProximity";

/** `getPublicPostsByTagCount` 统计行（与 `CommunityFeedMain` 内 `useQuery` 切片一致） */
export type CommunityFeedMainTagStatsQuery = Pick<
  UseQueryResult<number | null, Error>,
  "data" | "isLoading" | "isFetching" | "isError" | "refetch"
>;

/** Props for the feed primary column inside `CommunityFeedMain` */
export interface CommunityFeedMainFeedColumnProps {
  t: (key: string) => string;
  refreshFeed: () => void;
  authLoading: boolean;
  isLoggedIn: boolean;
  communityLoginReturnUrl: string;
  postDeepLinkBusy: boolean;
  postDeepLinkAlert: CommunityFeedPostDeepLinkAlert;
  dismissPostDeepLinkIssue: () => void;
  retryPostDeepLinkFetch: () => void;
  tagFilter: string | null;
  searchFilteredPosts: CommunityPost[];
  clearTopicOnly: () => void;
  tagStatsQ: CommunityFeedMainTagStatsQuery;
  openPublishFromForm: (e: FormEvent<HTMLFormElement>) => void;
  feedTab: FeedTab;
  setFeedTab: (tab: FeedTab) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  typeFilter: CommunityPostType | "all";
  setTypeFilter: (filter: CommunityPostType | "all") => void;
  regionFilter: RegionKey;
  setRegionFilter: (region: RegionKey) => void;
  destinationFilter: string;
  setDestinationFilter: (destination: string) => void;
  hotDestinations: readonly string[];
  setTagFilter: (tag: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  feedError: string | null;
  clearFilters: () => void;
  applySearchAsTopicTag: () => void;
  feedSearchMode?: "client-filter-topic-v1" | "api-text-q-v1";
  anchorPoiId: CommunityFeedAnchorPoiId;
  setAnchorPoiId: (id: CommunityFeedAnchorPoiId) => void;
  proximityFilter: CommunityFeedProximityFilter;
  setProximityFilter: (v: CommunityFeedProximityFilter) => void;
  meCollectsLoadError: string | null;
  retryMeCollectsLoad: () => void;
  pullY: number;
  feedLoading: boolean;
  postsToShow: CommunityPost[];
  localCommentsByPostId: Record<string, CommunityComment[]>;
  apiCommentsByPostId: Record<string, CommunityComment[]>;
  hasMore: boolean;
  feedLoadingMore: boolean;
  hrefTopicPathForTag: (tag: string) => string;
  likedPostIds: Set<string>;
  collectedPostIds: Set<string>;
  handleLike: (postId: string, hint?: { serverLiked?: boolean }) => void | Promise<void>;
  handleCollect: (postId: string, hint?: { serverCollected?: boolean }) => void | Promise<void>;
  handleLoadMore: () => void;
  openPostDetail: (post: CommunityPost, trigger?: HTMLElement | null, focusComments?: boolean) => void;
  handleReport: (post: CommunityPost) => void;
  openPublish: (trigger?: HTMLElement | null) => void;
  meUserId: string | null;
  followingAuthorIdSet: Set<string>;
  followBusyAuthorId: string | null;
  handleAuthorFollowToggle: (authorId: string) => void | Promise<void>;
  setShowLoginModal: (open: boolean) => void;
}

export interface CommunityFeedMainShellProps extends CommunityFeedMainFeedColumnProps {
  desktopSuggestedAuthors: CommunityPostAuthor[];
  showLoginModal: boolean;
  loginBackButtonRef: RefObject<HTMLButtonElement | null>;
}
