import Link from "next/link";

import ApiErrorAlert from "@/components/ApiErrorAlert";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  escrowRateFooterLinkClass,
  escrowRateOutlineBtnClass,
  escrowRateSolidBtnClass,
  TT_ESCROW_RATE_PAGE_SHELL,
} from "@/lib/escrowRateL5";

type T = (key: string) => string;

export function EscrowRatePageLoadErrorView({
  t,
  orderLoadError,
  onRetry,
}: {
  t: T;
  orderLoadError: string;
  onRetry: () => void;
}) {
  return (
    <main
      className={TT_ESCROW_RATE_PAGE_SHELL}
      aria-label={t("rate_pageTitle")}
      data-tt-escrow-rate-page="1"
      data-tt-escrow-rate-l5="1"
    >
      <h1 className="sr-only">{t("escrow_loadFailed")}</h1>
      <div className="container py-8 md:py-12 max-w-lg">
        <ApiErrorAlert message={orderLoadError} tone="dark" />
        <div className="mt-4 flex flex-wrap gap-3">
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onRetry();
            }}
          >
            <button type="submit" className={escrowRateSolidBtnClass}>
              {t("common_retry")}
            </button>
          </form>
          <Link href="/orders" className={`inline-flex items-center ${escrowRateOutlineBtnClass}`}>
            {t("escrow_backToOrders")}
          </Link>
        </div>
        <ProductCrossNav
          ariaLabelKey="rate_relatedNav_aria"
          showGuides
          className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-slate-300"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center ${escrowRateFooterLinkClass}`}
        />
      </div>
    </main>
  );
}
