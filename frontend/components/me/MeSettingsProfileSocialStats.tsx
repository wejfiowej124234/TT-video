"use client";

import Link from "next/link";
import type { CommunitySocialStatsPayload, DataState } from "@/lib/dataState";
import CommunityMeDataStateSurface from "@/components/me/CommunityMeDataStateSurface";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import type { LocaleTranslateFn } from "@/lib/i18n";

function StatCell({
  href,
  value,
  label,
  unknown,
  unavailableTitle,
  unavailableAria,
}: {
  href?: string;
  value: number | string;
  label: string;
  unknown?: boolean;
  unavailableTitle?: string;
  unavailableAria?: string;
}) {
  const valueClass = unknown ? TT_ME_SETTINGS_L5.profileStatValueMuted : TT_ME_SETTINGS_L5.profileStatValue;
  const body = (
    <>
      <span className={valueClass}>{value}</span>
      <span className={TT_ME_SETTINGS_L5.profileStatLabel}>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={TT_ME_SETTINGS_L5.profileStatCell}
        title={unavailableTitle}
        aria-label={unavailableAria ?? `${value} ${label}`}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={TT_ME_SETTINGS_L5.profileStatCell} title={unavailableTitle} aria-label={unavailableAria ?? `${value} ${label}`}>
      {body}
    </div>
  );
}

function StatsGrid({
  payload,
  t,
  showLikesReceivedMetric,
  compact = false,
}: {
  payload: CommunitySocialStatsPayload;
  t: LocaleTranslateFn;
  showLikesReceivedMetric?: boolean;
  compact?: boolean;
}) {
  const finColon = t("market_fin_colon");
  return (
    <div className={compact ? `${TT_ME_SETTINGS_L5.profileStatsGrid} mt-1` : TT_ME_SETTINGS_L5.profileStatsGrid}>
      {!compact ? (
        <p className="col-span-full mb-1 text-center text-meta text-slate-500/95 sm:col-span-4">
          {t("community_me_social_stats_empty_hint")}
        </p>
      ) : null}
      <StatCell
        href="/community/friends?tab=following"
        value={payload.followingCountUnknown ? "—" : payload.followingCount}
        label={t("community_me_following")}
        unknown={payload.followingCountUnknown}
        unavailableTitle={
          payload.followingCountUnknown
            ? t("community_me_social_count_unavailable_hint", { colon: finColon })
            : undefined
        }
        unavailableAria={
          payload.followingCountUnknown
            ? t("community_me_social_count_unavailable_aria", { label: t("community_me_following"), colon: finColon })
            : undefined
        }
      />
      <StatCell
        href="/community/friends?tab=followers"
        value={payload.followersCountUnknown ? "—" : payload.followersCount}
        label={t("community_me_followers")}
        unknown={payload.followersCountUnknown}
        unavailableTitle={
          payload.followersCountUnknown
            ? t("community_me_social_count_unavailable_hint", { colon: finColon })
            : undefined
        }
        unavailableAria={
          payload.followersCountUnknown
            ? t("community_me_social_count_unavailable_aria", { label: t("community_me_followers"), colon: finColon })
            : undefined
        }
      />
      <StatCell
        href="/community/friends?tab=friends"
        value={payload.friendsCountUnknown ? "—" : payload.friendsCount}
        label={t("community_me_friends")}
        unknown={payload.friendsCountUnknown}
        unavailableTitle={
          payload.friendsCountUnknown
            ? t("community_me_social_count_unavailable_hint", { colon: finColon })
            : undefined
        }
        unavailableAria={
          payload.friendsCountUnknown
            ? t("community_me_social_count_unavailable_aria", { label: t("community_me_friends"), colon: finColon })
            : undefined
        }
      />
      {showLikesReceivedMetric ? (
        <StatCell
          value={payload.likesReceivedUnknown ? "—" : payload.likesReceived}
          label={t("community_me_likes_received")}
          unknown={payload.likesReceivedUnknown}
          unavailableTitle={
            payload.likesReceivedUnknown
              ? t("community_me_likes_received_unavailable_hint", { colon: finColon })
              : t("community_me_likes_received")
          }
          unavailableAria={
            payload.likesReceivedUnknown
              ? t("community_me_likes_received_unavailable_aria", { colon: finColon })
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

const ZEROS: CommunitySocialStatsPayload = {
  followingCount: 0,
  followersCount: 0,
  friendsCount: 0,
  likesReceived: 0,
};

export function MeSettingsProfileSocialStats({
  state,
  t,
  onRetry,
  showLikesReceivedMetric = true,
}: {
  state: DataState<CommunitySocialStatsPayload>;
  t: LocaleTranslateFn;
  onRetry?: () => void;
  showLikesReceivedMetric?: boolean;
}) {
  const slotCount = showLikesReceivedMetric ? 4 : 3;

  return (
    <CommunityMeDataStateSurface<CommunitySocialStatsPayload>
      state={state}
      t={t}
      analyticsSurface="community_me_social_stats"
      loadingSlot={
        <div className={TT_ME_SETTINGS_L5.profileStatsGrid}>
          {Array.from({ length: slotCount }, (_, i) => (
            <div key={i} className={`${TT_ME_SETTINGS_L5.profileStatCell} animate-pulse motion-reduce:animate-none`} aria-hidden>
              <span className="block h-7 w-10 rounded bg-ref-sun/10" />
              <span className="mt-2 block h-3 w-12 rounded bg-slate-700/60" />
            </div>
          ))}
        </div>
      }
      onRetry={onRetry}
      emptySlot={
        <StatsGrid payload={ZEROS} t={t} showLikesReceivedMetric={showLikesReceivedMetric} compact />
      }
      success={(payload) => (
        <div className="space-y-3">
          {payload.partialLoad ? (
            <div className={TT_ME_SETTINGS_L5.sectionCallout} role="status">
              <p>{t("community_me_social_stats_partial_hint")}</p>
              {onRetry ? (
                <button type="button" onClick={() => onRetry()} className={`${TT_ME_SETTINGS_L5.profileIdentityLink} mt-2`}>
                  {t("community_me_social_stats_retry")}
                </button>
              ) : null}
            </div>
          ) : null}
          <StatsGrid payload={payload} t={t} showLikesReceivedMetric={showLikesReceivedMetric} />
        </div>
      )}
    />
  );
}
