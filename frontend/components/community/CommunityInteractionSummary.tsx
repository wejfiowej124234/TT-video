"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { communityCardLinkFocus, communityCyanPillFocus } from "@/lib/communityA11yFocus";
import {
  TT_COMMUNITY_FEED_ACTION,
  TT_COMMUNITY_PAGE_L5,
  TT_MARKETING_ACTION_STAT_EMPHASIS,
} from "@/lib/marketingUi";

type TFn = (key: string) => string;

export type CommunityActivityEventItem = {
  kind: string;
  actor_nickname?: string | null;
  post_id?: string | null;
  created_at: string;
};

export type CommunityInteractionSummaryProps = {
  t: TFn;
  isLoggedIn: boolean;
  authPending: boolean;
  likesReceived: number;
  likesLoading: boolean;
  likesError: boolean;
  /** 与 `mapApiReadError` 对齐的可读文案；缺省用 `community_activity_likes_load_failed` */
  likesErrorMessage?: string | null;
  onRetryLikes?: () => void;
  /** 构建期关闭赞过列表能力（优先于 `likesError`） */
  likesMetricDisabledByConfig?: boolean;
  /** 用户本机隐藏获赞总数（能力开但未请求 API） */
  likesMetricSuppressed?: boolean;
  /** 登录成功回跳（需已 encodeURIComponent 的 path+query） */
  loginReturnPath: string;
  /** `messages`：紧凑；`activity`：独立页稍宽松 */
  variant?: "messages" | "activity";
  activityItems?: CommunityActivityEventItem[];
  activityLoading?: boolean;
  activityError?: boolean;
  activityErrorMessage?: string | null;
  onRetryActivity?: () => void;
};

/**
 * 31 §2.2：互动摘要——已对接「帖子获赞总数」API；逐条通知（评/关注/@）仍待后端。
 */
export function CommunityInteractionSummary({
  t,
  isLoggedIn,
  authPending,
  likesReceived,
  likesLoading,
  likesError,
  likesErrorMessage,
  onRetryLikes,
  likesMetricDisabledByConfig = false,
  likesMetricSuppressed = false,
  loginReturnPath,
  variant = "activity",
  activityItems = [],
  activityLoading = false,
  activityError = false,
  activityErrorMessage,
  onRetryActivity,
}: CommunityInteractionSummaryProps) {
  const dash = t("ui_em_dash");
  const pad = variant === "messages" ? "px-4 py-5" : "px-6 py-8";
  const countClass = variant === "messages" ? "text-h2" : "text-h1";

  if (authPending) {
    return (
      <div className={`${TT_COMMUNITY_FEED_ACTION.emptyPanel} ${pad}`} role="status">
        <p className="text-small text-slate-400">{t("common_loading")}</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={`rounded-[var(--radius-md)] border border-warning/35 bg-warning/10 ${pad}`}>
        <p className="text-small text-warning/95 mb-3">{t("community_activity_login_hint")}</p>
        <Link
          href={`/auth/login?returnUrl=${encodeURIComponent(loginReturnPath)}`}
          className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}
        >
          {t("community_activity_go_login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section
        className={`${TT_COMMUNITY_FEED_ACTION.feedCard} shadow-scifi-panel ${pad}`}
        aria-label={t("community_activity_likes_section_aria")}
      >
        <h2 className="text-body font-semibold text-slate-100 mb-1">{t("community_activity_likes_summary_title")}</h2>
        <p className="text-meta text-slate-400 mb-4">{t("community_activity_likes_summary_desc")}</p>
        {likesMetricDisabledByConfig ? (
          <p className="text-meta text-slate-300 leading-relaxed">{t("community_me_likes_list_disabled_by_config")}</p>
        ) : likesMetricSuppressed ? (
          <div className="space-y-3">
            <p className="text-meta text-slate-300 leading-relaxed">{t("community_likes_metric_suppressed_hint")}</p>
            <Link
              href="/me/settings/profile"
              className={`inline-flex ${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
            >
              {t("community_likes_metric_suppressed_cta_me")}
            </Link>
          </div>
        ) : likesError ? (
          <div className="space-y-2">
            <ApiErrorAlert
              message={likesErrorMessage?.trim() ? likesErrorMessage : t("community_activity_likes_load_failed")}
              tone="dark"
            />
            {onRetryLikes ? (
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onRetryLikes();
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
            ) : null}
          </div>
        ) : (
          <>
            <p className={`${countClass} ${TT_MARKETING_ACTION_STAT_EMPHASIS}`}>
              {likesLoading ? dash : likesReceived.toLocaleString()}
            </p>
            <Link
              href="/community/me/posts"
              className={`mt-4 ${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
            >
              {t("community_activity_likes_cta_posts")}
            </Link>
          </>
        )}
      </section>

      <section
        className={`${TT_COMMUNITY_FEED_ACTION.activityPanelMuted} ${variant === "messages" ? "px-4 py-4" : "px-6 py-6"}`}
        aria-label={t("community_activity_notifications_aria")}
        data-tt-community-activity-events={activityItems.length > 0 ? "api-v1" : "empty-v1"}
      >
        <h3 className="text-small font-semibold text-slate-300 mb-2">{t("community_activity_notifications_title")}</h3>
        {activityError ? (
          <div className="space-y-2">
            <ApiErrorAlert
              message={
                activityErrorMessage?.trim()
                  ? activityErrorMessage
                  : t("community_activity_events_load_failed")
              }
              tone="dark"
            />
            {onRetryActivity ? (
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onRetryActivity();
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
            ) : null}
          </div>
        ) : activityLoading ? (
          <p className="text-meta text-slate-400">{t("common_loading")}</p>
        ) : activityItems.length === 0 ? (
          <p className="text-meta text-slate-400 leading-relaxed">{t("community_activity_notifications_empty")}</p>
        ) : (
          <ul className="space-y-3" role="list">
            {activityItems.map((ev, idx) => {
              const actor = ev.actor_nickname?.trim() || t("community_activity_event_actor_unknown");
              const kindKey =
                ev.kind === "like"
                  ? "community_activity_event_like"
                  : ev.kind === "comment"
                    ? "community_activity_event_comment"
                    : ev.kind === "follow"
                      ? "community_activity_event_follow"
                      : ev.kind === "mention"
                        ? "community_activity_event_mention"
                        : "community_activity_event_other";
              const label = t(kindKey).replace("{actor}", actor);
              const href = ev.post_id ? `/community?post=${encodeURIComponent(ev.post_id)}` : "/community/me/posts";
              return (
                <li key={`${ev.kind}-${ev.created_at}-${idx}`}>
                  <Link
                    href={href}
                    className={`block rounded-[var(--radius-sm)] border border-slate-600/40 bg-slate-900/40 px-3 py-2.5 text-small text-slate-200 hover:border-ref-sun/30 motion-sub ${communityCardLinkFocus}`}
                  >
                    <span>{label}</span>
                    <span className="mt-1 block text-meta text-slate-500">
                      {new Date(ev.created_at).toLocaleString()}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
