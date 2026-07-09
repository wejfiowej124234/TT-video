"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  AUTH_LOGIN_GOVERNANCE_REMEDIATION_ITEMS,
  authLoginGovernanceRemediationProgressSummary,
  type AuthLoginGovernanceRemediationStatus,
} from "@/lib/auth/authLoginGovernanceRemediationModel";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const STATUS_LOCALE: Record<AuthLoginGovernanceRemediationStatus, string> = {
  done: "auth_login_governance_remediation_status_done",
  in_progress: "auth_login_governance_remediation_status_in_progress",
  pending: "auth_login_governance_remediation_status_pending",
};

/** 登录页 · 治理整改进度只读条（① · AUTH-LOGIN-UI-FREEZE） */
export default function AuthLoginGovernanceRemediationProgress() {
  const { t } = useTranslation();
  const { done, total, percent } = authLoginGovernanceRemediationProgressSummary();

  return (
    <section
      className="mt-6 w-full max-w-md rounded-[var(--radius-md)] border border-white/10 bg-slate-950/50 px-4 py-3 text-small text-slate-300 backdrop-blur-sm"
      data-tt-auth-surface="login_governance_remediation"
      aria-label={t("auth_login_governance_remediation_title")}
    >
      <h2 className="text-body font-medium text-slate-100">{t("auth_login_governance_remediation_title")}</h2>
      <p className="mt-1 text-small text-slate-400">{t("auth_login_governance_remediation_lead")}</p>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-small text-slate-300">{t("auth_login_governance_remediation_progress_label")}</span>
        <span className="font-mono text-small text-ref-sun/90">
          {t("auth_login_governance_remediation_progress_value", { done, total, percent })}
        </span>
      </div>

      <ul className="mt-3 space-y-1.5" role="list">
        {AUTH_LOGIN_GOVERNANCE_REMEDIATION_ITEMS.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 text-small">
            <span className="text-slate-300">{t(item.localeKey)}</span>
            <span className="shrink-0 text-xs text-slate-500">{t(STATUS_LOCALE[item.status])}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-slate-500" role="note">
        {t("auth_login_governance_remediation_phase_note")}
      </p>

      <Link
        href="/governance/params"
        className={`mt-3 inline-flex text-small text-ref-sun/90 underline-offset-2 hover:underline ${touchTargetLink44Classes}`}
      >
        {t("auth_login_governance_remediation_params_link")}
      </Link>
    </section>
  );
}
