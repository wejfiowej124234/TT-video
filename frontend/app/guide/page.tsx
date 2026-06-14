"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { getMeFull } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GuideBillingPeriodCard from "@/components/guide/GuideBillingPeriodCard";
import GuideDashboardStats from "@/components/guide/GuideDashboardStats";
import { MeGuideRoleBadge } from "@/components/me/MeGuideRoleBadge";
import GuideWorkbenchMarketExposureCard from "@/components/guide/GuideWorkbenchMarketExposureCard";
import { FOCUS_RING, type UserShape } from "@/components/me/constants";
import { TT_ME_GUIDE_ROLE_BADGE } from "@/lib/me/meGuideRoleBadgeL5";
import WorkspaceL5PageShell from "@/components/workspace/WorkspaceL5PageShell";
import { WorkspaceL5Header } from "@/components/workspace/WorkspaceL5Header";
import { WorkspaceL5SettingsIngress } from "@/components/workspace/WorkspaceL5SettingsIngress";
import { WorkspaceL5PageSkeleton } from "@/components/workspace/WorkspaceL5PageSkeleton";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";
import { meSettingsExtensionIngressDataAttrs } from "@/components/me/MeSettingsExtensionIngressBlock";
import { isMeSettingsExtensionFromQuery } from "@/lib/me/meSettingsExtensionContext";
import { ME_SETTINGS_PROFILE_PATH } from "@/lib/me/meSettingsL5";
import { meGuideWorkspaceUnlocked } from "@/lib/me/meIdentitySlotVisibility";
import { useMeIdentitySlots } from "@/lib/me/useMeIdentitySlots";
import { WorkspaceOperatorLockedPanel } from "@/components/workspace/WorkspaceOperatorLockedPanel";
import { GuideDashboardRouteSuspense } from "@/components/guide/GuideDashboardRouteSuspense";
import { TouchpointConversionStrip } from "@/components/product-enhancement/TouchpointConversionStrip";
import { GuideWorkbenchL5CrossNav } from "@/components/guide/GuideWorkbenchL5CrossNav";
import GuideWorkbenchStakingGateCard from "@/components/guide/GuideWorkbenchStakingGateCard";
import GuideWorkbenchExitRequestCard from "@/components/guide/GuideWorkbenchExitRequestCard";
import { useGuideIdentityMinStake } from "@/lib/staking/useGuideIdentityMinStake";
import GuideWorkbenchInboxCard from "@/components/guide/GuideWorkbenchInboxCard";
import { useGuideWorkbenchInbox } from "./useGuideWorkbenchInbox";
import { useGuideWorkbenchProfile } from "./useGuideWorkbenchProfile";
import GuideWorkbenchStatsTeaser from "@/components/guide/GuideWorkbenchStatsTeaser";
import {
  GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER,
} from "@/lib/guide/guideWorkbenchL5ClosureSprintModel";
import {
  parseGuideStakeAmountFromMe,
  shouldShowGuideIdentityStakingBanner,
  shouldShowGuideIdentityStakingBelowMinWarning,
  shouldShowGuideWorkbenchStakingManageLink,
  guideIdentityStakingHasAnyAmount,
} from "@/lib/guide/guideIdentityStakingNav";
import { shouldShowGuideWorkbenchExitRequestCard } from "@/lib/guide/guideExitRequest";
import {
  guideHasReceptionHistory,
  GUIDE_WORKSPACE_OPS_SCOPE_MARKER,
  resolveGuideWorkbenchHeaderSubtitleKey,
  resolveGuideInboxEmptyGuidance,
  resolveGuideStakingGateMode,
  shouldShowGuideInboxEmptyState,
  shouldShowGuideWorkbenchPesConversion,
  shouldShowGuideWorkbenchMarketExposureSection,
  shouldShowGuideWorkbenchStatsSections,
  shouldShowGuideWorkbenchStatsTeaser,
} from "@/lib/guide/guideWorkbenchWorkspaceL5";
import { parseMeTrustFromMeResponse } from "@/lib/meTrust";
import { useWorkspaceContextWorkbenchGuard } from "@/lib/header/useWorkspaceContextWorkbenchGuard";

/** 07 §五 5.0 / 05：向导工作台首屏；user + stats 同源 `getMeFull`（GET /api/v1/me） */
function GuideDashboardPageInner() {
  useWorkspaceContextWorkbenchGuard();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromSettings = isMeSettingsExtensionFromQuery(searchParams.get("from"));
  const communityMeHref = ME_SETTINGS_PROFILE_PATH;
  const guideLoginReturnPath = useMemo(() => {
    const base = pathname && pathname !== "/" ? pathname : "/guide";
    const q = searchParams?.toString() ?? "";
    return q ? `${base}?${q}` : base;
  }, [pathname, searchParams]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserShape | null>(null);
  const [mePayload, setMePayload] = useState<unknown>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const guideMeFetchGen = useRef(0);

  const applyStatsFromPayload = useCallback((res: unknown) => {
    const st = (res as { stats?: unknown } | null)?.stats;
    if (st && typeof st === "object" && !Array.isArray(st)) {
      setStats(st as Record<string, unknown>);
      setStatsError(false);
    } else if (res != null) {
      setStats({});
    }
  }, []);

  const loadMe = useCallback(
    (opts?: { silent?: boolean; force?: boolean }) => {
      const silent = opts?.silent === true;
      const force = opts?.force === true;
      const gen = ++guideMeFetchGen.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      } else {
        setStatsLoading(true);
        setStatsError(false);
      }
      getMeFull({ force })
        .then((res) => {
          if (gen !== guideMeFetchGen.current) return;
          if (res == null) {
            if (!silent) {
              router.replace(`/auth/login?returnUrl=${encodeURIComponent(guideLoginReturnPath)}`);
            } else {
              setStatsError(true);
            }
            return;
          }
          const u = (res as { user?: UserShape })?.user;
          setUser(u ?? null);
          setMePayload(res);
          applyStatsFromPayload(res);
        })
        .catch((err) => {
          if (gen !== guideMeFetchGen.current) return;
          if (err instanceof Error && err.message === "login_required") {
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(guideLoginReturnPath)}`);
            return;
          }
          if (typeof window !== "undefined") {
            console.error("GuideDashboard getMeFull:", err);
          }
          if (silent) {
            setStatsError(true);
          } else {
            setError(mapApiReadError(err, t, "guide_dashboard_load_fail"));
          }
        })
        .finally(() => {
          if (gen !== guideMeFetchGen.current) return;
          if (!silent) setLoading(false);
          else setStatsLoading(false);
        });
    },
    [applyStatsFromPayload, guideLoginReturnPath, router, t]
  );

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const retryStatsCards = useCallback(() => {
    void loadMe({ silent: true, force: true });
  }, [loadMe]);

  const { ready: slotsReady, slotById } = useMeIdentitySlots();
  const guideWorkspaceUnlocked = meGuideWorkspaceUnlocked({
    userRole: user?.role ?? null,
    guideSlotState: slotsReady ? slotById("guide")?.state ?? null : null,
  });
  const awaitingSlots = !!user && !slotsReady;
  const {
    profile: workbenchProfile,
    loading: profileLoading,
    error: profileError,
    retry: retryProfile,
  } = useGuideWorkbenchProfile(guideWorkspaceUnlocked && slotsReady, t);

  const guideRowId = workbenchProfile?.guide_id ?? null;
  const {
    inbox: workbenchInbox,
    nextOrderItem,
    ordersLoading: inboxOrdersLoading,
    ordersError: inboxOrdersError,
    retryInbox,
  } = useGuideWorkbenchInbox(guideWorkspaceUnlocked && slotsReady, guideRowId, t);
  const { minStakeFormatted } = useGuideIdentityMinStake();

  if (loading) return <WorkspaceL5PageSkeleton t={t} kind="guide" ariaLabelKey="guide_dashboard_title" />;

  if (error) {
    return (
      <WorkspaceL5PageShell
        kind="guide"
        ariaLabel={t("guide_dashboard_title")}
        footerTarget={fromSettings ? "settings" : "none"}
        dataAttrs={meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-guide-from-settings")}
      >
        <WorkspaceL5SettingsIngress
          fromSettings={fromSettings}
          noticeKey="me_settings_guide_from_settings_notice"
          t={t}
        />
        <WorkspaceL5Header
          eyebrow={t("guide_workbench_eyebrow")}
          title={t("guide_dashboard_title")}
          subtitle={t("guide_dashboard_subtitle")}
        />
        <div className={TT_WORKSPACE_L5.errorPanel}>
          <ApiErrorAlert message={error} />
          <div className="flex flex-wrap gap-3 pt-2">
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                void loadMe();
              }}
            >
              <button type="submit" className={`${TT_WORKSPACE_L5.primaryBtn} ${FOCUS_RING}`}>
                {t("common_retry")}
              </button>
            </form>
            <Link href={communityMeHref} className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}>
              {t("guide_dashboard_link_me")}
            </Link>
          </div>
        </div>
      </WorkspaceL5PageShell>
    );
  }

  const ordersGuided = typeof stats?.orders_guided === "number" ? stats.orders_guided : 0;
  const completedCount = typeof stats?.completed_count === "number" ? stats.completed_count : 0;
  const totalEarned = typeof stats?.total_earned === "number" ? stats.total_earned : 0;
  const avgScore = typeof stats?.avg_score === "number" ? stats.avg_score : null;
  const reviewsWritten = typeof stats?.reviews_count === "number" ? stats.reviews_count : 0;
  const billingPeriodUtc = typeof stats?.billing_period_utc === "string" ? stats.billing_period_utc : null;
  const periodExpectedEarnings =
    typeof stats?.period_expected_earnings === "number" ? stats.period_expected_earnings : 0;
  const periodSettledOrdersCount =
    typeof stats?.period_settled_orders_count === "number" ? stats.period_settled_orders_count : 0;
  const hasReceptionHistory = guideHasReceptionHistory({ ordersGuided, completedCount });
  const showInboxEmpty = shouldShowGuideInboxEmptyState(workbenchInbox, {
    ordersLoading: inboxOrdersLoading,
    ordersError: inboxOrdersError,
    guideHasReceptionHistory: hasReceptionHistory,
  });
  const trustSummary = user != null ? parseMeTrustFromMeResponse(mePayload, user) : null;
  const guideStakeAmount = parseGuideStakeAmountFromMe(mePayload);
  const stakingGateInput = {
    guideWorkspaceUnlocked,
    guideRegistrationStatus: trustSummary?.guide_registration_status ?? null,
    stakeAmount: guideStakeAmount,
    minStakeAmount: minStakeFormatted,
  };
  const showStakingBanner =
    slotsReady && shouldShowGuideIdentityStakingBanner(stakingGateInput);
  const showStakingBelowMinWarning =
    slotsReady && shouldShowGuideIdentityStakingBelowMinWarning(stakingGateInput);
  const showStakingManageLink =
    slotsReady && shouldShowGuideWorkbenchStakingManageLink(stakingGateInput);
  const orderTakingBlocked = showStakingBanner || showStakingBelowMinWarning;
  const stakingGateMode = resolveGuideStakingGateMode({
    showStakingBanner,
    showStakingBelowMinWarning,
    showStakingManageLink,
  });
  const headerSubtitleKey = resolveGuideWorkbenchHeaderSubtitleKey({
    pendingAcceptCount: workbenchInbox.pendingAcceptCount,
    orderTakingBlocked,
  });
  const showStatsSections = shouldShowGuideWorkbenchStatsSections({
    ordersGuided,
    completedCount,
    periodExpectedEarnings,
    periodSettledOrdersCount,
    billingPeriodUtc,
    guideHasReceptionHistory: hasReceptionHistory,
  });
  const showStatsTeaser = shouldShowGuideWorkbenchStatsTeaser({
    showStatsSections,
    guideHasReceptionHistory: hasReceptionHistory,
  });
  const showPesConversion = shouldShowGuideWorkbenchPesConversion({
    showStatsTeaser,
    showStatsSections,
    ordersGuided,
    completedCount,
  });
  const inboxEmptyGuidance = resolveGuideInboxEmptyGuidance({ orderTakingBlocked });
  const showMarketExposure = shouldShowGuideWorkbenchMarketExposureSection({ orderTakingBlocked });
  const showExitRequestCard =
    slotsReady &&
    shouldShowGuideWorkbenchExitRequestCard({
      guideWorkspaceUnlocked,
      guideRegistrationStatus: trustSummary?.guide_registration_status ?? null,
      hasStakingActivity: guideIdentityStakingHasAnyAmount(guideStakeAmount),
    });

  return (
    <WorkspaceL5PageShell
      kind="guide"
      ariaLabel={t("guide_dashboard_title")}
      footerTarget={fromSettings ? "settings" : "none"}
      dataAttrs={{
        ...meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-guide-from-settings"),
        "data-tt-guide-workspace-ops": GUIDE_WORKSPACE_OPS_SCOPE_MARKER,
        "data-tt-guide-workspace-page": "1",
        "data-tt-guide-workbench-l5-closure": GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
        "data-tt-ui-frozen": GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER,
      }}
    >
      <WorkspaceL5SettingsIngress
        fromSettings={fromSettings}
        noticeKey="me_settings_guide_from_settings_notice"
        t={t}
      />
      <WorkspaceL5Header
        eyebrow={t("guide_workbench_eyebrow")}
        title={t("guide_dashboard_title")}
        subtitle={
          headerSubtitleKey === "guide_dashboard_subtitle_pending"
            ? t(headerSubtitleKey, { count: workbenchInbox.pendingAcceptCount })
            : t(headerSubtitleKey)
        }
        badge={
          user ? (
            <MeGuideRoleBadge user={user} className={TT_ME_GUIDE_ROLE_BADGE.pillGuideWorkspace} />
          ) : null
        }
      />

      {stakingGateMode !== "none" && guideWorkspaceUnlocked ? (
        <GuideWorkbenchStakingGateCard
          t={t}
          mode={stakingGateMode}
          apiStakeAmount={guideStakeAmount}
          minStakeAmount={minStakeFormatted}
        />
      ) : null}
      {awaitingSlots ? (
        <div className={`${TT_WORKSPACE_L5.sectionCard} animate-pulse motion-reduce:animate-none`} aria-busy="true">
          <div className="h-5 w-40 rounded bg-ref-sun/10" />
          <div className="mt-3 h-16 rounded-xl bg-ref-sun/[0.06]" />
        </div>
      ) : guideWorkspaceUnlocked ? (
        <>
          <GuideWorkbenchInboxCard
            t={t}
            inbox={workbenchInbox}
            ordersLoading={inboxOrdersLoading}
            ordersError={inboxOrdersError}
            onRetry={retryInbox}
            nextOrderListItem={nextOrderItem}
            showInboxEmpty={showInboxEmpty}
            inboxEmptyGuidance={inboxEmptyGuidance}
          />
        </>
      ) : null}

      {guideWorkspaceUnlocked && showMarketExposure ? (
        <GuideWorkbenchMarketExposureCard
          t={t}
          profile={workbenchProfile}
          profileLoading={profileLoading}
          profileError={profileError}
          onRetryProfile={retryProfile}
          stakeAmountForPreview={guideStakeAmount}
        />
      ) : null}

      {!awaitingSlots && !guideWorkspaceUnlocked ? (
        <WorkspaceOperatorLockedPanel
          t={t}
          messageKey="guide_workbench_slot_locked"
          ariaLabelKey="guide_dashboard_not_guide_aria"
        />
      ) : null}

      {guideWorkspaceUnlocked ? (
        <>
          {showStatsSections ? (
            <GuideBillingPeriodCard
              t={t}
              statsLoading={statsLoading}
              statsError={statsError}
              onRetry={retryStatsCards}
              billingPeriodUtc={billingPeriodUtc}
              periodExpectedEarnings={periodExpectedEarnings}
              periodSettledOrdersCount={periodSettledOrdersCount}
            />
          ) : null}
          {showStatsTeaser ? <GuideWorkbenchStatsTeaser t={t} /> : null}
          {showPesConversion && !orderTakingBlocked && !statsLoading && !statsError ? (
            <div className="mb-1">
              <TouchpointConversionStrip
                touchpoint="guide"
                kicker={t("pes_guide_conversion_kicker")}
                body={t("pes_guide_empty_stats")}
                badge={t("pes_guide_conversion_badge")}
                ctaHref="/market?view=guides"
                ctaLabel={t("pes_guide_conversion_cta")}
              />
            </div>
          ) : null}
          {showStatsSections ? (
            <GuideDashboardStats
              t={t}
              statsLoading={statsLoading}
              statsError={statsError}
              onRetry={retryStatsCards}
              ordersGuided={ordersGuided}
              completedCount={completedCount}
              totalEarned={totalEarned}
              avgScore={avgScore}
              reviewsWritten={reviewsWritten}
            />
          ) : null}
        </>
      ) : null}

      {guideWorkspaceUnlocked && showExitRequestCard ? (
        <GuideWorkbenchExitRequestCard
          t={t}
          guideRegistrationStatus={trustSummary?.guide_registration_status ?? null}
        />
      ) : null}

      {guideWorkspaceUnlocked ? (
        <GuideWorkbenchL5CrossNav showTrustLink={!orderTakingBlocked} />
      ) : null}
    </WorkspaceL5PageShell>
  );
}

export default function GuideDashboardPage() {
  return (
    <GuideDashboardRouteSuspense>
      <GuideDashboardPageInner />
    </GuideDashboardRouteSuspense>
  );
}
