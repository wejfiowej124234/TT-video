import type { MeMerchantProfile } from "@/lib/apiClient/meMerchantProfile";
import { MERCHANT_PUBLIC_HREF } from "@/lib/workspace/workspaceIdentityModel";

export function merchantProfileSummaryHasContent(profile: MeMerchantProfile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.shop_name?.trim() ||
      profile.city?.trim() ||
      profile.country_code?.trim() ||
      (profile.categories?.length ?? 0) > 0 ||
      profile.bio?.trim() ||
      profile.avatar_url?.trim() ||
      profile.cover_url?.trim(),
  );
}

export function merchantPublicShowcaseHref(): string {
  return MERCHANT_PUBLIC_HREF;
}
