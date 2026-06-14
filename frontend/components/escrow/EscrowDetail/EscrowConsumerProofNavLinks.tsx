"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  escrowConsumerChainHref,
  escrowConsumerProofHref,
} from "@/lib/escrowConsumerL5Model";
import { escrowProtocolFooterActionClass } from "@/lib/escrowProtocolUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export default function EscrowConsumerProofNavLinks({ orderId }: { orderId: string }) {
  const { t } = useTranslation();

  return (
    <nav
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-small print:hidden"
      aria-label={t("escrow_consumer_proofNav_aria")}
      data-tt-escrow-consumer-proof-nav="1"
    >
      <Link
        href={escrowConsumerProofHref(orderId)}
        className={`${touchTargetLink44Classes} inline-flex items-center ${escrowProtocolFooterActionClass}`}
      >
        {t("escrow_consumer_link_proof")}
      </Link>
      <Link
        href={escrowConsumerChainHref(orderId)}
        className={`${touchTargetLink44Classes} inline-flex items-center ${escrowProtocolFooterActionClass}`}
      >
        {t("escrow_consumer_link_chain")}
      </Link>
    </nav>
  );
}
