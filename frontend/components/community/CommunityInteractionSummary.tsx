"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { communityCyanPillFocus, communityFuchsiaPillFocus } from "@/lib/communityA11yFocus";

type TFn = (key: string) => string;

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
  /** 登录成功回跳（需已 encodeURIComponent 的 path+query） */
  loginReturnPath: string;
  /** `messages`：紧凑；`activity`：独立页稍宽松 */
  variant?: "messages" | "activity";
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
  loginReturnPath,
  variant = "activity",
}: CommunityInteractionSummaryProps) {
  const dash = t("ui_em_dash");
  const pad = variant === "messages" ? "px-4 py-5" : "px-6 py-8";
  const countClass = variant === "messages" ? "text-h2" : "text-h1";

  if (authPending) {
    return (
      <div className={`rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md ${pad}`} role="status">
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
          className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
        >
          {t("community_activity_go_login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section
        className={`rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md shadow-scifi-panel ${pad}`}
        aria-label={t("community_activity_likes_section_aria")}
      >
        <h2 className="text-body font-semibold text-cyan-200 mb-1">{t("community_activity_likes_summary_title")}</h2>
        <p className="text-meta text-slate-400 mb-4">{t("community_activity_likes_summary_desc")}</p>
        {likesError ? (
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
                  className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
                >
                  {t("common_retry")}
                </button>
              </form>
            ) : null}
          </div>
        ) : (
          <>
            <p className={`${countClass} font-bold bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent tabular-nums`}>
              {likesLoading ? dash : likesReceived.toLocaleString()}
            </p>
            <Link
              href="/community/me/posts"
              className={`mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-4 py-2 text-meta font-medium text-fuchsia-200 hover:text-fuchsia-100 hover:bg-fuchsia-500/20 motion-sub ${communityFuchsiaPillFocus}`}
            >
              {t("community_activity_likes_cta_posts")}
            </Link>
          </>
        )}
      </section>

      <section
        className={`rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/40 ${variant === "messages" ? "px-4 py-4" : "px-6 py-6"}`}
        aria-label={t("community_activity_notifications_aria")}
      >
        <h3 className="text-small font-semibold text-slate-300 mb-2">{t("community_activity_notifications_title")}</h3>
        <p className="text-meta text-slate-400 leading-relaxed">{t("community_activity_notifications_placeholder")}</p>
      </section>
    </div>
  );
}
