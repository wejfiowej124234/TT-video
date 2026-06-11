"use client";

import { useTranslation } from "@/components/LocaleProvider";
import type { DraftJourneyStep } from "../OrderFlowSteps";
import { escrowExperienceMetaClass } from "@/lib/escrowExperienceUi";

export interface EscrowDraftNextStepStripProps {
  draftJourneyStep: DraftJourneyStep;
  hasGuideAssigned: boolean;
  publishedToDiscover: boolean;
  itineraryDraftDirty: boolean;
  planLocked: boolean;
  guideAcceptPending?: boolean;
  bilateralPending?: boolean;
  /** 已有发布横幅主 CTA 时不重复提示 */
  hideWhenPublishedBanner?: boolean;
}

export default function EscrowDraftNextStepStrip({
  draftJourneyStep,
  hasGuideAssigned,
  publishedToDiscover,
  itineraryDraftDirty,
  planLocked,
  guideAcceptPending = false,
  bilateralPending = false,
  hideWhenPublishedBanner = false,
}: EscrowDraftNextStepStripProps) {
  const { t } = useTranslation();

  if (hideWhenPublishedBanner && publishedToDiscover && !hasGuideAssigned && !planLocked) {
    return null;
  }

  let messageKey = "escrow_draftNextStep_save";
  if (planLocked) {
    messageKey = "escrow_draftNextStep_pay";
  } else if (itineraryDraftDirty) {
    messageKey = "escrow_draftNextStep_saveDirty";
  } else if (bilateralPending) {
    messageKey = "escrow_draftNextStep_bilateral";
  } else if (guideAcceptPending) {
    messageKey = "escrow_draftNextStep_waitGuideAccept";
  } else if (!hasGuideAssigned && publishedToDiscover) {
    messageKey = "escrow_draftNextStep_pickGuide";
  } else if (!hasGuideAssigned) {
    messageKey = "escrow_draftNextStep_publish";
  } else if (draftJourneyStep === 3) {
    messageKey = "escrow_draftNextStep_confirm";
  }

  return (
    <div
      className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] px-4 py-2"
      role="status"
      aria-live="polite"
    >
      <p className={`${escrowExperienceMetaClass} m-0 text-white/75`}>
        {t("escrow_draftNextStep_label")} {t(messageKey)}
      </p>
    </div>
  );
}
