"use client";

import { memo } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { ColdStartOfficialHighlightCard } from "@/components/coldStartCampaign/ColdStartOfficialHighlightCard";
import { resolveConsumerHomeHeroHighlights } from "@/lib/coldStartCampaign/coldStartConsumerPresentation";
import { COLD_START_SURFACE_HOME_HERO } from "@/lib/coldStartCampaign/types";
import { useColdStartCampaignSurface } from "@/lib/coldStartCampaign/useColdStartCampaignSurface";

export type ColdStartHomeHeroHighlightsProps = {
  className?: string;
};

/** Home hero · L5 consumer official highlights. Hidden unless deploy has valid business objects. */
function ColdStartHomeHeroHighlightsInner({ className = "" }: ColdStartHomeHeroHighlightsProps) {
  const { t } = useTranslation();
  const { campaign, items, loading, error } = useColdStartCampaignSurface(COLD_START_SURFACE_HOME_HERO);

  if (loading || error) return null;

  const { visible, cards } = resolveConsumerHomeHeroHighlights(campaign, items, t);
  if (!visible) return null;

  return (
    <section
      className={`mx-auto w-full max-w-3xl px-3 sm:px-4 ${className}`.trim()}
      data-tt-cold-start-surface={COLD_START_SURFACE_HOME_HERO}
      data-tt-cold-start-ready="1"
      data-tt-cold-start-consumer="1"
      data-tt-cold-start-campaign-items={cards.length}
      aria-label={t("cold_start_consumer_section_aria")}
    >
      <div className="space-y-2.5" data-tt-cold-start-consumer-panel="1">
        <header className="px-0.5">
          <p
            data-tt-cold-start-kicker="1"
            className="text-meta font-medium uppercase tracking-wide text-ref-sun [color:var(--ref-sun)]"
          >
            {t("cold_start_campaign_surface_kicker")}
          </p>
          <p className="mt-0.5 text-meta text-white/70">{t("cold_start_consumer_section_lead")}</p>
        </header>
        <ul className="flex flex-col gap-2.5" data-tt-cold-start-consumer-card-list="1">
          {cards.map((card) => (
            <li key={card.id}>
              <ColdStartOfficialHighlightCard card={card} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const ColdStartHomeHeroHighlights = memo(ColdStartHomeHeroHighlightsInner);
