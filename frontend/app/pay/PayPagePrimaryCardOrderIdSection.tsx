"use client";

import Link from "next/link";
import { PAY_ORDER_ID_UUID_RE } from "@/lib/payOrderIdSource";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  payHubDividerClass,
  payHubInputClass,
  payHubMetaClass,
  payHubPrimaryCtaClass,
  payHubSecondaryCtaClass,
} from "@/lib/pay/payHubL5";
import type { PayPageViewModel } from "./usePayPage";

export function PayPagePrimaryCardOrderIdSection({ vm }: { vm: PayPageViewModel }) {
  const {
    t,
    emphasizeEscrowHub,
    escrowHref,
    stashEscrowNavPrefetch,
    payOrderInputId,
    orderIdInput,
    syncOrderIdQuery,
    orderIdInvalidHintId,
    awaitingOrderSlice,
  } = vm;
  return (
    <div className={`mt-8 ${payHubDividerClass} pt-6`}>
      <label htmlFor={payOrderInputId} className={`block text-small font-medium text-slate-200`}>
        {t("pay_orderIdLabel")}
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          id={payOrderInputId}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={t("pay_orderIdPlaceholder")}
          value={orderIdInput}
          onChange={(e) => syncOrderIdQuery(e.target.value)}
          className={`w-full ${payHubInputClass}`}
          aria-busy={awaitingOrderSlice ? true : undefined}
          aria-invalid={orderIdInput.length > 0 && !PAY_ORDER_ID_UUID_RE.test(orderIdInput.trim())}
          aria-describedby={
            orderIdInput.length > 0 && !PAY_ORDER_ID_UUID_RE.test(orderIdInput.trim())
              ? orderIdInvalidHintId
              : undefined
          }
        />
        {escrowHref ? (
          <Link
            href={escrowHref}
            onClick={stashEscrowNavPrefetch}
            className={
              emphasizeEscrowHub
                ? `${touchTargetLink44Classes} shrink-0 ${payHubSecondaryCtaClass}`
                : `${touchTargetLink44Classes} shrink-0 text-center ${payHubPrimaryCtaClass}`
            }
          >
            {emphasizeEscrowHub ? t("pay_ctaEscrowPrimary") : t("pay_ctaEscrow")}
          </Link>
        ) : null}
      </div>
      {orderIdInput.length > 0 && !PAY_ORDER_ID_UUID_RE.test(orderIdInput.trim()) ? (
        <p id={orderIdInvalidHintId} className={`${payHubMetaClass} mt-2`} role="alert">
          {t("pay_orderIdInvalidHint")}
        </p>
      ) : null}
    </div>
  );
}
