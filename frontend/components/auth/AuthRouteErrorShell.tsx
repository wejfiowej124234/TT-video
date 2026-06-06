"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import AuthShellCrossNav from "@/components/auth/AuthShellCrossNav";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_AUTH_L5_CROSS_NAV_LABEL, TT_AUTH_L5_CROSS_NAV_SHELL, TT_AUTH_L5_PAGE_COLUMN, TT_AUTH_L5_PAGE_SHELL } from "@/lib/auth/authL5Shell";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AUTH_LOGIN_RETURN_HOME, AUTH_REGISTER_RETURN_HOME } from "@/lib/headerLoginHref";

const footerLinkClass = `${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`;

/** Auth 子段错误壳 L5；与 `app/auth/error.tsx` 同 i18n；不向用户展示 `error.message`（96-13 13.8） */
export default function AuthRouteErrorShell({
  error,
  reset,
  dataTtRoot,
  logLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  dataTtRoot: string;
  logLabel: string;
}) {
  const { t } = useTranslation();
  const appErrorRetryHintId = useId();
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error(`${logLabel}:`, error?.message, error?.digest);
    }
  }, [error, logLabel]);

  return (
    <main
      className={TT_AUTH_L5_PAGE_SHELL}
      role="alert"
      data-tt-auth-root="1"
      data-tt-auth-route="error"
      data-tt-auth-visual="l5"
      data-tt-auth-surface="auth_route_error_boundary"
      data-tt-error-boundary-root={dataTtRoot}
    >
      <AuthL5PageBackdrop />
      <div className={`${TT_AUTH_L5_PAGE_COLUMN} gap-8`}>
        <AuthL5Card surface="auth_error_l5_card" maxWidth="narrow">
          <p className={TT_AUTH_L5_FORM.eyebrow}>
            {t("auth_login_title")} / {t("auth_register_title")}
          </p>
          <h1 className={TT_AUTH_L5_FORM.titleCompact}>{t("common_errorTitle")}</h1>
          <p className={TT_AUTH_L5_FORM.bodyText}>{t("common_errorMessage")}</p>
          <p id={appErrorRetryHintId} className={`${TT_AUTH_L5_FORM.metaText} text-center`}>
            {t("app_error_boundary_retry_hint")}
          </p>
          <div className={TT_AUTH_L5_FORM.errorPageActions}>
            <form
              className="inline"
              aria-describedby={appErrorRetryHintId}
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                reset();
              }}
            >
              <button
                type="submit"
                data-tt-auth-segment-error-boundary-retry="1"
                aria-label={t("common_retry")}
                className={`${TT_AUTH_L5_FORM.primaryCta} !w-auto min-w-[8.5rem] px-6`}
              >
                {t("common_retry")}
              </button>
            </form>
            <Link href="/" aria-label={t("common_backToHome")} className={TT_AUTH_L5_FORM.secondaryButton}>
              {t("common_backToHome")}
            </Link>
          </div>
          <p className={TT_AUTH_L5_FORM.errorPageLinks}>
            <Link href={AUTH_LOGIN_RETURN_HOME} className={footerLinkClass}>
              {t("auth_login_title")}
            </Link>
            <span className="text-ref-sun/30" aria-hidden>
              ·
            </span>
            <Link href={AUTH_REGISTER_RETURN_HOME} className={footerLinkClass}>
              {t("auth_register_title")}
            </Link>
            <span className="text-ref-sun/30" aria-hidden>
              ·
            </span>
            <Link href="/pay" className={footerLinkClass}>
              {t("header_payHub")}
            </Link>
          </p>
        </AuthL5Card>
        <div className={TT_AUTH_L5_CROSS_NAV_SHELL} data-tt-auth-surface="login_site_cross_nav">
          <p className={TT_AUTH_L5_CROSS_NAV_LABEL}>{t("auth_login_siteNav_label")}</p>
          <AuthShellCrossNav variant="darkL5" />
        </div>
      </div>
    </main>
  );
}
