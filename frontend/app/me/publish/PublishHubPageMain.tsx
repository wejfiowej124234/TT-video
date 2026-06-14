"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PublishHubGovernanceRailSection from "@/components/me/publish/PublishHubGovernanceRailSection";
import PublishHubGuideRailSection from "@/components/me/publish/PublishHubGuideRailSection";
import PublishHubListingInventory from "@/components/me/publish/PublishHubListingInventory";
import PublishHubSummaryStrip from "@/components/me/publish/PublishHubSummaryStrip";
import { PublishHubWorkspaceContextToast } from "@/components/me/publish/PublishHubWorkspaceContextToast";
import PublishHubTripRailSection from "@/components/me/publish/PublishHubTripRailSection";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { useTranslation } from "@/components/LocaleProvider";
import { useProviderWorkbenchListings } from "@/app/provider/useProviderWorkbenchListings";
import { usePublishHubAcquisitionListings } from "@/app/me/publish/usePublishHubAcquisitionListings";
import { usePublishHubGovernanceRail } from "@/app/me/publish/usePublishHubGovernanceRail";
import { usePublishHubGuideRail } from "@/app/me/publish/usePublishHubGuideRail";
import { usePublishHubTripOrders } from "@/app/me/publish/usePublishHubTripOrders";
import { buildHeaderLoginHref } from "@/lib/headerLoginHref";
import {
  listSelectableWorkspaceContexts,
  readActiveWorkspaceContext,
  workspaceContextFromPublishHubIdentityParam,
  workspaceContextLabelKey,
  writeActiveWorkspaceContext,
} from "@/lib/header/activeWorkspaceContext";
import {
  meAcquisitionWorkspaceUnlocked,
  meGuideWorkspaceUnlocked,
  meIdentityOperatorSlotVisible,
  meMerchantWorkspaceUnlocked,
  meStewardWorkspaceUnlocked,
} from "@/lib/me/meIdentitySlotVisibility";
import {
  PUBLISH_HUB_RAILS,
  publishHubFilterFromSearchParams,
  publishHubFilterLabelKey,
  publishHubRailPhaseAActive,
  publishHubRailPlaceholderKey,
  publishHubRailSectionLabelKey,
  type PublishHubContentRail,
  type PublishHubRailFilter,
} from "@/lib/me/publishHubModel";
import { publishHubL5MainDataAttrs, TT_PUBLISH_HUB_L5 } from "@/lib/me/publishHubL5";
import {
  buildPublishHubSummaryChips,
  countMerchantListingRows,
} from "@/lib/me/publishHubSummaryModel";
import {
  publishHubDefaultFilterFromUnlockedSlots,
  publishHubFilterFromIdentityParam,
} from "@/lib/me/publishHubIdentityDefaultFilter";
import {
  PUBLISH_HUB_OPERATING_SPINE_DATA_ATTR,
  publishHubOperatingContextFromPageState,
  publishHubOperatingSpineLine,
} from "@/lib/me/publishHubOperatingSpineModel";
import {
  PUBLISH_HUB_WORKSPACE_CONTEXT_URL_WINS_TOAST_KEY,
  publishHubUrlAndContextForFilter,
  resolvePublishHubWorkspaceContextInit,
} from "@/lib/me/publishHubWorkspaceContextSync";
import {
  PUBLISH_HUB_SINGLE_IDENTITY_FILTER_DATA_ATTR,
  PUBLISH_HUB_SINGLE_IDENTITY_FILTER_HINT_KEY,
} from "@/lib/me/accountOperatingModelUxWave0Model";
import { usePublishHubServerSummary } from "@/app/me/publish/usePublishHubServerSummary";
import { publishHubVisibleContentRails } from "@/lib/me/publishHubVisibleRailsModel";
import { publishHubFilterArrowKeyNext } from "@/lib/me/publishHubFilterA11y";
import { useMeIdentitySlots } from "@/lib/me/useMeIdentitySlots";
import { useMeSettingsSummary } from "@/lib/me/useMeSettingsSummary";
import {
  ACQUISITION_STUDIO_HREF,
  ACQUISITION_WORKSPACE_HREF,
  MERCHANT_STUDIO_HREF,
  MERCHANT_WORKSPACE_HREF,
} from "@/lib/workspace/workspaceIdentityModel";
import { FOCUS_RING } from "@/components/me/constants";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const CONTENT_RAILS: PublishHubContentRail[] = [
  "trip",
  "guide",
  "merchant",
  "acquisition",
  "governance",
];

function PublishHubRailPlaceholder({
  t,
  rail,
}: {
  t: (key: string) => string;
  rail: PublishHubContentRail;
}) {
  return (
    <section
      className={TT_PUBLISH_HUB_L5.railSection}
      aria-labelledby={`publish-hub-rail-${rail}`}
      data-tt-publish-hub-rail={rail}
      data-tt-publish-hub-rail-phase="placeholder"
    >
      <h2 id={`publish-hub-rail-${rail}`} className={TT_PUBLISH_HUB_L5.railTitle}>
        {t(publishHubRailSectionLabelKey(rail))}
      </h2>
      <div className={TT_PUBLISH_HUB_L5.railPlaceholder}>
        <p className="text-meta text-slate-400/95">{t(publishHubRailPlaceholderKey(rail))}</p>
      </div>
    </section>
  );
}

type ListingRailConfig = {
  rail: "merchant" | "acquisition";
  titleKey: string;
  subtitleKey: string;
  workbenchHref: string;
  workbenchKey: string;
  studioHref: string;
  studioKey: string;
  lockedBodyKey: string;
  applyHref: string;
  applyKey: string;
  emptyKey: string;
};

const LISTING_RAIL_CONFIG: Record<"merchant" | "acquisition", ListingRailConfig> = {
  merchant: {
    rail: "merchant",
    titleKey: "publish_hub_rail_merchant_title",
    subtitleKey: "publish_hub_rail_merchant_subtitle",
    workbenchHref: MERCHANT_WORKSPACE_HREF,
    workbenchKey: "publish_hub_merchant_open_workbench",
    studioHref: MERCHANT_STUDIO_HREF,
    studioKey: "publish_hub_merchant_studio_cta",
    lockedBodyKey: "publish_hub_merchant_locked_body",
    applyHref: "/provider/register",
    applyKey: "publish_hub_merchant_apply_cta",
    emptyKey: "publish_hub_merchant_empty",
  },
  acquisition: {
    rail: "acquisition",
    titleKey: "publish_hub_rail_acquisition_title",
    subtitleKey: "publish_hub_rail_acquisition_subtitle",
    workbenchHref: ACQUISITION_WORKSPACE_HREF,
    workbenchKey: "publish_hub_acquisition_open_subsite",
    studioHref: ACQUISITION_STUDIO_HREF,
    studioKey: "publish_hub_acquisition_studio_cta",
    lockedBodyKey: "publish_hub_acquisition_locked_body",
    applyHref: "/market/acquisition",
    applyKey: "publish_hub_acquisition_open_cta",
    emptyKey: "publish_hub_acquisition_empty",
  },
};

function PublishHubListingRailSection({
  t,
  config,
  unlocked,
  listings,
}: {
  t: (key: string) => string;
  config: ListingRailConfig;
  unlocked: boolean;
  listings: ReturnType<typeof useProviderWorkbenchListings>;
}) {
  return (
    <section
      className={TT_PUBLISH_HUB_L5.railSection}
      aria-labelledby={`publish-hub-rail-${config.rail}`}
      data-tt-publish-hub-rail={config.rail}
      data-tt-publish-hub-rail-phase="active"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={`publish-hub-rail-${config.rail}`} className={TT_PUBLISH_HUB_L5.railTitle}>
            {t(config.titleKey)}
          </h2>
          <p className={TT_PUBLISH_HUB_L5.railSubtitle}>{t(config.subtitleKey)}</p>
        </div>
        {unlocked ? (
          <Link
            href={config.workbenchHref}
            className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`}
            data-tt-publish-hub-listing-workbench={config.rail}
          >
            {t(config.workbenchKey)}
          </Link>
        ) : null}
      </div>

      {!unlocked ? (
        <div className={TT_PUBLISH_HUB_L5.railPlaceholder}>
          <p className="text-meta text-slate-400/95">{t(config.lockedBodyKey)}</p>
          <Link
            href={config.applyHref}
            className={`mt-4 inline-flex min-h-[44px] items-center text-small font-semibold text-ref-sun/90 ${FOCUS_RING}`}
            data-tt-publish-hub-listing-apply={config.rail}
          >
            {t(config.applyKey)}
          </Link>
        </div>
      ) : (
        <>
          <PublishHubListingInventory
            variant={config.rail}
            t={t}
            rows={listings.rows}
            loading={listings.loading}
            error={listings.error}
            mutatingId={listings.mutatingId}
            studioHref={config.studioHref}
            coverAlt={t("publish_hub_item_cover_alt")}
            onRetry={() => void listings.retry()}
            onArchivePublished={(id) => void listings.archivePublished(id)}
            onDeleteDraft={(id) => void listings.deleteDraft(id)}
          />
          {!listings.loading && !listings.error && listings.rows.length === 0 ? (
            <div className={TT_PUBLISH_HUB_L5.railPlaceholder}>
              <p className="text-meta text-slate-400/95">{t(config.emptyKey)}</p>
              <Link
                href={config.studioHref}
                className={`mt-4 inline-flex min-h-[44px] items-center text-small font-semibold text-ref-sun/90 ${FOCUS_RING}`}
                data-tt-publish-hub-listing-studio={config.rail}
              >
                {t(config.studioKey)}
              </Link>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function PublishHubPageInner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<PublishHubRailFilter>("all");
  const [filterInitialized, setFilterInitialized] = useState(false);
  const [contextUrlToast, setContextUrlToast] = useState(false);
  const lastConflictIdentityRef = useRef<string | null>(null);

  const { user, loading, error, reload } = useMeSettingsSummary(t);
  const { ready: slotsReady, slotById, slots } = useMeIdentitySlots();

  const loginHref = useMemo(
    () => buildHeaderLoginHref(pathname, searchParams),
    [pathname, searchParams],
  );

  const loggedIn = !loading && !!user && !error;
  const merchantUnlocked =
    loggedIn &&
    slotsReady &&
    meMerchantWorkspaceUnlocked({
      userRole: user?.role ?? null,
      merchantSlotState: slotById("merchant")?.state ?? null,
    });
  const acquisitionUnlocked =
    loggedIn &&
    slotsReady &&
    meAcquisitionWorkspaceUnlocked({
      acquisitionSlotState: slotById("acquisition")?.state ?? null,
    });
  const stewardUnlocked =
    loggedIn &&
    slotsReady &&
    meStewardWorkspaceUnlocked({
      userRole: user?.role ?? null,
      stewardSlotState: slotById("region_steward")?.state ?? null,
    });
  const guideUnlocked =
    loggedIn &&
    slotsReady &&
    meGuideWorkspaceUnlocked({
      userRole: user?.role ?? null,
      guideSlotState: slotById("guide")?.state ?? null,
    });
  const guideSlotState = slotsReady ? slotById("guide")?.state ?? null : null;
  const guideRailEnabled =
    loggedIn && slotsReady && (guideUnlocked || meIdentityOperatorSlotVisible(guideSlotState));

  const merchantListings = useProviderWorkbenchListings(merchantUnlocked, t);
  const acquisitionListings = usePublishHubAcquisitionListings(acquisitionUnlocked, t);
  const tripOrders = usePublishHubTripOrders(loggedIn, t);
  const governanceRail = usePublishHubGovernanceRail(loggedIn && stewardUnlocked, t);
  const guideRail = usePublishHubGuideRail(guideRailEnabled, t);
  const serverSummary = usePublishHubServerSummary(loggedIn);

  const selectableContexts = useMemo(
    () => listSelectableWorkspaceContexts(slots),
    [slots],
  );

  const applyFilterWithWorkspaceSync = useCallback(
    (railFilter: PublishHubRailFilter) => {
      const { href, context } = publishHubUrlAndContextForFilter(
        railFilter,
        pathname,
        searchParams,
      );
      writeActiveWorkspaceContext(context);
      setFilter(railFilter);
      router.replace(href);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!loggedIn || !slotsReady) return;

    const fromUrlFilter = publishHubFilterFromSearchParams(searchParams);
    if (fromUrlFilter) {
      setFilter(fromUrlFilter);
      setFilterInitialized(true);
      return;
    }

    const urlIdentity = searchParams.get("identity");
    const stored = readActiveWorkspaceContext();
    const resolved = resolvePublishHubWorkspaceContextInit({
      stored,
      urlIdentity,
      selectableIds: selectableContexts,
    });

    if (resolved.filter) {
      setFilter(resolved.filter);
      if (resolved.urlConflict) {
        const conflictKey = urlIdentity?.trim().toLowerCase() ?? "";
        if (lastConflictIdentityRef.current !== conflictKey) {
          lastConflictIdentityRef.current = conflictKey;
          setContextUrlToast(true);
        }
      }
      if (resolved.applyUrlIdentity) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("identity", resolved.applyUrlIdentity);
        router.replace(`${pathname}?${params.toString()}`);
      }
      setFilterInitialized(true);
      return;
    }

    if (!filterInitialized) {
      const auto = publishHubDefaultFilterFromUnlockedSlots({
        guideUnlocked,
        merchantUnlocked,
        acquisitionUnlocked,
        stewardUnlocked,
      });
      if (auto) setFilter(auto);
      setFilterInitialized(true);
    }
  }, [
    loggedIn,
    slotsReady,
    searchParams,
    selectableContexts,
    pathname,
    router,
    filterInitialized,
    guideUnlocked,
    merchantUnlocked,
    acquisitionUnlocked,
    stewardUnlocked,
  ]);

  const contextUrlToastMessage = useMemo(() => {
    const urlContext = workspaceContextFromPublishHubIdentityParam(searchParams.get("identity"));
    if (!urlContext) return "";
    return t(PUBLISH_HUB_WORKSPACE_CONTEXT_URL_WINS_TOAST_KEY, {
      context: t(workspaceContextLabelKey(urlContext)),
    });
  }, [searchParams, t]);

  const operatingSpineContext = useMemo(
    () =>
      publishHubOperatingContextFromPageState({
        filter,
        urlIdentity: searchParams.get("identity"),
        selectableIds: selectableContexts,
      }),
    [filter, searchParams, selectableContexts],
  );

  const operatingSpineLine = useMemo(
    () => publishHubOperatingSpineLine(operatingSpineContext, t),
    [operatingSpineContext, t],
  );

  const merchantCounts = useMemo(
    () => countMerchantListingRows(merchantListings.rows),
    [merchantListings.rows],
  );
  const acquisitionCounts = useMemo(
    () => countMerchantListingRows(acquisitionListings.rows),
    [acquisitionListings.rows],
  );

  const clientSummaryCounts = useMemo(
    () => ({
      trip: tripOrders.count,
      merchantPublished: merchantCounts.merchantPublished,
      merchantDrafts: merchantCounts.merchantDrafts,
      acquisitionPublished: acquisitionCounts.merchantPublished,
      acquisitionDrafts: acquisitionCounts.merchantDrafts,
      governance: governanceRail.count,
      guide: guideRail.hasListing ? 1 : 0,
    }),
    [
      tripOrders.count,
      merchantCounts,
      acquisitionCounts,
      governanceRail.count,
      guideRail.hasListing,
    ],
  );

  const summaryChips = useMemo(
    () => buildPublishHubSummaryChips(serverSummary.counts ?? clientSummaryCounts),
    [serverSummary.counts, clientSummaryCounts],
  );

  const visibleRailsSnapshot = useMemo(
    () => ({
      tripOrderCount: tripOrders.count,
      tripLoading: tripOrders.loading,
      tripError: !!tripOrders.error,
      governanceProposalCount: governanceRail.count,
      governanceLoading: governanceRail.loading,
      governanceError: !!governanceRail.error,
      guideVisible: guideRailEnabled,
      guideHasListing: guideRail.hasListing,
      guideLoading: guideRail.loading,
      guideError: !!guideRail.error,
      stewardUnlocked,
      merchantUnlocked,
      merchantRowCount: merchantListings.rows.length,
      merchantLoading: merchantListings.loading,
      merchantError: !!merchantListings.error,
      acquisitionUnlocked,
      acquisitionRowCount: acquisitionListings.rows.length,
      acquisitionLoading: acquisitionListings.loading,
      acquisitionError: !!acquisitionListings.error,
    }),
    [
      tripOrders.count,
      tripOrders.loading,
      tripOrders.error,
      governanceRail.count,
      governanceRail.loading,
      governanceRail.error,
      guideRailEnabled,
      guideRail.hasListing,
      guideRail.loading,
      guideRail.error,
      stewardUnlocked,
      merchantUnlocked,
      merchantListings.rows.length,
      merchantListings.loading,
      merchantListings.error,
      acquisitionUnlocked,
      acquisitionListings.rows.length,
      acquisitionListings.loading,
      acquisitionListings.error,
    ],
  );

  const visibleRails = useMemo(
    () =>
      publishHubVisibleContentRails({
        filter,
        allRails: CONTENT_RAILS,
        snapshot: visibleRailsSnapshot,
      }),
    [filter, visibleRailsSnapshot],
  );

  const singleSlotAutoFilter = useMemo(() => {
    if (!loggedIn || !slotsReady) return null;
    if (publishHubFilterFromSearchParams(searchParams)) return null;
    if (publishHubFilterFromIdentityParam(searchParams.get("identity"))) return null;
    return publishHubDefaultFilterFromUnlockedSlots({
      guideUnlocked,
      merchantUnlocked,
      acquisitionUnlocked,
      stewardUnlocked,
    });
  }, [
    loggedIn,
    slotsReady,
    searchParams,
    guideUnlocked,
    merchantUnlocked,
    acquisitionUnlocked,
    stewardUnlocked,
  ]);

  function renderRail(rail: PublishHubContentRail) {
    if (rail === "trip") {
      return (
        <PublishHubTripRailSection
          key={rail}
          t={t}
          rows={tripOrders.rows}
          loading={tripOrders.loading}
          error={tripOrders.error}
          onRetry={() => void tripOrders.retry()}
        />
      );
    }
    if (rail === "merchant") {
      return (
        <PublishHubListingRailSection
          key={rail}
          t={t}
          config={LISTING_RAIL_CONFIG.merchant}
          unlocked={merchantUnlocked}
          listings={merchantListings}
        />
      );
    }
    if (rail === "acquisition") {
      return (
        <PublishHubListingRailSection
          key={rail}
          t={t}
          config={LISTING_RAIL_CONFIG.acquisition}
          unlocked={acquisitionUnlocked}
          listings={acquisitionListings}
        />
      );
    }
    if (rail === "governance") {
      return (
        <PublishHubGovernanceRailSection
          key={rail}
          t={t}
          unlocked={stewardUnlocked}
          rows={governanceRail.rows}
          loading={governanceRail.loading}
          error={governanceRail.error}
          onRetry={() => void governanceRail.retry()}
        />
      );
    }
    if (rail === "guide") {
      return (
        <PublishHubGuideRailSection
          key={rail}
          t={t}
          unlocked={guideUnlocked}
          slotState={guideSlotState}
          profile={guideRail.profile}
          loading={guideRail.loading}
          error={guideRail.error}
          onRetry={() => void guideRail.retry()}
        />
      );
    }
    return <PublishHubRailPlaceholder key={rail} t={t} rail={rail} />;
  }

  return (
    <MeSettingsL5FlowPage
      ariaLabelledby="publish-hub-page-title"
      route="publish"
      dataAttrs={publishHubL5MainDataAttrs()}
    >
      <header className={TT_PUBLISH_HUB_L5.headerBlock}>
        <p className={TT_PUBLISH_HUB_L5.eyebrow}>{t("publish_hub_eyebrow")}</p>
        <h1 id="publish-hub-page-title" className={TT_PUBLISH_HUB_L5.title}>
          {t("publish_hub_title")}
        </h1>
        <p className={TT_PUBLISH_HUB_L5.subtitle}>{t("publish_hub_subtitle")}</p>
        <p
          className={`${TT_PUBLISH_HUB_L5.subtitle} font-medium text-slate-300/95`}
          {...{ [PUBLISH_HUB_OPERATING_SPINE_DATA_ATTR]: operatingSpineContext }}
          aria-live="polite"
        >
          {operatingSpineLine}
        </p>
        <p className={`${TT_PUBLISH_HUB_L5.subtitle} text-slate-400/90`}>{t("publish_hub_operating_context")}</p>
      </header>

      {!loading && error ? (
        <p className="text-meta text-danger" role="alert">
          {error}{" "}
          <button type="button" className={`text-ref-sun/90 underline ${FOCUS_RING}`} onClick={() => reload()}>
            {t("common_retry")}
          </button>
        </p>
      ) : null}

      {!loading && !user ? (
        <div className={TT_PUBLISH_HUB_L5.railPlaceholder}>
          <p className="text-meta text-slate-400/95">{t("publish_hub_login_required")}</p>
          <Link
            href={loginHref}
            className={`mt-4 inline-flex min-h-[44px] items-center text-small font-semibold text-ref-sun/90 ${touchTargetLink44Classes} ${FOCUS_RING}`}
            data-tt-publish-hub-login="1"
          >
            {t("header_login")}
          </Link>
        </div>
      ) : null}

      {loggedIn ? (
        <>
          <PublishHubSummaryStrip t={t} chips={summaryChips} />

          <div
            className={TT_PUBLISH_HUB_L5.filterRow}
            role="tablist"
            aria-label={t("publish_hub_filter_aria")}
            data-tt-publish-hub-filters="1"
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              applyFilterWithWorkspaceSync(
                publishHubFilterArrowKeyNext(filter, event.key as "ArrowLeft" | "ArrowRight"),
              );
            }}
          >
            {PUBLISH_HUB_RAILS.map((railFilter) => {
              const active = filter === railFilter;
              const disabled =
                railFilter !== "all" &&
                !publishHubRailPhaseAActive(railFilter as PublishHubContentRail);
              return (
                <button
                  key={railFilter}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  disabled={disabled}
                  className={`${active ? TT_PUBLISH_HUB_L5.filterChipActive : TT_PUBLISH_HUB_L5.filterChip}${
                    disabled ? ` ${TT_PUBLISH_HUB_L5.filterChipDisabled}` : ""
                  } ${FOCUS_RING}`}
                  onClick={() => applyFilterWithWorkspaceSync(railFilter)}
                  data-tt-publish-hub-filter={railFilter}
                >
                  {t(publishHubFilterLabelKey(railFilter))}
                </button>
              );
            })}
          </div>

          <PublishHubWorkspaceContextToast
            show={contextUrlToast}
            message={contextUrlToastMessage}
            onDismiss={() => setContextUrlToast(false)}
          />

          {singleSlotAutoFilter && filter === singleSlotAutoFilter ? (
            <p
              className="text-meta leading-relaxed text-slate-400/95"
              {...{ [PUBLISH_HUB_SINGLE_IDENTITY_FILTER_DATA_ATTR]: "1" }}
            >
              {t(PUBLISH_HUB_SINGLE_IDENTITY_FILTER_HINT_KEY, {
                filter: t(publishHubFilterLabelKey(singleSlotAutoFilter)),
              })}
            </p>
          ) : null}

          <div className="flex flex-col gap-4" data-tt-publish-hub-rails="1">
            {visibleRails.map((rail) => renderRail(rail))}
          </div>

          <nav className={TT_PUBLISH_HUB_L5.crossNav} aria-label={t("publish_hub_cross_nav_aria")}>
            <Link href="/orders" className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`}>
              {t("header_myOrders")}
            </Link>
            <Link href="/me/identities" className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`}>
              {t("header_multiIdentity")}
            </Link>
            <Link href="/me/settings" className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`}>
              {t("header_settings")}
            </Link>
          </nav>
        </>
      ) : null}
    </MeSettingsL5FlowPage>
  );
}

export default function PublishHubPageMain() {
  return (
    <Suspense fallback={null}>
      <PublishHubPageInner />
    </Suspense>
  );
}
