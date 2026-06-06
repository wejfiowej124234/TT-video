"use client";

import Link from "next/link";
import {
  communityCyanPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import { useId, type FormEvent } from "react";
import { usePathname } from "next/navigation";

export interface CommunityTopicHeroProps {
  t: (key: string) => string;
  tag: string;
  matchCount: number;
  onClearTag: () => void;
  /** 31 §2.1：服务端「公开」帖子总数（与列表内条数互补） */
  serverPublicCount?: number;
  serverPublicCountLoading?: boolean;
  serverPublicCountError?: boolean;
  onRetryServerPublicCount?: () => void;
}

/** 31 §2.1：话题聚合 — 话题名 + 当前列表匹配条数 */
export default function CommunityTopicHero({
  t,
  tag,
  matchCount,
  onClearTag,
  serverPublicCount,
  serverPublicCountLoading,
  serverPublicCountError,
  onRetryServerPublicCount,
}: CommunityTopicHeroProps) {
  const pathname = usePathname();
  const topicHeadingId = useId();
  const onTopicPath = (pathname ?? "").startsWith("/community/topic/");
  const countStr = t("community_topic_post_count").replace(/\{\{n\}\}/g, String(matchCount));
  const serverLine =
    serverPublicCountError === true
      ? null
      : serverPublicCountLoading === true
        ? t("community_topic_server_post_total_loading")
        : typeof serverPublicCount === "number"
          ? t("community_topic_server_post_total").replace(/\{\{n\}\}/g, String(serverPublicCount))
          : null;

  return (
    <section
      className="mb-4 rounded-[var(--radius-xl)] border border-ref-sun/28 bg-slate-900/70 px-4 py-3 backdrop-blur-md shadow-[0_0_24px_-10px_rgba(252,164,124,0.12)]"
      aria-labelledby={topicHeadingId}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-meta text-slate-400 mb-0.5">
            {onTopicPath ? t("community_topic_page_label") : t("community_topic_filter_label")}
          </p>
          <h2 id={topicHeadingId} className={`text-h3 truncate ${TT_COMMUNITY_DRAWER_L5.topicHeroTitle}`}>
            #{tag}
          </h2>
          <p className="text-meta text-slate-300 mt-1">{countStr}</p>
          {serverPublicCountError ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-meta text-warning/95">{t("community_topic_server_post_total_error")}</p>
              {onRetryServerPublicCount ? (
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    onRetryServerPublicCount();
                  }}
                >
                  <button
                    type="submit"
                    aria-label={t("common_retry")}
                    className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCyanPillFocus}`}
                  >
                    {t("common_retry")}
                  </button>
                </form>
              ) : null}
            </div>
          ) : serverLine ? (
            <p className="text-meta text-slate-400 mt-0.5">{serverLine}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onTopicPath ? (
            <Link
              href="/community"
              className={`rounded-full border border-ref-sun/40 bg-ref-sun/10 px-3 py-2 text-meta font-medium text-ref-sun hover:text-ref-sun/95 hover:bg-ref-sun/14 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
            >
              {t("community_topic_all_feed")}
            </Link>
          ) : null}
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onClearTag();
            }}
          >
            <button
              type="submit"
              className={`rounded-full border border-slate-500/60 bg-slate-800/60 px-3 py-2 text-meta text-slate-300 hover:bg-slate-700/60 motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
            >
              {t("community_topic_clear")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
