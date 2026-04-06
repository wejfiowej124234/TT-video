"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** Hero 下三徽章：非托管 · 链上托管 · 争议支持（28 融合规范；随 app locale 切换） */
const BADGE_KEYS = [
  { labelKey: "trust_badge_nonCustodial_label", titleKey: "trust_badge_nonCustodial_title" },
  { labelKey: "trust_badge_escrow_label", titleKey: "trust_badge_escrow_title" },
  { labelKey: "trust_badge_dispute_label", titleKey: "trust_badge_dispute_title" },
] as const;

export default function TrustBadgesRow() {
  const { t } = useTranslation();
  const delayClass = ["delay-150", "delay-200", "delay-300"];
  return (
    <div
      className="mt-4 flex flex-wrap items-center justify-center gap-2 animate-fadeIn delay-100"
      aria-label={t("trust_badges_aria")}
    >
      {BADGE_KEYS.map((b, i) => (
        <span
          key={b.labelKey}
          className={`rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-meta font-medium text-white/95 border border-white/20 animate-fadeIn ${delayClass[i] ?? ""}`}
          title={t(b.titleKey)}
        >
          {t(b.labelKey)}
        </span>
      ))}
    </div>
  );
}
