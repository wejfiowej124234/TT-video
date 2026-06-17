"use client";



import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAccount } from "wagmi";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";

import ApiErrorAlert from "@/components/ApiErrorAlert";

import { useGovernanceHubPage } from "./useGovernanceHubPage";

import { useStewardWorkbenchTodoCounts } from "./useStewardWorkbenchTodoCounts";

import StewardWorkbenchTodoSection from "@/components/governance/StewardWorkbenchTodoSection";

import StewardWorkbenchGovernanceSection from "@/components/governance/StewardWorkbenchGovernanceSection";

import StewardWorkbenchTtgStakeSection from "@/components/governance/StewardWorkbenchTtgStakeSection";

import StewardWorkbenchStakingGateCard from "@/components/governance/StewardWorkbenchStakingGateCard";

import StewardWorkbenchStakingSatisfiedStrip from "@/components/governance/StewardWorkbenchStakingSatisfiedStrip";

import { StewardWorkbenchL5CrossNav } from "@/components/governance/StewardWorkbenchL5CrossNav";

import { WorkspaceL5SettingsIngress } from "@/components/workspace/WorkspaceL5SettingsIngress";

import { WorkspaceL5Header } from "@/components/workspace/WorkspaceL5Header";

import WorkspaceL5PageShell from "@/components/workspace/WorkspaceL5PageShell";

import { WorkspaceL5PageSkeleton } from "@/components/workspace/WorkspaceL5PageSkeleton";

import { WorkspaceOperatorLockedPanel } from "@/components/workspace/WorkspaceOperatorLockedPanel";

import { meSettingsExtensionIngressDataAttrs } from "@/components/me/MeSettingsExtensionIngressBlock";

import { isMeSettingsExtensionFromQuery } from "@/lib/me/meSettingsExtensionContext";

import { meStewardWorkspaceUnlocked } from "@/lib/me/meIdentitySlotVisibility";

import { useMeIdentitySlots } from "@/lib/me/useMeIdentitySlots";

import { getMeFull } from "@/lib/apiClient";

import { mapApiReadError } from "@/lib/mapApiReadError";

import { FOCUS_RING, type UserShape } from "@/components/me/constants";

import { STEWARD_WORKSPACE_HREF, WORKSPACE_SPRINT_MARKER } from "@/lib/workspace/workspaceIdentityModel";

import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

import { useStewardStakeManage } from "@/lib/steward/useStewardStakeManage";

import { useStewardOnboardingBTrack } from "@/lib/steward/useStewardOnboardingBTrack";

import StewardWorkbenchBTrackAdmissionSection from "@/components/governance/StewardWorkbenchBTrackAdmissionSection";
import StewardWorkbenchBTrackCompleteStrip from "@/components/governance/StewardWorkbenchBTrackCompleteStrip";
import StewardWorkbenchDualTrackProgressCard from "@/components/governance/StewardWorkbenchDualTrackProgressCard";

import {

  resolveStewardWorkbenchGateMode,

  resolveStewardWorkbenchHeaderSubtitleKey,

  resolveStewardStakePanelCollapseMode,

  shouldCollapseStewardStakePanel,

  shouldFetchStewardGovernanceData,

  shouldShowStewardGovernanceObservation,

  shouldUseStewardStakePanelCompact,

  stewardWorkbenchGateShowsTopCard,

  stewardWorkbenchInRelease,

  shouldLockStewardWorkbenchTodo,

  stewardDualTrackProgressVisible,

} from "@/lib/governance/stewardWorkbenchWorkspaceL5";

import { useStewardStakePanelAnchorOpen } from "./useStewardStakePanelAnchorOpen";

import {

  STEWARD_WORKBENCH_PAGE_L5_CLOSURE_PROBE,

  STEWARD_WORKBENCH_PAGE_L5_FROZEN_MARKER,

} from "@/lib/governance/stewardWorkbenchL5ClosureSprintModel";

import {

  isStewardChainStakeComplete,

  stewardChainStakeSummaryKey,

  stewardOffchainSeatLabelKey,

} from "@/lib/steward/stewardStakeUiModel";



const STEWARD_APPLY_HREF = "/steward/register";



function StewardRegionWorkbenchInner() {

  const { t } = useTranslation();

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const fromSettings = isMeSettingsExtensionFromQuery(searchParams?.get("from"));

  const { address, isConnected } = useAccount();

  const returnPath = useMemo(() => {

    const base = pathname && pathname !== "/" ? pathname : STEWARD_WORKSPACE_HREF;

    const q = searchParams?.toString() ?? "";

    return q ? `${base}?${q}` : base;

  }, [pathname, searchParams]);



  const [authLoading, setAuthLoading] = useState(true);

  const [authError, setAuthError] = useState<string | null>(null);

  const [user, setUser] = useState<UserShape | null>(null);

  const fetchGen = useRef(0);



  const loadMe = useCallback(() => {

    const gen = ++fetchGen.current;

    setAuthLoading(true);

    setAuthError(null);

    getMeFull()

      .then((res) => {

        if (gen !== fetchGen.current) return;

        if (res == null) {

          router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnPath)}`);

          return;

        }

        const u = (res as { user?: UserShape })?.user;

        setUser(u ?? null);

      })

      .catch((err) => {

        if (gen !== fetchGen.current) return;

        if (err instanceof Error && err.message === "login_required") {

          router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnPath)}`);

          return;

        }

        setAuthError(mapApiReadError(err, t, "steward_workbench_load_fail"));

      })

      .finally(() => {

        if (gen !== fetchGen.current) return;

        setAuthLoading(false);

      });

  }, [returnPath, router, t]);



  useEffect(() => {

    loadMe();

  }, [loadMe]);



  const { ready: slotsReady, slotById } = useMeIdentitySlots();

  const stewardSlotState = slotsReady ? slotById("region_steward")?.state ?? null : null;

  const stewardWorkspaceUnlocked = meStewardWorkspaceUnlocked({

    userRole: user?.role ?? null,

    stewardSlotState,

  });

  const stewardSlotVisible =

    stewardSlotState === "pending" || stewardSlotState === "restricted" || stewardSlotState === "active";



  const awaitingSlots = !!user && !slotsReady;

  const stakeEnabled = stewardWorkspaceUnlocked && !authLoading && slotsReady;

  const manage = useStewardStakeManage(stakeEnabled);

  const bTrack = useStewardOnboardingBTrack(stakeEnabled);



  const walletMatch = Boolean(

    manage.app &&

      address &&

      address.trim().toLowerCase() === manage.app.walletAddress.trim().toLowerCase(),

  );

  const inRelease = stewardWorkbenchInRelease(manage.seat);

  const chainStakeSummaryKey = stewardChainStakeSummaryKey(manage.rows, {

    isConnected,

    walletMatch,

  });

  const gateMode = resolveStewardWorkbenchGateMode({

    loading: manage.loading,

    bTrackLoading: bTrack.loading,

    appStatus: manage.app?.status,

    inRelease,

    chainStakeSummaryKey,

    bTrackComplete: bTrack.bTrackComplete,

  });

  const headerSubtitleKey = resolveStewardWorkbenchHeaderSubtitleKey({ gateMode });

  const showGovernance = shouldShowStewardGovernanceObservation(gateMode);

  const showTopGate = stewardWorkbenchGateShowsTopCard(gateMode);

  const hideGateCtas = showTopGate;

  const { stakeAnchorOpen, openStakePanel } = useStewardStakePanelAnchorOpen(
    stewardWorkspaceUnlocked && gateMode === "need_stake",
  );

  const stakePanelCollapseMode = resolveStewardStakePanelCollapseMode({

    showTopGate,

    gateMode,

    stakeAnchorOpen,

  });

  const stakePanelCollapsed = shouldCollapseStewardStakePanel(stakePanelCollapseMode);

  const stakeGateCompact = shouldUseStewardStakePanelCompact({ gateMode, stakeAnchorOpen });

  const showDualTrackProgress = stewardDualTrackProgressVisible(gateMode);
  const slimAdmissionCompanion = showDualTrackProgress;
  const hideDualTrackSummary = gateMode === "satisfied" || stakeGateCompact || showDualTrackProgress;
  const todoLocked = shouldLockStewardWorkbenchTodo(gateMode);

  const fetchGovernanceData = shouldFetchStewardGovernanceData({

    workspaceUnlocked: stewardWorkspaceUnlocked,

    manageLoading: manage.loading,

    gateMode,

  });

  const { pool, rewards, poolHttpError, rewardsHttpError, loading: govLoading, error: govError } =

    useGovernanceHubPage(fetchGovernanceData);

  const todoCountsState = useStewardWorkbenchTodoCounts(stewardWorkspaceUnlocked && !authLoading);

  const loading = authLoading || (fetchGovernanceData && govLoading);



  if (loading) {

    return <WorkspaceL5PageSkeleton t={t} kind="steward" ariaLabelKey="steward_workbench_title" />;

  }



  return (

    <WorkspaceL5PageShell

      kind="steward"

      ariaLabel={t("steward_workbench_title")}

      showMinimalFooter={false}

      dataAttrs={{

        ...meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-steward-from-settings"),

        "data-tt-steward-workspace-page": "1",

        "data-tt-steward-workbench-l5-closure": STEWARD_WORKBENCH_PAGE_L5_CLOSURE_PROBE,

        "data-tt-ui-frozen": STEWARD_WORKBENCH_PAGE_L5_FROZEN_MARKER,

        "data-tt-workspace-sprint": WORKSPACE_SPRINT_MARKER,

      }}

    >

      <WorkspaceL5SettingsIngress

        fromSettings={fromSettings}

        noticeKey="me_settings_steward_from_settings_notice"

        showNotice={false}

        t={t}

      />

      <WorkspaceL5Header

        eyebrow={t("steward_workbench_eyebrow")}

        title={t("steward_workbench_title")}

        subtitle={t(headerSubtitleKey)}

      />



      {authError ? (

        <div className={TT_WORKSPACE_L5.errorPanel}>

          <ApiErrorAlert message={authError} />

          <button type="button" onClick={() => loadMe()} className={`${TT_WORKSPACE_L5.primaryBtn} mt-3 ${FOCUS_RING}`}>

            {t("common_retry")}

          </button>

        </div>

      ) : null}



      {!authError && awaitingSlots ? (

        <div className={`${TT_WORKSPACE_L5.sectionCard} animate-pulse motion-reduce:animate-none`} aria-busy="true">

          <div className="h-5 w-40 rounded bg-ref-sun/10" />

          <div className="mt-3 h-16 rounded-xl bg-ref-sun/[0.06]" />

        </div>

      ) : !authError && stewardWorkspaceUnlocked ? (

        <>

          {showTopGate && !showDualTrackProgress ? (

            <StewardWorkbenchStakingGateCard

              t={t}

              mode={gateMode === "need_stake" ? "need_stake" : "need_onboarding"}

              bTrackComplete={bTrack.bTrackComplete}

              bTrackPaid={bTrack.bTrackPaid}

              onOpenStakePanel={openStakePanel}

            />

          ) : null}

          {gateMode === "satisfied" && manage.app ? (

            <StewardWorkbenchStakingSatisfiedStrip

              t={t}

              offchainLabelKey={stewardOffchainSeatLabelKey(manage.app.status)}

              chainSummaryKey={chainStakeSummaryKey}

            />

          ) : null}



          {showDualTrackProgress ? (
            <StewardWorkbenchDualTrackProgressCard
              t={t}
              gateMode={gateMode === "need_stake" ? "need_stake" : "need_onboarding"}
              bTrackPaid={bTrack.bTrackPaid}
              bTrackComplete={bTrack.bTrackComplete}
              chainStakeSummaryKey={chainStakeSummaryKey}
              onOpenStakePanel={openStakePanel}
            />
          ) : null}



          {bTrack.bTrackComplete ? (
            <StewardWorkbenchBTrackCompleteStrip
              t={t}
              amountLabel={bTrack.quote?.amountLabel ?? null}
              bTrackStaked={isStewardChainStakeComplete(chainStakeSummaryKey)}
            />
          ) : (
            <StewardWorkbenchBTrackAdmissionSection
              bTrack={bTrack}
              slimCompanion={slimAdmissionCompanion}
              primaryJurisdiction={manage.app?.jurisdictions?.[0] ?? null}
            />
          )}



          <StewardWorkbenchTtgStakeSection

            t={t}

            enabled={stakeEnabled}

            manage={manage}

            hideGateCtas={hideGateCtas}

            gateCollapsed={stakePanelCollapsed}

            stakePanelCollapseMode={stakePanelCollapseMode}

            gateStakeCompact={stakeGateCompact}

            hideDualTrackSummary={hideDualTrackSummary}
            hideAdmissionDisclosure={slimAdmissionCompanion}

          />



          <StewardWorkbenchTodoSection

            t={t}

            counts={todoCountsState.counts}

            countsLoading={todoCountsState.loading}

            dataSource={todoCountsState.dataSource}

            locked={todoLocked}
            lockedCompact={slimAdmissionCompanion}

          />



          {showGovernance ? (

            govError ? (

              <div className={TT_WORKSPACE_L5.errorPanel}>

                <ApiErrorAlert message={govError} />

              </div>

            ) : (

              <StewardWorkbenchGovernanceSection

                t={t}

                pool={pool}

                rewards={rewards}

                poolHttpError={poolHttpError}

                rewardsHttpError={rewardsHttpError}

              />

            )

          ) : null}



          <StewardWorkbenchL5CrossNav />

        </>

      ) : !authError ? (

        <WorkspaceOperatorLockedPanel

          t={t}

          messageKey="steward_workbench_slot_locked"

          ariaLabelKey="steward_workbench_not_steward_aria"

          applyHref={stewardSlotVisible ? STEWARD_APPLY_HREF : undefined}

          applyLabelKey="steward_workbench_cta_register"

        />

      ) : null}

    </WorkspaceL5PageShell>

  );

}



/** `/governance?view=region` · 主理人工作台 L5 壳 */

export function StewardRegionWorkbenchMain() {

  const { t } = useTranslation();

  return (

    <Suspense

      fallback={

        <WorkspaceL5PageSkeleton t={t} kind="steward" ariaLabelKey="steward_workbench_title" />

      }

    >

      <StewardRegionWorkbenchInner />

    </Suspense>

  );

}


