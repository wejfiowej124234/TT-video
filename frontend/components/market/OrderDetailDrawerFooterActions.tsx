"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import {
  marketDetailDrawerAccentBlockLink,
  marketDetailDrawerBlockLink,
  marketDetailDrawerPrimaryCta,
} from "@/components/market/marketDetailDrawerClasses";
import { trackMarketEvent } from "@/lib/analytics";
import { stashEscrowOrderPrefetchFromDetailDrawer } from "@/lib/orderEscrowPrefetch";
import type { OnConfirmAccept, OrderDetailItem } from "./orderDetailDrawerModel";

export function OrderDetailDrawerFooterActions({
  orderId,
  displayOrder,
  t,
  onConfirmAccept,
  onAcceptSubmit,
  acceptLoading,
  acceptError,
  showParticipantEscrowPay = false,
}: {
  orderId: string;
  displayOrder: OrderDetailItem;
  t: (key: string) => string;
  onConfirmAccept?: OnConfirmAccept;
  onAcceptSubmit: (e: FormEvent<HTMLFormElement>) => void;
  acceptLoading: boolean;
  acceptError: string | null;
  /** P0：仅 GET /orders/:id 参与方成功后为 true */
  showParticipantEscrowPay?: boolean;
}) {
  const stashDrawerEscrowPayPrefetch = () => {
    if (!showParticipantEscrowPay) return;
    stashEscrowOrderPrefetchFromDetailDrawer(displayOrder);
  };

  return (
    <>
      <p className="text-small text-slate-400">{t("order_detail_guideCta")}</p>
      {acceptError && (
        <p className="text-small text-danger" role="alert">
          {acceptError}
        </p>
      )}
      <div className="flex flex-col gap-2 pt-2">
        {onConfirmAccept &&
          (displayOrder.status === "draft" ||
            displayOrder.status === "created" ||
            displayOrder.status === "open") && (
            <form className="w-full" onSubmit={onAcceptSubmit}>
              <button
                type="submit"
                disabled={acceptLoading}
                className={marketDetailDrawerPrimaryCta}
                aria-label={t("order_detail_confirmAccept")}
                aria-busy={acceptLoading ? true : undefined}
              >
                {acceptLoading ? t("common_submitting") : t("order_detail_confirmAccept")}
              </button>
            </form>
          )}
        {showParticipantEscrowPay ? (
          <Link
            data-tt-order-drawer-escrow="1"
            href={`/escrow/${encodeURIComponent(orderId)}`}
            onClick={() => {
              trackMarketEvent("market_order_drawer_escrow_click", { orderId: displayOrder.id });
              stashDrawerEscrowPayPrefetch();
            }}
            className={marketDetailDrawerBlockLink}
          >
            {t("order_detail_cta")}
          </Link>
        ) : (
          <p className="text-small text-slate-400" role="status" data-tt-order-drawer-escrow-gated="1">
            {t("order_detail_escrow_gated_hint")}
          </p>
        )}
        {showParticipantEscrowPay && orderLikeMayOnchainDeposit(displayOrder) ? (
          <Link
            data-tt-order-drawer-pay="1"
            href={`/pay?orderId=${encodeURIComponent(displayOrder.id)}`}
            onClick={() => {
              trackMarketEvent("market_order_drawer_pay_click", { orderId: displayOrder.id });
              stashDrawerEscrowPayPrefetch();
            }}
            className={marketDetailDrawerAccentBlockLink}
          >
            {t("orders_payHub")}
          </Link>
        ) : null}
      </div>
    </>
  );
}
