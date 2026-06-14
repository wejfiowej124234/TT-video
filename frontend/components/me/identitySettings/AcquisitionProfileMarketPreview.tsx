"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import MarketSubsiteMasonry from "@/components/market/MarketSubsiteMasonry";
import { acquisitionToMasonryItem } from "@/components/market/marketStandaloneBusinessPageUtils";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { acquisitionProfileToDemoListing } from "./identitySettingsPreviewUtils";

export function AcquisitionProfileMarketPreview({
  tagline,
  publicBio,
  avatarUrl,
}: {
  tagline: string;
  publicBio: string;
  avatarUrl?: string;
}) {
  const { t, locale } = useTranslation();
  const item = useMemo(() => {
    const demo = acquisitionProfileToDemoListing({ tagline, publicBio, avatarUrl, locale });
    return acquisitionToMasonryItem(demo, locale);
  }, [tagline, publicBio, avatarUrl, locale]);

  return (
    <section
      className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard}
      aria-labelledby="me-acquisition-profile-preview-title"
      data-tt-me-acquisition-profile-preview="1"
    >
      <h2 id="me-acquisition-profile-preview-title" className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionTitle}>
        {t("me_acquisition_profile_preview_title")}
      </h2>
      <p className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionHint}>{t("me_acquisition_profile_preview_subtitle")}</p>
      <p className="mt-2 text-meta leading-relaxed text-slate-400/90">{t("me_acquisition_profile_preview_bounty_demo_note")}</p>
      <div className="mt-4 -mx-4 max-w-sm sm:mx-0">
        <MarketSubsiteMasonry
          listLabelKey="me_acquisition_profile_preview_list_aria"
          items={[item]}
          badgeKey="me_acquisition_profile_preview_badge"
          onListingOpen={() => {}}
        />
      </div>
    </section>
  );
}
