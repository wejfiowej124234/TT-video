export {
  ME_IDENTITIES_ACQUISITION_SETTINGS_HREF,
  ME_IDENTITIES_MERCHANT_SETTINGS_HREF,
  ME_IDENTITIES_STEWARD_SETTINGS_HREF,
} from "@/lib/me/meIdentitiesCoreCardModel";
import {
  ME_IDENTITIES_ACQUISITION_SETTINGS_HREF,
  ME_IDENTITIES_MERCHANT_SETTINGS_HREF,
  ME_IDENTITIES_STEWARD_SETTINGS_HREF,
} from "@/lib/me/meIdentitiesCoreCardModel";
import type { MeIdentitySlotState } from "@/lib/meIdentitySlots";

export const ME_IDENTITIES_GUIDE_SETTINGS_HREF = "/me/identities/guide/settings" as const;

export type MeIdentitiesProfileLinkId = "acquisition" | "guide" | "merchant" | "steward";

export type MeIdentitiesProfileLink = {
  id: MeIdentitiesProfileLinkId;
  labelKey: string;
  descKey: string;
  href: string;
};

function operatorProfileLinkVisible(
  roleMatch: boolean,
  slotState: MeIdentitySlotState | null | undefined,
): boolean {
  if (roleMatch) return true;
  return slotState === "active";
}

/** Hub「身份资料」：仅已开通身份（active / role 对齐）；审核中与未申请请用上方的申请卡片。 */
export function meIdentitiesProfileLinks(input: {
  loggedIn: boolean;
  userRole?: string | null;
  guideSlotState?: MeIdentitySlotState | null;
  merchantSlotState?: MeIdentitySlotState | null;
  stewardSlotState?: MeIdentitySlotState | null;
}): MeIdentitiesProfileLink[] {
  if (!input.loggedIn) return [];

  const links: MeIdentitiesProfileLink[] = [
    {
      id: "acquisition",
      labelKey: "me_identities_profile_link_acquisition",
      descKey: "me_identities_profile_link_acquisition_desc",
      href: ME_IDENTITIES_ACQUISITION_SETTINGS_HREF,
    },
  ];

  const role = (input.userRole ?? "").trim().toLowerCase();
  if (operatorProfileLinkVisible(role === "guide", input.guideSlotState)) {
    links.push({
      id: "guide",
      labelKey: "me_identities_profile_link_guide",
      descKey: "me_identities_profile_link_guide_desc",
      href: ME_IDENTITIES_GUIDE_SETTINGS_HREF,
    });
  }
  if (operatorProfileLinkVisible(role === "provider", input.merchantSlotState)) {
    links.push({
      id: "merchant",
      labelKey: "me_identities_profile_link_merchant",
      descKey: "me_identities_profile_link_merchant_desc",
      href: ME_IDENTITIES_MERCHANT_SETTINGS_HREF,
    });
  }
  if (operatorProfileLinkVisible(role === "region_steward", input.stewardSlotState)) {
    links.push({
      id: "steward",
      labelKey: "me_identities_profile_link_steward",
      descKey: "me_identities_profile_link_steward_desc",
      href: ME_IDENTITIES_STEWARD_SETTINGS_HREF,
    });
  }

  return links;
}
