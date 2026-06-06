"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { meIdentitiesL5MainDataAttrs, TT_ME_IDENTITIES_L5 } from "@/lib/me/meIdentitiesL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const footerLinkClass = `${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`;

/** `/me/identities` 段错误 L5 壳（暖金 · 与 auth error 同族）。 */
export default function MeIdentitiesRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  const retryHintId = useId();

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("MeIdentitiesRouteError:", error?.message, error?.digest);
    }
  }, [error]);

  return (
    <main
      className={TT_ME_IDENTITIES_L5.pageShell}
      role="alert"
      data-tt-me-identities-surface="route_error"
      {...meIdentitiesL5MainDataAttrs(true)}
    >
      <AuthL5PageBackdrop />
      <div className={TT_ME_IDENTITIES_L5.inner}>
        <AuthL5Card surface="me_identities_error_l5_card" maxWidth="wide" className="!max-w-lg mx-auto">
          <p className={TT_AUTH_L5_FORM.eyebrow}>{t("me_identities_hub_eyebrow")}</p>
          <h1 className={TT_AUTH_L5_FORM.titleCompact}>{t("common_errorTitle")}</h1>
          <p className={TT_AUTH_L5_FORM.bodyText}>{t("common_errorMessage")}</p>
          <p id={retryHintId} className={`${TT_AUTH_L5_FORM.metaText} text-left sm:text-center`}>
            {t("app_error_boundary_retry_hint")}
          </p>
          <div className={TT_AUTH_L5_FORM.errorPageActions}>
            <form
              className="inline"
              aria-describedby={retryHintId}
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                reset();
              }}
            >
              <button
                type="submit"
                data-tt-me-identities-error-retry="1"
                aria-label={t("common_retry")}
                className={`${TT_AUTH_L5_FORM.primaryCta} !w-auto min-w-[8.5rem] px-6`}
              >
                {t("common_retry")}
              </button>
            </form>
            <Link href="/me/settings/profile" aria-label={t("me_identities_back_community")} className={TT_AUTH_L5_FORM.secondaryButton}>
              {t("me_identities_back_community")}
            </Link>
          </div>
          <p className={TT_AUTH_L5_FORM.errorPageLinks}>
            <Link href="/me/identities" className={footerLinkClass}>
              {t("header_multiIdentity")}
            </Link>
            <span className="text-ref-sun/30" aria-hidden>
              ·
            </span>
            <Link href="/auth/login" className={footerLinkClass}>
              {t("auth_login_title")}
            </Link>
          </p>
        </AuthL5Card>
        <AuthL5CrossNavFooter />
      </div>
    </main>
  );
}
