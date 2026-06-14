"use client";

import { Suspense } from "react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { getMeFull } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import ProviderWorkbenchInboxCard from "@/components/provider/ProviderWorkbenchInboxCard";
import MerchantWorkbenchMarketExposureCard from "@/components/provider/MerchantWorkbenchMarketExposureCard";
import ProviderWorkbenchBillingPeriodCard from "@/components/provider/ProviderWorkbenchBillingPeriodCard";
import ProviderWorkbenchStatsTeaser from "@/components/provider/ProviderWorkbenchStatsTeaser";
import { ProviderWorkbenchL5CrossNav } from "@/components/provider/ProviderWorkbenchL5CrossNav";
import { FOCUS_RING, type UserShape } from "@/components/me/constants";
import {
  MERCHANT_WORKSPACE_HREF,
} from "@/lib/workspace/workspaceIdentityModel";
import { parseMerchantWorkspaceStats } from "@/lib/workspace/workspaceStatsModel";
import { useProviderWorkbenchInbox } from "./useProviderWorkbenchInbox";
import { useProviderWorkbenchProfile } from "./useProviderWorkbenchProfile";
import { useProviderWorkbenchListingsSummary } from "./useProviderWorkbenchListingsSummary";
import WorkspaceL5PageShell from "@/components/workspace/WorkspaceL5PageShell";
import { WorkspaceL5Header } from "@/components/workspace/WorkspaceL5Header";
import { WorkspaceL5SettingsIngress } from "@/components/workspace/WorkspaceL5SettingsIngress";
import { WorkspaceL5PageSkeleton } from "@/components/workspace/WorkspaceL5PageSkeleton";
import { meSettingsExtensionIngressDataAttrs } from "@/components/me/MeSettingsExtensionIngressBlock";
import { isMeSettingsExtensionFromQuery } from "@/lib/me/meSettingsExtensionContext";
import { meMerchantWorkspaceUnlocked } from "@/lib/me/meIdentitySlotVisibility";
import { useMeIdentitySlots } from "@/lib/me/useMeIdentitySlots";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";
import { WorkspaceOperatorLockedPanel } from "@/components/workspace/WorkspaceOperatorLockedPanel";
import {
  PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER,
} from "@/lib/provider/providerWorkbenchL5ClosureSprintModel";
import {
  merchantHasServiceHistory,
  MERCHANT_WORKSPACE_OPS_SCOPE_MARKER,
  resolveMerchantInboxEmptyGuidance,
  resolveMerchantWorkbenchHeaderSubtitleKey,
  shouldShowMerchantInboxEmptyState,
  shouldShowMerchantWorkbenchStatsSections,
  shouldShowMerchantWorkbenchStatsTeaser,
} from "@/lib/provider/providerWorkbenchWorkspaceL5";
import { useProviderWorkbenchPublishEligibility } from "./useProviderWorkbenchPublishEligibility";
import { useProviderWorkbenchListings } from "./useProviderWorkbenchListings";
import { useWorkspaceContextWorkbenchGuard } from "@/lib/header/useWorkspaceContextWorkbenchGuard";

function ProviderWorkbenchPageInner() {
  useWorkspaceContextWorkbenchGuard();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromSettings = isMeSettingsExtensionFromQuery(searchParams?.get("from"));
  const returnPath = useMemo(() => {
    const base = pathname && pathname !== "/" ? pathname : MERCHANT_WORKSPACE_HREF;
    const q = searchParams?.toString() ?? "";
    return q ? `${base}?${q}` : base;
  }, [pathname, searchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserShape | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const fetchGen = useRef(0);

  const loadMe = useCallback(
    (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      const gen = ++fetchGen.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      } else {
        setStatsLoading(true);
        setStatsError(false);
      }
      getMeFull()
        .then((res) => {
          if (gen !== fetchGen.current) return;
          if (res == null) {
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnPath)}`);
            return;
          }
          const u = (res as { user?: UserShape })?.user;
          setUser(u ?? null);
          const st = (res as { stats?: unknown })?.stats;
          setStats(st && typeof st === "object" && !Array.isArray(st) ? (st as Record<string, unknown>) : {});
          setStatsError(false);
        })
        .catch((err) => {
          if (gen !== fetchGen.current) return;
          if (err instanceof Error && err.message === "login_required") {
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnPath)}`);
            return;
          }
          if (silent) {
            setStatsError(true);
          } else {
            setError(mapApiReadError(err, t, "provider_workbench_load_fail"));
          }
        })
        .finally(() => {
          if (gen !== fetchGen.current) return;
          if (!silent) setLoading(false);
          else setStatsLoading(false);
        });
    },
    [returnPath, router, t],
  );

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const retryStatsCards = useCallback(() => {
    void loadMe({ silent: true });
  }, [loadMe]);

  const { ready: slotsReady, slotById } = useMeIdentitySlots();
  const merchantWorkspaceUnlocked = meMerchantWorkspaceUnlocked({
    userRole: user?.role ?? null,
    merchantSlotState: slotsReady ? slotById("merchant")?.state ?? null : null,
  });
  const awaitingSlots = !!user && !slotsReady;
  const workbenchEnabled = merchantWorkspaceUnlocked && slotsReady;

  const { inbox, nextOrderItem, ordersLoading, ordersError, retryInbox } = useProviderWorkbenchInbox(
    workbenchEnabled,
    t,
  );
  const {
    profile: workbenchProfile,
    profileMissing,
    loading: profileLoading,
    error: profileError,
    retry: retryProfile,
  } = useProviderWorkbenchProfile(workbenchEnabled, t);
  const { eligibility: publishEligibility, loading: publishEligibilityLoading } =
    useProviderWorkbenchPublishEligibility(workbenchEnabled);
  const {
    summary: listingsSummary,
    loading: summaryLoading,
    error: summaryError,
    retry: retrySummary,
  } = useProviderWorkbenchListingsSummary(workbenchEnabled, t);
  const showcaseInventoryEnabled = workbenchEnabled && publishEligibility.ok;
  const showcaseInventory = useProviderWorkbenchListings(showcaseInventoryEnabled, t);

  const refreshShowcaseData = useCallback(() => {
    void showcaseInventory.retry();
    void retrySummary();
  }, [showcaseInventory.retry, retrySummary]);

  if (loading) return <WorkspaceL5PageSkeleton t={t} kind="merchant" ariaLabelKey="provider_workbench_title" />;

  if (error) {
    return (
      <WorkspaceL5PageShell
        kind="merchant"
        ariaLabel={t("provider_workbench_title")}
        footerTarget={fromSettings ? "settings" : "none"}
        dataAttrs={{
          ...meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-provider-from-settings"),
          "data-tt-provider-workspace-page": "1",
          "data-tt-provider-workbench-l5-closure": PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
          "data-tt-ui-frozen": PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER,
        }}
      >
        <WorkspaceL5SettingsIngress
          fromSettings={fromSettings}
          noticeKey="me_settings_merchant_from_settings_notice"
          t={t}
        />
        <WorkspaceL5Header
          eyebrow={t("provider_workbench_eyebrow")}
          title={t("provider_workbench_title")}
          subtitle={t("provider_workbench_subtitle")}
        />
        <div className={TT_WORKSPACE_L5.errorPanel}>
          <ApiErrorAlert message={error} />
          <button
            type="button"
            onClick={() => loadMe()}
            className={`${TT_WORKSPACE_L5.primaryBtn} mt-3 ${FOCUS_RING}`}
          >
            {t("common_retry")}
          </button>
        </div>
      </WorkspaceL5PageShell>
    );
  }

  const merchantStats = parseMerchantWorkspaceStats(stats);
  const ordersTotal = merchantStats.orders_merchant_total ?? 0;
  const inProgressFromStats = merchantStats.merchant_in_progress_count ?? inbox.inProgressCount;
  const periodEarnings = merchantStats.merchant_period_expected_earnings ?? 0;
  const periodSettled = merchantStats.merchant_period_settled_orders_count ?? 0;
  const billingPeriod = merchantStats.billing_period_utc ?? null;
  const hasServiceHistory = merchantHasServiceHistory({
    ordersMerchantTotal: ordersTotal,
    merchantInProgressCount: inProgressFromStats,
  });
  const showInboxEmpty = shouldShowMerchantInboxEmptyState(inbox, {
    ordersLoading,
    ordersError,
    merchantHasServiceHistory: hasServiceHistory,
  });
  const headerSubtitleKey = resolveMerchantWorkbenchHeaderSubtitleKey({
    pendingFulfillmentCount: inbox.pendingFulfillmentCount,
  });
  const showStatsSection = shouldShowMerchantWorkbenchStatsSections({
    ordersMerchantTotal: ordersTotal,
    merchantInProgressCount: inProgressFromStats,
    periodExpectedEarnings: periodEarnings,
    periodSettledOrdersCount: periodSettled,
    merchantHasServiceHistory: hasServiceHistory,
  });
  const showStatsTeaser = shouldShowMerchantWorkbenchStatsTeaser({
    showStatsSections: showStatsSection,
    merchantHasServiceHistory: hasServiceHistory,
  });
  const publishEligibilityOk = publishEligibility.ok;
  const inboxEmptyGuidance = resolveMerchantInboxEmptyGuidance({ publishEligibilityOk });

  return (
    <WorkspaceL5PageShell
      kind="merchant"
      ariaLabel={t("provider_workbench_title")}
      footerTarget={fromSettings ? "settings" : "none"}
      dataAttrs={{
        ...meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-provider-from-settings"),
        "data-tt-provider-workspace-page": "1",
        "data-tt-provider-workspace-ops": MERCHANT_WORKSPACE_OPS_SCOPE_MARKER,
        "data-tt-provider-workbench-l5-closure": PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
        "data-tt-ui-frozen": PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER,
      }}
    >
      <WorkspaceL5SettingsIngress
        fromSettings={fromSettings}
        noticeKey="me_settings_merchant_from_settings_notice"
        t={t}
      />
      <WorkspaceL5Header
        eyebrow={t("provider_workbench_eyebrow")}
        title={t("provider_workbench_title")}
        subtitle={
          headerSubtitleKey === "provider_workbench_subtitle_pending"
            ? t(headerSubtitleKey, { count: inbox.pendingFulfillmentCount })
            : t(headerSubtitleKey)
        }
      />

      {awaitingSlots ? (
        <div className={`${TT_WORKSPACE_L5.sectionCard} animate-pulse motion-reduce:animate-none`} aria-busy="true">
          <div className="h-5 w-40 rounded bg-ref-sun/10" />
          <div className="mt-3 h-16 rounded-xl bg-ref-sun/[0.06]" />
        </div>
      ) : merchantWorkspaceUnlocked ? (
        <ProviderWorkbenchInboxCard
          t={t}
          inbox={inbox}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
          onRetry={retryInbox}
          nextOrderListItem={nextOrderItem}
          showInboxEmpty={showInboxEmpty}
          inboxEmptyGuidance={inboxEmptyGuidance}
        />
      ) : (
        <WorkspaceOperatorLockedPanel
          t={t}
          messageKey="provider_workbench_slot_locked"
          ariaLabelKey="provider_workbench_not_provider_aria"
        />
      )}

      {merchantWorkspaceUnlocked ? (
        <>
          <MerchantWorkbenchMarketExposureCard
            t={t}
            profile={workbenchProfile}
            profileMissing={profileMissing}
            profileLoading={profileLoading}
            profileError={profileError}
            onRetryProfile={retryProfile}
            summary={listingsSummary}
            summaryLoading={summaryLoading}
            summaryError={summaryError}
            onRetrySummary={retrySummary}
            publishEligibility={publishEligibility}
            publishEligibilityLoading={publishEligibilityLoading}
            showcaseRows={showcaseInventory.rows}
            showcaseInventoryLoading={showcaseInventory.loading}
            showcaseInventoryError={showcaseInventory.error}
            showcaseMutatingId={showcaseInventory.mutatingId}
            onRetryShowcaseInventory={refreshShowcaseData}
            onArchiveShowcaseListing={(id) => {
              void showcaseInventory.archivePublished(id).then(() => void retrySummary());
            }}
            onDeleteShowcaseDraft={(id) => {
              void showcaseInventory.deleteDraft(id).then(() => void retrySummary());
            }}
          />
          {showStatsSection ? (
            <ProviderWorkbenchBillingPeriodCard
              t={t}
              statsLoading={statsLoading}
              statsError={statsError}
              onRetry={retryStatsCards}
              billingPeriodUtc={billingPeriod}
              ordersMerchantTotal={ordersTotal}
              merchantInProgressCount={inProgressFromStats}
              periodExpectedEarnings={periodEarnings}
              periodSettledOrdersCount={periodSettled}
            />
          ) : null}
          {showStatsTeaser ? <ProviderWorkbenchStatsTeaser t={t} /> : null}
        </>
      ) : null}
      {merchantWorkspaceUnlocked ? (
        <ProviderWorkbenchL5CrossNav showTrustLink={publishEligibilityOk} />
      ) : null}
    </WorkspaceL5PageShell>
  );
}

export default function ProviderWorkbenchPage() {
  return (
    <Suspense fallback={<ProviderWorkbenchPageSkeleton />}>
      <ProviderWorkbenchPageInner />
    </Suspense>
  );
}

function ProviderWorkbenchPageSkeleton() {
  const { t } = useTranslation();
  return <WorkspaceL5PageSkeleton t={t} kind="merchant" ariaLabelKey="provider_workbench_title" />;
}
