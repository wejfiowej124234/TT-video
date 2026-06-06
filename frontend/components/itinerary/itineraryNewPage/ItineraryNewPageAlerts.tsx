"use client";

import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { OrderResponse } from "@/components/escrow/EscrowDetail/types";
import { stashEscrowOrderPrefetchForFromOrderDeepLink } from "@/lib/orderEscrowPrefetch";
import { ordersNewHrefForGuide } from "@/lib/ordersGuideDeepLink";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_BTN_WARM_OUTLINE,
  TT_MARKETING_CALLOUT_WARM,
  TT_MARKETING_CONSOLE_INLINE_LINK,
  TT_MARKETING_CONSOLE_LINK_FOCUS,
} from "@/lib/marketingUi";

type TFunc = (key: string, vars?: LocaleInterpolationVars) => string;

const inlineLinkClass = `${touchTargetLink44Classes} ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`;

export type ItineraryNewPageAlertsProps = {
  t: TFunc;
  guideQueryInvalid: boolean;
  draftQueryInvalid: boolean;
  draftHydrateLoading: boolean;
  draftHydrateError: string | null;
  guideQueryOk: boolean;
  guideIdFromQuery: string;
  fromOrderId: string | null;
  fromOrderLoading: boolean;
  fromOrderPrefetchError: string | null;
  fromOrderFullResponse: OrderResponse | null;
};

export function ItineraryNewPageAlerts({
  t,
  guideQueryInvalid,
  draftQueryInvalid,
  draftHydrateLoading,
  draftHydrateError,
  guideQueryOk,
  guideIdFromQuery,
  fromOrderId,
  fromOrderLoading,
  fromOrderPrefetchError,
  fromOrderFullResponse,
}: ItineraryNewPageAlertsProps) {
  return (
    <>
      {guideQueryInvalid ? (
        <div
          className="mt-4 rounded-[var(--radius-sm)] border border-warning/40 bg-warning/10 p-4 text-small text-ink-800"
          role="alert"
        >
          {t("itin_error_invalidGuideQuery")}
        </div>
      ) : null}
      {draftQueryInvalid ? (
        <div
          className="mt-4 rounded-[var(--radius-sm)] border border-warning/40 bg-warning/10 p-4 text-small text-ink-800"
          role="alert"
        >
          {t("itin_error_invalidDraftQuery")}
        </div>
      ) : null}
      {draftHydrateLoading ? (
        <div
          className={`mt-4 rounded-[var(--radius-sm)] border p-4 text-small text-ink-800 ${TT_MARKETING_CALLOUT_WARM}`}
          role="status"
        >
          {t("itin_draftHydrate_loading")}
        </div>
      ) : null}
      {draftHydrateError ? (
        <div className="mt-4">
          <ApiErrorAlert message={draftHydrateError} />
        </div>
      ) : null}
      {guideQueryOk ? (
        <div
          className={`mt-4 rounded-[var(--radius-sm)] border p-4 text-small text-ink-800 ${TT_MARKETING_CALLOUT_WARM}`}
          role="status"
        >
          <p className="font-medium text-ink-900">{t("itin_guideContext_title")}</p>
          <p className="mt-1 text-meta text-ink-600">{t("itin_guideContext_body")}</p>
          <Link
            href={ordersNewHrefForGuide(guideIdFromQuery)}
            className={`mt-3 ${TT_MARKETING_BTN_WARM_OUTLINE} rounded-[var(--radius-sm)]`}
          >
            {t("itin_guideContext_cta")}
          </Link>
        </div>
      ) : null}

      {fromOrderId && (
        <div
          className="mt-4 p-4 rounded-[var(--radius-sm)] border border-cyan-500/40 bg-cyan-500/5 text-small text-slate-800"
          role="status"
        >
          <p>{fromOrderLoading ? t("common_loading") : t("itin_fromOrderHint", { id: fromOrderId })}</p>
          {!fromOrderLoading && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href={`/escrow/${encodeURIComponent(fromOrderId)}`}
                onClick={() =>
                  stashEscrowOrderPrefetchForFromOrderDeepLink(fromOrderId, fromOrderFullResponse, "escrow")
                }
                className={inlineLinkClass}
              >
                {t("itin_backToOrder")}
              </Link>
              <Link
                href={`/pay?orderId=${encodeURIComponent(fromOrderId)}`}
                onClick={() =>
                  stashEscrowOrderPrefetchForFromOrderDeepLink(fromOrderId, fromOrderFullResponse, "pay")
                }
                className={inlineLinkClass}
              >
                {t("orders_payHub")}
              </Link>
            </div>
          )}
          {fromOrderPrefetchError && !fromOrderLoading && (
            <div className="mt-3">
              <ApiErrorAlert message={fromOrderPrefetchError} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
