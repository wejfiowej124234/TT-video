"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { escrowExperienceControlClass } from "@/lib/escrowExperienceUi";

export type EscrowDraftItineraryTab = "cities" | "narrative" | "preview";

export interface EscrowDraftItineraryTabBarProps {
  active: EscrowDraftItineraryTab;
  onChange: (tab: EscrowDraftItineraryTab) => void;
  showCities: boolean;
  showNarrative: boolean;
  showPreview: boolean;
}

const TAB_KEYS: Record<EscrowDraftItineraryTab, string> = {
  cities: "escrow_draftItineraryTab_cities",
  narrative: "escrow_draftItineraryTab_narrative",
  preview: "escrow_draftItineraryTab_preview",
};

export default function EscrowDraftItineraryTabBar({
  active,
  onChange,
  showCities,
  showNarrative,
  showPreview,
}: EscrowDraftItineraryTabBarProps) {
  const { t } = useTranslation();
  const tabs = (
    [
      showCities ? ("cities" as const) : null,
      showNarrative ? ("narrative" as const) : null,
      showPreview ? ("preview" as const) : null,
    ] as const
  ).filter(Boolean) as EscrowDraftItineraryTab[];

  if (tabs.length < 2) return null;

  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label={t("escrow_draftItineraryTab_aria")}
    >
      {tabs.map((tab) => {
        const selected = active === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab)}
            className={`${escrowExperienceControlClass} !px-3 !py-1.5 !min-h-[40px] ${
              selected ? "!bg-ref-sun/30 !border-ref-sun/50" : "!bg-transparent !text-white/80"
            }`}
          >
            {t(TAB_KEYS[tab])}
          </button>
        );
      })}
    </div>
  );
}
