"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { allowChainOffMockPayUi } from "@/lib/travelTrustUiGuards";
import {
  escrowExperienceMetaClass,
  escrowExperiencePrimaryCtaClass,
} from "@/lib/escrowExperienceUi";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export interface EscrowDraftPayStepCardProps {
  orderId: string;
  orderState: string;
  mockPayEnabled: boolean;
}

/**
 * ① 草稿 Journey 步 3：确认终版后的付款引导（非 ② 测试网真 PSP / 链上 deposit）
 */
export default function EscrowDraftPayStepCard({
  orderId,
  orderState,
  mockPayEnabled,
}: EscrowDraftPayStepCardProps) {
  const { t } = useTranslation();
  const st = orderState.toLowerCase();
  const accepted = st === "accepted";
  const showMockHint = allowChainOffMockPayUi() && mockPayEnabled;

  return (
    <section
      className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-ref-sun/10 p-4 space-y-3"
      role="region"
      aria-labelledby="escrow-draft-pay-heading"
    >
      <h2 id="escrow-draft-pay-heading" className="text-small font-semibold text-ref-sun/95 m-0">
        {t("escrow_draftPay_step3_title")}
      </h2>
      <p className={`${escrowExperienceMetaClass} m-0`}>
        {accepted
          ? t("escrow_draftPay_readyBody")
          : t("escrow_draftPay_waitAcceptBody")}
      </p>
      {showMockHint ? (
        <p className="m-0 text-meta text-white/55">{t("escrow_draftPay_mockHint")}</p>
      ) : null}
      <Link
        href={`/pay?orderId=${encodeURIComponent(orderId)}`}
        onClick={() => stashEscrowOrderPrefetchForOrderIdNav(orderId, "pay")}
        className={`${escrowExperiencePrimaryCtaClass} inline-flex justify-center text-center ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`}
      >
        {t("escrow_draftPay_goPayHub")}
      </Link>
      {!accepted ? (
        <p className={`${escrowExperienceMetaClass} m-0 text-meta`}>{t("escrow_draftPay_guideAcceptNote")}</p>
      ) : null}
    </section>
  );
}
