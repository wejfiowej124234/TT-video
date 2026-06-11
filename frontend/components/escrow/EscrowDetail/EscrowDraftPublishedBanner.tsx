"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { marketHrefForEscrowGuideBind } from "@/lib/ordersGuideDeepLink";
import { escrowExperiencePrimaryCtaClass } from "@/lib/escrowExperienceUi";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export interface EscrowDraftPublishedBannerProps {
  orderId: string;
  /** 保存成功后的短闪；常驻条在已发布时始终显示 */
  saveFlash?: boolean;
  /** 合并原 GuideEmpty 卡片的行程上下文（可选） */
  destinationLabel?: string;
}

/** ① Experience 草稿：已发布到 discover 时的顶栏状态条 */
export default function EscrowDraftPublishedBanner({
  orderId,
  saveFlash = false,
  destinationLabel,
}: EscrowDraftPublishedBannerProps) {
  const { t } = useTranslation();
  const marketHref = marketHrefForEscrowGuideBind(orderId.trim());

  return (
    <div
      className={`rounded-[var(--radius-md)] border px-4 py-3 space-y-2 ${
        saveFlash
          ? "border-emerald-400/50 bg-emerald-500/15 ring-1 ring-emerald-400/25"
          : "border-ref-sun/35 bg-ref-sun/10"
      }`}
      role="status"
      aria-live="polite"
    >
      <p className="text-small font-semibold text-ref-sun/95 m-0">
        {saveFlash ? t("escrow_publishedBanner_saveFlashTitle") : t("orders_selectGuide")}
      </p>
      <p className="text-small text-slate-200/95 m-0 leading-relaxed">
        {destinationLabel
          ? t("escrow_publishedBanner_bodyDest").replace("{{dest}}", destinationLabel)
          : t("escrow_publishedBanner_bodyShort")}
      </p>
      <Link
        href={marketHref}
        className={`${escrowExperiencePrimaryCtaClass} inline-flex min-h-[44px] items-center justify-center px-4 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`}
      >
        {t("orders_selectGuide")} →
      </Link>
    </div>
  );
}
