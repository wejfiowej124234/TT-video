"use client";

import type { FormEvent } from "react";
import NextImage from "next/image";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { formatFeedbackListDate, type FeedbackMediaItem } from "@/lib/communityFeedbackDisplay";
import type { CommunityFeedbackLocalItem } from "@/lib/communityFeedbackLocal";
import {
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";

export type FeedbackListItem = CommunityFeedbackLocalItem;

export function CommunityFeedbackListPanel({
  feedbackListHeadingId,
  t,
  hydrated,
  listFetchError,
  serverListSynced,
  list,
  onRetryFetch,
  onOpenPost,
  clearFeedbackFormErrors,
}: {
  feedbackListHeadingId: string;
  t: (key: string) => string;
  hydrated: boolean;
  listFetchError: string | null;
  serverListSynced: boolean;
  list: FeedbackListItem[];
  onRetryFetch: () => void;
  onOpenPost: () => void;
  clearFeedbackFormErrors: () => void;
}) {
  const listSourceAttr =
    !hydrated || listFetchError != null
      ? undefined
      : serverListSynced
        ? ({ "data-tt-community-feedback-list-source": "server" as const })
        : ({ "data-tt-community-feedback-list-source": "local-mixed" as const });

  return (
    <section
      className={`${TT_COMMUNITY_PAGE_L5.panel} p-4 sm:p-6`}
      aria-labelledby={feedbackListHeadingId}
      {...listSourceAttr}
    >
      <h2 id={feedbackListHeadingId} className="text-body font-semibold text-ref-sun/90 mb-4">{t("community_feedback_list_title")}</h2>
      {!hydrated ? (
        <div
          className="space-y-3 py-2"
          role="status"
          aria-busy="true"
          aria-label={t("common_loading")}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-[var(--radius-md)] border border-slate-600/40 bg-ink-700/25 animate-pulse motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : (
        <>
          {listFetchError != null && (
            <div className="mb-4 space-y-2" role="alert" aria-live="polite">
              <ApiErrorAlert message={listFetchError} />
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onRetryFetch();
                }}
              >
                <button
                  type="submit"
                  aria-label={t("common_retry")}
                  className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
                >
                  {t("common_retry")}
                </button>
              </form>
            </div>
          )}
          {listFetchError == null && !serverListSynced && (
            <div className="mb-4 space-y-2" role="alert" aria-live="polite">
              <ApiErrorAlert message={t("community_feedback_list_not_synced")} />
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onRetryFetch();
                }}
              >
                <button
                  type="submit"
                  aria-label={t("common_retry")}
                  className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
                >
                  {t("common_retry")}
                </button>
              </form>
            </div>
          )}
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-[var(--radius-md)] border border-dashed border-slate-500/50 bg-ink-900/30">
              <p className="text-small text-slate-300">{t("community_feedback_empty")}</p>
              <p className="text-meta text-slate-400 mt-1">{t("community_feedback_empty_hint")}</p>
              <form
                className="mt-4 inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  clearFeedbackFormErrors();
                  onOpenPost();
                }}
              >
                <button
                  type="submit"
                  aria-label={t("community_feedback_post")}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/42 bg-ref-sun/12 px-4 py-2 text-small font-medium text-ref-sun/90 hover:text-ref-sun/95 hover:bg-ref-sun/14 motion-sub ${communityFuchsiaPillFocus}`}
                >
                  {t("community_feedback_post")}
                </button>
              </form>
            </div>
          ) : (
            <ul className="space-y-3">
              {list.map((item) => (
                <FeedbackListRow key={item.id} item={item} t={t} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function FeedbackListRow({
  item,
  t,
}: {
  item: FeedbackListItem;
  t: (key: string) => string;
}) {
  return (
    <li className="rounded-[var(--radius-md)] border border-slate-600/50 bg-ink-800/50 p-4 text-small text-slate-300">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-meta text-slate-400">{t(item.category)}</span>
        {item.status && (
          <span className="rounded px-1.5 py-0.5 text-micro font-medium bg-ink-600/60 text-slate-300 border border-slate-500/50">
            {item.status === "replied" || item.official_reply
              ? t("community_feedback_status_replied")
              : item.status === "closed"
                ? t("community_feedback_status_closed")
                : t("community_feedback_status_open")}
          </span>
        )}
        {item.local && (
          <span className="rounded px-1.5 py-0.5 text-micro font-medium bg-warning/15 text-warning/95 border border-warning/40">
            {t("community_feedback_local_only")}
          </span>
        )}
      </div>
      <p className="mt-1 whitespace-pre-wrap">{item.content}</p>
      {item.official_reply && (
        <div className="mt-3 pl-3 border-l-2 border-ref-sun/35">
          <p className="text-meta text-ref-sun/90 mb-0.5">{t("community_feedback_official_reply_label")}</p>
          <p className="text-small text-slate-300 whitespace-pre-wrap">{item.official_reply}</p>
        </div>
      )}
      {item.media && item.media.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2 overflow-x-auto list-none p-0" role="list">
          {item.media.map((m: FeedbackMediaItem, i: number) => (
            <li key={i} className="relative shrink-0 w-24 h-24 rounded-[var(--radius-md)] overflow-hidden border border-slate-500/50 bg-ink-800">
              {m.type === "image" ? (
                <NextImage
                  src={communityMediaAbsoluteUrlForRender(m.url)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized={communityMediaNextImageUnoptimized(
                    communityMediaAbsoluteUrlForRender(m.url)
                  )}
                />
              ) : (
                <video
                  src={communityMediaAbsoluteUrlForRender(m.url)}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  controlsList="nodownload"
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-meta text-slate-400 mt-2">{formatFeedbackListDate(item.created_at)}</p>
    </li>
  );
}
