import en from "@/locales/en";
import zh from "@/locales/zh";

/** OG 图静态文案（TT-PH1-073 / 167 · ①；分语言图 defer ②） */
export const TRAVELTRUST_OG_COPY = {
  zh: {
    kicker: zh.traveltrust_hero_kicker,
    title: `${zh.traveltrust_title_brand} ${zh.traveltrust_title_suffix}`,
    tagline: zh.traveltrust_tagline,
    chips: ["托管订金", "链上治理", "五角色"],
    illustrative: zh.traveltrust_illustrative_badge,
  },
  en: {
    kicker: en.traveltrust_hero_kicker,
    title: `${en.traveltrust_title_brand} ${en.traveltrust_title_suffix}`,
    tagline: en.traveltrust_tagline,
    chips: ["Escrow", "Governance", "Four roles"],
    illustrative: en.traveltrust_illustrative_badge,
  },
} as const;
