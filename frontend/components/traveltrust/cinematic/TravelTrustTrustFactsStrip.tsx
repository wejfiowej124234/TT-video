"use client";

import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { TravelTrustTtgAllocationDashboard } from "./TravelTrustTtgAllocationDashboard";
import {
  TT_SECTION_CONTENT_L5,
  TT_SECTION_KICKER_L5,
  TT_SECTION_SURFACE_L5,
  traveltrustSectionL5DataAttrs,
} from "@/lib/traveltrust/l5";

export function TravelTrustTrustFactsStrip() {
  const { t } = useTranslation();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.trust.title;
  return (
    <section
      id="trust"
      className={TT_SECTION_SURFACE_L5.trust}
      aria-labelledby={titleId}
      data-tt-traveltrust-trust-facts="1"
      data-tt-traveltrust-trust-facts-l5="1"
      {...traveltrustSectionL5DataAttrs("trust")}
    >
      <div
        className={TT_SECTION_CONTENT_L5.bodyWideClass}
        data-tt-traveltrust-trust-faq-liquidity-surface-l5="1"
      >
        <p className={TT_SECTION_KICKER_L5}>{t("traveltrust_trust_eyebrow")}</p>
        <h2
          id={titleId}
          className={`${TT_SECTION_CONTENT_L5.kickerToHeadingClass} ${TT_SECTION_CONTENT_L5.headingClass}`}
        >
          {t("traveltrust_trust_strip_heading")}
        </h2>
        <div className="contents" data-tt-traveltrust-trust-warm-plate-l5="1">
          <TravelTrustTtgAllocationDashboard />
        </div>
        <p
          className="mt-3 max-w-3xl text-meta leading-relaxed text-slate-400/90"
          data-tt-traveltrust-trust-facts-disclaimer="1"
        >
          {t("traveltrust_trust_facts_disclaimer")}
        </p>
      </div>
    </section>
  );
}
