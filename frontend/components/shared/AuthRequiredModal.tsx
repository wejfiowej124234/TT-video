"use client";

import Link from "next/link";
import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { travelFocusRingCoreOffset1Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_HOME_UNLOCK_MODAL_PAY_BTN } from "@/lib/marketingUi";

export type AuthRequiredModalProps = {
  open: boolean;
  onClose: () => void;
  /** Absolute path + query for post-login return (e.g. `/` or `/market?…`) */
  returnUrl: string;
  /** Optional override for body copy i18n key (default landing_error_login) */
  messageKey?: string;
  ctaKey?: string;
  titleKey?: string;
  testId?: string;
};

/**
 * Shared L5 dark-glass auth gate (landing AI generate · market custom itinerary).
 * Mirrors UnlockModal chrome; does not invent a second visual system.
 */
export default function AuthRequiredModal({
  open,
  onClose,
  returnUrl,
  messageKey = "landing_error_login",
  ctaKey = "landing_error_login_cta",
  titleKey = "auth_required_modal_title",
  testId = "auth-required-modal",
}: AuthRequiredModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const focusTrapRef = useFocusTrap(open, onClose);

  if (!open) return null;

  const loginHref = `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={focusTrapRef}
        data-testid={testId}
        data-tt-auth-required-modal="1"
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
            onClick={onClose}
            className={`flex-1 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-white/25 px-4 py-2 text-small text-white/90 hover:bg-white/10 ${travelFocusRingCoreOffset1Classes} focus-visible:ring-offset-ink-950`}
          >
            {t("common_cancel")}
          </button>
          <Link
            href={loginHref}
            className={`${TT_MARKETING_HOME_UNLOCK_MODAL_PAY_BTN} ${travelFocusRingCoreOffset1Classes} flex-1 text-center`}
            data-tt-auth-required-login-cta="1"
          >
            {t(ctaKey)}
          </Link>
        </div>
      </div>
    </div>
  );
}
