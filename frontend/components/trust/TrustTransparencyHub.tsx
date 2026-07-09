"use client";

import { useCallback, useId, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import ExternalVerificationPanel from "@/components/trust/ExternalVerificationPanel";
import TrustStatusCallout from "@/components/trust/TrustStatusCallout";
import TechnicalTransparencyDetails from "@/components/trust/TechnicalTransparencyDetails";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { GovernanceProposalsL5Shell } from "@/components/governance/GovernanceProposalsL5Shell";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { GovernanceProposalsL5Panel } from "@/lib/governance/governanceProposalsL5Ui";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";
import { useAutoTransparencyVerification } from "@/lib/trust/useAutoTransparencyVerification";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const LINK = `${touchTargetLink44Classes} ${GOV_PROPOSALS_L5.footerLink} !inline-flex`;
const BTN_PRIMARY = GOV_PROPOSALS_L5.primarySubmit;
const BTN_SECONDARY = GOV_PROPOSALS_L5.retryBtn;

function formatCheckedAt(iso: string | null, t: (k: string) => string): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return `${t("p003_last_checked")} ${d.toLocaleString()}`;
  } catch {
    return null;
  }
}

function TrustHubInner({ fromSettings, titleId }: { fromSettings: boolean; titleId: string }) {
  const { t } = useTranslation();
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const { trustState, bundle, fingerprint, error, lastCheckedAt, backgroundBusy, isVerifying, refresh } =
    useAutoTransparencyVerification({
      t,
      refreshKey: "transparency-hub",
      pollIntervalMs: 90_000,
    });

  const downloadJson = useCallback(() => {
    if (!bundle) return;
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traveltrust-transparency-snapshot-${bundle.fetched_at.replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bundle]);

  const copyFingerprint = useCallback(async () => {
    if (!fingerprint) return;
    try {
      await navigator.clipboard.writeText(fingerprint);
      setCopyHint(t("trust_copied"));
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint(t("trust_verify_fail"));
    }
  }, [fingerprint, t]);

  const checkedLabel = formatCheckedAt(lastCheckedAt, t);

  const headline =
    trustState === "verified"
      ? t("pux1_headline_verified")
      : trustState === "failed"
        ? t("pux1_headline_failed")
        : t("pux1_headline_pending");

  const body =
    trustState === "verified"
      ? t("pux1_body_verified")
      : trustState === "failed"
        ? t("pux1_body_failed")
        : t("pux1_body_pending");

  const subtleParts: string[] = [];
  if (backgroundBusy) subtleParts.push(t("p003_background_check"));
  if (checkedLabel) subtleParts.push(checkedLabel);
  const subtle = subtleParts.length ? subtleParts.join(" · ") : null;

  return (
    <div data-tt-trust-hub-page="1" data-tt-ui-generation="l5">
      {fromSettings ? (
        <p className="mb-4">
          <Link href={ME_SETTINGS_HUB_PATH} className={LINK}>
            {t("me_settings_back_hub")}
          </Link>
        </p>
      ) : null}

      <header className={GOV_PROPOSALS_L5.pageHeaderWrap}>
        <p className={GOV_PROPOSALS_L5.heroKicker}>{t("pux2_hub_kicker")}</p>
        <h1 id={titleId} className={GOV_PROPOSALS_L5.heroTitle}>
          {t("trust_page_title")}
        </h1>
        <p className={GOV_PROPOSALS_L5.heroLead}>{t("trust_page_subtitle")}</p>
      </header>

      <section aria-label={t("trust_hub_auto_status_aria")}>
        <GovernanceProposalsL5Panel className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={`text-body font-semibold ${GOV_PROPOSALS_L5.cardHint}`}>{t("pux1_hub_section_title")}</h2>
            <p className={`mt-1 max-w-prose ${GOV_PROPOSALS_L5.metaNote}`}>{t("pux1_hub_section_subtitle")}</p>
          </div>
          <button type="button" className={BTN_PRIMARY} onClick={() => refresh()} disabled={isVerifying}>
            {isVerifying ? t("p003_refresh_busy") : t("p003_refresh_cta")}
          </button>
        </div>

        <div className="mt-4 space-y-3" role="status" aria-live="polite">
          <TrustStatusCallout
            state={trustState}
            surface="slate"
            headline={headline}
            body={body}
            subtle={subtle}
          />
        </div>

        {error && trustState === "failed" ? (
          <div className="mt-4">
            <ApiErrorAlert message={error} />
          </div>
        ) : null}

        {trustState === "verified" && bundle && fingerprint ? (
          <>
            <p className={`mt-4 max-w-prose leading-relaxed ${GOV_PROPOSALS_L5.metaNote}`}>
              {t("pux1_hub_download_hint")}
            </p>
            <TechnicalTransparencyDetails surface="slate">
              <p className={`leading-relaxed ${GOV_PROPOSALS_L5.metaNote}`}>{t("pux1_technical_explainer")}</p>
              <dl className={`mt-2 grid gap-2 ${GOV_PROPOSALS_L5.metaNote}`}>
                <div>
                  <dt className={GOV_PROPOSALS_L5.mutedNote}>{t("trust_build_git_sha")}</dt>
                  <dd className="break-all font-mono text-small text-slate-200">{bundle.build.git_sha}</dd>
                </div>
                <div>
                  <dt className={GOV_PROPOSALS_L5.mutedNote}>{t("trust_doc_version_label")}</dt>
                  <dd className="font-mono text-slate-200">
                    {bundle.protocol_reference_summary.doc_version ?? t("ui_em_dash")}
                  </dd>
                </div>
                {typeof bundle.meta_slice.chain === "object" &&
                bundle.meta_slice.chain &&
                "chain_id" in (bundle.meta_slice.chain as object) ? (
                  <div>
                    <dt className={GOV_PROPOSALS_L5.mutedNote}>{t("trust_chain_id_label")}</dt>
                    <dd className="font-mono text-slate-200">
                      {String((bundle.meta_slice.chain as { chain_id?: unknown }).chain_id)}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className={GOV_PROPOSALS_L5.mutedNote}>{t("trust_fingerprint_label")}</dt>
                  <dd className="break-all font-mono text-xs text-[#fde9a8] sm:text-sm">{fingerprint}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" className={BTN_SECONDARY} onClick={() => downloadJson()}>
                  {t("trust_download_json")}
                </button>
                <button type="button" className={BTN_SECONDARY} onClick={() => void copyFingerprint()}>
                  {t("trust_copy_hash")}
                </button>
              </div>
              {copyHint ? <p className="text-meta text-success">{copyHint}</p> : null}
            </TechnicalTransparencyDetails>
          </>
        ) : null}
        {trustState === "verified" && fingerprint ? (
          <ExternalVerificationPanel fingerprint={fingerprint} surface="slate" />
        ) : null}
        </GovernanceProposalsL5Panel>
      </section>

      <section className="mb-6" aria-label={t("trust_section_proof_title")}>
        <h2 className={`mb-2 text-body font-semibold ${GOV_PROPOSALS_L5.cardHint}`}>{t("pux1_three_pillars_title")}</h2>
        <p className={`mb-4 max-w-prose leading-relaxed ${GOV_PROPOSALS_L5.mutedNote}`}>
          {t("pux1_three_pillars_intro")}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <GovernanceProposalsL5Panel className="border-success/20">
            <h3 className="mb-2 text-meta font-semibold text-success">{t("pux1_pillar_finance_title")}</h3>
            <p className={`leading-relaxed ${GOV_PROPOSALS_L5.metaNote}`}>{t("pux1_pillar_finance_body")}</p>
          </GovernanceProposalsL5Panel>
          <GovernanceProposalsL5Panel className="border-ref-sun/25">
            <h3 className="mb-2 text-meta font-semibold text-ref-sun/90">{t("pux1_pillar_audit_title")}</h3>
            <p className={`leading-relaxed ${GOV_PROPOSALS_L5.metaNote}`}>{t("pux1_pillar_audit_body")}</p>
          </GovernanceProposalsL5Panel>
          <GovernanceProposalsL5Panel className="border-warning/25">
            <h3 className="mb-2 text-meta font-semibold text-slate-50">{t("pux1_pillar_gov_title")}</h3>
            <p className={`leading-relaxed ${GOV_PROPOSALS_L5.metaNote}`}>{t("pux1_pillar_gov_body")}</p>
          </GovernanceProposalsL5Panel>
        </div>
      </section>

      <section aria-label={t("trust_section_gov_title")}>
        <GovernanceProposalsL5Panel className="mb-8">
        <h2 className={`mb-3 text-body font-semibold ${GOV_PROPOSALS_L5.cardHint}`}>{t("trust_section_gov_title")}</h2>
        <ul className={`space-y-2 ${GOV_PROPOSALS_L5.metaNote}`}>
          <li>
            <Link href="/governance/proposals" className={LINK}>
              {t("trust_gov_proposals")}
            </Link>
          </li>
          <li>
            <Link href="/governance/params" className={LINK}>
              {t("trust_gov_params")}
            </Link>
            <p className={`mt-1 leading-relaxed ${GOV_PROPOSALS_L5.mutedNote}`}>{t("trust_gov_params_hint")}</p>
          </li>
          <li>
            <Link href="/governance/fee-routes" className={LINK}>
              {t("trust_gov_fee_routes")}
            </Link>
          </li>
        </ul>
        </GovernanceProposalsL5Panel>
      </section>

      {!fromSettings ? (
        <ProductCrossNav
          ariaLabelKey="trust_related_nav_aria"
          className={GOV_PROPOSALS_L5.crossNavWrap}
          linkClassName={GOV_PROPOSALS_L5.crossNavLink}
          separatorClassName={GOV_PROPOSALS_L5.crossNavSep}
          showGuides
        />
      ) : null}
    </div>
  );
}

export default function TrustTransparencyHub({ fromSettings = false }: { fromSettings?: boolean }) {
  const titleId = useId();

  if (fromSettings) {
    return (
      <MeSettingsL5FlowPage
        route="trust-from-settings"
        ariaLabelledby={titleId}
        dataAttrs={{ "data-tt-trust-hub-from-settings": "1" }}
        showMinimalFooter={false}
      >
        <TrustHubInner fromSettings titleId={titleId} />
      </MeSettingsL5FlowPage>
    );
  }

  return (
    <GovernanceProposalsL5Shell width="narrow" ariaLabelledBy={titleId}>
      <TrustHubInner fromSettings={false} titleId={titleId} />
    </GovernanceProposalsL5Shell>
  );
}
