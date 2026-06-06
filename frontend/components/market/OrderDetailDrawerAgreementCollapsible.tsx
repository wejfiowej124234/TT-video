"use client";

import { type Dispatch, type SetStateAction } from "react";
import {
  marketDetailDrawerAgreementBody,
  marketDetailDrawerAgreementToggle,
  marketDetailDrawerMeta,
} from "@/components/market/marketDetailDrawerClasses";

export function OrderDetailDrawerAgreementCollapsible({
  agreementOpen,
  setAgreementOpen,
  agreementHeadingId,
  agreementBodyId,
  t,
  orderCurrency,
}: {
  agreementOpen: boolean;
  setAgreementOpen: Dispatch<SetStateAction<boolean>>;
  agreementHeadingId: string;
  agreementBodyId: string;
  t: (key: string) => string;
  orderCurrency: string;
}) {
  return (
    <section aria-labelledby={agreementHeadingId}>
      <button
        type="button"
        onClick={() => setAgreementOpen((o) => !o)}
        className={marketDetailDrawerAgreementToggle}
        aria-expanded={agreementOpen}
        aria-controls={agreementBodyId}
        id={agreementHeadingId}
        aria-label={agreementOpen ? t("order_detail_agreementCollapse") : t("order_detail_agreementExpand")}
      >
        {t("order_detail_agreementTitle")}
        <span className="text-slate-400" aria-hidden="true">
          {agreementOpen ? "▼" : "▶"}
        </span>
      </button>
      {!agreementOpen && (
        <p className={`${marketDetailDrawerMeta} mt-1`} aria-hidden="true">
          {t("order_detail_agreementCollapsedHint")}
        </p>
      )}
      <div id={agreementBodyId} hidden={!agreementOpen} className={marketDetailDrawerAgreementBody}>
        <p>{t("order_detail_payToken").replace("{{currency}}", orderCurrency)}</p>
        <p>{t("order_detail_platformFee")}</p>
        <p>{t("order_detail_snapshotHash")}</p>
      </div>
    </section>
  );
}
