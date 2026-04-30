"use client";

import Link from "next/link";
import type { CommunitySocialStatsPayload, DataState } from "@/lib/dataState";
import CommunityMeDataStateSurface from "@/components/me/CommunityMeDataStateSurface";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import type { LocaleTranslateFn } from "@/lib/i18n";

function SocialStatsLinks({
  payload,
  t,
  showLikesReceivedMetric = true,
}: {
  payload: CommunitySocialStatsPayload;
  t: LocaleTranslateFn;
  showLikesReceivedMetric?: boolean;
}) {
  const { followingCount, followersCount, friendsCount, likesReceived } = payload;
  const finColon = t("market_fin_colon");
  return (
    <>
      <Link
        href="/community/friends?tab=following"
        className={`text-center min-w-[60px] min-h-[44px] flex flex-col justify-center rounded-[var(--radius-md)] ${communityCardLinkFocus}`}
        title={
          payload.followingCountUnknown
            ? t("community_me_social_count_unavailable_hint", { colon: finColon })
            : undefined
        }
        aria-label={
          payload.followingCountUnknown
            ? t("community_me_social_count_unavailable_aria", { label: t("community_me_following"), colon: finColon })
            : `${followingCount} ${t("community_me_following")}`
        }
      >
        <span
          className={`block text-h4 font-bold tabular-nums ${
            payload.followingCountUnknown ? "text-slate-500" : "text-cyan-200"
          }`}
        >
          {payload.followingCountUnknown ? "—" : followingCount}
        </span>
        <span className="text-meta text-slate-400">{t("community_me_following")}</span>
      </Link>
      <Link
        href="/community/friends?tab=followers"
        className={`text-center min-w-[60px] min-h-[44px] flex flex-col justify-center rounded-[var(--radius-md)] ${communityCardLinkFocus}`}
        title={
          payload.followersCountUnknown
            ? t("community_me_social_count_unavailable_hint", { colon: finColon })
            : undefined
        }
        aria-label={
          payload.followersCountUnknown
            ? t("community_me_social_count_unavailable_aria", { label: t("community_me_followers"), colon: finColon })
            : `${followersCount} ${t("community_me_followers")}`
        }
      >
        <span
          className={`block text-h4 font-bold tabular-nums ${
            payload.followersCountUnknown ? "text-slate-500" : "text-cyan-200"
          }`}
        >
          {payload.followersCountUnknown ? "—" : followersCount}
        </span>
        <span className="text-meta text-slate-400">{t("community_me_followers")}</span>
      </Link>
      <Link
        href="/community/friends?tab=friends"
        className={`text-center min-w-[60px] min-h-[44px] flex flex-col justify-center rounded-[var(--radius-md)] ${communityCardLinkFocus}`}
        title={
          payload.friendsCountUnknown ? t("community_me_social_count_unavailable_hint", { colon: finColon }) : undefined
        }
        aria-label={
          payload.friendsCountUnknown
            ? t("community_me_social_count_unavailable_aria", { label: t("community_me_friends"), colon: finColon })
            : `${friendsCount} ${t("community_me_friends")}`
        }
      >
        <span
          className={`block text-h4 font-bold tabular-nums ${
            payload.friendsCountUnknown ? "text-slate-500" : "text-cyan-200"
          }`}
        >
          {payload.friendsCountUnknown ? "—" : friendsCount}
        </span>
        <span className="text-meta text-slate-400">{t("community_me_friends")}</span>
      </Link>
      {showLikesReceivedMetric ? (
        <div
          className="text-center min-w-[60px] min-h-[44px] flex flex-col justify-center"
          title={
            payload.likesReceivedUnknown
              ? t("community_me_likes_received_unavailable_hint", { colon: finColon })
              : t("community_me_likes_received")
          }
          aria-label={
            payload.likesReceivedUnknown
              ? t("community_me_likes_received_unavailable_aria", { colon: finColon })
              : `${likesReceived} ${t("community_me_likes_received")}`
          }
        >
          <span
            className={`block text-h4 font-bold tabular-nums ${
              payload.likesReceivedUnknown ? "text-slate-500" : "text-cyan-200"
            }`}
          >
            {payload.likesReceivedUnknown ? "—" : likesReceived}
          </span>
          <span className="text-meta text-slate-400">{t("community_me_likes_received")}</span>
        </div>
      ) : null}
    </>
  );
}

const ZEROS: CommunitySocialStatsPayload = {
  followingCount: 0,
  followersCount: 0,
  friendsCount: 0,
  likesReceived: 0,
};

/**
 * 资料卡内社区统计条：DataState（loading / error / empty / success / invalid）+ 审计 DOM / 埋点见 `CommunityMeDataStateSurface`。
 */
export default function CommunityMeSocialStatsStrip({
  state,
  t,
  onRetry,
  showLikesReceivedMetric = true,
}: {
  state: DataState<CommunitySocialStatsPayload>;
  t: LocaleTranslateFn;
  onRetry?: () => void;
  /** 与 `isCommunityMeLikesListEnabled()` 对齐；为 false 时不渲染「获赞」列（亦不请求该路数据，见页级 Query）。 */
  showLikesReceivedMetric?: boolean;
}) {
  const slotCount = showLikesReceivedMetric ? 4 : 3;
  const loadingSlot = (
    <div className="flex w-full flex-wrap items-stretch justify-evenly gap-x-2 gap-y-1 sm:justify-center sm:gap-x-6 md:gap-x-8">
      {Array.from({ length: slotCount }, (_, i) => (
        <div key={i} className="text-center min-w-[60px] min-h-[44px] flex flex-col justify-center gap-1" aria-hidden>
          <span className="block h-6 w-8 rounded-[var(--radius-sm)] bg-ink-500/70 animate-pulse motion-reduce:animate-none mx-auto" />
          <span className="block h-3 w-12 rounded-[var(--radius-sm)] bg-ink-600/60 animate-pulse motion-reduce:animate-none mx-auto" />
        </div>
      ))}
    </div>
  );

  return (
    <CommunityMeDataStateSurface<CommunitySocialStatsPayload>
      state={state}
      t={t}
      analyticsSurface="community_me_social_stats"
      loadingSlot={loadingSlot}
      onRetry={onRetry}
      emptySlot={
        <div className="w-full space-y-2">
          <p className="text-center text-meta text-slate-500">{t("community_me_social_stats_empty_hint")}</p>
          <div className="flex w-full flex-wrap items-stretch justify-evenly gap-x-2 gap-y-1 sm:justify-center sm:gap-x-6 md:gap-x-8">
            <SocialStatsLinks payload={ZEROS} t={t} showLikesReceivedMetric={showLikesReceivedMetric} />
          </div>
        </div>
      }
      success={(payload) => (
        <div className="w-full space-y-2">
          {payload.partialLoad ? (
            <div
              className="rounded-[var(--radius-sm)] border border-warning/35 bg-warning/30 px-2 py-2 text-center"
              role="status"
            >
              <p className="text-[0.68rem] leading-snug text-white/95">{t("community_me_social_stats_partial_hint")}</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={() => onRetry()}
                  className={`mt-2 inline-flex min-h-[40px] items-center justify-center rounded-full border border-warning/50 bg-warning/45 px-3 py-1.5 text-meta font-medium text-white hover:bg-warning/65 motion-sub ${communityCardLinkFocus}`}
                >
                  {t("community_me_social_stats_retry")}
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="flex w-full flex-wrap items-stretch justify-evenly gap-x-2 gap-y-1 sm:justify-center sm:gap-x-6 md:gap-x-8">
            <SocialStatsLinks payload={payload} t={t} showLikesReceivedMetric={showLikesReceivedMetric} />
          </div>
        </div>
      )}
    />
  );
}
