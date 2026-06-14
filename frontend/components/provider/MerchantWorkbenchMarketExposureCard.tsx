"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import MarketSubsiteMasonry from "@/components/market/MarketSubsiteMasonry";
import { merchantToMasonryItem } from "@/components/market/marketStandaloneBusinessPageUtils";
import { merchantProfileToDemoListing } from "@/components/me/identitySettings/identitySettingsPreviewUtils";
import { FOCUS_RING } from "@/components/me/constants";
import type { MeMerchantProfile } from "@/lib/apiClient/meMerchantProfile";
import type { MeMerchantListingsSummary } from "@/lib/apiClient/meMerchantListingsSummary";
import type { MerchantPublishEligibility } from "@/lib/provider/merchantPublishEligibility";
import { PROVIDER_WORKBENCH_MARKET_EXPOSURE_ANCHOR } from "@/lib/provider/merchantOrderCorridorModel";
import { merchantProfileSettingsHrefFromWorkbench } from "@/lib/provider/merchantProfileSettingsNav";
import { merchantProfileSummaryHasContent } from "@/lib/provider/providerWorkbenchProfileSummaryModel";
import {
  PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER,
} from "@/lib/provider/providerWorkbenchL5ClosureSprintModel";
import { MERCHANT_STUDIO_HREF } from "@/lib/workspace/workspaceIdentityModel";
import { PUBLISH_HUB_PATH } from "@/lib/me/publishHubL5";
import {
  ProviderWorkbenchOnboardingLink,
  ProviderWorkbenchTrustAdmissionLink,
} from "@/components/provider/ProviderWorkbenchAdmissionLinks";
import {
  resolveMerchantMarketExposureActionPlan,
  resolveMerchantMarketExposureReadyActions,
  resolveMerchantMarketExposureSubtitleKey,
} from "@/lib/provider/providerWorkbenchWorkspaceL5";
import MerchantWorkbenchShowcaseInventory from "@/components/provider/MerchantWorkbenchShowcaseInventory";
import type { MerchantWorkbenchShowcaseRow } from "@/lib/provider/providerWorkbenchListingsModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type MerchantWorkbenchMarketExposureCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  profile: MeMerchantProfile | null;
  profileMissing: boolean;
  profileLoading: boolean;
  profileError: string | null;
  onRetryProfile: () => void;
  summary: MeMerchantListingsSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  onRetrySummary: () => void;
  publishEligibility: MerchantPublishEligibility;
  publishEligibilityLoading: boolean;
  showcaseRows?: MerchantWorkbenchShowcaseRow[];
  showcaseInventoryLoading?: boolean;
  showcaseInventoryError?: string | null;
  showcaseMutatingId?: string | null;
  onRetryShowcaseInventory?: () => void;
  onArchiveShowcaseListing?: (listingId: string) => void;
  onDeleteShowcaseDraft?: (draftId: string) => void;
};

function countDisplay(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return String(value);
}

export default function MerchantWorkbenchMarketExposureCard({
  t,
  profile,
  profileMissing,
  profileLoading,
  profileError,
  onRetryProfile,
  summary,
  summaryLoading,
  summaryError,
  onRetrySummary,
  publishEligibility,
  publishEligibilityLoading,
  showcaseRows = [],
  showcaseInventoryLoading = false,
  showcaseInventoryError = null,
  showcaseMutatingId = null,
  onRetryShowcaseInventory = () => {},
  onArchiveShowcaseListing = () => {},
  onDeleteShowcaseDraft = () => {},
}: MerchantWorkbenchMarketExposureCardProps) {
  const { locale } = useTranslation();

  const hasContent = merchantProfileSummaryHasContent(profile);
  const publishedCount = summary?.published_count;
  const draftCount = summary?.draft_count;
  const countsReady = !summaryLoading && !summaryError && summary != null;
  const settingsHref = merchantProfileSettingsHrefFromWorkbench();
  const publishEligibilityOk = publishEligibility.ok;
  const actionPlan = resolveMerchantMarketExposureActionPlan({ publishEligibilityOk });
  const subtitleKey = resolveMerchantMarketExposureSubtitleKey({ publishEligibilityOk });

  const previewItem = useMemo(() => {
    if (!profile || !hasContent) return null;
    const demo = merchantProfileToDemoListing({
      shopName: profile.shop_name ?? "",
      city: profile.city ?? "",
      countryCode: profile.country_code ?? "",
      categories: profile.categories ?? [],
      bio: profile.bio ?? "",
      avatarUrl: profile.avatar_url ?? undefined,
      coverUrl: profile.cover_url ?? undefined,
    });
    return merchantToMasonryItem(demo, locale);
  }, [profile, hasContent, locale]);

  const showPublishGate = !publishEligibilityLoading && !publishEligibilityOk;
  const showShowcaseEmpty =
    actionPlan.showStudio && countsReady && publishedCount === 0 && draftCount === 0;
  const readyActions =
    countsReady && actionPlan.showStudio
      ? resolveMerchantMarketExposureReadyActions({
          publishedCount: publishedCount ?? 0,
          draftCount: draftCount ?? 0,
        })
      : null;

  return (
    <section
      id={PROVIDER_WORKBENCH_MARKET_EXPOSURE_ANCHOR}
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1`}
      aria-label={t("provider_workbench_market_exposure_aria")}
      data-tt-provider-workbench-market-exposure="1"
      data-tt-provider-workbench-profile-summary="1"
      data-tt-provider-workbench-l5-closure={PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE}
      data-tt-ui-frozen={PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER}
    >
      <div className="mb-4">
        <h2 className={TT_WORKSPACE_L5.sectionTitle}>{t("provider_workbench_market_exposure_title")}</h2>
        <p className={TT_WORKSPACE_L5.sectionSubtitle}>{t(subtitleKey)}</p>
        {!showPublishGate ? (
          <Link
            href={`${PUBLISH_HUB_PATH}?filter=merchant`}
            className={`mt-2 inline-flex min-h-[44px] items-center text-meta font-semibold text-ref-sun/90 ${FOCUS_RING}`}
            data-tt-provider-workbench-publish-hub-link="1"
          >
            {t("header_userMenu_publish_hub")}
          </Link>
        ) : null}
      </div>

      {showPublishGate ? (
        <div
          className="mb-4 rounded-xl border border-ref-sun/28 bg-gradient-to-br from-ref-sun/[0.08] via-[#0c0a09]/40 to-[#0a0a0a]/80 px-4 py-4 sm:px-5"
          data-tt-provider-workbench-publish-gate="1"
        >
          <p className="text-small font-semibold text-slate-100">{t("provider_workbench_publish_gate_title")}</p>
          <p className="text-meta text-slate-400 mt-1.5 leading-relaxed">
            {t("provider_workbench_publish_gate_body")}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <ProviderWorkbenchOnboardingLink t={t} variant="primary" className="w-full justify-center" />
            <div className="flex flex-col sm:flex-row gap-2">
              <ProviderWorkbenchTrustAdmissionLink t={t} className="w-full sm:flex-1 justify-center" />
              <Link
                href={settingsHref}
                className={`${TT_WORKSPACE_L5.navLink} w-full sm:flex-1 justify-center ${FOCUS_RING}`}
                data-tt-provider-workbench-profile-edit="1"
              >
                {t("provider_workbench_link_settings")}
              </Link>
            </div>
          </div>
          <p
            className="mt-3 text-meta text-slate-500 leading-relaxed border-t border-ref-sun/12 pt-3"
            data-tt-provider-workbench-market-exposure-collapsed="1"
          >
            {t("provider_workbench_market_exposure_locked_placeholder")}
          </p>
        </div>
      ) : null}

      {profileLoading ? (
        <div className="animate-pulse motion-reduce:animate-none space-y-2 mb-4" aria-busy="true">
          <div className="h-4 w-48 rounded bg-ref-sun/10" />
          <div className="h-16 rounded-xl bg-ref-sun/[0.06]" />
        </div>
      ) : null}

      {!profileLoading && profileError ? (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <p className="text-meta text-danger" role="alert">
            {profileError}
          </p>
          <button
            type="button"
            className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}
            onClick={() => void onRetryProfile()}
          >
            {t("common_retry")}
          </button>
        </div>
      ) : null}

      {!showPublishGate && !profileLoading && !profileError && profileMissing ? (
        <div
          className="mb-4 rounded-xl border border-dashed border-ref-sun/25 px-4 py-3"
          data-tt-provider-workbench-profile-missing="1"
        >
          <p className="text-small font-semibold text-slate-200">{t("provider_workbench_profile_missing_title")}</p>
          <p className="text-meta text-slate-400 mt-1">{t("provider_workbench_profile_missing_body")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/provider/register?step=1" className={`${TT_WORKSPACE_L5.primaryBtn} ${FOCUS_RING}`}>
              {t("provider_workbench_profile_missing_cta_register")}
            </Link>
            <Link href={settingsHref} className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}>
              {t("provider_workbench_profile_missing_cta_settings")}
            </Link>
          </div>
        </div>
      ) : null}

      {!profileLoading && !profileError && profile && !hasContent ? (
        <p className="text-meta text-slate-400 mb-4">{t("provider_workbench_profile_summary_empty")}</p>
      ) : null}

      {actionPlan.showPreview && !profileLoading && !profileError && previewItem ? (
        <div className="mb-4 max-w-sm" data-tt-provider-workbench-profile-preview="1">
          <MarketSubsiteMasonry
            listLabelKey="provider_workbench_profile_preview_list_aria"
            items={[previewItem]}
            badgeKey="provider_workbench_profile_preview_badge"
            previewOnly
          />
        </div>
      ) : null}

      {actionPlan.showListingCounts ? (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className={TT_WORKSPACE_L5.statTile}>
            <p className={TT_WORKSPACE_L5.statValue}>{summaryLoading ? "…" : countDisplay(publishedCount)}</p>
            <p className={TT_WORKSPACE_L5.statLabel}>{t("provider_workbench_showcase_published")}</p>
          </div>
          <div className={TT_WORKSPACE_L5.statTile}>
            <p className={TT_WORKSPACE_L5.statValueAccent}>{summaryLoading ? "…" : countDisplay(draftCount)}</p>
            <p className={TT_WORKSPACE_L5.statLabel}>{t("provider_workbench_showcase_drafts")}</p>
          </div>
        </div>
      ) : null}

      {summaryError ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-meta text-danger" role="alert">
            {summaryError}
          </p>
          <button
            type="button"
            className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}
            onClick={() => void onRetrySummary()}
          >
            {t("common_retry")}
          </button>
        </div>
      ) : null}

      {actionPlan.showStudio ? (
        <MerchantWorkbenchShowcaseInventory
          t={t}
          rows={showcaseRows}
          loading={showcaseInventoryLoading}
          error={showcaseInventoryError}
          mutatingId={showcaseMutatingId}
          onRetry={onRetryShowcaseInventory}
          onArchivePublished={onArchiveShowcaseListing}
          onDeleteDraft={onDeleteShowcaseDraft}
        />
      ) : null}

      {showShowcaseEmpty ? (
        <p className="text-meta text-slate-400 mb-3">{t("provider_workbench_showcase_empty")}</p>
      ) : null}

      {actionPlan.showStudio && readyActions ? (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
          {readyActions.primary === "settings" ? (
            <Link
              href={settingsHref}
              className={`${TT_WORKSPACE_L5.primaryBtn} min-h-[44px] justify-center ${FOCUS_RING}`}
              data-tt-provider-workbench-profile-edit="1"
            >
              {t("provider_workbench_link_settings")}
            </Link>
          ) : (
            <Link
              href={MERCHANT_STUDIO_HREF}
              className={`${TT_WORKSPACE_L5.primaryBtn} min-h-[44px] justify-center ${FOCUS_RING}`}
              data-tt-provider-workbench-open-studio="1"
            >
              {t("provider_workbench_manage_showcase_cta")}
            </Link>
          )}
          {readyActions.secondary === "settings" ? (
            <Link
              href={settingsHref}
              className={`${TT_WORKSPACE_L5.secondaryBtn} min-h-[44px] justify-center ${FOCUS_RING}`}
              data-tt-provider-workbench-profile-edit="1"
            >
              {t("provider_workbench_link_settings")}
            </Link>
          ) : (
            <Link
              href={MERCHANT_STUDIO_HREF}
              className={`${TT_WORKSPACE_L5.secondaryBtn} min-h-[44px] justify-center ${FOCUS_RING}`}
              data-tt-provider-workbench-open-studio="1"
            >
              {t("provider_workbench_manage_showcase_cta")}
            </Link>
          )}
        </div>
      ) : null}
    </section>
  );
}
