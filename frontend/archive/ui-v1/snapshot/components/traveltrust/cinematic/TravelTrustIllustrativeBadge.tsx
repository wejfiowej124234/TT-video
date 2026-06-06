"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_MARKETING_ILLUSTRATIVE_BADGE,
  TT_MARKETING_ILLUSTRATIVE_BADGE_PREVIEW,
} from "@/lib/marketingUi";

type Variant = "illustrative" | "preview";

type Props = {
  variant?: Variant;
  className?: string;
};

/** 统一「示意 / 预览」视觉规范（TT-PH1-180 / TT-PH1-189 · ①） */
export function TravelTrustIllustrativeBadge({ variant = "illustrative", className = "" }: Props) {
  const { t } = useTranslation();
  const label =
    variant === "preview"
      ? t("traveltrust_liquidity_preview_badge")
      : t("traveltrust_illustrative_badge");
  const tokenClass =
    variant === "preview" ? TT_MARKETING_ILLUSTRATIVE_BADGE_PREVIEW : TT_MARKETING_ILLUSTRATIVE_BADGE;

  return (
    <span
      className={`${tokenClass} ${className}`}
      data-tt-traveltrust-illustrative-badge={variant}
    >
      {label}
    </span>
  );
}
