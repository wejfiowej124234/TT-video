"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { GOV_PARAMS_L5 } from "@/lib/governance/governanceParamsPageL5";
import {
  GOVERNANCE_PARAMS_SECTION_IDS,
  useGovernanceParamsActiveSection,
} from "@/app/governance/params/useGovernanceParamsActiveSection";

export function GovernanceParamsPercentBar({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  const labelId = useId();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      <div className={`mb-1.5 flex items-baseline justify-between gap-3 ${GOV_PARAMS_L5.cardHint}`}>
        <span id={labelId}>{label}</span>
        <span className="font-semibold tabular-nums text-ref-sun/95">{clamped}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full border border-white/10 bg-slate-950/70"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-labelledby={labelId}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-ref-sun/85 to-ref-coral/75 motion-reduce:transition-none transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function GovernanceParamsSectionNav({
  t,
  className = "",
}: {
  t: (key: string) => string;
  className?: string;
}) {
  const activeSection = useGovernanceParamsActiveSection();
  const links = [
    { id: GOVERNANCE_PARAMS_SECTION_IDS[0], label: t("governance_params_section_nav_overview") },
    { id: GOVERNANCE_PARAMS_SECTION_IDS[1], label: t("governance_params_section_nav_allocation") },
    { id: GOVERNANCE_PARAMS_SECTION_IDS[2], label: t("governance_params_section_nav_countries") },
  ] as const;

  return (
    <nav
      className={`sticky top-3 z-20 flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-white/10 bg-slate-950/80 p-2 backdrop-blur-md ${className}`.trim()}
      aria-label={t("governance_params_section_nav_aria")}
      data-tt-governance-params-section-nav="1"
    >
      {links.map((link) => {
        const isActive = activeSection === link.id;
        return (
          <a
            key={link.id}
            href={`#${link.id}`}
            aria-current={isActive ? "location" : undefined}
            data-tt-governance-params-section-nav-link={link.id}
            data-tt-governance-params-section-nav-active={isActive ? "1" : "0"}
            className={`inline-flex min-h-[40px] items-center rounded-full border px-3.5 py-1.5 text-small font-medium transition ${GOV_PARAMS_L5.linkFocus} ${
              isActive
                ? "border-ref-sun/45 bg-ref-sun/[0.14] text-ref-sun/95 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]"
                : "border-white/12 bg-slate-950/55 text-slate-200 hover:border-ref-sun/35 hover:bg-ref-sun/[0.08] hover:text-ref-sun/95"
            }`}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}

export function GovernanceParamsRetryButton({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${GOV_PARAMS_L5.retryBtn} ${className}`.trim()}
      data-tt-governance-params-retry="1"
    >
      {label}
    </button>
  );
}

export function GovernanceParamsTechnicalDetails({
  t,
  children,
  className = "",
}: {
  t: (key: string) => string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={`${GOV_PARAMS_L5.accordion} ${className}`.trim()} data-tt-governance-params-technical="1">
      <summary className={`${GOV_PARAMS_L5.accordionSummary} hover:bg-ref-sun/[0.06]`}>
        {t("governance_params_technical_toggle")}
      </summary>
      <div className={`border-t border-white/10 px-4 pb-4 pt-3 ${GOV_PARAMS_L5.metaNote}`}>{children}</div>
    </details>
  );
}

export function GovernanceParamsChecksumDetails({
  t,
  children,
  className = "",
}: {
  t: (key: string) => string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details
      className={`${GOV_PARAMS_L5.accordion} ${className}`.trim()}
      data-tt-governance-params-checksums="1"
    >
      <summary className={`${GOV_PARAMS_L5.accordionSummary} hover:bg-ref-sun/[0.06]`}>
        {t("governance_params_checksum_toggle")}
      </summary>
      <div className={`border-t border-white/10 px-4 pb-4 pt-3 ${GOV_PARAMS_L5.metaNote}`}>{children}</div>
    </details>
  );
}

export function GovernanceParamsStewardBackFromQuery({
  t,
  show,
}: {
  t: (key: string) => string;
  show: boolean;
}) {
  if (!show) return null;
  return (
    <div className="mb-4" data-tt-steward-subpage-back-workbench="1">
      <Link href="/governance?view=region" className={GOV_PARAMS_L5.inlineLink}>
        ← {t("steward_workbench_subpage_back")}
      </Link>
    </div>
  );
}
