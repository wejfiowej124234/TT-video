"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  escrowExperiencePrimaryCtaClass,
  escrowExperienceSecondaryBtnClass,
} from "@/lib/escrowExperienceUi";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export interface EscrowDraftMobileActionBarProps {
  canSave: boolean;
  /** 有未保存编辑时才显示「保存」 */
  showSaveButton?: boolean;
  saving: boolean;
  onSave: () => void;
  confirmBlocked: boolean;
  confirmBlockedReasonKey?: string | null;
}

/** 草稿 Experience：小屏底部固定「保存 | 去确认」 */
export default function EscrowDraftMobileActionBar({
  canSave,
  showSaveButton = false,
  saving,
  onSave,
  confirmBlocked,
  confirmBlockedReasonKey = null,
}: EscrowDraftMobileActionBarProps) {
  const { t } = useTranslation();

  const scrollToConfirm = () => {
    if (confirmBlocked) return;
    document.getElementById("escrow-draft-quote-confirm")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!canSave) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 border-t border-ref-sun/20 bg-ink-950/95 backdrop-blur-md p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
      role="toolbar"
      aria-label={t("escrow_draftMobileActions_aria")}
    >
      <div className={`mx-auto flex max-w-lg gap-2 ${showSaveButton ? "" : ""}`}>
        {showSaveButton ? (
          <button
            type="button"
            disabled={saving}
            className={`flex-1 ${escrowExperienceSecondaryBtnClass} ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`}
            aria-busy={saving ? true : undefined}
            onClick={() => onSave()}
          >
            {saving ? t("common_loading") : t("escrow_saveItinerary")}
          </button>
        ) : null}
        <button
          type="button"
          className={`${showSaveButton ? "flex-1" : "w-full"} ${escrowExperiencePrimaryCtaClass} min-h-[48px] py-2.5 text-small ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950 ${confirmBlocked ? "opacity-55" : ""}`}
          onClick={scrollToConfirm}
          aria-disabled={confirmBlocked ? true : undefined}
          title={confirmBlocked && confirmBlockedReasonKey ? t(confirmBlockedReasonKey) : undefined}
        >
          {t("escrow_draftMobileGoConfirm")}
        </button>
      </div>
    </div>
  );
}
