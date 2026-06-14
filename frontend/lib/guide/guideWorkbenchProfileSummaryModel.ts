import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";

import type { GuideCardItem } from "@/lib/marketTypes";

import {

  buildGuideProfileMarketPreviewDraft,

  guideProfileToForm,

} from "@/lib/guide/guideProfileSettingsModel";

import { resolveApiUploadUrl } from "@/lib/me/resolveApiUploadUrl";



export function guideProfileToMarketPreviewDraft(profile: MeGuideProfile): GuideCardItem {

  return buildGuideProfileMarketPreviewDraft(profile, guideProfileToForm(profile), (raw) =>

    resolveApiUploadUrl(raw?.trim() || undefined) || undefined,

  );

}



export function guidePublicDetailHref(profile: MeGuideProfile | null | undefined): string | null {
  const id = profile?.guide_id?.trim();
  if (!id) return null;
  if (profile?.public_detail_available === false) return null;
  return `/guides/${encodeURIComponent(id)}`;
}

/** 测试/演示挂牌未上公众 catalog 时，链至市场列表（按城市筛选）。 */
export function guidePublicMarketBrowseHref(profile: MeGuideProfile | null | undefined): string {
  const city = profile?.city?.trim();
  if (!city) return "/market";
  return `/market?city=${encodeURIComponent(city)}`;
}



export function guideProfileSummaryHasContent(profile: MeGuideProfile | null | undefined): boolean {

  if (!profile) return false;

  return Boolean(

    profile.city?.trim() ||

      profile.country_code?.trim() ||

      (profile.languages?.length ?? 0) > 0 ||

      (profile.service_types?.length ?? 0) > 0 ||

      profile.bio?.trim() ||

      profile.hourly_rate?.trim() ||

      profile.avatar_url?.trim(),

  );

}

/** 挂牌有内容但未设 public_title 时在工作台展示轻提示（① · L5）。 */
export function guideProfileMissingPublicTitle(profile: MeGuideProfile | null | undefined): boolean {
  if (!guideProfileSummaryHasContent(profile)) return false;
  const title = typeof profile?.public_title === "string" ? profile.public_title.trim() : "";
  return title === "";
}


