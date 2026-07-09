"use client";

import { Suspense, useMemo, useId } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import { GovernanceParamsL5Shell } from "@/components/governance/GovernanceParamsL5Shell";
import { GovernanceProposalsPageHeader } from "@/components/governance/GovernanceProposalsPageHeader";
import { formatCnyFdvBillions } from "@/lib/governance/ttgReferencePriceV1";
import { countryPoolFundraiseTargetTotalCnyWan } from "@/lib/governance/countryPoolFundraiseGovernanceV1";
import { applyGovernanceFundraiseTargetToRows } from "@/lib/governance/governanceParamsPhase1IndependentParamsModel";
import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";
import { GovernanceParamsFeeRouterTechnicalSection } from "./GovernanceParamsFeeRouterTechnicalSection";
import { GovernanceParamsGlobalTreasuryUsageSection } from "./GovernanceParamsGlobalTreasuryUsageSection";
import { GovernanceParamsTtgAllocationUnifiedSection } from "./GovernanceParamsTtgAllocationUnifiedSection";
import { GovernanceParamsPhaseContrastSection } from "./GovernanceParamsPhaseContrastSection";
import { GovernanceParamsOverviewSection } from "./GovernanceParamsOverviewSection";
import { GovernanceParamsPhase1CountriesTables } from "./GovernanceParamsPhase1CountriesTables";
import { GovernanceParamsPhase1IndependentParamsDetails } from "./GovernanceParamsPhase1IndependentParamsDetails";
import { GovernanceParamsStewardContextPanel } from "./GovernanceParamsStewardContextPanel";
import { GovernanceParamsGovFreezeRulesSection } from "./GovernanceParamsGovFreezeRulesSection";
import { GovernanceParamsTreasuryPolicySection } from "./GovernanceParamsTreasuryPolicySection";
import { GovernanceParamsTechnicalAppendixSection } from "./GovernanceParamsTechnicalAppendixSection";
import { GovernanceParamsPanelHeader } from "./GovernanceParamsSectionBlock";
import { PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS, protocolReferenceHasSubstance } from "@/lib/governanceParams84Readonly";
import {
  GOV_PARAMS_L5,
  GOV_PARAMS_TABLE,
  GovernanceParamsL5Panel,
} from "@/lib/governance/governanceParamsPageL5";
import {
  GovernanceParamsChecksumDetails,
  GovernanceParamsRetryButton,
  GovernanceParamsSectionNav,
  GovernanceParamsTechnicalDetails,
} from "@/lib/governance/governanceParamsPageL5Ui";
import { GovernanceParamsPageFooterNav } from "./GovernanceParamsPageFooterNav";
import { GovernanceParamsParticipatePanel } from "./GovernanceParamsParticipatePanel";
import { GovernanceParamsQueryProvider } from "./GovernanceParamsQueryProvider";
import { GovernanceParamsStewardBackLink } from "./GovernanceParamsStewardBackLink";
import { CHECKSUM_I18N_KEY } from "./governanceParamsPageModel";
import { useGovernanceParamsPage } from "./useGovernanceParamsPage";

/** 13-1 · /governance/params · C-GOV-011 文档镜像只读 · L5 冻结 */
export function GovernanceParamsPageMain() {
  return (
    <Suspense fallback={null}>
      <GovernanceParamsQueryProvider>
        <GovernanceParamsPageMainBody />
      </GovernanceParamsQueryProvider>
    </Suspense>
  );
}

function GovernanceParamsPageMainBody() {
  const pageTitleId = useId();
  const diffSectionId = useId();
  const feeSplitSectionId = useId();
  const countriesSectionId = useId();
  const diffTableCaptionId = useId();
  const protocolTableCaptionId = useId();
  const fundraiseTableCaptionId = useId();
  const {
    t,
    locale,
    dash,
    loading,
    error,
    data,
    dataSource,
    pending,
    pendingErr,
    l1,
    diffRows,
    allMatch,
    pendingSource,
    retryAll,
    retryPending,
  } = useGovernanceParamsPage();

  const phase1Rows = useMemo(
    () => applyGovernanceFundraiseTargetToRows(data?.phase1_countries ?? []),
    [data?.phase1_countries],
  );

  const phase1FundraiseTotalWan = countryPoolFundraiseTargetTotalCnyWan();
  const hasSubstance = data != null && protocolReferenceHasSubstance(data);
  const showSectionNav = !loading && hasSubstance;
  const usingMirror = dataSource === "mirror";

  return (
    <GovernanceParamsL5Shell ariaLabelledBy={pageTitleId}>
      <GovernanceParamsStewardBackLink t={t} />

      <GovernanceProposalsPageHeader
        pageTitleId={pageTitleId}
        kicker={t("governance_params_l5_kicker")}
        title={t("governance_params_title")}
        lead={t("governance_params_lead_short")}
      />

      <GovernanceParamsStewardContextPanel t={t} className="mt-4" />

      <GovernanceParamsOverviewSection
        t={t}
        className="mt-4"
        mirrorBadge={usingMirror ? t("governance_params_status_mirror_badge") : undefined}
      />

      {usingMirror && error ? (
        <div className={`${GOV_PARAMS_LAYOUT.panelGap} space-y-3`} data-tt-governance-params-mirror-fallback="1">
          <ApiErrorAlert message={error} />
          <GovernanceParamsRetryButton label={t("governance_params_retry_load")} onClick={retryAll} />
        </div>
      ) : null}

      {showSectionNav ? <GovernanceParamsSectionNav t={t} className="mt-6" /> : null}

      {!loading && hasSubstance ? (
        <div id="gov-params-allocation-detail" className="scroll-mt-24 space-y-6 mt-6">
          <GovernanceParamsL5Panel data-tt-governance-params-allocation-treasury="1">
            <GovernanceParamsPanelHeader
              title={t("governance_params_allocation_panel_revenue_title")}
              lead={t("governance_params_allocation_panel_revenue_lead")}
            />
            <GovernanceParamsGlobalTreasuryUsageSection t={t} className="mt-4" />
          </GovernanceParamsL5Panel>

          <GovernanceParamsL5Panel data-tt-governance-params-allocation-governance="1">
            <GovernanceParamsTreasuryPolicySection t={t} locale={locale} />
          </GovernanceParamsL5Panel>

          <GovernanceParamsL5Panel data-tt-governance-params-allocation-tokenomics="1">
            <GovernanceParamsPanelHeader
              title={t("governance_params_allocation_panel_token_title")}
              lead={t("governance_params_allocation_panel_token_lead")}
            />
            <GovernanceParamsGovFreezeRulesSection t={t} locale={locale} className="mt-4" />
            <GovernanceParamsTtgAllocationUnifiedSection t={t} locale={locale} className={GOV_PARAMS_LAYOUT.blockDivider} />
            <GovernanceParamsPhaseContrastSection t={t} className={GOV_PARAMS_LAYOUT.blockDivider} />
          </GovernanceParamsL5Panel>
        </div>
      ) : null}

      {loading ? (
        <GovernanceParamsL5Panel className="mt-6">
          <h2 id={countriesSectionId} className={GOV_PARAMS_L5.sectionHeading}>
            {t("governance_params_phase1_countries_short")}
          </h2>
          <div className={`mt-4 ${GOV_PARAMS_L5.loadingPanel}`}>
            <LoadingText />
          </div>
        </GovernanceParamsL5Panel>
      ) : null}

      {!loading && hasSubstance ? (
        <>
          <div id="gov-params-countries" className="scroll-mt-24">
            <GovernanceParamsL5Panel className="mt-6">
              <GovernanceParamsPanelHeader
                title={t("governance_params_phase1_countries_short")}
                lead={t("governance_params_phase1_lead_short")}
              />
              <p
                className={`mt-3 rounded-[var(--radius-md)] border border-white/10 bg-slate-950/40 px-4 py-2.5 text-small text-slate-200`}
                data-tt-governance-params-jurisdiction-summary="1"
              >
                {t("governance_params_phase1_jurisdiction_summary")}
              </p>
              <GovernanceParamsPhase1CountriesTables
                t={t}
                locale={locale}
                dash={dash}
                rows={phase1Rows}
                fundraiseTotalWan={phase1FundraiseTotalWan}
                protocolTableCaptionId={protocolTableCaptionId}
                fundraiseTableCaptionId={fundraiseTableCaptionId}
              />
              {data.valuation_anchor?.reference_price_cny_per_ttg ? (
                <p
                  className={`mt-4 ${GOV_PARAMS_L5.mutedNote}`}
                  role="note"
                  data-tt-governance-params-valuation-anchor="1"
                >
                  {t("governance_params_valuation_anchor_note_short", {
                    cny: data.valuation_anchor.reference_price_cny_per_ttg,
                    fdv: formatCnyFdvBillions(data.valuation_anchor.fdv_cny ?? 2_000_000_000, locale),
                  })}
                </p>
              ) : null}
              <GovernanceParamsPhase1IndependentParamsDetails t={t} locale={locale} />
            </GovernanceParamsL5Panel>
          </div>

          <GovernanceParamsTechnicalAppendixSection t={t} className="mt-6">
            <GovernanceParamsFeeRouterTechnicalSection
              t={t}
              diffSectionId={diffSectionId}
              feeSplitSectionId={feeSplitSectionId}
              diffTableCaptionId={diffTableCaptionId}
              l1={l1}
              diffRows={diffRows}
              allMatch={allMatch}
              pending={pending}
              pendingErr={pendingErr}
              pendingUnavailable={usingMirror}
              retryAll={retryAll}
              retryPending={retryPending}
            />
            {data.checksums ? (
              <div className="mt-6 border-t border-white/10 pt-4">
                <GovernanceParamsChecksumDetails t={t}>
                  <p className={`mb-3 ${GOV_PARAMS_L5.cardHint}`}>{t("governance_params_phase1_checksum_lead")}</p>
                  <dl className="space-y-2 text-small">
                    {PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS.map((key) => {
                      const raw = data.checksums![key];
                      if (raw === undefined) return null;
                      return (
                        <div
                          key={key}
                          className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline"
                        >
                          <dt className={GOV_PARAMS_L5.metaNote}>{t(CHECKSUM_I18N_KEY[key])}</dt>
                          <dd className={`${GOV_PARAMS_TABLE.mono} text-right sm:text-left`}>{String(raw)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </GovernanceParamsChecksumDetails>
              </div>
            ) : null}
          </GovernanceParamsTechnicalAppendixSection>
        </>
      ) : null}

      {!loading && !hasSubstance ? (
        <GovernanceParamsL5Panel className="mt-6">
          <h2 id={countriesSectionId} className={GOV_PARAMS_L5.sectionHeading}>
            {t("governance_params_phase1_countries_short")}
          </h2>
          <p className={`mt-3 ${GOV_PARAMS_L5.filterEmptyPanel}`} role="alert">
            {t("governance_params_body_incomplete")}
          </p>
          <GovernanceParamsRetryButton label={t("governance_params_retry_load")} onClick={retryAll} className="mt-3" />
        </GovernanceParamsL5Panel>
      ) : null}

      <GovernanceParamsParticipatePanel t={t} className="mt-8" />

      <GovernanceParamsTechnicalDetails t={t} className="mt-4">
        <p className={`${GOV_PARAMS_L5.mutedNote} mb-3`}>{t("governance_params_doc_notice_short")}</p>
        {data?.doc_ref ? (
          <p className={`font-mono ${GOV_PARAMS_L5.metaNote}`}>
            {data.doc_ref} · v{data.doc_version ?? dash}
            {usingMirror ? ` · ${t("governance_params_mirror_source_tag")}` : ""}
          </p>
        ) : null}
        {pendingSource ? (
          <p className={`mt-2 ${GOV_PARAMS_L5.metaNote}`}>
            {t("governance_params_diff_source_hint", { source: pendingSource })}
          </p>
        ) : null}
      </GovernanceParamsTechnicalDetails>

      <GovernanceParamsPageFooterNav t={t} />
    </GovernanceParamsL5Shell>
  );
}
