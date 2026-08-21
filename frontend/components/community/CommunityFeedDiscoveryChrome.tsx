"use client";

import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { COMMUNITY_FEED_TAG_QUERY_MAX_LEN } from "@/lib/apiClient/community";
import {
  communityTopicTagExceedsFeedQueryLimit,
  normalizeCommunityTopicTagFromSearchInput,
} from "@/lib/communityFeedSortUrl";
import type { CommunityPost, CommunityPostType } from "@/lib/communityMockData";
import { CommunityFeedMobileHotStrip } from "@/components/community/CommunityFeedMobileHotStrip";
import {
  COMMUNITY_FEED_ANCHOR_POIS,
  communityFeedAnchorPoiLabel,
  type CommunityFeedAnchorPoiId,
} from "@/components/community/communityFeedAnchorPoi";
import type { CommunityFeedProximityFilter } from "@/components/community/communityFeedProximity";
import {
  applyCommunityDiscoveryFoodFilter,
  applyCommunityDiscoveryFunFilter,
  applyCommunityDiscoveryStayFilter,
  applyCommunityDiscoveryProximityFilter,
  applyCommunityDiscoveryStreamTab,
  communityDiscoverySecondaryFiltersActive,
  isCommunityDiscoveryFunTopicActive,
  isCommunityDiscoveryStayTopicActive,
} from "@/components/community/communityFeedDiscoveryQuickFilters";
import type { FeedTab, SortBy, RegionKey } from "./communityFeedConstants";
import {
  TYPE_OPTIONS,
  communityFeedDestinationLabel,
} from "./communityFeedConstants";
import { CommunityFeedDestinationPicker } from "@/components/community/CommunityFeedDestinationPicker";
import {
  FEED_STREAM_TABS,
  feedStreamTabFromState,
  type FeedStreamTab,
} from "./communityFeedStreamTab";
import { TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";
import {
  communityCardLinkFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { warmCommunityFeedMode } from "@/lib/communityFeedInfiniteQuery";
import { hasClientAuthSession } from "@/lib/communityDrawerPrefetch";
import { communityMeLikesReceivedQueryKey } from "@/lib/communityMeLikesReceivedContract";
import { getMeLikesReceived } from "@/lib/apiClient/community";

export interface CommunityFeedDiscoveryChromeProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
  feedTab: FeedTab;
  setFeedTab: (v: FeedTab) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  typeFilter: CommunityPostType | "all";
  setTypeFilter: (v: CommunityPostType | "all") => void;
  regionFilter: RegionKey;
  setRegionFilter: (v: RegionKey) => void;
  destinationFilter: string;
  setDestinationFilter: (v: string) => void;
  hotDestinations: string[];
  /** 与瀑布 / 热榜同源 · 移动热榜条 */
  feedPosts?: readonly CommunityPost[];
  tagFilter: string | null;
  setTagFilter: (v: string | null) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  feedError: string | null;
  onRefresh: () => void;
  onClearFilters: () => void;
  tagTopicMatchCount?: number;
  onPublishSubmit: (e: FormEvent<HTMLFormElement>) => void;
  anchorPoiId: CommunityFeedAnchorPoiId;
  setAnchorPoiId: (id: CommunityFeedAnchorPoiId) => void;
  proximityFilter: CommunityFeedProximityFilter;
  setProximityFilter: (v: CommunityFeedProximityFilter) => void;
  /** 搜索 Enter → 服务端话题 tag（与 FilterBar 同源） */
  onSearchApplyServerTag?: () => void;
  /** 机读：客户端滤已加载帖 + Enter 话题 · 或 `GET …/feed?q=` */
  feedSearchMode?: "client-filter-topic-v1" | "api-text-q-v1";
}

const STREAM_TAB_I18N: Record<FeedStreamTab, string> = {
  following: "community_feed_following",
  recommend: "community_feed_recommend",
  destination: "community_feed_stream_destination",
  hot: "community_feed_stream_hot",
};

function discoveryFilterChipClass(active: boolean): string {
  return `${TT_COMMUNITY_FEED_ACTION.filterChipBase} ${TT_COMMUNITY_FEED_L5.discoveryChipMotion} ${
    active
      ? `${TT_COMMUNITY_FEED_ACTION.filterChipActive} ${TT_COMMUNITY_FEED_L5.discoveryChipActivePop}`
      : TT_COMMUNITY_FEED_ACTION.filterChipIdle
  }`;
}

/** 发现页顶栏：四分类 Tab + 发帖/搜索 + 目的地与筛选 pill（TT 暖金 · 本地生活排版） */
export function CommunityFeedDiscoveryChrome({
  t,
  feedTab,
  setFeedTab,
  sortBy,
  setSortBy,
  typeFilter,
  setTypeFilter,
  regionFilter,
  setRegionFilter,
  destinationFilter,
  setDestinationFilter,
  hotDestinations,
  feedPosts = [],
  tagFilter,
  setTagFilter,
  searchQuery,
  setSearchQuery,
  feedError,
  onRefresh,
  onClearFilters,
  tagTopicMatchCount,
  onPublishSubmit,
  anchorPoiId,
  setAnchorPoiId,
  proximityFilter,
  setProximityFilter,
  onSearchApplyServerTag,
  feedSearchMode = "client-filter-topic-v1",
}: CommunityFeedDiscoveryChromeProps) {
  const queryClient = useQueryClient();

  const warmFeedSort = useCallback(
    (s: SortBy) => {
      warmCommunityFeedMode(queryClient, s === "hot" ? "hot" : "latest", tagFilter);
    },
    [queryClient, tagFilter],
  );

  const warmFeedStreamTab = useCallback(
    (tab: FeedStreamTab) => {
      if (tab === "following") {
        warmCommunityFeedMode(queryClient, "follow", tagFilter);
        return;
      }
      warmFeedSort(sortBy);
    },
    [queryClient, sortBy, tagFilter, warmFeedSort],
  );
  const chipFiltersRegionId = useId();
  const searchTopicHintId = useId();
  const searchTopicOverLimitId = useId();
  const topicTagFromSearch = useMemo(
    () => normalizeCommunityTopicTagFromSearchInput(searchQuery),
    [searchQuery],
  );
  const topicTagOverApiLimit = useMemo(
    () => communityTopicTagExceedsFeedQueryLimit(topicTagFromSearch),
    [topicTagFromSearch],
  );
  const searchAriaDescribedBy = onSearchApplyServerTag
    ? [searchTopicHintId, topicTagOverApiLimit ? searchTopicOverLimitId : null]
        .filter(Boolean)
        .join(" ") || undefined
    : undefined;
  const streamTab = feedStreamTabFromState(feedTab, sortBy, destinationFilter);

  const hasStreamContext = feedTab === "following" || sortBy === "hot";
  const hasActiveFilters =
    hasStreamContext ||
    destinationFilter !== "all" ||
    typeFilter !== "all" ||
    regionFilter !== "all" ||
    tagFilter !== null ||
    searchQuery.trim() !== "" ||
    proximityFilter !== "none";

  const chipFiltersActive =
    typeFilter !== "all" ||
    regionFilter !== "all" ||
    destinationFilter !== "all" ||
    tagFilter !== null;

  const secondaryFiltersActive = communityDiscoverySecondaryFiltersActive({
    regionFilter,
    destinationFilter,
    typeFilter,
    tagFilter,
    sortBy,
  });

  const discoveryReset = {
    setFeedTab,
    setSortBy,
    setDestinationFilter,
    setTypeFilter,
    setRegionFilter,
    setTagFilter,
    setProximityFilter,
    setSearchQuery,
  };

  const isNearbyFeed = proximityFilter === "nearby";
  const isFunTopicFeed = isCommunityDiscoveryFunTopicActive(tagFilter);
  const isStayTopicFeed = isCommunityDiscoveryStayTopicActive(tagFilter);
  const isRecommendNearbyMode =
    feedTab === "recommend" && sortBy === "latest" && proximityFilter !== "none";

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  useEffect(() => {
    if (secondaryFiltersActive || streamTab === "destination") setFiltersExpanded(true);
  }, [secondaryFiltersActive, streamTab]);

  const applyStreamTab = (tab: FeedStreamTab) => {
    applyCommunityDiscoveryStreamTab(discoveryReset, tab);
    if (tab === "destination") setFiltersExpanded(true);
  };

  const secondaryChipClass = "contents";

  return (
    <div className={TT_COMMUNITY_FEED_ACTION.discoveryChrome} data-testid="community-feed-discovery-chrome">
      <div
        className={TT_COMMUNITY_FEED_ACTION.discoveryCategoryRow}
        role="tablist"
        aria-label={t("community_title")}
      >
        {FEED_STREAM_TABS.map((tab) => (
          <form
            key={tab}
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              applyStreamTab(tab);
            }}
          >
            <button
              type="submit"
              role="tab"
              aria-selected={streamTab === tab || (tab === "recommend" && isRecommendNearbyMode)}
              onPointerEnter={() => warmFeedStreamTab(tab)}
              className={`text-body motion-sub ${TT_COMMUNITY_FEED_ACTION.feedTabFocus} ${TT_COMMUNITY_FEED_L5.discoveryTabIndicator} ${
                streamTab === tab || (tab === "recommend" && isRecommendNearbyMode)
                  ? TT_COMMUNITY_FEED_ACTION.discoveryCategoryTabActive
                  : TT_COMMUNITY_FEED_ACTION.discoveryCategoryTabIdle
              }`}
            >
              {t(STREAM_TAB_I18N[tab])}
            </button>
          </form>
        ))}
      </div>

      <div className={TT_COMMUNITY_FEED_ACTION.discoverySearchRow}>
        <div className={TT_COMMUNITY_FEED_ACTION.discoverySearchShell}>
          <Link
            href="/community/explore?scan=1"
            className={TT_COMMUNITY_FEED_L5.discoveryScanBtn}
            aria-label={t("community_discovery_scan")}
            title={t("community_discovery_scan_explore_hint")}
            data-testid="community-feed-scan-entry"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8h10v8H7z"
              />
            </svg>
          </Link>
          <form className="contents max-md:hidden" onSubmit={onPublishSubmit}>
            <button
              type="submit"
              className={TT_COMMUNITY_FEED_ACTION.discoveryPublishBtn}
              aria-label={t("community_publish")}
              title={t("community_publish_entry_hint")}
              data-testid="community-feed-publish-entry"
              data-tt-community-feed-publish-entry="1"
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className={TT_COMMUNITY_FEED_ACTION.discoveryPublishBtnLabel}>{t("community_publish")}</span>
            </button>
          </form>
          <form
            className="flex min-w-0 flex-1 items-stretch gap-2"
            data-tt-community-feed-search-mode={feedSearchMode}
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
            }}
          >
            <Link
              href="/community/activity"
              prefetch={true}
              onPointerEnter={() => {
                if (!hasClientAuthSession()) return;
                void queryClient.prefetchQuery({
                  queryKey: communityMeLikesReceivedQueryKey,
                  queryFn: getMeLikesReceived,
                  staleTime: 60_000,
                });
              }}
              className={TT_COMMUNITY_FEED_L5.discoveryActivityLink}
              title={t("community_discovery_activity_center")}
              aria-label={t("community_discovery_activity_center")}
              data-testid="community-feed-activity-center"
            >
              {t("community_discovery_activity_center")}
            </Link>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || !onSearchApplyServerTag) return;
                e.preventDefault();
                onSearchApplyServerTag();
              }}
              placeholder={t("community_search_placeholder")}
              className={TT_COMMUNITY_FEED_ACTION.discoverySearchInput}
              aria-label={t("community_search_placeholder")}
              aria-describedby={searchAriaDescribedBy}
            />
            <button
              type="button"
              className={TT_COMMUNITY_FEED_ACTION.discoverySearchBtn}
              onClick={() => onSearchApplyServerTag?.()}
            >
              {t("community_discovery_search_btn")}
            </button>
          </form>
        </div>
        {onSearchApplyServerTag ? (
          <p id={searchTopicHintId} className={TT_COMMUNITY_FEED_ACTION.discoverySearchHint}>
            {t("community_search_dual_mode_hint")}
            {topicTagOverApiLimit ? (
              <>
                {" · "}
                <span id={searchTopicOverLimitId} className="text-warning/95" role="status">
                  {t("community_search_topic_tag_over_limit", { n: COMMUNITY_FEED_TAG_QUERY_MAX_LEN })}
                </span>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <div
        className={TT_COMMUNITY_FEED_ACTION.discoveryFilterRow}
        role="group"
        aria-label={t("community_filter_type_aria")}
      >
        <div className={TT_COMMUNITY_FEED_ACTION.discoveryQuickFilterRow}>
        <div className={TT_COMMUNITY_FEED_ACTION.discoveryQuickFilterScroll}>
        <label className={TT_COMMUNITY_FEED_ACTION.discoveryDestinationPillWrap}>
          <span className="sr-only">{t("community_anchor_poi_label")}</span>
          <select
            value={anchorPoiId}
            onChange={(e) => setAnchorPoiId(e.target.value as CommunityFeedAnchorPoiId)}
            className={TT_COMMUNITY_FEED_L5.discoveryAnchorSelect}
            aria-label={t("community_anchor_poi_label")}
            data-testid="community-feed-anchor-poi"
          >
            {COMMUNITY_FEED_ANCHOR_POIS.map((poi) => (
              <option key={poi.id} value={poi.id}>
                {t(poi.labelKey)}
              </option>
            ))}
          </select>
          <svg
            className={TT_COMMUNITY_FEED_ACTION.discoveryDestinationChevron}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </label>

        <CommunityFeedDestinationPicker
          t={t}
          value={destinationFilter}
          onChange={(next) => {
            setDestinationFilter(next);
            if (next === "all") setRegionFilter("all");
            else setProximityFilter("none");
          }}
          onCitySelect={() => {
            setFeedTab("recommend");
            setRegionFilter("all");
            setProximityFilter("none");
          }}
          className="hidden md:block"
        />

        <div
          className={`${TT_COMMUNITY_FEED_ACTION.discoveryPillRow} ${filtersExpanded ? "" : "max-md:hidden"}`}
          aria-label={t("community_filter_type_aria")}
        >
          <form
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              applyCommunityDiscoveryProximityFilter(discoveryReset, "nearby");
            }}
          >
            <button type="submit" className={discoveryFilterChipClass(isNearbyFeed)}>
              {t("community_discovery_nearby")}
            </button>
          </form>
          <form
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              applyCommunityDiscoveryFunFilter(discoveryReset);
            }}
          >
            <button type="submit" className={discoveryFilterChipClass(isFunTopicFeed)}>
              {t("community_discovery_fun_chip")}
            </button>
          </form>
          <form
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              applyCommunityDiscoveryFoodFilter(discoveryReset);
            }}
          >
            <button type="submit" className={discoveryFilterChipClass(typeFilter === "food")}>
              {t("community_discovery_food_chip")}
            </button>
          </form>
          <form
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              applyCommunityDiscoveryStayFilter(discoveryReset);
            }}
          >
            <button type="submit" className={discoveryFilterChipClass(isStayTopicFeed)}>
              {t("community_discovery_stay_chip")}
            </button>
          </form>
        </div>
        </div>
          <form
            className="shrink-0"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setFiltersExpanded((v) => !v);
            }}
          >
            <button
              type="submit"
              className={TT_COMMUNITY_FEED_ACTION.discoveryFilterMoreBtn}
              aria-expanded={filtersExpanded}
              aria-controls={chipFiltersRegionId}
            >
              {filtersExpanded ? t("community_filters_collapse") : t("community_filters_toggle")}
              {chipFiltersActive ? (
                <span className={TT_COMMUNITY_FEED_ACTION.filterToggleDotActive} aria-hidden />
              ) : null}
            </button>
          </form>
        </div>

        <div
          className={`${TT_COMMUNITY_FEED_ACTION.discoveryTypeSortRow} ${filtersExpanded ? "" : "max-md:hidden"}`}
          aria-label={t("community_filter_type_aria")}
        >
          {(["latest", "hot"] as const).map((s) => (
            <form
              key={s}
              className={secondaryChipClass}
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setFeedTab("recommend");
                setSortBy(s);
              }}
            >
              <button
                type="submit"
                onPointerEnter={() => warmFeedSort(s)}
                className={discoveryFilterChipClass(feedTab === "recommend" && sortBy === s)}
              >
                {t(s === "latest" ? "community_sort_latest" : "community_sort_hot")}
              </button>
            </form>
          ))}
          <span className="mx-0.5 h-5 w-px shrink-0 bg-white/10" aria-hidden />
          <form
            className={secondaryChipClass}
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setTypeFilter("all");
            }}
          >
            <button type="submit" className={discoveryFilterChipClass(typeFilter === "all")}>
              {t("community_type_all")}
            </button>
          </form>
          {TYPE_OPTIONS.map((type) => (
            <form
              key={type}
              className={secondaryChipClass}
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setFeedTab("recommend");
                setTypeFilter(type);
              }}
            >
              <button type="submit" className={discoveryFilterChipClass(typeFilter === type)}>
                {t(`community_type_${type}`)}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div
        id={chipFiltersRegionId}
        className={`mb-1 space-y-3 px-3 pb-3 max-[390px]:px-2.5 ${filtersExpanded ? "block" : "hidden"}`}
      >
        {/* HU-035: sole geo entry on mobile expand — no parallel REGION_KEYS / hot-city rows */}
        <CommunityFeedDestinationPicker
          t={t}
          value={destinationFilter}
          onChange={(next) => {
            setDestinationFilter(next);
            if (next === "all") setRegionFilter("all");
            else setProximityFilter("none");
          }}
          onCitySelect={() => {
            setFeedTab("recommend");
            setRegionFilter("all");
            setProximityFilter("none");
          }}
          className="md:hidden block max-w-full w-full"
          showLabel
        />
      </div>

      {hasActiveFilters && (
        <div className={`${TT_COMMUNITY_FEED_ACTION.filterSummaryBar} mx-3 mb-3 max-[390px]:mx-2.5`}>
          <span className="text-meta text-slate-400">{t("community_filter_current")}:</span>
          <span className="text-meta text-slate-300">
            {[
              streamTab === "following"
                ? t("community_feed_following")
                : streamTab === "hot"
                  ? t("community_feed_stream_hot")
                  : streamTab === "destination"
                    ? t("community_feed_stream_destination")
                    : t("community_feed_recommend"),
              sortBy === "hot" ? t("community_sort_hot") : t("community_sort_latest"),
              regionFilter !== "all" ? t(`community_region_${regionFilter}`) : null,
              destinationFilter !== "all" ? communityFeedDestinationLabel(t, destinationFilter) : null,
              anchorPoiId ? communityFeedAnchorPoiLabel(anchorPoiId, t) : null,
              proximityFilter !== "none"
                ? proximityFilter === "nearby_1km"
                  ? t("community_discovery_nearby_1km")
                  : t("community_discovery_nearby")
                : null,
              typeFilter !== "all" ? t(`community_type_${typeFilter}`) : null,
              tagFilter
                ? `#${tagFilter}${
                    typeof tagTopicMatchCount === "number"
                      ? ` · ${t("community_tag_topic_count").replace("{{count}}", String(tagTopicMatchCount))}`
                      : ""
                  }`
                : null,
              searchQuery.trim()
                ? `「${searchQuery.trim().slice(0, 12)}${searchQuery.trim().length > 12 ? "…" : ""}」`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <form
            className="ml-auto inline"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              onClearFilters();
            }}
          >
            <button
              type="submit"
              className={`${TT_COMMUNITY_FEED_ACTION.asideGhostPill} ${communitySlatePillFocus}`}
            >
              {t("community_filter_clear")}
            </button>
          </form>
        </div>
      )}

      {streamTab === "recommend" && !tagFilter && hotDestinations.length > 0 ? (
        <CommunityFeedMobileHotStrip t={t} hotDestinations={hotDestinations} feedPosts={feedPosts} />
      ) : null}

      {feedError != null && (
        <div className="mx-3 mb-3 space-y-2 max-[390px]:mx-2.5" role="alert" aria-live="polite">
          <ApiErrorAlert message={feedError} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onRefresh();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
