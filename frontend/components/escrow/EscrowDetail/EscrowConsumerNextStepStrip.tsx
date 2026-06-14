"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { resolveEscrowConsumerNextStepKey, type EscrowConsumerNextStepInput } from "@/lib/escrowConsumerL5Model";
import { escrowProtocolMetaClass, TT_ESCROW_PROTOCOL_PANEL } from "@/lib/escrowProtocolUi";

export default function EscrowConsumerNextStepStrip(input: EscrowConsumerNextStepInput) {
  const { t } = useTranslation();
  const messageKey = resolveEscrowConsumerNextStepKey(input);

  return (
    <div
      className={`${TT_ESCROW_PROTOCOL_PANEL} px-4 py-3`}
      role="status"
      aria-live="polite"
      data-tt-escrow-consumer-next-step="1"
    >
      <p className={`${escrowProtocolMetaClass} m-0`}>
        <span className="font-semibold text-ref-sun/90">{t("escrow_consumer_next_label")}</span>{" "}
        {t(messageKey)}
      </p>
    </div>
  );
}
