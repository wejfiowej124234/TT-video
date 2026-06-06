"use client";

/**
 * @deprecated 主 Feed 已改用 `CommunityFeedDiscoveryChrome`（`/community` · 2026-05+）。
 * 保留供 contract / 历史引用；新功能勿接入。
 */

import { useState, useEffect, useId, useMemo, type FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { CommunityPostType } from "@/lib/communityMockData";
import type { FeedTab, SortBy, RegionKey } from "./communityFeedConstants";
import { TYPE_OPTIONS, REGION_KEYS, DESTINATION_LABEL_KEYS } from "./communityFeedConstants";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import {
  communityCardLinkFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";

export interface CommunityFeedFilterBarProps {
  t: (key: string) => string;
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
  tagFilter: string | null;
  setTagFilter: (v: string | null) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  /** 非 null 时展示 Feed 拉取失败（已为本地化全文，可含 login/限流等映射） */
  feedError: string | null;
  onRefresh: () => void;
  onClearFilters: () => void;
  /** 与 Feed 列表一致：话题筛选时的匹配条数 */
  tagTopicMatchCount?: number;
  /** 桌面搜索已并入 composer 行时隐藏此处搜索框 */
  hideSearchRow?: boolean;
}

/** 主 Tab：推荐/关注 + 排序；类型/地区/目的地筛选；当前筛选汇总与清除；Feed 错误与重试 */
export default function CommunityFeedFilterBar({
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
  tagFilter,
  setTagFilter,
  searchQuery,
  setSearchQuery,
  feedError,
  onRefresh,
  onClearFilters,
  tagTopicMatchCount,
  hideSearchRow = false,
}: CommunityFeedFilterBarProps) {
  const chipFiltersRegionId = useId();
  const hasStreamContext = feedTab === "following" || sortBy === "hot";
  const hasActiveFilters =
    hasStreamContext ||
    destinationFilter !== "all" ||
    typeFilter !== "all" ||
    regionFilter !== "all" ||
    tagFilter !== null ||
    searchQuery.trim() !== "";

  const chipFiltersActive =
    typeFilter !== "all" ||
    regionFilter !== "all" ||
    destinationFilter !== "all" ||
    tagFilter !== null;

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  useEffect(() => {
    if (chipFiltersActive) setFiltersExpanded(true);
  }, [chipFiltersActive]);

  const filterToggleSummary = useMemo(() => {
    if (
      typeFilter === "all" &&
      regionFilter === "all" &&
      destinationFilter === "all" &&
      sortBy === "latest" &&
      !tagFilter &&
      !searchQuery.trim()
    ) {
      return t("community_filters_toggle");
    }
    const typeLabel =
      typeFilter === "all" ? t("community_type_all") : t(`community_type_${typeFilter}`);
    const regionLabel = t(`community_region_${regionFilter}`);
    const sortLabel = t(sortBy === "latest" ? "community_sort_latest" : "community_sort_hot");
    return `${typeLabel} · ${regionLabel} · ${sortLabel}`;
  }, [t, typeFilter, regionFilter, destinationFilter, sortBy, tagFilter, searchQuery]);

  return (
    <>
      {!hideSearchRow ? (
        <div className={TT_COMMUNITY_FEED_ACTION.searchWrap}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("community_search_placeholder")}
            className={TT_COMMUNITY_FEED_ACTION.searchInput}
            aria-label={t("community_search_placeholder")}
          />
        </div>
      ) : null}

      <div className={TT_COMMUNITY_FEED_ACTION.feedTabBar} role="tablist" aria-label={t("community_title")}>
        {(["recommend", "following"] as const).map((tab) => (
          <form
            key={tab}
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setFeedTab(tab);
            }}
          >
            <button
              type="submit"
              role="tab"
              aria-selected={feedTab === tab}
              className={`text-body motion-sub ${TT_COMMUNITY_FEED_ACTION.feedTabFocus} ${
                feedTab === tab ? TT_COMMUNITY_FEED_ACTION.feedTabActive : TT_COMMUNITY_FEED_ACTION.feedTabIdle
              }`}
            >
              {t(tab === "recommend" ? "community_feed_recommend" : "community_feed_following")}
            </button>
          </form>
        ))}
        <div className="ml-auto flex gap-1.5">
          {(["latest", "hot"] as const).map((s) => (
            <form
              key={s}
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setSortBy(s);
              }}
            >
              <button
                type="submit"
                className={`${TT_COMMUNITY_FEED_ACTION.sortChipBase} ${
                  sortBy === s ? TT_COMMUNITY_FEED_ACTION.sortChipActive : TT_COMMUNITY_FEED_ACTION.sortChipIdle
                }`}
              >
                {t(s === "latest" ? "community_sort_latest" : "community_sort_hot")}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className={TT_COMMUNITY_FEED_ACTION.filterToggleWrap}>
        <form
          className="block w-full"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setFiltersExpanded((v) => !v);
          }}
        >
          <button
            type="submit"
            className={TT_COMMUNITY_FEED_ACTION.filterToggle}
            aria-expanded={filtersExpanded}
            aria-controls={chipFiltersRegionId}
          >
            <span className="flex items-center gap-2 min-w-0">
              <svg className={TT_COMMUNITY_FEED_ACTION.filterToggleIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="truncate text-slate-400">
                {filtersExpanded ? t("community_filters_toggle") : filterToggleSummary}
              </span>
              {chipFiltersActive ? (
                <span className={TT_COMMUNITY_FEED_ACTION.filterToggleDotActive} aria-hidden />
              ) : null}
            </span>
            <svg
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${filtersExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </form>
      </div>

      <div
        id={chipFiltersRegionId}
        className={`mb-3 space-y-3 lg:mb-4 ${filtersExpanded ? "block" : "hidden"}`}
      >
      <div className="-mx-3 px-3 overflow-x-auto overflow-y-hidden scrollbar-hide" aria-label={t("community_filter_type_aria")}>
        <div className="flex gap-2 pb-1 min-w-max">
          <form
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setTypeFilter("all");
            }}
          >
            <button
              type="submit"
              className={`${TT_COMMUNITY_FEED_ACTION.filterChipBase} ${
                typeFilter === "all" ? TT_COMMUNITY_FEED_ACTION.filterChipActive : TT_COMMUNITY_FEED_ACTION.filterChipIdle
              }`}
            >
              {t("community_type_all")}
            </button>
          </form>
          {TYPE_OPTIONS.map((type) => (
            <form
              key={type}
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setTypeFilter(type);
              }}
            >
              <button
                type="submit"
                className={`${TT_COMMUNITY_FEED_ACTION.filterChipBase} ${
                  typeFilter === type ? TT_COMMUNITY_FEED_ACTION.filterChipActive : TT_COMMUNITY_FEED_ACTION.filterChipIdle
                }`}
              >
                {t(`community_type_${type}`)}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="-mx-3 px-3 overflow-x-auto overflow-y-hidden scrollbar-hide" aria-label={t("community_region_filter")}>
        <div className="flex gap-2 pb-1 min-w-max">
          {REGION_KEYS.map((key) => (
            <form
              key={key}
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setRegionFilter(key);
                setDestinationFilter("all");
              }}
            >
              <button
                type="submit"
                className={`${TT_COMMUNITY_FEED_ACTION.filterChipBase} ${
                  regionFilter === key ? TT_COMMUNITY_FEED_ACTION.filterChipActive : TT_COMMUNITY_FEED_ACTION.filterChipIdle
                }`}
              >
                {t(`community_region_${key}`)}
              </button>
            </form>
          ))}
        </div>
      </div>

      {hotDestinations.length > 0 && (
        <div className="-mx-3 px-3 overflow-x-auto overflow-y-hidden scrollbar-hide" aria-label={t("community_hot_destinations")}>
          <div className="flex gap-2 pb-1 min-w-max">
            <form
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setDestinationFilter("all");
              }}
            >
              <button
                type="submit"
                className={`${TT_COMMUNITY_FEED_ACTION.filterChipBase} ${
                  destinationFilter === "all"
                    ? TT_COMMUNITY_FEED_ACTION.filterChipActive
                    : TT_COMMUNITY_FEED_ACTION.filterChipIdle
                }`}
              >
                {t("community_destination_all")}
              </button>
            </form>
            {hotDestinations.map((d) => (
              <form
                key={d}
                className="contents"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  setDestinationFilter(d);
                }}
              >
                <button
                  type="submit"
                  className={`${TT_COMMUNITY_FEED_ACTION.filterChipBase} ${
                    destinationFilter === d
                      ? TT_COMMUNITY_FEED_ACTION.filterChipActive
                      : TT_COMMUNITY_FEED_ACTION.filterChipIdle
                  }`}
                >
                  {d}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
      </div>

      {hasActiveFilters && (
        <div className={TT_COMMUNITY_FEED_ACTION.filterSummaryBar}>
          <span className="text-meta text-slate-400">{t("community_filter_current")}:</span>
          <span className="text-meta text-slate-300">
            {[
              feedTab === "following" ? t("community_feed_following") : t("community_feed_recommend"),
              sortBy === "hot" ? t("community_sort_hot") : t("community_sort_latest"),
              regionFilter !== "all" ? t(`community_region_${regionFilter}`) : null,
              destinationFilter !== "all" ? (DESTINATION_LABEL_KEYS[destinationFilter] ? t(DESTINATION_LABEL_KEYS[destinationFilter]) : destinationFilter) : null,
              typeFilter !== "all" ? t(`community_type_${typeFilter}`) : null,
              tagFilter
                ? `#${tagFilter}${
                    typeof tagTopicMatchCount === "number"
                      ? ` · ${t("community_tag_topic_count").replace("{{count}}", String(tagTopicMatchCount))}`
                      : ""
                  }`
                : null,
              searchQuery.trim() ? `「${searchQuery.trim().slice(0, 12)}${searchQuery.trim().length > 12 ? "…" : ""}」` : null,
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

      {feedError != null && (
        <div className="mb-4 space-y-2" role="alert" aria-live="polite">
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
    </>
  );
}
