"use client";

import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { travelFocusRingCoreOffset1Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_HOME_UNLOCK_MODAL_PAY_BTN } from "@/lib/marketingUi";

export interface UnlockModalProps {
  selectedForUnlock: { orderId: string; index: number } | null;
  setSelectedForUnlock: (v: { orderId: string; index: number } | null) => void;
  handleUnlockPay: () => void;
  unlockPaying: boolean;
  unlockError?: string | null;
}

export default function UnlockModal({
  selectedForUnlock,
  setSelectedForUnlock,
  handleUnlockPay,
  unlockPaying,
  unlockError = null,
}: UnlockModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const paymentNoteId = useId();
  const focusTrapRef = useFocusTrap(!!selectedForUnlock, () => setSelectedForUnlock(null));

  if (!selectedForUnlock) return null;
  const paymentNote = t("unlock_payment_note");
  const btnPay = t("unlock_btn_pay");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={`${descId} ${paymentNoteId}`}
      onClick={(e) => e.target === e.currentTarget && setSelectedForUnlock(null)}
    >
      <div
        ref={focusTrapRef}
        data-testid="unlock-modal"
        data-tt-landing-unlock-honesty="phase1-preview-no-usdc"
        className="rounded-[var(--radius-lg)] border border-white/20 bg-ink-950/95 text-white shadow-strong p-6 max-w-sm w-full backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-h4 font-semibold text-white mb-2">{t("unlock_title")}</h3>
        <p
          className="mb-3 inline-flex items-center rounded-[var(--radius-sm)] border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-meta font-medium text-amber-100"
          role="status"
          data-tt-landing-unlock-honesty-badge="1"
        >
          {t("unlock_honesty_badge")}
        </p>
        <p id={descId} className="text-body text-white/85 mb-3">{t("unlock_desc")}</p>
        <p id={paymentNoteId} className="text-small text-white/70 mb-4">{paymentNote}</p>
        {unlockError ? (
          <p className="text-small text-red-300 mb-4" role="alert">
            {unlockError}
          </p>
        ) : null}
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
              className={`flex-1 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-white/25 px-4 py-2 text-small text-white/90 hover:bg-white/10 ${travelFocusRingCoreOffset1Classes} focus-visible:ring-offset-ink-950`}
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
              className={`${TT_MARKETING_HOME_UNLOCK_MODAL_PAY_BTN} ${travelFocusRingCoreOffset1Classes}`}
            >
              {unlockPaying ? t("unlock_btn_paying") : btnPay}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
