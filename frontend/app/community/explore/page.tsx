"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, type FormEvent } from "react";
import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import {
  DESTINATION_BY_REGION,
  DESTINATION_LABEL_KEYS,
  REGION_KEYS,
} from "@/components/community/communityFeedConstants";
import { mapApiPostToCommunityPost, type ApiPostInput } from "@/components/community/communityFeedMappers";
import { communityStoredRolePillClassName } from "@/components/community/communityFeedMappers";
import { suggestedAuthorsFromPosts } from "@/components/community/communitySuggestedAuthors";
import {
  CommunityExplorePhotoMasonry,
  COMMUNITY_EXPLORE_MASONRY_DEFAULT_MAX,
} from "@/components/community/CommunityExplorePhotoMasonry";
import { communityFeedDegradedMessage } from "@/lib/communityFeedDegradedMessage";
import { parseCommunityFeedPageEnvelope } from "@/lib/communityFeedPageEnvelope";
import { getFeed, getMeFollowing } from "@/lib/apiClient/community";
import { getMeFull } from "@/lib/apiClient/me";
import { countCommunityMeSocialList } from "@/lib/communityMeSocialListsContract";
import { userFromGetMePayload } from "@/lib/meTrust";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
  communitySlatePillFocus,
  communityWarningPillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";

/** 31 §2.1 P3：发现页——热门目的地入口（`?destination=`）+ 话题入口（`/community/topic/…`）+ 推荐作者网格；`pathTag` 与历史分享 URL 一致，标签文案走 i18n。 */
const EXPLORE_TOPIC_LINKS = [
  { pathTag: "旅行", labelKey: "community_explore_topic_label_travel" },
  { pathTag: "美食", labelKey: "community_explore_topic_label_food" },
  { pathTag: "摄影", labelKey: "community_explore_topic_label_photo" },
  { pathTag: "攻略", labelKey: "community_explore_topic_label_guide" },
] as const;

const EXPLORE_FEED_STALE_MS = 60_000;
const EXPLORE_FEED_PAGE_SIZE = 24;
/** 瀑布流缩略图上限：首屏 + 每多一页 +24，封顶 120 */
const EXPLORE_MASONRY_CAP_MAX = 120;
const EXPLORE_MASONRY_MORE_PER_PAGE = 24;

export default function CommunityExplorePage() {
  const { t } = useTranslation();
  const exploreTopicsHeadingId = useId();
  const exploreMasonryHeadingId = useId();
  const exploreAuthorsHeadingId = useId();
  const exploreDestHeadingId = useId();
  const exploreLoadSentinelRef = useRef<HTMLDivElement>(null);

  const feedInfinite = useInfiniteQuery({
    queryKey: ["community", "exploreFeed"],
    staleTime: EXPLORE_FEED_STALE_MS,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      getFeed({
        limit: EXPLORE_FEED_PAGE_SIZE,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (last) => {
      const parsed = parseCommunityFeedPageEnvelope(last);
      if (parsed.kind !== "ok") return undefined;
      const c = parsed.nextCursor;
      return c != null && c.length > 0 ? c : undefined;
    },
  });

  const [meQ, followingQ] = useQueries({
    queries: [
      { queryKey: ["community", "exploreMe", "meFull"], queryFn: () => getMeFull(), staleTime: EXPLORE_FEED_STALE_MS },
      {
        queryKey: ["community", "exploreFollowing"],
        queryFn: getMeFollowing,
        staleTime: EXPLORE_FEED_STALE_MS,
      },
    ],
  });

  const regionBlocks = useMemo(() => {
    return REGION_KEYS.filter((k) => k !== "all").map((regionKey) => ({
      regionKey,
      destinations: DESTINATION_BY_REGION[regionKey] ?? [],
    }));
  }, []);

  const posts = useMemo(() => {
    const pages = feedInfinite.data?.pages ?? [];
    const seen = new Set<string>();
    const raw: ApiPostInput[] = [];
    for (const page of pages) {
      const parsed = parseCommunityFeedPageEnvelope(page);
      if (parsed.kind === "invalid") continue;
      for (const row of parsed.posts as ApiPostInput[]) {
        const id = row?.id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        raw.push(row);
      }
    }
    return raw.map(mapApiPostToCommunityPost);
  }, [feedInfinite.data]);

  const feedPageCount = feedInfinite.data?.pages.length ?? 0;
  const masonryMaxThumbs = Math.min(
    COMMUNITY_EXPLORE_MASONRY_DEFAULT_MAX + Math.max(0, feedPageCount - 1) * EXPLORE_MASONRY_MORE_PER_PAGE,
    EXPLORE_MASONRY_CAP_MAX
  );

  const meId = userFromGetMePayload(meQ.data)?.id ?? null;

  const followingEnvelopeInvalid = useMemo(() => {
    if (!followingQ.isSuccess || followingQ.data == null) return false;
    return countCommunityMeSocialList(followingQ.data, "following").kind === "invalid";
  }, [followingQ.isSuccess, followingQ.data]);

  const followingIds = useMemo(() => {
    const d = followingQ.data;
    if (d == null) return new Set<string>();
    const p = countCommunityMeSocialList(d, "following");
    if (p.kind !== "ok") return new Set<string>();
    const raw = (d as { following: { id?: string }[] }).following;
    return new Set(raw.map((x) => x.id).filter((id): id is string => typeof id === "string" && id.length > 0));
  }, [followingQ.data]);

  const suggestedAuthors = useMemo(
    () => suggestedAuthorsFromPosts(posts, { meUserId: meId, followingAuthorIds: followingIds, max: 9 }),
    [posts, meId, followingIds]
  );

  const authorsLoading = feedInfinite.isPending || meQ.isLoading || followingQ.isLoading;

  const {
    isError: exploreFeedError,
    hasNextPage: exploreHasNext,
    isFetchingNextPage: exploreFetchingNext,
    isPending: explorePending,
    data: exploreData,
    fetchNextPage: exploreFetchNext,
    refetch: exploreFeedRefetch,
  } = feedInfinite;

  const exploreFeedDegradedBanner = useMemo(() => {
    const pages = exploreData?.pages ?? [];
    for (const page of pages) {
      const parsed = parseCommunityFeedPageEnvelope(page);
      if (parsed.kind === "degraded") {
        return communityFeedDegradedMessage(parsed.envelope, t);
      }
    }
    return null;
  }, [exploreData?.pages, t]);

  const exploreFeedContractInvalid = useMemo(() => {
    const pages = exploreData?.pages ?? [];
    return pages.some((page) => parseCommunityFeedPageEnvelope(page).kind === "invalid");
  }, [exploreData?.pages]);

  /** 31 §3.2：瀑布流区块近底自动拉取下一页（与手动「加载更多」并存） */
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    if (exploreFeedError || !exploreHasNext || exploreFetchingNext) return;
    if (explorePending && !exploreData) return;
    const node = exploreLoadSentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        if (typeof navigator !== "undefined" && !navigator.onLine) return;
        void exploreFetchNext();
      },
      { root: null, rootMargin: "240px 0px 0px 0px", threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [exploreFeedError, exploreHasNext, exploreFetchingNext, explorePending, exploreData, exploreFetchNext]);

  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      aria-label={t("community_explore_title")}
    >
      <header className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-ink-800/60 backdrop-blur-md px-4 py-5 mb-4 text-slate-200">
        <h1 className="text-h3 font-bold bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
          {t("community_explore_title")}
        </h1>
        <p className="text-small text-slate-300 mt-1">{t("community_explore_subtitle")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/community"
            className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
          >
            {t("community_explore_open_feed")}
          </Link>
          <Link
            href="/terms/community-guidelines"
            className={`rounded-full border border-slate-500/60 bg-ink-700/60 px-4 py-2 text-meta text-slate-300 hover:bg-ink-600/60 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
          >
            {t("community_guidelines")}
          </Link>
          <Link
            href="/community/me/reports"
            title={t("community_explore_reports_link_hint")}
            className={`rounded-full border border-white/35 bg-warning/20 px-4 py-2 text-meta font-medium text-white hover:bg-warning/30 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityWarningPillFocus}`}
          >
            {t("community_me_my_reports")}
          </Link>
        </div>
      </header>

      {exploreFeedDegradedBanner ? (
        <div className="mb-4" role="status" aria-live="polite">
          <ApiErrorAlert message={exploreFeedDegradedBanner} tone="dark" />
        </div>
      ) : null}

      {exploreFeedContractInvalid ? (
        <div className="mb-4 space-y-2" role="alert" aria-live="polite">
          <ApiErrorAlert message={t("api_list_items_contract_error")} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void exploreFeedRefetch();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}

      <section
        className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-800/70 backdrop-blur-md p-4 mb-4"
        aria-labelledby={exploreTopicsHeadingId}
      >
        <h2 id={exploreTopicsHeadingId} className="text-body font-semibold text-slate-200 mb-3">
          {t("community_explore_section_topics")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {EXPLORE_TOPIC_LINKS.map(({ pathTag, labelKey }) => (
            <Link
              key={pathTag}
              href={`/community/topic/${encodeURIComponent(pathTag)}`}
              className={`rounded-full border border-cyan-500/45 bg-ink-700/60 px-3 py-1.5 text-meta text-cyan-200 hover:text-cyan-100 hover:bg-cyan-500/15 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
            >
              #{t(labelKey)}
            </Link>
          ))}
        </div>
      </section>

      <section
        className="rounded-[var(--radius-md)] border border-violet-500/30 bg-ink-800/70 backdrop-blur-md p-4 mb-4"
        aria-labelledby={exploreMasonryHeadingId}
      >
        <h2 id={exploreMasonryHeadingId} className="text-body font-semibold text-slate-200 mb-1">
          {t("community_explore_section_masonry")}
        </h2>
        <p className="text-meta text-slate-400 mb-3">{t("community_explore_masonry_subtitle")}</p>
        {feedInfinite.isError ? (
          <div className="space-y-3 py-4" role="alert">
            <ApiErrorAlert message={mapApiReadError(feedInfinite.error, t, "community_error_feed")} tone="dark" />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void feedInfinite.refetch();
              }}
            >
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        ) : (
          <>
            <CommunityExplorePhotoMasonry
              posts={posts}
              t={t}
              loading={feedInfinite.isPending}
              maxThumbs={masonryMaxThumbs}
              emptyActions={
                <>
                  <Link
                    href="/community"
                    className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
                  >
                    {t("community_explore_open_feed")}
                  </Link>
                  {EXPLORE_TOPIC_LINKS.map(({ pathTag, labelKey }) => (
                    <Link
                      key={pathTag}
                      href={`/community/topic/${encodeURIComponent(pathTag)}`}
                      className={`rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 py-2 text-meta text-fuchsia-100 hover:text-fuchsia-100 hover:bg-fuchsia-500/25 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityFuchsiaPillFocus}`}
                    >
                      #{t(labelKey)}
                    </Link>
                  ))}
                </>
              }
            />
            {feedInfinite.hasNextPage ? (
              <>
                <div ref={exploreLoadSentinelRef} className="h-px w-full shrink-0" aria-hidden />
                <form
                  className="mt-4 flex justify-center"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    void feedInfinite.fetchNextPage();
                  }}
                >
                  <button
                    type="submit"
                    disabled={feedInfinite.isFetchingNextPage}
                    aria-busy={feedInfinite.isFetchingNextPage ? true : undefined}
                    aria-label={feedInfinite.isFetchingNextPage ? t("common_loading") : t("community_explore_load_more")}
                    className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-5 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none disabled:opacity-50 min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
                  >
                    {feedInfinite.isFetchingNextPage ? t("common_loading") : t("community_explore_load_more")}
                  </button>
                </form>
              </>
            ) : null}
          </>
        )}
      </section>

      <section
        className="rounded-[var(--radius-md)] border border-success/25 bg-ink-800/70 backdrop-blur-md p-4 mb-4"
        aria-labelledby={exploreAuthorsHeadingId}
      >
        <h2 id={exploreAuthorsHeadingId} className="text-body font-semibold text-slate-200 mb-1">
          {t("community_explore_section_authors")}
        </h2>
        <p className="text-meta text-slate-400 mb-3">{t("community_explore_authors_subtitle")}</p>
        {followingEnvelopeInvalid ? (
          <div className="mb-3 space-y-2" role="status" aria-live="polite">
            <ApiErrorAlert message={t("api_list_items_contract_error")} tone="dark" />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void followingQ.refetch();
              }}
            >
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        ) : null}
        {authorsLoading ? (
          <div className="py-6 flex justify-center" aria-busy="true" aria-label={t("common_loading")}>
            <LoadingText className="text-slate-300" />
          </div>
        ) : exploreFeedError && posts.length === 0 ? (
          <div className="space-y-3 py-2" role="alert" aria-live="polite">
            <ApiErrorAlert message={mapApiReadError(feedInfinite.error, t, "community_error_feed")} tone="dark" />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void feedInfinite.refetch();
              }}
            >
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        ) : suggestedAuthors.length === 0 ? (
          <div className="py-6 text-center space-y-3" role="status" aria-live="polite">
            <p className="text-body text-slate-400 max-w-md mx-auto">{t("community_explore_authors_empty")}</p>
            <p className="text-body text-slate-500 max-w-md mx-auto">{t("community_explore_authors_empty_hint")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/community"
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
              >
                {t("community_explore_open_feed")}
              </Link>
              <Link
                href="/guides"
                className={`rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-4 py-2 text-meta text-fuchsia-100 hover:text-fuchsia-100 hover:bg-fuchsia-500/25 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityFuchsiaPillFocus}`}
              >
                {t("community_explore_authors_empty_cta_guides")}
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3" role="list">
            {suggestedAuthors.map((a, authorIdx) => (
              <li key={a.id}>
                <Link
                  href={`/community/user/${a.id}`}
                  className={`flex flex-col items-center gap-2 rounded-[var(--radius-xl)] border border-slate-600/50 bg-ink-700/45 p-3 text-center motion-sub motion-reduce:transition-none hover:border-cyan-500/40 hover:bg-ink-700/70 min-h-[120px] ${communityCardLinkFocus}`}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-cyan-400/25 bg-ink-700">
                    {a.avatar_url ? (
                      <Image
                        src={a.avatar_url}
                        alt={t("guide_card_avatarAlt", { name: a.nickname })}
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized
                        priority={authorIdx === 0}
                        fetchPriority={authorIdx === 0 ? "high" : "low"}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-body font-semibold text-cyan-300">
                        {a.nickname.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <p className="text-meta font-medium text-slate-200 truncate w-full">{a.nickname}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.65rem] leading-none ${communityStoredRolePillClassName(a.role)}`}
                  >
                    {t(communityStoredRoleLabelI18nKey(a.role))}
                  </span>
                  {a.isEscrowGuide ? (
                    <span className="rounded-full border border-warning/35 bg-warning/10 px-1.5 py-0.5 text-[0.6rem] text-warning/90">
                      {t("community_badge_escrow_guide")}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="rounded-[var(--radius-md)] border border-fuchsia-500/25 bg-ink-800/70 backdrop-blur-md p-4 mb-4"
        aria-labelledby={exploreDestHeadingId}
      >
        <h2 id={exploreDestHeadingId} className="text-body font-semibold text-slate-200 mb-3">
          {t("community_explore_section_destinations")}
        </h2>
        {/* 88 §3.4 / 31：热门目的地采用 flex-wrap 多行换行（非横向滚动），窄屏可读优先 */}
        <div className="space-y-4">
          {regionBlocks.map(({ regionKey, destinations }) => (
            <div key={regionKey}>
              <h3 className="text-meta font-medium text-slate-400 mb-2">{t(`community_region_${regionKey}`)}</h3>
              <div className="flex flex-wrap gap-2">
                {destinations.map((d) => (
                  <Link
                    key={d}
                    href={`/community?destination=${encodeURIComponent(d)}`}
                    className={`rounded-full border border-fuchsia-400/35 bg-fuchsia-500/10 px-3 py-1.5 text-meta text-fuchsia-100 hover:bg-fuchsia-500/20 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityFuchsiaPillFocus}`}
                  >
                    {DESTINATION_LABEL_KEYS[d] ? t(DESTINATION_LABEL_KEYS[d]) : d}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
