"use client";



import Link from "next/link";

import { Suspense, useId } from "react";

import { useSearchParams } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";

import { FOCUS_RING } from "@/components/me/constants";

import WorkspaceL5PageShell from "@/components/workspace/WorkspaceL5PageShell";

import { WorkspaceL5Header } from "@/components/workspace/WorkspaceL5Header";

import { StakingContractPanel } from "@/components/staking/StakingContractPanel";

import { StakingGuideIdentityWorkbench } from "@/components/staking/StakingGuideIdentityWorkbench";

import GuideIdentityStakingOpsGate from "@/components/staking/GuideIdentityStakingOpsGate";

import { StakingL5CrossNav } from "@/components/staking/StakingL5CrossNav";

import { StakingRegistryCollapsible } from "@/components/staking/StakingRegistryCollapsible";

import { StakingRegistryPanel } from "@/components/staking/StakingRegistryPanel";

import { StakingStakePanel } from "@/components/staking/StakingStakePanel";

import { StakingStakePrefillProvider } from "@/components/staking/StakingStakePrefillContext";

import { StakingWalletGateProvider } from "@/components/staking/StakingWalletGateContext";

import { StakingWithdrawPanel } from "@/components/staking/StakingWithdrawPanel";

import { StakingWalletConnectPrompt } from "@/components/staking/StakingWalletConnectPrompt";

import { useGuidePoolDeploymentMissing } from "@/lib/staking/stakingContractDeployment";

import {

  GUIDE_IDENTITY_STAKE_SECTION_ID,

  isGuideOnlyStakingScope,

} from "@/lib/guide/guideIdentityStakingNav";

import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";



const PANEL_VARIANT = "warm" as const;



function StakingPageContent() {

  const { t } = useTranslation();

  const bodySectionId = useId();

  const searchParams = useSearchParams();

  const guideOnly = isGuideOnlyStakingScope(searchParams.get("scope"));

  const guidePoolMissing = useGuidePoolDeploymentMissing();



  const pageTitle = guideOnly ? t("staking_guide_scope_pageTitle") : t("staking_pageTitle");

  const pageSubtitle = guideOnly ? t("staking_guide_scope_pageSubtitle") : t("staking_pageSubtitle");

  const eyebrow = guideOnly ? t("staking_guide_scope_eyebrow") : t("staking_full_scope_eyebrow");



  const guideScopeBody = (

    <StakingStakePrefillProvider>

      <StakingWalletGateProvider pageLevelConnectPrompt>

        <WorkspaceL5Header eyebrow={eyebrow} title={pageTitle} subtitle={pageSubtitle} />

        <StakingWalletConnectPrompt messageKey="staking_guide_scope_intro" scrollToStakeOnConnect />



        <div id={GUIDE_IDENTITY_STAKE_SECTION_ID} className="scroll-mt-24">

          <StakingGuideIdentityWorkbench panelVariant={PANEL_VARIANT} poolMissing={guidePoolMissing} />

        </div>



        <StakingRegistryCollapsible panelVariant={PANEL_VARIANT} />

        <StakingL5CrossNav />

      </StakingWalletGateProvider>

    </StakingStakePrefillProvider>

  );



  if (guideOnly) {

    return (

      <WorkspaceL5PageShell

        kind="guide"

        ariaLabel={pageTitle}

        dataAttrs={TT_STAKING_PAGE_L5.guideScopePageAttrs}

        footerTarget="guide"

      >

        {guideScopeBody}

      </WorkspaceL5PageShell>

    );

  }



  return (

    <WorkspaceL5PageShell

      kind="guide"

      ariaLabel={pageTitle}

      dataAttrs={TT_STAKING_PAGE_L5.fullPageAttrs}

      footerTarget="guide"

    >

      <StakingStakePrefillProvider>

        <StakingWalletGateProvider pageLevelConnectPrompt>

          <WorkspaceL5Header eyebrow={eyebrow} title={pageTitle} subtitle={pageSubtitle} />

          <StakingWalletConnectPrompt messageKey="staking_stake_connect" />



          <section className={TT_STAKING_PAGE_L5.panelCard} aria-labelledby={bodySectionId}>

            <h2 id={bodySectionId} className={TT_STAKING_PAGE_L5.panelTitle}>

              {t("staking_intro_heading")}

            </h2>

            <p className={`mt-3 ${TT_STAKING_PAGE_L5.bodyProse}`}>{t("staking_intro")}</p>

            <ul className={`mt-4 list-disc space-y-2 pl-5 ${TT_STAKING_PAGE_L5.bodyProse}`}>

              <li>{t("staking_point1")}</li>

              <li>{t("staking_point2")}</li>

            </ul>

            <div className="mt-6">

              <Link

                href="/guide/register"

                className={`${touchTargetLink44Classes} ${TT_STAKING_PAGE_L5.primaryBtn} inline-flex no-underline ${FOCUS_RING}`}

              >

                {t("staking_ctaApply")}

              </Link>

            </div>

          </section>



          <div id={GUIDE_IDENTITY_STAKE_SECTION_ID} className={`scroll-mt-24 ${TT_STAKING_PAGE_L5.panelStack}`}>

            <StakingContractPanel pool="guide" panelVariant={PANEL_VARIANT} />

            <GuideIdentityStakingOpsGate>

              <StakingStakePanel pool="guide" panelVariant={PANEL_VARIANT} />

              <StakingWithdrawPanel pool="guide" panelVariant={PANEL_VARIANT} />

            </GuideIdentityStakingOpsGate>

          </div>



          <div className={TT_STAKING_PAGE_L5.panelStack} data-tt-staking-provider-pools="1">

            <StakingContractPanel pool="provider" panelVariant={PANEL_VARIANT} />

            <StakingStakePanel pool="provider" panelVariant={PANEL_VARIANT} />

            <StakingWithdrawPanel pool="provider" panelVariant={PANEL_VARIANT} />

          </div>



          <StakingRegistryPanel panelVariant={PANEL_VARIANT} />

          <StakingL5CrossNav />

        </StakingWalletGateProvider>

      </StakingStakePrefillProvider>

    </WorkspaceL5PageShell>

  );

}



/** 07 Phase 4：身份质押 · 体验深壳（`/guide` 工作台 + 首页 L0 深顶栏同族） */

export default function StakingPage() {

  const { t } = useTranslation();



  return (

    <Suspense

      fallback={

        <main className={TT_STAKING_PAGE_L5.experienceShell}>

          <div className={`${TT_STAKING_PAGE_L5.experienceColumn} text-body text-slate-400`}>

            {t("staking_guide_ops_gate_loading")}

          </div>

        </main>

      }

    >

      <StakingPageContent />

    </Suspense>

  );

}

