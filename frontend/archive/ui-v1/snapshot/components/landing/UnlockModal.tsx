"use client";

import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { UNLOCK_PRICE_USD } from "./constants";
import { escrowModalPortalRootClass, escrowModalScrimClass } from "@/components/market/marketStudioModalLayout";
import { TT_MARKETING_BTN_PRIMARY_WARM, TT_MARKETING_BTN_WARM_OUTLINE } from "@/lib/marketingUi";

export interface UnlockModalProps {
  selectedForUnlock: { orderId: string; index: number } | null;
  setSelectedForUnlock: (v: { orderId: string; index: number } | null) => void;
  handleUnlockPay: () => void;
  unlockPaying: boolean;
}

export default function UnlockModal({
  selectedForUnlock,
  setSelectedForUnlock,
  handleUnlockPay,
  unlockPaying,
}: UnlockModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const paymentNoteId = useId();
  const focusTrapRef = useFocusTrap(!!selectedForUnlock, () => setSelectedForUnlock(null));

  if (!selectedForUnlock) return null;
  const stablecoinPair = t("didRank_badge_stablecoins");
  const unlockDesc = t("unlock_desc").replace("{{amount}}", String(UNLOCK_PRICE_USD));
  const paymentNote = t("unlock_payment_note").replace("{{token}}", stablecoinPair);
  const btnPay = t("unlock_btn_pay").replace("{{amount}}", String(UNLOCK_PRICE_USD)).replace("{{token}}", stablecoinPair);

  return (
    <div
      className={escrowModalPortalRootClass}
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={`${descId} ${paymentNoteId}`}
      data-tt-landing-unlock-modal="1"
    >
      <div
        className={`${escrowModalScrimClass} backdrop-blur-sm`}
        aria-hidden
        onClick={() => setSelectedForUnlock(null)}
      />
      <div
        ref={focusTrapRef}
        className="relative z-10 rounded-[var(--radius-lg)] border border-ink-200 bg-bg-console shadow-strong p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-h4 font-semibold text-ink-900 mb-2">{t("unlock_title")}</h3>
        <p id={descId} className="text-body text-ink-600 mb-3">{unlockDesc}</p>
        <p id={paymentNoteId} className="text-small text-ink-500 mb-6">{paymentNote}</p>
        <div className="flex gap-3">
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              setSelectedForUnlock(null);
            }}
          >
            <button
              type="submit"
              className={`flex-1 ${TT_MARKETING_BTN_WARM_OUTLINE} focus-visible:ring-offset-bg-console`}
            >
              {t("common_cancel")}
            </button>
          </form>
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              handleUnlockPay();
            }}
          >
            <button
              type="submit"
              disabled={unlockPaying}
              aria-busy={unlockPaying ? true : undefined}
              className={`flex-1 min-w-0 ${TT_MARKETING_BTN_PRIMARY_WARM} focus-visible:ring-offset-bg-console`}
            >
              {unlockPaying ? t("unlock_btn_paying") : btnPay}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
