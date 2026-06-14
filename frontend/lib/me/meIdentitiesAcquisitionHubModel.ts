import type { MeIdentitySlotState } from "@/lib/meIdentitySlots";
import { ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF } from "@/lib/me/meIdentitiesCoreCardModel";

/** PD-009：收购为旅行者附加能力；Hub 卡片始终进子站，槽位只表示「发布就绪度」。 */
export type MeIdentitiesAcquisitionCardView = {
  href: typeof ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF;
  ctaLabelKey: "me_identities_card_acquisition_workspace_cta";
  statusLabelKey: string;
  statusPillState: MeIdentitySlotState;
  showStatus: boolean;
};

export function deriveMeIdentitiesAcquisitionCardView(
  rawSlotState: MeIdentitySlotState | null | undefined,
): MeIdentitiesAcquisitionCardView {
  const state = rawSlotState ?? "inactive";

  if (state === "active") {
    return {
      href: ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF,
      ctaLabelKey: "me_identities_card_acquisition_workspace_cta",
      statusLabelKey: "me_identities_acquisition_state_publish_ready",
      statusPillState: "active",
      showStatus: true,
    };
  }

  if (state === "restricted") {
    return {
      href: ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF,
      ctaLabelKey: "me_identities_card_acquisition_workspace_cta",
      statusLabelKey: "me_identity_state_restricted",
      statusPillState: "restricted",
      showStatus: true,
    };
  }

  return {
    href: ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF,
    ctaLabelKey: "me_identities_card_acquisition_workspace_cta",
    statusLabelKey: "me_identities_acquisition_state_browse_ready",
    statusPillState: "pending",
    showStatus: true,
  };
}
