"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { escrowProtocolMetaClass, TT_ESCROW_PROTOCOL_PANEL } from "@/lib/escrowProtocolUi";

export default function EscrowConsumerFundSafetyStrip() {
  const { t } = useTranslation();

  return (
    <div
      className={`${TT_ESCROW_PROTOCOL_PANEL} px-4 py-3 border-ref-sun/20`}
      role="note"
      data-tt-escrow-consumer-fund-safety="1"
    >
      <p className="m-0 text-small font-semibold text-ref-sun/90">{t("escrow_consumer_fundSafety_title")}</p>
      <p className={`${escrowProtocolMetaClass} m-0 mt-1`}>{t("escrow_consumer_fundSafety_body")}</p>
    </div>
  );
}
