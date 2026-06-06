"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import TrustBadgesRow from "@/components/trust/TrustBadgesRow";
import {
  TT_MARKETING_BTN_NETWORK_LINK_HOME,
  TT_MARKETING_BTN_SECONDARY_HOME,
  TT_MARKETING_BTN_SECONDARY_HOME_MARKET,
} from "@/lib/marketingUi";

export default function LandingHeroFormHeroIntro() {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="text-h3 font-bold tracking-tight sm:text-h2 text-center text-slate-50 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
        {t("landing_hero_title")}
      </h1>
      <p className="mt-3 text-body-l text-slate-100 text-center sm:text-h4 drop-shadow-[0_1px_8px_rgba(0,0,0,0.75)]">
        {t("landing_hero_subtitle")}
      </p>
      <p className="mt-2 text-small text-slate-200/95 text-center drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
        {t("landing_hero_escrow_note")}
      </p>
      <TrustBadgesRow variant="home" />
      <p className="mt-1 text-meta text-slate-300 text-center drop-shadow-[0_1px_4px_rgba(0,0,0,0.65)]">
        {t("landing_payment_note")}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3 max-[390px]:gap-2">
        <Link href="/market" className={TT_MARKETING_BTN_SECONDARY_HOME_MARKET}>
          {t("header_market")}
        </Link>
        <Link
          href="/guides"
          className={`${TT_MARKETING_BTN_SECONDARY_HOME} border-ref-sage/35 hover:border-ref-sage/45 hover:bg-ref-sage/15`}
        >
          {t("landing_cta_guides")}
        </Link>
        <Link href="/traveltrust" className={TT_MARKETING_BTN_NETWORK_LINK_HOME}>
          {t("landing_cta_traveltrust_network")}
        </Link>
      </div>
    </>
  );
}
