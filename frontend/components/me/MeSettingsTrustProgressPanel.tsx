"use client";

import Link from "next/link";
import { MeSettingsResendVerifyEmailPanel } from "@/components/me/MeSettingsResendVerifyEmailPanel";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import type {
  MeSettingsTrustChecklistStep,
  MeSettingsTrustPrimaryCta,
  MeSettingsTrustProgressView,
} from "@/lib/me/meSettingsTrustProgressModel";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

function StepStatusIcon({ state }: { state: MeSettingsTrustChecklistStep["state"] }) {
  if (state === "done") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-success/40 bg-success/12 text-success text-meta font-bold" aria-hidden>
        ✓
      </span>
    );
  }
  if (state === "pending") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-warning/40 bg-warning/10 text-warning/95 text-meta" aria-hidden>
        …
      </span>
    );
  }
  if (state === "blocked") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-600/60 bg-slate-800/50 text-slate-500 text-meta" aria-hidden>
        —
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ref-sun/45 bg-ref-sun/12 text-ref-sun text-meta font-semibold" aria-hidden>
      ○
    </span>
  );
}

function ChecklistRow({
  step,
  t,
}: {
  step: MeSettingsTrustChecklistStep;
  t: (key: string) => string;
}) {
  const body = (
    <>
      <StepStatusIcon state={step.state} />
      <span className={TT_ME_SETTINGS_L5.rowBody}>
        <span className="flex flex-wrap items-center gap-2">
          <span className={TT_ME_SETTINGS_L5.rowLabel}>{t(step.labelKey)}</span>
          {step.statusText ? (
            <span
              className={
                step.state === "blocked"
                  ? "rounded-full border border-slate-600/50 bg-slate-800/40 px-2 py-0.5 text-[10px] font-medium text-slate-500"
                  : step.state === "done"
                    ? "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success/90"
                    : "rounded-full border border-ref-sun/22 bg-ref-sun/8 px-2 py-0.5 text-[10px] font-medium text-slate-400"
              }
            >
              {step.statusText}
            </span>
          ) : null}
        </span>
        <span className={TT_ME_SETTINGS_L5.rowDesc}>{t(step.descKey)}</span>
      </span>
    </>
  );

  if (step.state === "action" && step.href) {
    return (
      <Link href={step.href} className={TT_ME_SETTINGS_L5.row} role="listitem">
        {body}
        <svg className={TT_ME_SETTINGS_L5.rowChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    );
  }

  return (
    <div
      className={step.state === "blocked" ? `${TT_ME_SETTINGS_L5.rowStatic} opacity-80` : TT_ME_SETTINGS_L5.rowStatic}
      role="listitem"
      aria-disabled={step.state === "blocked" ? true : undefined}
    >
      {body}
    </div>
  );
}

function PrimaryCtaBlock({
  cta,
  t,
}: {
  cta: MeSettingsTrustPrimaryCta;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  if (cta.kind === "complete") {
    return (
      <div
        className="rounded-xl border border-success/30 bg-success/[0.08] px-4 py-4 sm:px-5 sm:py-5"
        data-tt-me-settings-trust-primary-cta="complete"
      >
        <p className="text-body font-medium text-success">{t(cta.labelKey)}</p>
        <p className="mt-2 text-meta text-slate-400/95">
          <Link
            href={cta.transparencyHref}
            className={`text-cyan-300/90 underline underline-offset-4 hover:text-cyan-100 ${authL5InlineLinkFocusClasses}`}
          >
            {t("me_settings_trust_advanced_transparency_link")}
          </Link>
        </p>
      </div>
    );
  }

  if (cta.kind === "email_resend") {
    return (
      <div
        className={`${TT_ME_SETTINGS_L5.sectionCardInteractive} px-4 py-5 sm:px-6 sm:py-6 space-y-4`}
        data-tt-me-settings-trust-primary-cta="email"
      >
        <p className="text-body font-semibold text-slate-100">{t(cta.labelKey)}</p>
        <MeSettingsResendVerifyEmailPanel embedded />
      </div>
    );
  }

  return (
    <div
      className={`${TT_ME_SETTINGS_L5.sectionCardInteractive} px-4 py-5 sm:px-6 sm:py-6 space-y-4`}
      data-tt-me-settings-trust-primary-cta="link"
    >
      <p className="text-meta text-slate-400/95">{t("me_settings_trust_primary_hint")}</p>
      <Link href={cta.href} className={`${TT_ME_SETTINGS_L5.btnPrimary} justify-center`}>
        {t(cta.labelKey)}
      </Link>
    </div>
  );
}

export function MeSettingsTrustProgressPanel({
  t,
  loading,
  error,
  onRetry,
  progress,
  needsLogin = false,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  progress: MeSettingsTrustProgressView | null;
  needsLogin?: boolean;
}) {
  if (loading) {
    return <p className="text-meta text-slate-400/90">{t("common_loading")}</p>;
  }

  if (error) {
    return (
      <p className={TT_ME_SETTINGS_L5.sectionCallout} role="alert">
        {error}{" "}
        <button type="button" className="text-ref-sun underline" onClick={() => onRetry()}>
          {t("common_retry")}
        </button>
      </p>
    );
  }

  if (needsLogin) {
    return (
      <div
        className={`${TT_ME_SETTINGS_L5.sectionCard} px-4 py-5 sm:px-6 sm:py-6 space-y-3`}
        data-tt-me-settings-trust-login-required="1"
        role="status"
      >
        <p className="text-body font-medium text-slate-100">{t("me_settings_trust_login_required")}</p>
        <p className="text-meta text-slate-400/95 leading-relaxed">{t("me_settings_trust_login_required_hint")}</p>
        <Link
          href="/auth/login?returnUrl=%2Fme%2Fsettings%2Ftrust"
          className={`${TT_ME_SETTINGS_L5.btnPrimary} justify-center`}
        >
          {t("header_login")}
        </Link>
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div className="space-y-6" data-tt-me-settings-trust-progress="1">
      <section aria-labelledby="me-settings-trust-primary-title">
        <h2 id="me-settings-trust-primary-title" className="sr-only">
          {t("me_settings_trust_primary_section_aria")}
        </h2>
        <PrimaryCtaBlock cta={progress.primaryCta} t={t} />
      </section>

      <section className={TT_ME_SETTINGS_L5.section} aria-labelledby="me-settings-trust-progress-title">
        <h2 id="me-settings-trust-progress-title" className={TT_ME_SETTINGS_L5.sectionTitle}>
          {t("me_settings_trust_progress_title")}
        </h2>
        <p className="px-1 text-meta text-slate-500/90 mb-1">
          {progress.showGuideAdmissionSection
            ? t("me_settings_trust_progress_subtitle_guide")
            : t("me_settings_trust_progress_subtitle")}
        </p>
        <ul className={TT_ME_SETTINGS_L5.sectionCard} role="list">
          {progress.checklist.map((step) => (
            <li key={step.id} className="list-none">
              <ChecklistRow step={step} t={t} />
            </li>
          ))}
        </ul>
      </section>

      {progress.showKycDetail ? (
        <section
          id="me-settings-trust-kyc-detail"
          className={TT_ME_SETTINGS_L5.section}
          aria-labelledby="me-settings-trust-kyc-detail-title"
          data-tt-me-settings-kyc-status="1"
        >
          <h2 id="me-settings-trust-kyc-detail-title" className={TT_ME_SETTINGS_L5.sectionTitle}>
            {t("me_settings_trust_kyc_detail_title")}
          </h2>
          <div className={`${TT_ME_SETTINGS_L5.sectionCard} px-4 py-4 sm:px-5 sm:py-5 space-y-2`}>
            <p className="text-meta text-slate-400/95 leading-relaxed">{t("me_kycReservedNote")}</p>
          </div>
        </section>
      ) : null}

      <details className={`${TT_ME_SETTINGS_L5.sectionCard} group px-4 py-3 sm:px-5`} data-tt-me-settings-trust-advanced="1">
        <summary className="cursor-pointer list-none text-small font-medium text-slate-200 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="text-ref-sun/75 group-open:text-ref-sun">{t("me_settings_trust_advanced_title")}</span>
          <span className="mt-1 block text-meta font-normal text-slate-500/95">{t("me_settings_trust_advanced_intro")}</span>
        </summary>
        <ul className="mt-4 space-y-2 border-t border-ref-sun/12 pt-4" role="list">
          <li>
            <Link
              href={progress.transparencyHref}
              className={`text-meta text-cyan-300/90 underline underline-offset-4 hover:text-cyan-100 ${authL5InlineLinkFocusClasses}`}
            >
              {t("me_settings_trust_desc_center")}
            </Link>
          </li>
          <li>
            <Link
              href={progress.securityHref}
              className={`text-meta text-ref-sun/85 underline underline-offset-4 hover:text-[#fde9a8] ${authL5InlineLinkFocusClasses}`}
            >
              {t("me_settings_desc_security")}
            </Link>
          </li>
        </ul>
      </details>
    </div>
  );
}
