"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  ACCOUNT_BTN_PRIMARY_CLASS,
  ACCOUNT_BTN_SECONDARY_CLASS,
  accountFooterLinkClass,
  TT_MARKETING_ACCOUNT_ERROR_CARD,
  TT_MARKETING_ACCOUNT_ERROR_MAIN,
} from "@/lib/accountUi";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

/** `/me/onboarding` 段错误 Console L5 壳（与 account 子页同族，非 Auth 暗玻璃）。 */
export default function MeOnboardingRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  const retryHintId = useId();
  const footerLinkClass = accountFooterLinkClass();

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("MeOnboardingRouteError:", error?.message, error?.digest);
    }
  }, [error]);

  return (
    <main
      className={TT_MARKETING_ACCOUNT_ERROR_MAIN}
      role="alert"
      data-tt-me-onboarding-surface="route_error"
      {...TT_ME_ONBOARDING_L5.pageAttrs}
    >
      <div className={`${TT_MARKETING_ACCOUNT_ERROR_CARD} w-full max-w-lg text-center`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          {t("me_onboarding_title")}
        </p>
        <h1 className="mt-2 text-h4 font-semibold text-ink-900">{t("common_errorTitle")}</h1>
        <p className="mt-2 text-small text-ink-700">{t("common_errorMessage")}</p>
        <p id={retryHintId} className="mt-3 text-meta text-ink-600">
          {t("app_error_boundary_retry_hint")}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
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
              className={ACCOUNT_BTN_PRIMARY_CLASS}
              data-tt-me-onboarding-error-retry="1"
              aria-label={t("common_retry")}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link href="/me/identities" className={`${ACCOUNT_BTN_SECONDARY_CLASS} no-underline`}>
            {t("me_onboarding_backIdentities")}
          </Link>
        </div>
        <ProductCrossNav
          ariaLabelKey="me_onboarding_relatedNav_aria"
          showGuides
          hideFeeRouterLinks
          className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-ink-200 pt-5 text-meta text-ink-500"
          linkClassName={footerLinkClass}
        />
      </div>
    </main>
  );
}
