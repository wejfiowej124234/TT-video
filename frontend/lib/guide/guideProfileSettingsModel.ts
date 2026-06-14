import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import { DEFAULT_SETTLEMENT_CURRENCY_CODE } from "@/lib/defaultSettlementCurrency";
import { parseCommaList } from "@/lib/guide/guideRegisterGeo";
import type { GuideCardItem } from "@/lib/marketTypes";
import type { IdentitySlotPatchGateFields } from "@/lib/me/identitySlotSettingsGate";
import { resolveIdentityProfilePatchGate } from "@/lib/me/identitySlotSettingsGate";

export type GuideProfileFormDraft = {
  countryCode: string;
  city: string;
  publicTitle: string;
  languages: string;
  serviceTypes: string;
  bio: string;
  hourlyRate: string;
  avatarUrl: string;
};

export function guideProfileToForm(p: MeGuideProfile): GuideProfileFormDraft {
  return {
    countryCode: p.country_code ?? "",
    city: p.city ?? "",
    publicTitle: p.public_title ?? "",
    languages: (p.languages ?? []).join(", "),
    serviceTypes: (p.service_types ?? []).join(", "),
    bio: p.bio ?? "",
    hourlyRate: p.hourly_rate ?? "",
    avatarUrl: p.avatar_url ?? "",
  };
}

export function resolveGuideProfileApplicationStatus(profile: MeGuideProfile | null | undefined): string {
  return (profile?.application_status ?? profile?.status ?? "").trim().toLowerCase();
}

export type GuideProfileSettingsView = {
  applicationStatus: string;
  patchGate: ReturnType<typeof resolveIdentityProfilePatchGate>;
  formReadOnly: boolean;
  /** Active + patch allowed: hide review/blocked/materials/patch-gate chrome. */
  showOnboardingPanels: boolean;
};

export function resolveGuideProfileSettingsView(
  profile: MeGuideProfile | null | undefined,
): GuideProfileSettingsView {
  const patchGate = resolveIdentityProfilePatchGate(profile as IdentitySlotPatchGateFields | null);
  const applicationStatus = resolveGuideProfileApplicationStatus(profile);
  const isActiveEditable = patchGate.patchAllowed && applicationStatus === "active";
  return {
    applicationStatus,
    patchGate,
    formReadOnly: profile != null && !patchGate.patchAllowed,
    showOnboardingPanels: !isActiveEditable,
  };
}

export function buildGuideProfileMarketPreviewDraft(
  profile: MeGuideProfile | null,
  form: GuideProfileFormDraft,
  resolveAvatarUrl: (raw: string | null | undefined) => string | undefined,
): GuideCardItem {
  const avatarRaw = form.avatarUrl.trim() || profile?.avatar_url || "";
  return {
    id: profile?.guide_id ?? "preview-guide",
    user_id: "preview-user",
    city: form.city.trim() || profile?.city || "",
    country_code: form.countryCode.trim() || profile?.country_code || "CN",
    public_title: form.publicTitle.trim() || profile?.public_title || undefined,
    languages: parseCommaList(form.languages),
    service_types: parseCommaList(form.serviceTypes),
    bio: form.bio.trim() || profile?.bio || "",
    hourly_rate: form.hourlyRate.trim() || profile?.hourly_rate || undefined,
    hourly_currency: profile?.hourly_currency?.trim() || DEFAULT_SETTLEMENT_CURRENCY_CODE,
    avatar_url: resolveAvatarUrl(avatarRaw || undefined),
    status: profile?.application_status ?? profile?.status ?? "active",
  };
}
