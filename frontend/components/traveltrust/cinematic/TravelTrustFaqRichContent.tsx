"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { TT_FAQ_ACCORDION_L5 } from "@/lib/traveltrustCinematicNonGlobeL5";

const faqLinkClass =
  "font-medium text-ref-sun underline-offset-2 transition hover:text-ref-coral hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45";

export function TravelTrustFaqIntro() {
  const { t } = useTranslation();
  return (
    <>
      {t("traveltrust_faq_intro_lead")}
      <Link href="/help" className={faqLinkClass}>
        {t("traveltrust_nav_help")}
      </Link>
      {t("traveltrust_faq_intro_mid")}
      <Link href="/governance" className={faqLinkClass}>
        {t("traveltrust_nav_governance_center")}
      </Link>
      {t("traveltrust_faq_intro_tail")}
    </>
  );
}

export function TravelTrustFaqAnswerBody({ answerKey }: { answerKey: string }) {
  const { t } = useTranslation();

  if (answerKey === "traveltrust_faq_a4") {
    return (
      <p className={TT_FAQ_ACCORDION_L5.panelBodyClass}>
        {t("traveltrust_faq_a4_lead")}
        <Link href="/governance" className={faqLinkClass}>
          {t("traveltrust_nav_governance_center")}
        </Link>
        {t("traveltrust_faq_a4_tail")}
      </p>
    );
  }

  if (answerKey === "traveltrust_faq_a10") {
    return (
      <p className={TT_FAQ_ACCORDION_L5.panelBodyClass}>
        {t("traveltrust_faq_a10_lead")}
        <Link href="/help" className={faqLinkClass}>
          {t("traveltrust_nav_help")}
        </Link>
        {t("traveltrust_faq_a10_mid")}
        <Link href="/disputes" className={faqLinkClass}>
          {t("traveltrust_faq_a10_disputes")}
        </Link>
        {t("traveltrust_faq_a10_tail")}
      </p>
    );
  }

  return <p className={TT_FAQ_ACCORDION_L5.panelBodyClass}>{t(answerKey)}</p>;
}
