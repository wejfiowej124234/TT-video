"use client";

import { TravelTrustListingDocPage } from "@/components/traveltrust/cinematic/TravelTrustListingDocPage";
import { TRAVELTRUST_TTG_AVATAR_SRC } from "@/lib/traveltrustListingDisclosure";
import { useTranslation } from "@/components/LocaleProvider";

export function BrandMarkPageMain() {
  const { t } = useTranslation();
  return (
    <TravelTrustListingDocPage
      marker="brand"
      experience="brand-mark"
      kickerKey="listing_brand_kicker"
      titleKey="listing_brand_title"
      statusKey="listing_brand_status"
      leadKey="listing_brand_lead"
      bodyKeys={["listing_brand_body", "listing_brand_supply"]}
    >
      <figure className="mx-auto max-w-[18rem]" data-tt-listing-brand-avatar="1">
        <img
          src={TRAVELTRUST_TTG_AVATAR_SRC}
          alt={t("listing_brand_avatar_alt")}
          width={512}
          height={512}
          className="w-full rounded-2xl border border-[#f4d39a]/25 bg-[#0c0a09]"
        />
        <figcaption className="mt-3 text-center text-meta text-slate-400/90">
          {t("listing_brand_caption")}
        </figcaption>
      </figure>
      <p className="text-meta leading-relaxed text-slate-400/90">{t("listing_brand_files")}</p>
    </TravelTrustListingDocPage>
  );
}
