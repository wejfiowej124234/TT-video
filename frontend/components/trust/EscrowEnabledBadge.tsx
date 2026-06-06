"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

/** 卡片 Escrow 角标（28 · market 暖金）；`cover` 与封面天数 chip 同对比度 */
export default function EscrowEnabledBadge({
  className = "",
  variant = "default",
}: {
  className?: string;
  /** `cover`：封面底栏，用 `cardCoverChip` 避免深底黑字不可读 */
  variant?: "default" | "cover";
}) {
  const { t } = useTranslation();
  const base =
    variant === "cover"
      ? `${TT_MARKETING_MARKET_DARK_PATH.cardCoverChip} text-slate-100 font-semibold shadow-[0_2px_10px_-4px_rgba(0,0,0,0.65)]`
      : TT_MARKETING_MARKET_DARK_PATH.trustEscrowBadge;
  return (
    <span className={`${base} ${className}`.trim()} title={t("trust_escrow_badge_title")}>
      {t("trust_escrow_badge_short")}
    </span>
  );
}
