/** Multi-Identity IA Full Closure · Hub + 账户导航 + onboarding 深链 SSOT（① · ACTIVE） */

export const ME_IDENTITIES_IA_CLOSURE_SPRINT_ID = "multi-identity-ia-full-closure-20260612" as const;

export const ME_IDENTITIES_IA_CLOSURE_PROBE = "multi-identity-ia-v1" as const;

/** Hub UI 仍属 ME-IDENTITIES-UI-FREEZE · 本 sprint 仅声明 IA/data-link ACTIVE */
export const ME_IDENTITIES_IA_CLOSURE_ACTIVE = true as const;

export const ME_IDENTITIES_HUB_FROZEN_MARKER = "me-identities-ui-frozen-20260526" as const;

/** 主理人 USDC 准入 · 工作台 A 轨（客户 UI A = USDC；spec 内部 B 轨 SKU） */
export const ME_IDENTITIES_STEWARD_ADMISSION_ANCHOR = "steward-b-track-admission" as const;

export const ME_IDENTITIES_IA_LOCALE_KEYS: readonly string[] = [
  "me_identities_hub_title",
  "me_identities_hub_subtitle",
  "me_identities_hub_footer_note",
  "me_identities_capabilities_section_title",
  "me_identities_operator_section_title",
  "me_identities_operator_section_hint",
  "me_identities_operator_section_expand",
  "me_identities_operator_grid_aria",
  "me_identities_card_provider_desc",
  "me_identities_card_steward_desc",
  "me_identities_card_guide_desc",
  "me_identities_profile_link_open",
  "nav_community_profile",
] as const;

/** ① 收口禁止回流：Hub footer 重复 onboarding · slot 覆盖 CTA · 主理人 onboarding 页身 */
export const ME_IDENTITIES_IA_BANNED_HUB_PATTERNS: readonly RegExp[] = [
  /me_identities_link_onboarding_provider/,
  /slotState && slotState !== "inactive"/,
  /buildIdentitiesApplyChildHref\("\/market\/acquisition"/,
  /MeOnboardingStewardJourneyBridge/,
  /MeOnboardingStewardStakeSection/,
];

export const ME_IDENTITIES_IA_SMOKE_VITEST_FILES: readonly string[] = [
  "meIdentitiesIaClosure",
  "meIdentitiesPage",
  "meIdentitiesUiFreeze",
  "meIdentitiesL5FullScore",
  "meIdentitySlotVisibility",
  "meIdentitiesProfileLinksModel",
  "stewardAdmissionNav",
  "meOnboardingPage",
  "accountNavNamingP3",
];

/** 纯旅行者默认折叠经营区；任一经营槽位非 inactive 则展开 */
export function meIdentitiesHubOperatorSectionDefaultOpen(
  slotStates: Readonly<Record<string, string | null | undefined>>,
): boolean {
  return (["guide", "merchant", "region_steward"] as const).some((id) => {
    const state = slotStates[id];
    return state != null && state !== "inactive";
  });
}
