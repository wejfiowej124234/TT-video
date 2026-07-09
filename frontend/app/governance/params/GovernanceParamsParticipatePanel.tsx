"use client";

import Link from "next/link";
import { GOV_PARAMS_L5, GovernanceParamsL5Panel } from "@/lib/governance/governanceParamsPageL5";
import { GovernanceParamsPanelHeader } from "./GovernanceParamsSectionBlock";
import { useGovernanceParamsQuery } from "./GovernanceParamsQueryProvider";

type Props = {
  t: (key: string) => string;
  className?: string;
};

/** 治理专用下一步（主理人 deep link 时不展示）。 */
export function GovernanceParamsParticipatePanel({ t, className = "" }: Props) {
  const { fromStewardWorkbench } = useGovernanceParamsQuery();
  if (fromStewardWorkbench) return null;

  const links = [
    {
      href: "/governance/proposals",
      title: t("governance_params_participate_proposals"),
      hint: t("governance_params_participate_proposals_hint"),
    },
    {
      href: "/governance/delegate",
      title: t("governance_params_participate_delegate"),
      hint: t("governance_params_participate_delegate_hint"),
    },
    {
      href: "/governance",
      title: t("governance_params_participate_hub"),
      hint: t("governance_params_participate_hub_hint"),
    },
  ] as const;

  return (
    <GovernanceParamsL5Panel className={className} data-tt-governance-params-participate="1">
      <GovernanceParamsPanelHeader title={t("governance_params_participate_title")} lead={t("governance_params_participate_lead")} />
      <ul className="mt-4 grid gap-3 sm:grid-cols-3" role="list">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`flex min-h-[88px] flex-col justify-center rounded-[var(--radius-md)] border border-white/10 bg-slate-950/45 px-4 py-3 transition hover:border-ref-sun/35 hover:bg-ref-sun/[0.08] ${GOV_PARAMS_L5.linkFocus}`}
            >
              <span className="text-small font-semibold text-ref-sun/95">{link.title}</span>
              <span className={`mt-1 ${GOV_PARAMS_L5.cardHint}`}>{link.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </GovernanceParamsL5Panel>
  );
}
