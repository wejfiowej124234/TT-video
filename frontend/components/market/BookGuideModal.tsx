"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { trackMarketEvent } from "@/lib/analytics";
import { getIdempotencyKey, patchOrderGuide } from "@/lib/apiClient";
import { mapOrderWriteError } from "@/lib/mapOrderWriteError";
import { marketHrefForGuideCustomItinerary, ordersNewHrefForGuide } from "@/lib/ordersGuideDeepLink";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_MARKET_GLASS, TT_MARKETING_BTN_MARKET_PRIMARY, TT_MARKETING_BTN_MARKET_SUCCESS_GHOST, TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

/**
 * P29 预约向导弹窗：创建新订单预填 guide_id，或为 Escrow 草稿订单绑定向导。
 */
export default function BookGuideModal({
  guideId,
  guideName,
  bindOrderId,
  onClose,
}: {
  guideId: string;
  guideName?: string;
  /** 为既有草稿订单选向导（PATCH /orders/:id/guide） */
  bindOrderId?: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const trapRef = useFocusTrap(true, onClose);
  const titleId = useId();
  const descId = useId();
  const subtitleId = useId();
  const [binding, setBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);
  const bindTrimmed = bindOrderId?.trim() ?? "";
  const isBindMode = bindTrimmed.length > 0;

  useEffect(() => {
    if (guideId) trackMarketEvent("market_book_guide_open", { guideId, bindOrderId: bindTrimmed || undefined });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [guideId, bindTrimmed]);

  const handleBindToOrder = () => {
    if (!isBindMode || binding) return;
    setBinding(true);
    setBindError(null);
    void (async () => {
      try {
        await patchOrderGuide(bindTrimmed, guideId, getIdempotencyKey());
        trackMarketEvent("market_escrow_guide_bound", { orderId: bindTrimmed, guideId });
        stashEscrowOrderPrefetchForOrderIdNav(bindTrimmed, "escrow");
        onClose();
        router.push(`/escrow/${encodeURIComponent(bindTrimmed)}`);
      } catch (err) {
        setBindError(mapOrderWriteError(err, t, { fallbackKey: "escrow_bindGuideFailed" }));
      } finally {
        setBinding(false);
      }
    })();
  };

  return (
    <div
      className={TT_MARKETING_MARKET_DARK_PATH.glassModalScrim}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={guideName ? `${subtitleId} ${descId}` : descId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={trapRef}
        className={TT_MARKETING_MARKET_DARK_PATH.glassModalPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-body font-semibold">
          {isBindMode ? t("book_guide_bindTitle") : t("book_guide_title")}
        </h2>
        {guideName ? (
          <p id={subtitleId} className="text-small text-white/90 mt-1">
            {guideName}
          </p>
        ) : null}
        <p id={descId} className="text-small text-white/85 mt-3">
          {isBindMode ? t("book_guide_bindDesc") : t("book_guide_desc")}
        </p>
        {bindError ? (
          <p className="mt-3 text-small text-red-300/95" role="alert">
            {bindError}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          {isBindMode ? (
            <button
              type="button"
              disabled={binding}
              className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY} w-full text-center disabled:opacity-50`}
              aria-busy={binding ? true : undefined}
              onClick={handleBindToOrder}
            >
              {binding ? t("common_submitting") : t("book_guide_bindSelect")}
            </button>
          ) : (
            <Link
              href={ordersNewHrefForGuide(guideId)}
              onClick={() => trackMarketEvent("market_book_guide_click", { guideId })}
              className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY} w-full text-center`}
            >
              {t("book_guide_selectAndBook")}
            </Link>
          )}
          {!isBindMode ? (
            <>
              <Link
                href={`/itinerary/new?guide_id=${encodeURIComponent(guideId)}`}
                className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_GLASS} w-full text-center`}
              >
                {t("book_guide_createFirst")}
              </Link>
              <Link
                href={marketHrefForGuideCustomItinerary(guideId)}
                onClick={() => trackMarketEvent("market_book_guide_market_custom", { guideId })}
                className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_GLASS} w-full text-center`}
              >
                {t("book_guide_marketCustom")}
              </Link>
              <Link
                href="/pay"
                className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_SUCCESS_GHOST} w-full text-center`}
              >
                {t("header_payHub")}
              </Link>
            </>
          ) : null}
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
            className={`${touchTargetLink44Classes} w-full ${TT_MARKETING_MARKET_DARK_PATH.glassModalDismissLink}`}
            aria-label={t("book_guide_cancelClose")}
          >
            {t("common_cancel")}
          </button>
        </form>
      </div>
    </div>
  );
}
