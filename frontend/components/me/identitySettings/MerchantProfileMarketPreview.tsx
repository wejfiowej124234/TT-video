"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import MarketSubsiteMasonry from "@/components/market/MarketSubsiteMasonry";
import { merchantToMasonryItem } from "@/components/market/marketStandaloneBusinessPageUtils";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { merchantProfileToDemoListing } from "./identitySettingsPreviewUtils";

export function MerchantProfileMarketPreview({
  shopName,
  city,
  countryCode,
  categories,
  bio,
  avatarUrl,
  coverUrl,
  dirtyOnly = false,
}: {
  shopName: string;
  city: string;
  countryCode: string;
  categories: string[];
  bio: string;
  avatarUrl?: string;
  coverUrl?: string;
  /** 仅编辑中展示；已保存挂牌见工作台市场曝光 */
  dirtyOnly?: boolean;
}) {
  const { t, locale } = useTranslation();
  const item = useMemo(() => {
    const demo = merchantProfileToDemoListing({
      shopName,
      city,
      countryCode,
      categories,
      bio,
      avatarUrl,
      coverUrl,
    });
    return merchantToMasonryItem(demo, locale);
  }, [shopName, city, countryCode, categories, bio, avatarUrl, coverUrl, locale]);

  return (
    <section
      className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard}
      aria-labelledby="me-merchant-profile-preview-title"
      data-tt-me-merchant-profile-preview="1"
      data-tt-me-merchant-profile-preview-dirty-only={dirtyOnly ? "1" : undefined}
    >
      <h2 id="me-merchant-profile-preview-title" className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionTitle}>
        {t("me_merchant_profile_preview_title")}
      </h2>
      <p className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionHint}>
        {dirtyOnly ? t("me_merchant_profile_preview_subtitle_dirty") : t("me_merchant_profile_preview_subtitle")}
      </p>
      <div className="mt-4 -mx-4 max-w-sm sm:mx-0">
        <MarketSubsiteMasonry
          listLabelKey="me_merchant_profile_preview_list_aria"
          items={[item]}
          badgeKey="me_merchant_profile_preview_badge"
          previewOnly
        />
      </div>
    </section>
  );
}
