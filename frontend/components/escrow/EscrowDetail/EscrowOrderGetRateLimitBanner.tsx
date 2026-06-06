"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_ESCROW_EXPERIENCE_PANEL, escrowExperienceSecondaryBtnClass } from "@/lib/escrowExperienceUi";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export interface EscrowOrderGetRateLimitBannerProps {
  onRetry: () => void;
}

/** ① GET /orders/:id 触发全局限流时的 Experience 提示（不清空已展示订单） */
export default function EscrowOrderGetRateLimitBanner({ onRetry }: EscrowOrderGetRateLimitBannerProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`${TT_ESCROW_EXPERIENCE_PANEL} border-amber-400/35 bg-amber-500/10 p-4 space-y-3`}
      role="alert"
      aria-live="polite"
    >
      <p className="text-small font-medium text-amber-100/95 leading-relaxed">{t("escrow_orderGetRateLimited")}</p>
      <button
        type="button"
        className={`${escrowExperienceSecondaryBtnClass} ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`}
        onClick={() => onRetry()}
      >
        {t("common_retry")}
      </button>
    </div>
  );
}
