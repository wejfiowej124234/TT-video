"use client";

import { useId, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityPost, CommunityPostAuthor } from "@/lib/communityMockData";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS_COMPACT } from "./communityFeedConstants";
import { communityFeedHotDestinationRows } from "./communityFeedPromoMedia";
import { communityFeedAsideHotRowViewModel } from "./communityFeedAsideRowViewModel";
import { CommunityFeedPromoThumb } from "./CommunityFeedPromoThumb";
import { communityFollowPillClassName } from "@/components/community/communityFollowPillClassName";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";
import { TT_COMMUNITY_FEED_ACTION, TT_MARKETING_COMMUNITY_FEED_ASIDE_STICKY_CLASS } from "@/lib/marketingUi";

export interface CommunityFeedDesktopAsideProps {
  t: (key: string) => string;
  hotDestinations: string[];
  destinationFilter: string;
  /** @deprecated 侧栏改 Link 深链；保留兼容调用方 */
  setDestinationFilter?: (v: string) => void;
  /** 与瀑布热榜同源 · 缩略图 / 互动量 */
  feedPosts?: readonly CommunityPost[];
  /** 31 §1.2：由当前 Feed 列表推导，排除自己与已关注 */
  suggestedAuthors: CommunityPostAuthor[];
  followingAuthorIds: Set<string>;
  followBusyAuthorId: string | null;
  onAuthorFollowToggle: (authorId: string) => void;
}

/** 31 §1.2 / §3.1：桌面端热门目的地 + 推荐关注侧栏（可折叠），不改动移动端单列 */
export default function CommunityFeedDesktopAside({
  t,
  hotDestinations,
  destinationFilter,
  feedPosts = [],
  suggestedAuthors,
  followingAuthorIds,
  followBusyAuthorId,
  onAuthorFollowToggle,
}: CommunityFeedDesktopAsideProps) {
  const [open, setOpen] = useState(true);
  const asidePanelsId = useId();
  const suggestedHeadingId = useId();
  const hotRows = communityFeedHotDestinationRows(hotDestinations, feedPosts, 8);

  return (
    <aside
      className={`${TT_MARKETING_COMMUNITY_FEED_ASIDE_STICKY_CLASS} ${TT_COMMUNITY_FEED_ACTION.asideRail} w-full transition-[width] duration-200 motion-reduce:transition-none ${
        open ? "" : "max-w-[2.75rem]"
      }`}
      aria-label={t("community_feed_aside_label")}
    >
      <div className={TT_COMMUNITY_FEED_ACTION.asideShell}>
        <form
          className="contents"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setOpen((v) => !v);
          }}
        >
          <button
            type="submit"
            className={`flex w-full min-h-[44px] items-center justify-start gap-2 px-3 py-2.5 text-left text-meta font-medium ${TT_COMMUNITY_FEED_ACTION.asideSectionHead} ${TT_COMMUNITY_FEED_ACTION.asideToggleHover} motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]`}
            aria-expanded={open}
            aria-controls={asidePanelsId}
            title={open ? t("community_feed_aside_collapse") : t("community_feed_aside_expand")}
            aria-label={open ? undefined : t("community_feed_aside_expand")}
          >
            <svg
              className={`h-4 w-4 shrink-0 text-ref-sun/90 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {open ? <span>{t("community_feed_aside_destinations")}</span> : null}
          </button>
        </form>
        {open ? (
          <div
            id={asidePanelsId}
            className={`${TT_COMMUNITY_FEED_ACTION.asideDivider} pb-3 pt-1`}
          >
            <ul
              className={TT_COMMUNITY_FEED_ACTION.asideDestList}
              aria-label={t("community_feed_aside_destinations")}
            >
              <li>
                <Link
                  href="/community"
                  className={`block w-full px-2 py-2 pl-2.5 text-left text-meta motion-sub ${communityCardLinkFocus} ${
                    destinationFilter === "all"
                      ? TT_COMMUNITY_FEED_ACTION.asideDestRowActive
                      : TT_COMMUNITY_FEED_ACTION.asideDestRowIdle
                  }`}
                >
                  {t("community_destination_all")}
                </Link>
              </li>
              {hotRows.map((row) => {
                const vm = communityFeedAsideHotRowViewModel(row, t);
                const active = destinationFilter === row.destination;
                return (
                  <li key={row.destination}>
                    <Link
                      href={row.href}
                      className={`block w-full px-2 py-2 pl-2.5 text-left text-meta motion-sub ${communityCardLinkFocus} ${
                        active
                          ? TT_COMMUNITY_FEED_ACTION.asideDestRowActive
                          : TT_COMMUNITY_FEED_ACTION.asideDestRowIdle
                      }`}
                    >
                      <span className={TT_COMMUNITY_FEED_ACTION.asideDestRowInner}>
                        {row.thumbSrc ? (
                          <span className={TT_COMMUNITY_FEED_ACTION.asideDestRowThumb} aria-hidden>
                            <CommunityFeedPromoThumb
                              src={row.thumbSrc}
                              sizes="32px"
                              fallbackSeed={row.destination}
                            />
                          </span>
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{vm.label}</span>
                          {vm.showMeta ? (
                            <span className={TT_COMMUNITY_FEED_ACTION.asideDestRowMeta}>
                              {vm.scoreLabel} · {vm.checkinsLabel} · {vm.distanceLabel}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <section className={`mt-3 ${TT_COMMUNITY_FEED_ACTION.asideDivider} pt-3`} aria-labelledby={suggestedHeadingId}>
              <h2 id={suggestedHeadingId} className={TT_COMMUNITY_FEED_ACTION.asideSuggestedHead}>
                {t("community_feed_aside_suggested")}
              </h2>
              {suggestedAuthors.length === 0 ? (
                <p className={TT_COMMUNITY_FEED_ACTION.asideSuggestedEmpty}>{t("community_feed_aside_suggested_empty")}</p>
              ) : (
                <ul className="space-y-1">
                  {suggestedAuthors.map((a) => {
                    const followed = followingAuthorIds.has(a.id);
                    const busy = followBusyAuthorId === a.id;
                    return (
                      <li key={a.id}>
                        <div className={`rounded-[var(--radius-md)] px-1.5 py-1.5 ${TT_COMMUNITY_FEED_ACTION.asideAuthorRowHover} motion-sub`}>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/community/user/${a.id}`}
                              className={`flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-sm py-0.5 ${communityCardLinkFocus}`}
                            >
                              {a.avatar_url ? (
                                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                                  <Image
                                    src={communityMediaAbsoluteUrlForRender(a.avatar_url)}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="32px"
                                    unoptimized
                                  />
                                </span>
                              ) : (
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-meta ${TT_COMMUNITY_FEED_ACTION.asideAvatarFallback}`}
                                  aria-hidden
                                >
                                  {(a.nickname ?? "?").slice(0, 1)}
                                </span>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-meta text-slate-200">{a.nickname}</span>
                                <span className="block truncate text-[0.62rem] text-slate-500">
                                  {t(communityStoredRoleLabelI18nKey(a.role))}
                                </span>
                              </span>
                            </Link>
                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                              {a.isEscrowGuide ? (
                                <Link
                                  href={marketHrefForCommunityUser(a.id)}
                                  className={`${COMMUNITY_BOOK_GUIDE_CTA_CLASS_COMPACT} ${communityCyanPillFocus}`}
                                >
                                  {t("community_book_guide_cta")}
                                </Link>
                              ) : null}
                              <form
                                className="shrink-0"
                                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                                  e.preventDefault();
                                  if (!busy) onAuthorFollowToggle(a.id);
                                }}
                              >
                                <button
                                  type="submit"
                                  disabled={busy}
                                  aria-busy={busy ? true : undefined}
                                  className={`${communityFollowPillClassName({
                                    followed,
                                    disabled: busy,
                                    size: "compact",
                                  })} disabled:opacity-60`}
                                >
                                  {followed ? t("community_following") : t("community_follow")}
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href="/community/friends"
                className={`${TT_COMMUNITY_FEED_ACTION.asideFooterLink} ${communityCardLinkFocus}`}
              >
                {t("community_feed_aside_follow_more")}
              </Link>
            </section>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
