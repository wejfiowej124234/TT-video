"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 卡片右上角角标：Escrow-enabled（28 融合规范，Experience 区微元素） */
export default function EscrowEnabledBadge() {
  const { t } = useTranslation();
  return (
    <span
      className="absolute right-2 top-2 rounded-[var(--radius-sm)] bg-success text-white px-2 py-0.5 text-meta font-medium shadow-medium border border-white/20 animate-fadeIn"
      title={t("trust_escrow_badge_title")}
    >
      Escrow-enabled ✓
    </span>
  );
}
