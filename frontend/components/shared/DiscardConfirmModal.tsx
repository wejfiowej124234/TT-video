"use client";

import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { travelFocusRingCoreOffset1Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_HOME_UNLOCK_MODAL_PAY_BTN } from "@/lib/marketingUi";

export type DiscardConfirmModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  messageKey?: string;
  titleKey?: string;
  confirmKey?: string;
  testId?: string;
};

/** Centered L5 confirm dialog — replaces `window.confirm` for unsaved draft discard. */
export default function DiscardConfirmModal({
  open,
  onCancel,
  onConfirm,
  messageKey = "market_studio_unsaved_confirm",
  titleKey = "market_studio_unsaved_title",
  confirmKey = "market_studio_unsaved_discard",
  testId = "discard-confirm-modal",
}: DiscardConfirmModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const focusTrapRef = useFocusTrap(open, onCancel);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        ref={focusTrapRef}
        data-testid={testId}
        data-tt-discard-confirm-modal="1"
        className="rounded-[var(--radius-lg)] border border-white/20 bg-ink-950/95 text-white shadow-strong p-6 max-w-sm w-full backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-h4 font-semibold text-white mb-2">
          {t(titleKey)}
        </h3>
        <p id={descId} className="text-body text-white/85 mb-5">
          {t(messageKey)}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-white/25 px-4 py-2 text-small text-white/90 hover:bg-white/10 ${travelFocusRingCoreOffset1Classes} focus-visible:ring-offset-ink-950`}
          >
            {t("common_cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${TT_MARKETING_HOME_UNLOCK_MODAL_PAY_BTN} ${travelFocusRingCoreOffset1Classes} flex-1`}
            data-tt-discard-confirm-cta="1"
          >
            {t(confirmKey)}
          </button>
        </div>
      </div>
    </div>
  );
}
