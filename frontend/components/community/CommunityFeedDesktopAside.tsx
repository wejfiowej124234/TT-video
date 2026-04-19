"use client";

import { useId, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityPostAuthor } from "@/lib/communityMockData";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS, DESTINATION_LABEL_KEYS } from "./communityFeedConstants";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";

export interface CommunityFeedDesktopAsideProps {
  t: (key: string) => string;
  hotDestinations: string[];
  destinationFilter: string;
  setDestinationFilter: (v: string) => void;
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
  setDestinationFilter,
  suggestedAuthors,
  followingAuthorIds,
  followBusyAuthorId,
  onAuthorFollowToggle,
}: CommunityFeedDesktopAsideProps) {
  const [open, setOpen] = useState(true);
  const asidePanelsId = useId();
  const suggestedHeadingId = useId();

  return (
    <aside
      className={`hidden lg:block shrink-0 sticky top-24 z-10 self-start transition-[width] duration-200 motion-reduce:transition-none ${
        open ? "w-[min(100%,280px)]" : "w-11"
      }`}
      aria-label={t("community_feed_aside_label")}
    >
      <div className="rounded-[var(--radius-xl)] border border-cyan-500/30 bg-slate-900/75 backdrop-blur-md shadow-scifi-panel overflow-hidden">
        <form
          className="contents"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setOpen((v) => !v);
          }}
        >
          <button
            type="submit"
            className="flex w-full min-h-[44px] items-center justify-start gap-2 px-3 py-2.5 text-left text-meta font-medium text-cyan-200 hover:text-cyan-100 hover:bg-slate-800/60 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            aria-expanded={open}
            aria-controls={asidePanelsId}
            title={open ? t("community_feed_aside_collapse") : t("community_feed_aside_expand")}
            aria-label={open ? undefined : t("community_feed_aside_expand")}
          >
            <svg
              className={`h-4 w-4 shrink-0 text-cyan-300 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
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
          <div id={asidePanelsId} className="border-t border-slate-600/50 px-2 pb-3 pt-1">
            <ul className="space-y-0.5 max-h-[min(40vh,16rem)] overflow-y-auto" aria-label={t("community_feed_aside_destinations")}>
              <li>
                <form
                  className="block w-full"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    setDestinationFilter("all");
                  }}
                >
                  <button
                    type="submit"
                    className={`w-full rounded-[var(--radius-md)] px-2.5 py-2 text-left text-meta motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                      destinationFilter === "all"
                        ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    {t("community_destination_all")}
                  </button>
                </form>
              </li>
              {hotDestinations.map((d) => {
                const label = DESTINATION_LABEL_KEYS[d] ? t(DESTINATION_LABEL_KEYS[d]) : d;
                return (
                  <li key={d}>
                    <form
                      className="block w-full"
                      onSubmit={(e: FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        setDestinationFilter(d);
                      }}
                    >
                      <button
                        type="submit"
                        className={`w-full rounded-[var(--radius-md)] px-2.5 py-2 text-left text-meta motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                          destinationFilter === d
                            ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                            : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent"
                        }`}
                      >
                        {label}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>

            <section className="mt-3 border-t border-slate-600/40 pt-3" aria-labelledby={suggestedHeadingId}>
              <h2 id={suggestedHeadingId} className="px-2.5 mb-2 text-meta font-medium text-slate-300">
                {t("community_feed_aside_suggested")}
              </h2>
              {suggestedAuthors.length === 0 ? (
                <p className="px-2.5 text-meta text-slate-500 leading-snug">{t("community_feed_aside_suggested_empty")}</p>
              ) : (
                <ul className="space-y-1 max-h-[min(36vh,14rem)] overflow-y-auto">
                  {suggestedAuthors.map((a) => {
                    const following = followingAuthorIds.has(a.id);
                    const busy = followBusyAuthorId === a.id;
                    return (
                      <li key={a.id}>
                        <div className="rounded-[var(--radius-md)] px-1.5 py-1.5 hover:bg-slate-800/60 motion-sub">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/community/user/${a.id}`}
                              className={`flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-sm py-0.5 ${communityCardLinkFocus}`}
                              title={a.nickname}
                            >
                              <div className="relative h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 overflow-hidden rounded-full bg-slate-700 ring-2 ring-cyan-400/25">
                                {a.avatar_url ? (
                                  <Image src={a.avatar_url} alt="" fill className="object-cover" sizes="44px" unoptimized />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-meta font-medium text-cyan-300">
                                    {a.nickname.slice(0, 1)}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-meta font-medium text-slate-200">{a.nickname}</p>
                                {a.wallet ? (
                                  <p className="truncate text-[0.65rem] font-mono text-slate-500 max-w-[10rem]" title={a.wallet}>
                                    {a.wallet}
                                  </p>
                                ) : null}
                                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[0.65rem] leading-none ${
                                      a.role === "guide" ? "bg-fuchsia-500/20 text-fuchsia-300" : "bg-cyan-500/15 text-cyan-200"
                                    }`}
                                  >
                                    {t(communityStoredRoleLabelI18nKey(a.role))}
                                  </span>
                                  {a.isEscrowGuide ? (
                                    <span className="rounded-full border border-warning/35 bg-warning/10 px-1.5 py-0.5 text-[0.65rem] text-warning/90">
                                      {t("community_badge_escrow_guide")}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </Link>
                            <form
                              className="contents shrink-0"
                              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                                e.preventDefault();
                                onAuthorFollowToggle(a.id);
                              }}
                            >
                              <button
                                type="submit"
                                disabled={busy}
                                aria-busy={busy ? true : undefined}
                                className={
                                  "shrink-0 rounded-full border px-2.5 py-1 text-[0.65rem] font-medium motion-sub min-h-[44px] inline-flex items-center justify-center " +
                                  (following
                                    ? `border-slate-500/60 bg-slate-700/50 text-slate-300 ${communitySlatePillFocus}`
                                    : `border-cyan-400/50 bg-cyan-500/20 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 ${communityCyanPillFocus}`) +
                                  (busy ? " opacity-60 cursor-wait" : "")
                                }
                              >
                                {following ? t("community_following") : t("community_follow")}
                              </button>
                            </form>
                          </div>
                          {(a.role === "guide" || a.isEscrowGuide) && (
                            <Link
                              href={marketHrefForCommunityUser(a.id)}
                              className={`mt-1 ml-[calc(2.75rem+0.5rem)] inline-block ${COMMUNITY_BOOK_GUIDE_CTA_CLASS}`}
                            >
                              {t("community_book_guide_cta")}
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <div className="mt-3 border-t border-slate-600/40 pt-3 px-0.5">
              <Link
                href="/community/friends"
                className={`flex min-h-[44px] items-center justify-start rounded-[var(--radius-md)] px-2 py-2 text-meta text-fuchsia-200 hover:text-fuchsia-100 hover:bg-fuchsia-500/10 motion-sub ${communityCardLinkFocus}`}
              >
                {t("community_following_follow_more")}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
