"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_MARKETING_TRUST_BADGE_HOME,
  TT_MARKETING_TRUST_BADGE_PROTOCOL,
} from "@/lib/marketingUi";

/** Hero 下三徽章：非托管 · 链上托管 · 争议支持（28 融合规范；随 app locale 切换） */
const BADGE_KEYS = [
  { labelKey: "trust_badge_nonCustodial_label", titleKey: "trust_badge_nonCustodial_title" },
  { labelKey: "trust_badge_escrow_label", titleKey: "trust_badge_escrow_title" },
  { labelKey: "trust_badge_dispute_label", titleKey: "trust_badge_dispute_title" },
] as const;

type TrustBadgesVariant = "home" | "protocol";

export default function TrustBadgesRow({ variant = "home" }: { variant?: TrustBadgesVariant }) {
  const { t } = useTranslation();
  const badgeClass = variant === "protocol" ? TT_MARKETING_TRUST_BADGE_PROTOCOL : TT_MARKETING_TRUST_BADGE_HOME;
  const delayClass = ["delay-150", "delay-200", "delay-300"];
  return (
    <div
      className="mt-4 flex flex-wrap items-center justify-center gap-2 animate-fadeIn delay-100 lg:justify-start"
      aria-label={t("trust_badges_aria")}
      data-tt-trust-badges-variant={variant}
    >
      {BADGE_KEYS.map((b, i) => (
        <span
          key={b.labelKey}
          className={`${badgeClass} animate-fadeIn ${delayClass[i] ?? ""}`}
          title={t(b.titleKey)}
        >
          {t(b.labelKey)}
        </span>
      ))}
    </div>
  );
}
