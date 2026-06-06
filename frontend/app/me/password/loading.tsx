"use client";

import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { useTranslation } from "@/components/LocaleProvider";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

export default function MePasswordLoading() {
  const { t } = useTranslation();
  return (
    <MeSettingsL5FlowPage ariaLabel={t("mePassword_title")} route="password-loading">
      <div
        className={`${TT_AUTH_L5_FORM.card} auth-l5-glass-surface max-w-lg w-full p-7`}
        role="status"
        aria-busy="true"
        aria-label={t("mePassword_title")}
      >
        <div className="space-y-4" aria-hidden>
          <div className="h-8 w-40 rounded-lg bg-ref-sun/15 animate-pulse" />
          <div className="h-11 w-full rounded-xl bg-ref-sun/10 animate-pulse" />
          <div className="h-11 w-full rounded-xl bg-ref-sun/10 animate-pulse" />
          <div className="h-11 w-full rounded-xl bg-ref-sun/10 animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-ref-sun/25 animate-pulse" />
        </div>
      </div>
    </MeSettingsL5FlowPage>
  );
}
