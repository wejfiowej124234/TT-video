"use client";



import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import Link from "next/link";

import ApiErrorAlert from "@/components/ApiErrorAlert";

import { TouchpointEmptyPanel } from "@/components/product-enhancement/TouchpointEmptyPanel";

import { TouchpointConversionStrip } from "@/components/product-enhancement/TouchpointConversionStrip";

import { GovernanceProposalListCard } from "@/components/governance/GovernanceProposalListCard";

import {

  GovernanceProposalsPageGuide,

  GovernanceProposalsTechDisclosure,

} from "@/components/governance/GovernanceProposalsPageGuide";

import { GovernanceProposalsToolbar } from "@/components/governance/GovernanceProposalsToolbar";

import { GovernanceProposalsL5Shell } from "@/components/governance/GovernanceProposalsL5Shell";

import { GovernanceProposalsPageHeader } from "@/components/governance/GovernanceProposalsPageHeader";

import { Suspense } from "react";
import { StewardWorkbenchSubpageBackLinkFromQuery } from "@/components/governance/StewardWorkbenchSubpageBackLinkFromQuery";

import { GOV_EXEC_LIST_BRIDGE_DOM_ID, GovExecReadOnlyI18n } from "@/lib/governanceExecReadOnlyNarrative";

import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";

import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

import {

  filterGovernanceProposals,

  readGovernancePersonaView,

  writeGovernancePersonaView,

  type GovernancePersonaView,

  type GovernanceProposalStatusFilter,

} from "@/lib/governance/governanceProposalsListModel";

import {

  GOV_PROPOSALS_L5,

  GovernanceProposalsL5Panel,

} from "@/lib/governance/governanceProposalsL5Ui";
import { resolveGovernanceProposalDisplayTitle } from "@/lib/governance/governanceStarterProposalDisplay";

import { useGovernanceProposalsPage } from "./useGovernanceProposalsPage";



export function GovernanceProposalsPageMain() {

  const pageTitleId = useId();

  const listSectionId = useId();

  const [statusFilter, setStatusFilter] = useState<GovernanceProposalStatusFilter>("all");

  const [personaView, setPersonaView] = useState<GovernancePersonaView>("all");



  useEffect(() => {

    setPersonaView(readGovernancePersonaView());

  }, []);



  const {

    t,

    items,

    note,

    loading,

    error,

    setRetryTick,

    chainId,

    metaGovernor,

    chainExecById,

    chainExecLoading,

    summaryById,

    summaryLoading,

    emptySuccess,

    showOnChainPanel,

  } = useGovernanceProposalsPage();



  const filteredItems = useMemo(() => {

    if (!items) return null;

    return filterGovernanceProposals(items, statusFilter, chainExecById);

  }, [items, statusFilter, chainExecById]);



  const onPersonaChange = (next: GovernancePersonaView) => {

    setPersonaView(next);

    writeGovernancePersonaView(next);

  };



  return (

    <GovernanceProposalsL5Shell ariaLabelledBy={pageTitleId}>

      <Suspense fallback={null}>
        <StewardWorkbenchSubpageBackLinkFromQuery t={t} />
      </Suspense>

      <GovernanceProposalsPageHeader

        pageTitleId={pageTitleId}

        kicker={t("governance_proposals_l5_kicker")}

        title={t("governance_proposals_title")}

        lead={t("governance_proposals_intro_l5")}

        createCtaLabel={t("governance_proposals_create_cta")}

        secondaryCtaLabel={t("governance_delegate_nav")}

      />



      <GovernanceProposalsPageGuide />

      <p className={`${GOV_PROPOSALS_L5.noticeSoft} mt-5`} role="note">

        {t("governance_proposals_l5_disclaimer")}

      </p>



      {!loading && !error ? (

        <GovernanceProposalsToolbar

          statusFilter={statusFilter}

          onStatusFilterChange={setStatusFilter}

          personaView={personaView}

          onPersonaViewChange={onPersonaChange}

          proposalCount={filteredItems?.length ?? items?.length}

          showCreateCta={false}

        />

      ) : null}

      {!loading && !error ? (

        <p className={`mt-2 px-1 ${GOV_PROPOSALS_L5.metaNote}`} role="note">

          {t("governance_proposals_persona_help")}

        </p>

      ) : null}



      <GovernanceProposalsTechDisclosure

        showOnChainPanel={showOnChainPanel}

        chainId={chainId}

        metaGovernor={metaGovernor}

        listBridgeId={GOV_EXEC_LIST_BRIDGE_DOM_ID}

        listBridgeText={t(GovExecReadOnlyI18n.listEntryBridge)}

      />



      {loading ? (

        <div className={`mt-6 ${GOV_PROPOSALS_L5.loadingPanel}`} role="status" aria-live="polite" aria-busy="true">

          <p className={GOV_PROPOSALS_L5.metaNote}>{t("pes_governance_loading")}</p>

          <div className="space-y-2" aria-hidden>

            {Array.from({ length: 4 }).map((_, i) => (

              <div

                key={i}

                className={`h-16 rounded-[var(--radius-md)] border border-white/10 bg-slate-950/40 animate-pulse motion-reduce:animate-none ${i === 3 ? "w-2/3" : "w-full"}`}

              />

            ))}

          </div>

        </div>

      ) : null}



      {error ? (

        <GovernanceProposalsL5Panel className="mt-6">

          <ApiErrorAlert message={error} />

          <form

            className="mt-3 inline"

            onSubmit={(e: FormEvent) => {

              e.preventDefault();

              if (loading) return;

              setRetryTick((n) => n + 1);

            }}

          >

            <button

              type="submit"

              disabled={loading}

              aria-busy={loading ? true : undefined}

              aria-label={t("common_retry")}

              className={GOV_PROPOSALS_L5.retryBtn}

            >

              {loading ? t("common_retrying") : t("common_retry")}

            </button>

          </form>

        </GovernanceProposalsL5Panel>

      ) : null}



      {!loading && !error && emptySuccess ? (

        <div className="mt-6 space-y-4">

          <TouchpointConversionStrip

            touchpoint="governance"

            kicker={t("pes_governance_conversion_kicker")}

            body={t("pes_governance_conversion_body")}

            badge={t("pes_governance_conversion_badge")}

            ctaHref="/governance/proposals/new"

            ctaLabel={t("governance_proposals_create_cta")}

          />

          <GovernanceProposalsL5Panel>

            <TouchpointEmptyPanel

              variant="dark"

              title={t("governance_proposals_empty_title")}

              body={t("governance_proposals_empty_body_l5")}

              actions={[

                { href: "/governance/proposals/new", label: t("governance_proposals_create_cta"), primary: true },

                { href: "/governance/delegate", label: t("pes_governance_empty_cta_delegate") },

                { href: "/governance", label: t("pes_governance_conversion_cta") },

              ]}

              footer={

                note ? (

                  <p className={GOV_PROPOSALS_L5.metaNote} role="note">

                    {note}

                  </p>

                ) : null

              }

            />

          </GovernanceProposalsL5Panel>

        </div>

      ) : null}



      {!loading && !error && filteredItems !== null && filteredItems.length > 0 ? (

        <section className="mt-6 space-y-3" aria-labelledby={listSectionId}>

          <div className="flex flex-wrap items-center justify-between gap-2 px-1">

            <h2 id={listSectionId} className={GOV_PROPOSALS_L5.listSectionTitle}>

              {t("governance_proposals_list_heading")}

            </h2>

            <span className={GOV_PROPOSALS_L5.listCountBadge}>{filteredItems.length}</span>

          </div>



          {personaView !== "all" ? (

            <p className={`px-1 ${GOV_PROPOSALS_L5.metaNote}`} role="note">

              {t("governance_proposals_persona_hint").replace(

                "{{persona}}",

                t(`governance_proposals_persona_${personaView}`),

              )}

            </p>

          ) : null}



          {showOnChainPanel && chainExecLoading ? (

            <p className={`px-1 ${GOV_PROPOSALS_L5.mutedNote}`} aria-live="polite">

              {t("governance_proposals_status_loading")}

            </p>

          ) : null}



          <ul className="space-y-3">

            {filteredItems.map((proposal, i) => {

              const key =

                typeof proposal.id === "string" && proposal.id.trim() ? proposal.id : `proposal-${i}`;

              const pid =

                typeof proposal.id === "string" && proposal.id.trim() ? proposal.id.trim() : "";

              const title = resolveGovernanceProposalDisplayTitle(
                pid,
                typeof proposal.title === "string" ? proposal.title : undefined,
                t,
              );

              if (!pid) {

                return (

                  <li key={key}>

                    <span className={GOV_PROPOSALS_L5.proposalTitle}>{title}</span>

                  </li>

                );

              }

              return (

                <li key={key}>

                  <GovernanceProposalListCard

                    proposalId={pid}

                    title={title}

                    href={`/governance/proposals/${encodeURIComponent(pid)}`}

                    showOnChainPanel={showOnChainPanel}

                    chainExecLoading={chainExecLoading}

                    chainExecById={chainExecById}

                    summary={summaryById?.[pid]}

                    summaryLoading={summaryLoading && !summaryById?.[pid]}

                  />

                </li>

              );

            })}

          </ul>

        </section>

      ) : null}



      {!loading && !error && items !== null && items.length > 0 && filteredItems !== null && filteredItems.length === 0 ? (

        <p className={GOV_PROPOSALS_L5.filterEmptyPanel} role="status">

          {t("governance_proposals_filter_empty")}

        </p>

      ) : null}



      <GovernanceProposalsL5Panel className="mt-8">

        <nav className={GOV_PROPOSALS_L5.footerNav} aria-label={t("governance_nav_label")}>

          <Link href="/governance" className={GOV_PROPOSALS_L5.footerLink}>

            {t("governance_title")}

          </Link>

          <Link href="/governance/delegate" className={GOV_PROPOSALS_L5.footerLink}>

            {t("governance_delegate_nav")}

          </Link>

          <Link href="/governance/params" className={GOV_PROPOSALS_L5.footerLink}>

            {t("governance_params_title")}

          </Link>

        </nav>



        <details className="mt-4">

          <summary className={`${GOV_PROPOSALS_L5.accordionSummary} rounded-[var(--radius-md)] hover:bg-ref-sun/[0.06]`}>

            {t("governance_proposals_more_links_toggle")}

          </summary>

          <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-small" aria-label={t("governance_subpage_relatedNav_aria")}>

            <Link href="/governance/fee-routes" className={GOV_PROPOSALS_L5.inlineLink}>

              {t("governance_fee_routes_title")}

            </Link>

            <Link href="/governance/vault-forwards" className={GOV_PROPOSALS_L5.inlineLink}>

              {t("governance_vault_forwards_title")}

            </Link>

            <Link href="/governance/distribution-accruals" className={GOV_PROPOSALS_L5.inlineLink}>

              {t("governance_distribution_accruals_title")}

            </Link>

            <Link href="/governance/params" className={GOV_PROPOSALS_L5.inlineLink}>

              {t("governance_params_title")}

            </Link>

            <Link href="/traveltrust#fee-router" className={GOV_PROPOSALS_L5.inlineLink}>

              {t("traveltrust_link_feeRouter")}

            </Link>

            <GovernanceOpsAdminLinks />

            <Link href="/help" className={GOV_PROPOSALS_L5.inlineLink}>

              {t("help_title")}

            </Link>

          </nav>

        </details>

      </GovernanceProposalsL5Panel>



      <ProductCrossNav

        ariaLabelKey="governance_subpage_relatedNav_aria"

        showGuides

        className={GOV_PROPOSALS_L5.crossNavWrap}

        linkClassName={GOV_PROPOSALS_L5.crossNavLink}

        separatorClassName={GOV_PROPOSALS_L5.crossNavSep}

      />

    </GovernanceProposalsL5Shell>

  );

}

