import {
  isProviderApplicationPending,
  isProviderApplicationRejected,
} from "@/lib/provider/providerRegisterValidation";
import {
  isStewardApplicationPending,
  isStewardApplicationRejected,
} from "@/lib/steward/stewardRegisterValidation";
import type { MeIdentitySlotState } from "@/lib/meIdentitySlots";
import {
  onboardingRoleConfirmedForQuote,
  parseOnboardingEntitlementsView,
  type OnboardingEntitlementsView,
} from "@/lib/me/meOnboardingViewModel";
import type { OnboardingQuoteRole } from "@/lib/apiClient";
import { parseMeTrustFromMeResponse, userFromGetMePayload } from "@/lib/meTrust";
import {
  roleApplicationStatusForSurface,
  type MeRoleApplicationRow,
} from "@/lib/me/roleApplications";

/** 商家资料 settings（Hub 已开通 / 待审槽 CTA） */
export const ME_IDENTITIES_MERCHANT_SETTINGS_HREF = "/me/identities/merchant/settings";

/** 主理人资料 settings（Hub 已开通 CTA） */
export const ME_IDENTITIES_STEWARD_SETTINGS_HREF = "/me/identities/region-steward/settings";

/** 收购资料 settings（Hub 非 inactive 槽 CTA） */
export const ME_IDENTITIES_ACQUISITION_SETTINGS_HREF = "/me/identities/acquisition/settings";

/** @deprecated 使用 `ME_IDENTITIES_MERCHANT_SETTINGS_HREF`；保留工作台深链 */
export const ME_IDENTITIES_PROVIDER_ACTIVE_HREF = "/market/provider";

/** 主理人区域治理工作台（settings 页内链；Hub active 改走 settings） */
export const ME_IDENTITIES_STEWARD_WORKSPACE_HREF = "/governance?view=region";

/** @deprecated 使用 `ME_IDENTITIES_STEWARD_SETTINGS_HREF` */
export const ME_IDENTITIES_STEWARD_ACTIVE_HREF = ME_IDENTITIES_STEWARD_SETTINGS_HREF;

/** Hub 核心轨（商家 / 主理人）细粒度阶段 */
export type MeIdentitiesCorePhase =
  | "not_applied"
  | "draft"
  | "reviewing"
  | "payment_pending"
  | "confirm_pending"
  | "active"
  | "restricted";

export type MeIdentitiesCoreSurface = "provider" | "steward";

export type MeIdentitiesCoreCardSignals = {
  surface: MeIdentitiesCoreSurface;
  loggedIn: boolean;
  userRole: string | null;
  slotState: MeIdentitySlotState | null;
  applicationStatus: string | null;
  hasRegistrationDraft: boolean;
  hasActivePaidEntitlement: boolean;
  hasPendingEntitlement: boolean;
};

export type MeIdentitiesCoreCardView = {
  phase: MeIdentitiesCorePhase;
  href: string;
  statusLabelKey: string;
  ctaLabelKey: string;
  statusPillState: MeIdentitySlotState | null;
};

export function meIdentitiesCoreQuoteRole(surface: MeIdentitiesCoreSurface): OnboardingQuoteRole {
  return surface === "steward" ? "region_steward" : "provider";
}

export function meIdentitiesCorePhaseLabelKey(phase: MeIdentitiesCorePhase): string {
  return `me_identities_core_phase_${phase}`;
}

export function meIdentitiesCorePhaseToPillState(phase: MeIdentitiesCorePhase): MeIdentitySlotState | null {
  switch (phase) {
    case "active":
      return "active";
    case "restricted":
      return "restricted";
    case "reviewing":
    case "payment_pending":
    case "confirm_pending":
    case "draft":
      return "pending";
    default:
      return null;
  }
}

function isProviderApplicationApproved(status: string | null): boolean {
  return status?.toLowerCase() === "approved";
}

function isStewardApplicationApproved(status: string | null): boolean {
  return status?.toLowerCase() === "approved";
}

function isApplicationInReview(surface: MeIdentitiesCoreSurface, status: string | null): boolean {
  if (!status) return false;
  if (status.toLowerCase() === "draft") return false;
  if (surface === "provider") return isProviderApplicationPending(status);
  return isStewardApplicationPending(status);
}

function isApplicationRejected(surface: MeIdentitiesCoreSurface, status: string | null): boolean {
  if (surface === "provider") return isProviderApplicationRejected(status);
  return isStewardApplicationRejected(status);
}

function isApplicationApproved(surface: MeIdentitiesCoreSurface, status: string | null): boolean {
  if (surface === "provider") return isProviderApplicationApproved(status);
  return isStewardApplicationApproved(status);
}

function roleActiveForSurface(surface: MeIdentitiesCoreSurface, userRole: string | null): boolean {
  const r = userRole?.trim().toLowerCase() ?? "";
  if (surface === "provider") return r === "provider";
  return r === "region_steward";
}

export function providerRegistrationDraftNonEmpty(draft: Record<string, unknown> | null | undefined): boolean {
  if (!draft || typeof draft !== "object") return false;
  return Object.entries(draft).some(([key, value]) => {
    if (key === "v") return false;
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isFinite(value);
    return true;
  });
}

export function parseProviderApplicationStatus(raw: unknown): string | null {
  const app = (raw as { application?: { status?: unknown } | null } | null)?.application;
  if (app == null) return null;
  const st = app.status;
  return typeof st === "string" && st.trim() !== "" ? st.trim() : null;
}

export function parseStewardApplicationStatus(raw: unknown): string | null {
  return parseProviderApplicationStatus(raw);
}

export function entitlementsViewForCoreSurface(
  view: OnboardingEntitlementsView | null,
  surface: MeIdentitiesCoreSurface,
): OnboardingEntitlementsView | null {
  if (!view) return null;
  const target = surface === "steward" ? "region_steward" : "provider";
  const items = view.items.filter((i) => i.roleTarget === target);
  if (items.length === 0) return null;
  const hasActivePaid = items.some((i) => {
    const s = i.status.toLowerCase();
    return s === "paid" || s === "active";
  });
  return { ...view, items, hasActivePaid };
}

export function parseMeIdentitiesCoreCardSignals(input: {
  surface: MeIdentitiesCoreSurface;
  loggedIn: boolean;
  mePayload: unknown;
  slotState: MeIdentitySlotState | null;
  providerApplicationRaw: unknown;
  stewardApplicationRaw: unknown;
  entitlementsRaw: unknown;
  providerRegistrationDraft: Record<string, unknown> | null;
  /** PD-007 · PG `role_applications`（优先于内存 provider/steward application） */
  roleApplications?: MeRoleApplicationRow[] | null;
}): MeIdentitiesCoreCardSignals {
  const user = userFromGetMePayload(input.mePayload);
  const trust = parseMeTrustFromMeResponse(input.mePayload, user);
  const fromRoleApplications = roleApplicationStatusForSurface(
    input.roleApplications,
    input.surface,
  );
  const applicationStatus =
    fromRoleApplications ??
    (input.surface === "provider"
      ? parseProviderApplicationStatus(input.providerApplicationRaw) ??
        trust.provider_registration_status ??
        null
      : parseStewardApplicationStatus(input.stewardApplicationRaw));

  const entView = entitlementsViewForCoreSurface(
    parseOnboardingEntitlementsView(input.entitlementsRaw),
    input.surface,
  );
  const hasActivePaidEntitlement = entView?.hasActivePaid ?? false;
  const hasPendingEntitlement =
    entView?.items.some((i) => i.status.toLowerCase() === "pending") ?? false;

  const hasRegistrationDraft =
    input.surface === "provider"
      ? providerRegistrationDraftNonEmpty(input.providerRegistrationDraft)
      : applicationStatus?.toLowerCase() === "draft";

  return {
    surface: input.surface,
    loggedIn: input.loggedIn,
    userRole: user?.role ?? null,
    slotState: input.slotState,
    applicationStatus,
    hasRegistrationDraft,
    hasActivePaidEntitlement,
    hasPendingEntitlement,
  };
}

export function deriveMeIdentitiesCoreCardView(
  signals: MeIdentitiesCoreCardSignals,
  hrefs: {
    applyHref: string;
    onboardingHref: string;
    activeHref: string;
  },
): MeIdentitiesCoreCardView {
  const { surface, applicationStatus, slotState } = signals;
  const phase = deriveMeIdentitiesCorePhase(signals);

  let href = hrefs.applyHref;
  let ctaLabelKey = "me_identities_card_cta";

  switch (phase) {
    case "active":
      href =
        surface === "provider"
          ? ME_IDENTITIES_MERCHANT_SETTINGS_HREF
          : surface === "steward"
            ? ME_IDENTITIES_STEWARD_SETTINGS_HREF
            : hrefs.activeHref;
      ctaLabelKey =
        surface === "provider"
          ? "me_identities_card_merchant_settings_cta"
          : surface === "steward"
            ? "me_identities_card_steward_settings_cta"
            : "me_identities_card_cta_active";
      break;
    case "restricted":
      ctaLabelKey = "me_identities_card_cta_reapply";
      break;
    case "confirm_pending":
      href = hrefs.onboardingHref;
      ctaLabelKey = "me_identities_card_cta_confirm_role";
      break;
    case "payment_pending":
      href = hrefs.onboardingHref;
      ctaLabelKey = "me_identities_card_cta_complete_payment";
      break;
    case "reviewing":
      href = hrefs.applyHref;
      ctaLabelKey = "me_identities_card_cta_review_progress";
      break;
    case "draft":
      href = hrefs.applyHref;
      ctaLabelKey = "me_identities_card_cta_continue_draft";
      break;
    default:
      href = hrefs.applyHref;
      ctaLabelKey = "me_identities_card_cta";
      break;
  }

  void applicationStatus;
  void slotState;

  return {
    phase,
    href,
    statusLabelKey: meIdentitiesCorePhaseLabelKey(phase),
    ctaLabelKey,
    statusPillState: meIdentitiesCorePhaseToPillState(phase),
  };
}

export function deriveMeIdentitiesCorePhase(signals: MeIdentitiesCoreCardSignals): MeIdentitiesCorePhase {
  const { surface, loggedIn, userRole, slotState, applicationStatus } = signals;

  if (roleActiveForSurface(surface, userRole) || slotState === "active") {
    return "active";
  }

  if (slotState === "restricted" || isApplicationRejected(surface, applicationStatus)) {
    return "restricted";
  }

  if (!loggedIn) {
    if (signals.hasRegistrationDraft) return "draft";
    return "not_applied";
  }

  if (signals.hasActivePaidEntitlement && !roleActiveForSurface(surface, userRole)) {
    return "confirm_pending";
  }

  if (isApplicationInReview(surface, applicationStatus)) {
    return "reviewing";
  }

  if (
    signals.hasPendingEntitlement ||
    isApplicationApproved(surface, applicationStatus) ||
    slotState === "pending"
  ) {
    return "payment_pending";
  }

  if (signals.hasRegistrationDraft || applicationStatus?.toLowerCase() === "draft") {
    return "draft";
  }

  return "not_applied";
}

/** 刷新后从 `GET /me` 恢复主理人/商家是否已 role-confirm（与 onboarding 页同源）。 */
export function meIdentitiesCoreRoleConfirmed(mePayload: unknown, surface: MeIdentitiesCoreSurface): boolean {
  return onboardingRoleConfirmedForQuote(mePayload, meIdentitiesCoreQuoteRole(surface));
}
