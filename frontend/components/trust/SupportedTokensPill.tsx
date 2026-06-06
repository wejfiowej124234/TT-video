"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

/** 小 pill：USDC / Polygon（28 融合规范，卡片上「支持方式」） */
export default function SupportedTokensPill({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { t } = useTranslation();
  const className =
    tone === "dark"
      ? TT_MARKETING_MARKET_DARK_PATH.trustTokenPill
      : "inline-flex items-center gap-1 rounded-full bg-ink-100 text-ink-700 px-2 py-0.5 text-meta font-medium animate-fadeIn";
  return (
    <span className={className} title={t("trust_usdc_pill_title")}>
      {t("trust_supported_token_pill_label")}
    </span>
  );
}
