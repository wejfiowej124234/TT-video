"use client";

import { useCallback, useId, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import ExternalVerificationPanel from "@/components/trust/ExternalVerificationPanel";
import TrustStatusCallout from "@/components/trust/TrustStatusCallout";
import TechnicalTransparencyDetails from "@/components/trust/TechnicalTransparencyDetails";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";
import { useAutoTransparencyVerification } from "@/lib/trust/useAutoTransparencyVerification";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const CARD =
  "rounded-[var(--radius-md)] border border-slate-600/55 bg-ink-800/60 backdrop-blur-md px-4 py-4 sm:px-5 sm:py-5";
const BTN_PRIMARY = `inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/55 bg-cyan-500/15 px-5 py-2.5 text-meta font-medium text-cyan-200 hover:bg-cyan-500/25 motion-sub motion-reduce:transition-none disabled:opacity-50 ${travelFocusRingOffset2Classes}`;
const BTN_SECONDARY = `inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-500/60 bg-ink-700/70 px-5 py-2.5 text-meta text-slate-200 hover:bg-ink-600/70 motion-sub motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;

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

export default function TrustTransparencyHub({ fromSettings = false }: { fromSettings?: boolean }) {
  const { t } = useTranslation();
  const titleId = useId();
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
    <main
      className="min-h-screen relative overflow-hidden bg-ink-900"
      aria-labelledby={titleId}
      {...(fromSettings ? { "data-tt-trust-hub-from-settings": "1" } : {})}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.08),_transparent_55%)]" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 sm:py-14">
        {fromSettings ? (
          <p className="mb-4">
            <Link
              href={ME_SETTINGS_HUB_PATH}
              className={`text-meta text-cyan-300 hover:text-cyan-100 underline ${travelFocusRingOffset2Classes}`}
            >
              {t("me_settings_back_hub")}
            </Link>
          </p>
        ) : null}
        <header className="mb-8">
          <p className="text-meta text-cyan-300 mb-1">{t("pux2_hub_kicker")}</p>
          <h1 id={titleId} className="text-2xl sm:text-3xl font-semibold text-slate-50 tracking-tight">
            {t("trust_page_title")}
          </h1>
          <p className="text-body text-slate-300 mt-3 max-w-prose leading-relaxed">{t("trust_page_subtitle")}</p>
        </header>

        <section
          className={`${CARD} mb-6 border-cyan-500/25`}
          aria-label={t("trust_hub_auto_status_aria")}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-body font-semibold text-cyan-100">{t("pux1_hub_section_title")}</h2>
              <p className="text-meta text-slate-300 mt-1 max-w-prose">{t("pux1_hub_section_subtitle")}</p>
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
              <p className="text-meta text-slate-300 mt-4 leading-relaxed max-w-prose">{t("pux1_hub_download_hint")}</p>
              <TechnicalTransparencyDetails surface="slate">
                <p className="text-meta text-slate-300 leading-relaxed">{t("pux1_technical_explainer")}</p>
                <dl className="grid gap-2 text-meta text-slate-300 mt-2">
                  <div>
                    <dt className="text-slate-400">{t("trust_build_git_sha")}</dt>
                    <dd className="font-mono text-slate-200 break-all">{bundle.build.git_sha}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">{t("trust_doc_version_label")}</dt>
                    <dd className="font-mono text-slate-200">
                      {bundle.protocol_reference_summary.doc_version ?? t("ui_em_dash")}
                    </dd>
                  </div>
                  {typeof bundle.meta_slice.chain === "object" &&
                  bundle.meta_slice.chain &&
                  "chain_id" in (bundle.meta_slice.chain as object) ? (
                    <div>
                      <dt className="text-slate-400">{t("trust_chain_id_label")}</dt>
                      <dd className="font-mono text-slate-200">
                        {String((bundle.meta_slice.chain as { chain_id?: unknown }).chain_id)}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-slate-400">{t("trust_fingerprint_label")}</dt>
                    <dd className="font-mono text-cyan-200/95 text-xs sm:text-sm break-all">{fingerprint}</dd>
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
        </section>

        <section className="mb-6" aria-label={t("trust_section_proof_title")}>
          <h2 className="text-body font-semibold text-slate-100 mb-2">{t("pux1_three_pillars_title")}</h2>
          <p className="text-meta text-slate-400 mb-4 leading-relaxed max-w-prose">{t("pux1_three_pillars_intro")}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={`${CARD} border-success/20`}>
              <h3 className="text-meta font-semibold text-success mb-2">{t("pux1_pillar_finance_title")}</h3>
              <p className="text-meta text-slate-300 leading-relaxed">{t("pux1_pillar_finance_body")}</p>
            </div>
            <div className={`${CARD} border-violet-500/20`}>
              <h3 className="text-meta font-semibold text-violet-300 mb-2">{t("pux1_pillar_audit_title")}</h3>
              <p className="text-meta text-slate-300 leading-relaxed">{t("pux1_pillar_audit_body")}</p>
            </div>
            <div className={`${CARD} border-warning/20`}>
              <h3 className="text-meta font-semibold text-white mb-2">{t("pux1_pillar_gov_title")}</h3>
              <p className="text-meta text-slate-300 leading-relaxed">{t("pux1_pillar_gov_body")}</p>
            </div>
          </div>
        </section>

        <section className={`${CARD} mb-8`} aria-label={t("trust_section_gov_title")}>
          <h2 className="text-body font-semibold text-slate-100 mb-3">{t("trust_section_gov_title")}</h2>
          <ul className="space-y-2 text-meta text-slate-300">
            <li>
              <Link
                href="/governance/proposals"
                className={`text-cyan-300 hover:text-cyan-100 underline ${travelFocusRingOffset2Classes}`}
              >
                {t("trust_gov_proposals")}
              </Link>
            </li>
            <li>
              <Link
                href="/governance/params"
                className={`text-cyan-300 hover:text-cyan-100 underline ${travelFocusRingOffset2Classes}`}
              >
                {t("trust_gov_params")}
              </Link>
              <p className="mt-1 text-meta text-slate-400 leading-relaxed">{t("trust_gov_params_hint")}</p>
            </li>
            <li>
              <Link
                href="/governance/fee-routes"
                className={`text-cyan-300 hover:text-cyan-100 underline ${travelFocusRingOffset2Classes}`}
              >
                {t("trust_gov_fee_routes")}
              </Link>
            </li>
          </ul>
        </section>

        {!fromSettings ? (
          <ProductCrossNav
            ariaLabelKey="trust_related_nav_aria"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-slate-400 max-w-prose"
            linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 font-medium motion-sub motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
            separatorClassName="text-slate-500"
            showGuides
          />
        ) : null}
      </div>
    </main>
  );
}
