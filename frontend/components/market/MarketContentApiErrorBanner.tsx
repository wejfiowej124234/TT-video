"use client";

import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_ERROR_RETRY_BTN, TT_MARKETING_FOCUS_RING_CONSOLE } from "@/lib/marketingUi";

type Props = {
  apiErrorOrders: string | null;
  apiErrorGuides: string | null;
  apiErrorDismissed: boolean;
  setApiErrorDismissed: (v: boolean) => void;
  loadOrders: () => void;
  loadGuides: () => void;
  loadingOrders: boolean;
  loadingGuides: boolean;
};

export function MarketContentApiErrorBanner({
  apiErrorOrders,
  apiErrorGuides,
  apiErrorDismissed,
  setApiErrorDismissed,
  loadOrders,
  loadGuides,
  loadingOrders,
  loadingGuides,
}: Props) {
  const { t } = useTranslation();
  const hasApiError = apiErrorOrders != null || apiErrorGuides != null;
  if (!hasApiError || apiErrorDismissed) return null;

  return (
    <div
      className="mb-4 rounded-[var(--radius-sm)] border border-ink-200/70 bg-bg-console/98 shadow-soft px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0 flex-1 space-y-2">
        {apiErrorOrders != null && apiErrorGuides != null ? (
          <>
            <p className="text-small font-medium text-ink-900">{t("market_apiError_both")}</p>
            <ApiErrorAlert message={apiErrorOrders} />
            <ApiErrorAlert message={apiErrorGuides} />
          </>
        ) : (
          <ApiErrorAlert message={apiErrorOrders ?? apiErrorGuides} />
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            if (apiErrorOrders != null) loadOrders();
            if (apiErrorGuides != null) loadGuides();
          }}
        >
          <button
            type="submit"
            disabled={loadingOrders || loadingGuides}
            className={`${touchTargetLink44Classes} ${TT_MARKETING_ERROR_RETRY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loadingOrders || loadingGuides ? t("common_retrying") : t("common_retry")}
          </button>
        </form>
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            setApiErrorDismissed(true);
          }}
        >
          <button
            type="submit"
            disabled={loadingOrders || loadingGuides}
            aria-busy={loadingOrders || loadingGuides ? true : undefined}
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-60 ${TT_MARKETING_FOCUS_RING_CONSOLE}`}
            aria-label={t("common_closeAlert")}
          >
            ✕
          </button>
        </form>
      </div>
    </div>
  );
}
