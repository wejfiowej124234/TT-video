"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { AUTH_LOGIN_RETURN_HOME, AUTH_REGISTER_RETURN_HOME } from "@/lib/headerLoginHref";

/** Auth 子段错误壳；与 `app/auth/error.tsx` 同 i18n；不向用户展示 `error.message`（96-13 13.8） */
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
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 bg-bg-main"
      role="alert"
      data-tt-auth-root="1"
      data-tt-auth-route="error"
      data-tt-auth-surface="auth_route_error_boundary"
      data-tt-error-boundary-root={dataTtRoot}
    >
      <div className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft">
        <p className="text-meta font-medium text-ink-500 mb-1">
          {t("auth_login_title")} / {t("auth_register_title")}
        </p>
        <h1 className="text-h4 font-semibold text-ink-900">{t("common_errorTitle")}</h1>
        <p className="mt-2 text-body text-ink-600">{t("common_errorMessage")}</p>
        <p id={appErrorRetryHintId} className="mt-3 text-meta text-ink-600 leading-relaxed text-center">
          {t("app_error_boundary_retry_hint")}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
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
              className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-400 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/"
            aria-label={t("common_backToHome")}
            className={`rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {t("common_backToHome")}
          </Link>
        </div>
        <p className="mt-5 text-meta text-ink-600 text-center flex flex-wrap justify-center gap-x-2 gap-y-1">
          <Link href={AUTH_LOGIN_RETURN_HOME} className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("auth_login_title")}
          </Link>
          <span aria-hidden>·</span>
          <Link href={AUTH_REGISTER_RETURN_HOME} className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("auth_register_title")}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/pay" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("header_payHub")}
          </Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="app_error_relatedNav_aria"
          showGuides
          authShellCrossNavMarker
          className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-ink-200 pt-5 text-meta text-ink-600"
        />
      </div>
    </main>
  );
}
