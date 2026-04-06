"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 小 pill：USDC / Polygon（28 融合规范，卡片上「支持方式」） */
export default function SupportedTokensPill() {
  const { t } = useTranslation();
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-ink-100 text-ink-700 px-2 py-0.5 text-meta font-medium animate-fadeIn"
      title={t("trust_usdc_pill_title")}
    >
      {t("trust_supported_token_pill_label")}
    </span>
  );
}
