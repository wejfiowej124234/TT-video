"use client";



import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";

import GovernanceB090OnChainProposalNotice from "@/components/governance/GovernanceB090OnChainProposalNotice";

import { GOV_PROPOSALS_L5, GovernanceProposalsL5Panel } from "@/lib/governance/governanceProposalsL5Ui";



const STEPS = ["browse", "vote", "create"] as const;



/** 提案列表 · 用户向三步说明（L5 · 深色玻璃） */

export function GovernanceProposalsPageGuide() {

  const { t } = useTranslation();



  return (

    <GovernanceProposalsL5Panel className="mt-5">

      <h2 className={`text-small font-semibold ${GOV_PROPOSALS_L5.detailTitle}`}>{t("governance_proposals_l5_guide_title")}</h2>

      <ol className="mt-3 space-y-3">

        {STEPS.map((step, i) => (

          <li key={step} className="flex gap-3">

            <span

              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ref-sun/35 bg-ref-sun/12 text-meta font-bold text-ref-sun/95"

              aria-hidden

            >

              {i + 1}

            </span>

            <div className="min-w-0">

              <p className={`text-body font-medium text-slate-50`}>{t(`governance_proposals_l5_guide_${step}_title`)}</p>

              <p className={`mt-0.5 text-meta leading-relaxed ${GOV_PROPOSALS_L5.cardHint}`}>

                {t(`governance_proposals_l5_guide_${step}_body`)}

              </p>

            </div>

          </li>

        ))}

      </ol>

      <p className={`mt-4 ${GOV_PROPOSALS_L5.proposalMeta}`}>

        {t("governance_proposals_l5_guide_delegate_prefix")}{" "}

        <Link href="/governance/delegate" className={GOV_PROPOSALS_L5.inlineLink}>

          {t("governance_delegate_nav")}

        </Link>

      </p>

    </GovernanceProposalsL5Panel>

  );

}



/** 链上 / 审计长文 · 默认折叠 */

export function GovernanceProposalsTechDisclosure({

  showOnChainPanel,

  chainId,

  metaGovernor,

  listBridgeId,

  listBridgeText,

}: {

  showOnChainPanel: boolean;

  chainId: number | null;

  metaGovernor: string | null;

  listBridgeId: string;

  listBridgeText: string;

}) {

  const { t } = useTranslation();

  if (!showOnChainPanel) return null;



  return (

    <details className={`${GOV_PROPOSALS_L5.accordion} mt-4`}>

      <summary className={GOV_PROPOSALS_L5.accordionSummary}>{t("governance_proposals_l5_tech_toggle")}</summary>

      <div className={`space-y-4 border-t border-white/10 px-4 pb-4 pt-3 leading-relaxed ${GOV_PROPOSALS_L5.metaNote}`}>

        <p>{t("governance_proposals_l5_lead")}</p>

        <GovernanceB090OnChainProposalNotice variant="list" chainId={chainId} governorAddress={metaGovernor} />

        <p id={listBridgeId} role="note">

          {listBridgeText}

        </p>

      </div>

    </details>

  );

}

