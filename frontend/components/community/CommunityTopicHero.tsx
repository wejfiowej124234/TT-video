"use client";

import Link from "next/link";
import {
  communityCyanPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
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
      className="mb-4 rounded-[var(--radius-xl)] border border-fuchsia-500/35 bg-slate-900/70 px-4 py-3 backdrop-blur-md shadow-scifi-fuchsia-panel"
      aria-labelledby={topicHeadingId}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-meta text-slate-400 mb-0.5">
            {onTopicPath ? t("community_topic_page_label") : t("community_topic_filter_label")}
          </p>
          <h2 id={topicHeadingId} className="text-h3 font-bold bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent truncate">
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
                    className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-3 py-1 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
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
              className={`rounded-full border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-meta font-medium text-cyan-200 hover:text-cyan-100 hover:bg-cyan-500/25 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
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
