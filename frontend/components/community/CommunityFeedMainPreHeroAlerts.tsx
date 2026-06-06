"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import {
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  communityPostTagExceedsServerUtf8Limit,
  communityPostTagUtf8ByteLenTrimmed,
} from "@/lib/apiClient/community";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import type { CommunityFeedPostDeepLinkAlert } from "@/components/community/communityFeedMainTypes";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

export interface CommunityFeedMainPreHeroAlertsProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  authLoading: boolean;
  isLoggedIn: boolean;
  communityLoginReturnUrl: string;
  postDeepLinkBusy: boolean;
  postDeepLinkAlert: CommunityFeedPostDeepLinkAlert;
  dismissPostDeepLinkIssue: () => void;
  retryPostDeepLinkFetch: () => void;
  tagFilter: string | null;
}

export default function CommunityFeedMainPreHeroAlerts({
  t,
  authLoading,
  isLoggedIn,
  communityLoginReturnUrl,
  postDeepLinkBusy,
  postDeepLinkAlert,
  dismissPostDeepLinkIssue,
  retryPostDeepLinkFetch,
  tagFilter,
}: CommunityFeedMainPreHeroAlertsProps) {
  return (
    <>
      {!authLoading && !isLoggedIn ? (
        <div
          className="mb-4 flex flex-col gap-2 rounded-[var(--radius-md)] border border-ref-sun/22 bg-ink-900/75 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="note"
        >
          <p className="text-small text-slate-300">{t("community_feed_guest_interactions_hint")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent(communityLoginReturnUrl)}`}
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-ref-sun/40 bg-ref-sun/10 px-4 text-meta font-medium text-ref-sun hover:bg-ref-sun/14 motion-sub ${communityCyanPillFocus}`}
          >
            {t("community_activity_go_login")}
          </Link>
        </div>
      ) : null}

      {postDeepLinkBusy ? (
        <div
          className={TT_COMMUNITY_DRAWER_L5.feedInlineAlert}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          {t("community_postDeepLink_resolving")}
        </div>
      ) : null}

      {postDeepLinkAlert?.kind === "unavailable" ? (
        <div
          className={TT_COMMUNITY_DRAWER_L5.feedInlineAlertSoft}
          role="region"
          aria-label={t("community_postDeepLink_notFoundOrHidden")}
        >
          <p className="text-small text-slate-200">{t("community_postDeepLink_notFoundOrHidden")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/community"
              className={`${touchTargetLink44Classes} text-meta font-medium text-ref-sun/90 hover:text-ref-sun/95`}
            >
              {t("community_postDeepLink_backFeed")}
            </Link>
            <Link
              href="/community/explore"
              className={`${touchTargetLink44Classes} text-meta font-medium text-ref-sun/90 hover:text-ref-sun/95`}
            >
              {t("community_postDeepLink_goExplore")}
            </Link>
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                dismissPostDeepLinkIssue();
              }}
            >
              <button
                type="submit"
                className={`${TT_COMMUNITY_FEED_ACTION.asideGhostPill} ${communitySlatePillFocus}`}
              >
                {t("common_closeAlert")}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {postDeepLinkAlert?.kind === "load_failed" ? (
        <div className="mb-4 space-y-2" role="alert" aria-live="polite">
          <ApiErrorAlert message={postDeepLinkAlert.message} tone="dark" />
          <div className="flex flex-wrap items-center gap-2">
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                retryPostDeepLinkFetch();
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
            <Link
              href="/community"
              className={`${touchTargetLink44Classes} text-meta font-medium text-ref-sun/90 hover:text-ref-sun/95`}
            >
              {t("community_postDeepLink_backFeed")}
            </Link>
            <Link
              href="/community/explore"
              className={`${touchTargetLink44Classes} text-meta font-medium text-ref-sun/90 hover:text-ref-sun/95`}
            >
              {t("community_postDeepLink_goExplore")}
            </Link>
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                dismissPostDeepLinkIssue();
              }}
            >
              <button
                type="submit"
                className={`${TT_COMMUNITY_FEED_ACTION.asideGhostPill} ${communitySlatePillFocus}`}
              >
                {t("common_closeAlert")}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {tagFilter != null && communityPostTagExceedsServerUtf8Limit(tagFilter) ? (
        <div
          className="mb-4 rounded-[var(--radius-md)] border border-warning/45 bg-warning/10 px-4 py-3"
          role="status"
          aria-live="polite"
          data-tt-community-topic-tag-over-limit="1"
        >
          <p className="text-small text-warning/95">
            {t("community_topic_tag_exceeds_api_limit_notice", {
              len: communityPostTagUtf8ByteLenTrimmed(tagFilter),
              max: COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
            })}
          </p>
        </div>
      ) : null}
    </>
  );
}
