"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GuideCard from "@/components/market/GuideCard";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { FOCUS_RING } from "@/components/me/constants";
import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import { fetchGuideAvailabilityCached } from "@/lib/guideAvailabilityClient";
import { parseOccupiedRanges } from "@/lib/guidesAvailableForTrip";
import { countGuideOccupiedDaysThisMonth } from "@/lib/guide/guideWorkbenchAvailabilityModel";
import { guideProfileSettingsHrefFromWorkbench } from "@/lib/guide/guideProfileSettingsNav";
import { GUIDE_WORKBENCH_MARKET_EXPOSURE_ANCHOR } from "@/lib/guide/guideOrderCorridorModel";
import {
  guideProfileMissingPublicTitle,
  guideProfileSummaryHasContent,
  guideProfileToMarketPreviewDraft,
  guidePublicDetailHref,
  guidePublicMarketBrowseHref,
} from "@/lib/guide/guideWorkbenchProfileSummaryModel";
import {
  GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER,
} from "@/lib/guide/guideWorkbenchL5ClosureSprintModel";
import { resolveGuideMarketExposureActionPlan } from "@/lib/guide/guideWorkbenchWorkspaceL5";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideWorkbenchMarketExposureCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  profile: MeGuideProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  onRetryProfile: () => void;
  /** 游客预览：身份押金档位展示（来自 `GET /me` · `guide.stake_amount`） */
  stakeAmountForPreview?: string | null;
};

/** 市场曝光：挂牌预览 + 档期摘要 + 编辑/公开市场链（合并原挂牌摘要与档期卡） */
export default function GuideWorkbenchMarketExposureCard({
  t,
  profile,
  profileLoading,
  profileError,
  onRetryProfile,
  stakeAmountForPreview = null,
}: GuideWorkbenchMarketExposureCardProps) {
  const actionPlan = resolveGuideMarketExposureActionPlan({ orderTakingBlocked: false });
  const guideId = profile?.guide_id?.trim() ?? "";
  const publicHref = guidePublicDetailHref(profile);
  const marketBrowseHref = guidePublicMarketBrowseHref(profile);
  const hasContent = guideProfileSummaryHasContent(profile);
  const missingPublicTitle = guideProfileMissingPublicTitle(profile);
  const preview = profile ? guideProfileToMarketPreviewDraft(profile) : null;

  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [occupiedThisMonth, setOccupiedThisMonth] = useState<number | null>(null);

  useEffect(() => {
    if (!guideId) return;
    let cancelled = false;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    void fetchGuideAvailabilityCached(guideId)
      .then((payload) => {
        if (cancelled) return;
        const ranges = parseOccupiedRanges(payload?.occupied_ranges);
        setOccupiedThisMonth(countGuideOccupiedDaysThisMonth(ranges).occupied);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailabilityError(t("guide_workbench_availability_load_fail"));
        setOccupiedThisMonth(null);
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guideId, t]);

  if (!guideId && !profileLoading && !profileError) return null;

  return (
    <section
      id={GUIDE_WORKBENCH_MARKET_EXPOSURE_ANCHOR}
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1`}
      aria-label={t("guide_workbench_market_exposure_aria")}
      data-tt-guide-workbench-market-exposure="1"
      data-tt-guide-workbench-profile-summary="1"
      data-tt-guide-workbench-l5-closure={GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE}
      data-tt-ui-frozen={GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER}
    >
      <div className="mb-3">
        <h2 className={TT_WORKSPACE_L5.sectionTitle}>{t("guide_workbench_market_exposure_title")}</h2>
        <p className={TT_WORKSPACE_L5.sectionSubtitle}>{t("guide_workbench_market_exposure_subtitle")}</p>
      </div>

      {profileLoading ? (
        <div className="animate-pulse motion-reduce:animate-none space-y-2" aria-busy="true">
          <div className="h-4 w-48 rounded bg-ref-sun/10" />
          <div className="h-16 rounded-xl bg-ref-sun/[0.06]" />
        </div>
      ) : null}

      {!profileLoading && profileError ? (
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <p className="text-meta text-danger" role="alert">
            {profileError}
          </p>
          <button type="button" className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`} onClick={() => void onRetryProfile()}>
            {t("common_retry")}
          </button>
        </div>
      ) : null}

      {!profileLoading && !profileError && profile && !hasContent ? (
        <p className="text-meta text-slate-400 mb-3">{t("guide_workbench_profile_summary_empty")}</p>
      ) : null}

      {actionPlan.showPreview && !profileLoading && !profileError && preview && hasContent ? (
        <div className="mb-4 max-w-sm" data-tt-guide-workbench-profile-preview="1">
          <GuideCard
            guide={{
              ...preview,
              stake_amount: stakeAmountForPreview?.trim() || preview.stake_amount,
            }}
            glass
            previewOnly
          />
        </div>
      ) : null}

      {actionPlan.showPreview && !profileLoading && !profileError && missingPublicTitle && profile ? (
        <p className="text-meta text-slate-400 mb-3" data-tt-guide-workbench-profile-public-title-hint="1">
          {t("guide_workbench_profile_public_title_hint", {
            city: profile.city?.trim() || t("guide_card_guide"),
          })}
        </p>
      ) : null}

      {actionPlan.showAvailability && guideId ? (
        <div
          className="mb-4 rounded-xl border border-ref-sun/15 bg-ref-sun/[0.04] px-4 py-3"
          data-tt-guide-workbench-availability="1"
        >
          <p className="text-meta font-medium text-slate-300">{t("guide_workbench_availability_title")}</p>
          {availabilityLoading ? (
            <p className="mt-1 text-meta text-slate-400">{t("guide_workbench_inbox_syncing")}</p>
          ) : null}
          {availabilityError ? (
            <div className="mt-2">
              <ApiErrorAlert message={availabilityError} />
            </div>
          ) : null}
          {!availabilityLoading && !availabilityError && occupiedThisMonth != null ? (
            <p className="mt-1 text-body text-slate-200">
              {t("guide_workbench_availability_occupied_month", { count: occupiedThisMonth })}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Link
            href={guideProfileSettingsHrefFromWorkbench()}
            className={`${TT_WORKSPACE_L5.primaryBtn} min-h-[44px] justify-center ${FOCUS_RING}`}
            data-tt-guide-workbench-profile-edit="1"
          >
            {t("guide_workbench_profile_summary_edit")}
          </Link>
          {publicHref ? (
            <Link
              href={`${publicHref}#guide-availability`}
              className={`${TT_WORKSPACE_L5.secondaryBtn} min-h-[44px] justify-center ${FOCUS_RING}`}
            >
              {t("guide_workbench_profile_summary_market_preview")}
            </Link>
          ) : profile?.public_detail_available === false ? (
            <Link
              href={marketBrowseHref}
              className={`${TT_WORKSPACE_L5.secondaryBtn} min-h-[44px] justify-center ${FOCUS_RING}`}
            >
              {t("guide_workbench_profile_summary_market_browse")}
            </Link>
          ) : null}
      </div>

      {!profileLoading &&
      !profileError &&
      profile?.public_detail_available === false ? (
        <p className="mt-3 text-meta text-slate-500/95" data-tt-guide-workbench-profile-public-unavailable-hint="1">
          {t("guide_workbench_profile_public_detail_unavailable_hint")}
        </p>
      ) : null}
    </section>
  );
}
