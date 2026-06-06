"use client";

import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { TT_MARKETING_ERROR_RETRY_BTN } from "@/lib/marketingUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export function OrdersListAlertsSection({
  t,
  orderActionError,
  setOrderActionError,
  loading,
  expectOrderId,
  expectOrderBanner,
  listSyncing,
  refreshOrders,
}: {
  t: (key: string) => string;
  orderActionError: string | null;
  setOrderActionError: (v: string | null) => void;
  loading: boolean;
  expectOrderId: string;
  expectOrderBanner: boolean;
  listSyncing: boolean;
  refreshOrders: (options?: { silent?: boolean }) => void;
}) {
  return (
    <>
      {orderActionError ? (
        <div className={TT_ORDERS_LIST_L5.alertPanel} role="alert" aria-live="polite">
          <ApiErrorAlert message={orderActionError} tone="dark" />
          <div className="flex flex-wrap items-center gap-2">
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                refreshOrders();
              }}
            >
              <button
                type="submit"
                data-tt-orders-inline-action-retry="1"
                disabled={loading}
                aria-busy={loading ? true : undefined}
                className={`${touchTargetLink44Classes} ${TT_MARKETING_ERROR_RETRY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? t("common_retrying") : t("common_retry")}
              </button>
            </form>
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setOrderActionError(null);
              }}
            >
              <button type="submit" className={TT_ORDERS_LIST_L5.alertDismissBtn} aria-label={t("common_closeAlert")}>
                ✕
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {expectOrderId && expectOrderBanner ? (
        <div className={TT_ORDERS_LIST_L5.expectBannerPanel} role="status" aria-live="polite">
          <p className={`text-small ${TT_ORDERS_LIST_L5.hintText}`}>{t("orders_list_expectNewOrder_banner")}</p>
          <form
            className="mt-3 inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (listSyncing) return;
              refreshOrders({ silent: true });
            }}
          >
            <button
              type="submit"
              data-tt-orders-expect-order-refresh="1"
              disabled={listSyncing}
              aria-busy={listSyncing ? true : undefined}
              className={TT_ORDERS_LIST_L5.inlineRefreshBtn}
            >
              {listSyncing ? t("common_retrying") : t("orders_list_expectNewOrder_refresh")}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
