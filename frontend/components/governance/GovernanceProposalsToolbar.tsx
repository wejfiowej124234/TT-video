"use client";



import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";

import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";

import type { GovernancePersonaView, GovernanceProposalStatusFilter } from "@/lib/governance/governanceProposalsListModel";



type Props = {

  statusFilter: GovernanceProposalStatusFilter;

  onStatusFilterChange: (next: GovernanceProposalStatusFilter) => void;

  personaView: GovernancePersonaView;

  onPersonaViewChange: (next: GovernancePersonaView) => void;

  proposalCount?: number;

  showCreateCta?: boolean;

};



const STATUS_FILTERS: GovernanceProposalStatusFilter[] = ["all", "active", "pending", "closed"];

const PERSONA_VIEWS: GovernancePersonaView[] = ["all", "holder", "traveler", "steward"];



export function GovernanceProposalsToolbar({

  statusFilter,

  onStatusFilterChange,

  personaView,

  onPersonaViewChange,

  proposalCount,

  showCreateCta = true,

}: Props) {

  const { t } = useTranslation();



  return (

    <div className={`${GOV_PROPOSALS_L5.toolbarShell} mt-6`} data-tt-governance-proposals-toolbar="1">

      <div className={GOV_PROPOSALS_L5.toolbarInnerFlat}>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

          <div className="min-w-0 flex-1 space-y-4">

            <div className="flex flex-wrap items-center gap-2">

              <p className={GOV_PROPOSALS_L5.listSectionTitle}>{t("governance_proposals_filter_status_aria")}</p>

              {typeof proposalCount === "number" ? (

                <span className={GOV_PROPOSALS_L5.listCountBadge}>{proposalCount}</span>

              ) : null}

            </div>

            <div className={GOV_PROPOSALS_L5.filterBar} role="group" aria-label={t("governance_proposals_filter_status_aria")}>

              {STATUS_FILTERS.map((f) => (

                <button

                  key={f}

                  type="button"

                  className={statusFilter === f ? GOV_PROPOSALS_L5.filterTabActive : GOV_PROPOSALS_L5.filterTabIdle}

                  aria-pressed={statusFilter === f}

                  onClick={() => onStatusFilterChange(f)}

                >

                  {t(`governance_proposals_filter_${f}`)}

                </button>

              ))}

            </div>

            <div className="flex flex-wrap items-center gap-3">

              <label htmlFor="gov-persona-view" className={`text-meta font-medium ${GOV_PROPOSALS_L5.voteLegend}`}>

                {t("governance_proposals_persona_label")}

              </label>

              <select

                id="gov-persona-view"

                value={personaView}

                onChange={(e) => onPersonaViewChange(e.target.value as GovernancePersonaView)}

                className={GOV_PROPOSALS_L5.personaSelect}

              >

                {PERSONA_VIEWS.map((v) => (

                  <option key={v} value={v}>

                    {t(`governance_proposals_persona_${v}`)}

                  </option>

                ))}

              </select>

              <Link href="/governance/delegate" className={`text-small ${GOV_PROPOSALS_L5.inlineLink}`}>

                {t("governance_delegate_nav")}

              </Link>

            </div>

          </div>

          {showCreateCta ? (

            <Link href="/governance/proposals/new" className={`shrink-0 ${GOV_PROPOSALS_L5.createCta}`}>

              {t("governance_proposals_create_cta")}

            </Link>

          ) : null}

        </div>

      </div>

    </div>

  );

}

