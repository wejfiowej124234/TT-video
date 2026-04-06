"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { trackMarketEvent } from "@/lib/analytics";
import { marketHrefForGuideCustomItinerary, ordersNewHrefForGuide } from "@/lib/ordersGuideDeepLink";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/**
 * P29 预约向导弹窗：进入创建订单（预填 guide_id）或先建行程；与 5.1 / orders/new 一致。
 */
export default function BookGuideModal({
  guideId,
  guideName,
  onClose,
}: {
  guideId: string;
  guideName?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap(true, onClose);
  const titleId = useId();
  const descId = useId();
  const subtitleId = useId();

  useEffect(() => {
    if (guideId) trackMarketEvent("market_book_guide_open", { guideId });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [guideId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={guideName ? `${subtitleId} ${descId}` : descId}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={trapRef}
        className="w-full max-w-md rounded-[var(--radius-md)] border border-white/25 bg-white/5 backdrop-blur-md shadow-strong p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-body font-semibold">
          {t("book_guide_title")}
        </h2>
        {guideName ? (
          <p id={subtitleId} className="text-small text-white/90 mt-1">
            {guideName}
          </p>
        ) : null}
        <p id={descId} className="text-small text-white/85 mt-3">
          {t("book_guide_desc")}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={ordersNewHrefForGuide(guideId)}
            onClick={() => trackMarketEvent("market_book_guide_click", { guideId })}
            className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small font-medium text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white/20`}
          >
            {t("book_guide_selectAndBook")}
          </Link>
          <Link
            href={`/itinerary/new?guide_id=${encodeURIComponent(guideId)}`}
            className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-white text-small text-center hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white/20`}
          >
            {t("book_guide_createFirst")}
          </Link>
          <Link
            href={marketHrefForGuideCustomItinerary(guideId)}
            onClick={() => trackMarketEvent("market_book_guide_market_custom", { guideId })}
            className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-white text-small text-center hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white/20`}
          >
            {t("book_guide_marketCustom")}
          </Link>
          <Link
            href="/pay"
            className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] border border-success/35 bg-success/10 px-4 py-2 text-white text-small text-center hover:bg-success/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white/20`}
          >
            {t("header_payHub")}
          </Link>
        </div>
        <form
          className="mt-4 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <button
            type="submit"
            className={`${touchTargetLink44Classes} w-full text-meta text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white/20 rounded-[var(--radius-sm)]`}
            aria-label={t("book_guide_cancelClose")}
          >
            {t("common_cancel")}
          </button>
        </form>
      </div>
    </div>
  );
}
