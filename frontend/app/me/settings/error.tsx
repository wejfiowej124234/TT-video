"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { ME_SETTINGS_HUB_PATH, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** 设置族错误边界 · L5 暖金暗壳（非 `/me` 默认 cyan 壳） */
export default function MeSettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  const hintId = useId();

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("Me settings error:", error?.message);
    }
  }, [error]);

  return (
    <MeSettingsL5FlowPage
      ariaLabel={t("common_errorTitle")}
      route="settings-error"
      dataAttrs={{ "data-tt-me-settings-route": "error" }}
      showMinimalFooter={false}
    >
      <MeSettingsHubBackLink t={t} />

      <div
        className="auth-l5-glass-surface rounded-xl border border-danger/35 bg-danger/10 px-5 py-6 text-center"
        role="alert"
      >
        <h1 className={TT_AUTH_L5_FORM.titleCompact}>{t("common_errorTitle")}</h1>
        <p className={`${TT_ME_SETTINGS_L5.subtitle} mt-2`}>{t("common_errorMessage")}</p>
        <p id={hintId} className="mt-3 text-meta text-slate-400/95">
          {t("app_error_boundary_retry_hint")}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <form
            className="inline"
            aria-describedby={hintId}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              reset();
            }}
          >
            <button type="submit" className={TT_AUTH_L5_FORM.primaryCta}>
              {t("common_retry")}
            </button>
          </form>
          <Link
            href={ME_SETTINGS_HUB_PATH}
            className={`${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.secondaryButton} inline-flex items-center justify-center`}
          >
            {t("me_settings_back_hub")}
          </Link>
        </div>
        <p className="mt-5 text-meta">
          <Link href="/me/settings/profile" className={`text-ref-sun/85 underline ${authL5InlineLinkFocusClasses}`}>
            {t("me_settings_footer_back_community")}
          </Link>
        </p>
      </div>
    </MeSettingsL5FlowPage>
  );
}
