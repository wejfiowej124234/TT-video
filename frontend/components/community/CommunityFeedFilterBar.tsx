"use client";

import { useState, useEffect, useId, type FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { CommunityPostType } from "@/lib/communityMockData";
import type { FeedTab, SortBy, RegionKey } from "./communityFeedConstants";
import { TYPE_OPTIONS, REGION_KEYS, DESTINATION_LABEL_KEYS } from "./communityFeedConstants";
import {
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
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

  return (
    <>
      <div className="mb-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("community_search_placeholder")}
          className="w-full rounded-[var(--radius-xl)] border border-cyan-500/40 bg-slate-900/80 px-4 py-2.5 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          aria-label={t("community_search_placeholder")}
        />
      </div>

      <div
        className="sticky top-12 z-20 mb-3 flex items-center gap-4 border-b border-slate-600/80 bg-slate-900/90 backdrop-blur-md -mx-1 px-1"
        role="tablist"
        aria-label={t("community_title")}
      >
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
              className={`relative inline-flex min-h-[44px] items-end justify-center pb-2.5 pt-1 px-1 text-body font-semibold motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-[var(--radius-sm)] ${
                feedTab === tab ? "text-cyan-300" : "text-slate-300 hover:text-slate-300"
              }`}
            >
              {t(tab === "recommend" ? "community_feed_recommend" : "community_feed_following")}
              {feedTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" aria-hidden />
              )}
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
                className={`rounded-full border px-2.5 py-1 text-meta motion-sub min-h-[44px] inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                  sortBy === s
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-300"
                    : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-cyan-500/40 hover:text-slate-300"
                }`}
              >
                {t(s === "latest" ? "community_sort_latest" : "community_sort_hot")}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="mb-2 lg:hidden">
        <form
          className="block w-full"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setFiltersExpanded((v) => !v);
          }}
        >
          <button
            type="submit"
            className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-[var(--radius-xl)] border border-slate-600/70 bg-slate-800/70 px-3 py-2.5 text-meta font-medium text-slate-300 motion-sub hover:border-cyan-500/40 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            aria-expanded={filtersExpanded}
            aria-controls={chipFiltersRegionId}
          >
            <span className="flex items-center gap-2 min-w-0">
              <svg className="h-4 w-4 shrink-0 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="truncate">{t("community_filters_toggle")}</span>
              {chipFiltersActive ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-scifi-dot-glow" aria-hidden />
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
        className={`mb-3 space-y-3 lg:mb-4 ${filtersExpanded ? "block" : "hidden lg:block"}`}
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
              className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1.5 min-h-[44px] text-meta motion-sub ${communityFuchsiaPillFocus} ${
                typeFilter === "all"
                  ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-300"
                  : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-fuchsia-500/40 hover:text-slate-300"
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
                className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1.5 min-h-[44px] text-meta motion-sub ${communityFuchsiaPillFocus} ${
                  typeFilter === type
                    ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-300"
                    : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-fuchsia-500/40 hover:text-slate-300"
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
                className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1.5 min-h-[44px] text-meta motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                  regionFilter === key
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-300"
                    : "border-slate-600 bg-slate-800/60 text-slate-300 hover:text-slate-300"
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
                className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1.5 min-h-[44px] text-meta motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                  destinationFilter === "all"
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-300"
                    : "border-slate-600 bg-slate-800/60 text-slate-300 hover:text-slate-300"
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
                  className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1.5 min-h-[44px] text-meta motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                    destinationFilter === d
                      ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-300"
                      : "border-slate-600 bg-slate-800/60 text-slate-300 hover:text-slate-300"
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
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-800/50 px-3 py-2">
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
              className={`rounded-full border border-slate-500/60 bg-slate-700/60 px-2.5 py-1 text-meta text-slate-300 hover:text-slate-200 hover:bg-slate-600/60 motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
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
              className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
