import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import type { MeIdentitySlotState } from "@/lib/meIdentitySlots";
import { meTrustStateLabelKey } from "@/components/me/meTrustSectionLabels";

export function publishHubGuideStatusLabelKey(
  profile: MeGuideProfile | null,
  slotState: MeIdentitySlotState | null | undefined,
): string {
  const app = (profile?.application_status ?? profile?.status ?? "").trim().toLowerCase();
  if (app === "approved" || app === "active") return "publish_hub_guide_status_active";
  if (app === "pending") return "publish_hub_guide_status_pending";
  if (app === "rejected") return "publish_hub_guide_status_rejected";
  if (app === "suspended") return "publish_hub_guide_status_suspended";
  if (slotState) return meTrustStateLabelKey(slotState);
  return "publish_hub_guide_status_none";
}

export function publishHubGuideHeadline(
  profile: MeGuideProfile | null,
  untitledKey: string,
): string {
  const title = profile?.public_title?.trim();
  if (title) return title;
  const city = profile?.city?.trim();
  const country = profile?.country_code?.trim();
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return untitledKey;
}

export function publishHubGuideHasListing(profile: MeGuideProfile | null): boolean {
  return Boolean(profile?.guide_id?.trim());
}
