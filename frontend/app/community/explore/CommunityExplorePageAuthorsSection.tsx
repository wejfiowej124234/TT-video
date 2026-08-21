"use client";

import Link from "next/link";
import Image from "next/image";
import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import { communityStoredRolePillClassName } from "@/components/community/communityFeedMappers";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import type { CommunityExplorePageViewModel } from "./useCommunityExplorePage";

export function CommunityExplorePageAuthorsSection(vm: CommunityExplorePageViewModel) {
  const {
    t,
    exploreAuthorsHeadingId,
    followingEnvelopeInvalid,
    followingRefetch,
    authorsLoading,
    exploreFeedError,
    posts,
    feedError,
    feedRefetch,
    suggestedAuthors,
  } = vm;

  return (
    <section
      className="rounded-[var(--radius-md)] border border-success/25 bg-ink-800/70 backdrop-blur-md p-4 mb-4 [content-visibility:auto]"
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
              followingRefetch();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${TT_COMMUNITY_PAGE_L5.pill} motion-reduce:transition-none ${communityCyanPillFocus}`}
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
          <ApiErrorAlert message={mapApiReadError(feedError, t, "community_error_feed")} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              feedRefetch();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${TT_COMMUNITY_PAGE_L5.pill} motion-reduce:transition-none ${communityCyanPillFocus}`}
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
              className={`${TT_COMMUNITY_PAGE_L5.pill} motion-reduce:transition-none ${communityCyanPillFocus}`}
            >
              {t("community_explore_open_feed")}
            </Link>
            <Link
              href="/guides"
              className={`rounded-full border border-ref-sun/35 bg-ref-sun/12 px-4 py-2 text-meta text-ref-sun/95 hover:text-ref-sun/95 hover:bg-ref-sun/14 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityFuchsiaPillFocus}`}
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
                className={`flex flex-col items-center gap-2 rounded-[var(--radius-xl)] border border-slate-600/50 bg-ink-700/45 p-3 text-center motion-sub motion-reduce:transition-none hover:border-ref-sun/30 hover:bg-ink-700/70 min-h-[120px] ${communityCardLinkFocus}`}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-ref-sun/22 bg-ink-700">
                  {a.avatar_url?.trim() ? (
                    <Image
                      src={communityMediaAbsoluteUrlForRender(a.avatar_url.trim())}
                      alt={t("guide_card_avatarAlt", { name: a.nickname })}
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized={communityMediaNextImageUnoptimized(
                        communityMediaAbsoluteUrlForRender(a.avatar_url.trim())
                      )}
                      priority={authorIdx === 0}
                      fetchPriority={authorIdx === 0 ? "high" : "low"}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-body font-semibold text-ref-sun">
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
                {a.isEscrowGuide && String(a.role ?? "").toLowerCase() !== "guide" ? (
                  <span className="rounded-full border border-warning/35 bg-warning/10 px-1.5 py-0.5 text-[0.6rem] text-warning/90">
                    {t("community_role_guide")}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
