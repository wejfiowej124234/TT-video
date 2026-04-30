"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  errorBoundaryMotionSafeClasses,
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type TitleKey =
  | "governance_delegate_title"
  | "governance_distribution_accruals_detail_title"
  | "governance_distribution_accruals_title"
  | "governance_proposal_detail_title"
  | "governance_proposals_title"
  | "governance_fee_routes_title"
  | "governance_params_title"
  | "governance_claim_title"
  | "governance_vault_forwards_title";

/** 治理子路由共用错误壳；不向用户展示 `error.message`（96-13 13.8） */
export default function GovernanceSubrouteError({
  error,
  reset,
  titleKey,
  dataTtRoot,
  logLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  titleKey: TitleKey;
  dataTtRoot: string;
  logLabel: string;
}) {
  const { t } = useTranslation();
  const appErrorRetryHintId = useId();
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error(`${logLabel} segment error:`, error?.message);
    }
  }, [error, logLabel]);

  return (
    <main
      className={`mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 bg-bg-main ${errorBoundaryMotionSafeClasses}`}
      role="alert"
      data-tt-error-boundary-root={dataTtRoot}
    >
      <div
        className={`rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft ${errorBoundaryMotionSafeClasses}`}
      >
        <p className="text-meta font-medium text-ink-500 mb-1">{t(titleKey)}</p>
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
              aria-label={t("common_retry")}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-400 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/"
            aria-label={t("governance_backHome")}
            className={`rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {t("governance_backHome")}
          </Link>
        </div>
        <p className="mt-5 text-meta text-ink-600 text-center flex flex-wrap justify-center gap-x-2 gap-y-1">
          <Link href="/governance" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("governance_title")}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/disputes" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("governance_disputes")}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/pay" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("header_payHub")}
          </Link>
        </p>
        <nav
          className="mt-4 flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-ink-200 pt-4 text-meta text-ink-600"
          aria-label={t("governance_error_adminOpsNav_aria")}
        >
          <GovernanceOpsAdminLinks />
        </nav>
        <ProductCrossNav
          ariaLabelKey="app_error_relatedNav_aria"
          showGuides
          errorBoundaryCrossNavMarker
          className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-ink-200 pt-5 text-meta text-ink-600"
        />
      </div>
    </main>
  );
}
