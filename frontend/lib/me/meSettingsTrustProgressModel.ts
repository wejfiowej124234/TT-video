import { guideProfileSummaryHasContent } from "@/lib/guide/guideWorkbenchProfileSummaryModel";
import { ME_IDENTITIES_GUIDE_SETTINGS_HREF } from "@/lib/me/meIdentitiesProfileLinksModel";
import { meSettingsNavExtensionHref } from "@/lib/me/meSettingsExtensionContext";
import { meSecurityHref } from "@/lib/me/meSecurityL5";
import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import type { MeTrustSummary } from "@/lib/meTrust";
import { formatKycStatusLabelCompact } from "@/lib/meTrust";

export type MeSettingsTrustChecklistStepId =
  | "email"
  | "wallet"
  | "kyc"
  | "guide_registration"
  | "guide_listing";

export type MeSettingsTrustChecklistStepState = "done" | "action" | "pending" | "blocked";

export type MeSettingsTrustChecklistStep = {
  id: MeSettingsTrustChecklistStepId;
  state: MeSettingsTrustChecklistStepState;
  labelKey: string;
  descKey: string;
  statusText?: string;
  href?: string;
};

export type MeSettingsTrustPrimaryCta =
  | {
      kind: "email_resend";
      labelKey: "me_settings_trust_primary_verify_email";
    }
  | {
      kind: "link";
      labelKey:
        | "me_settings_trust_primary_verify_wallet"
        | "me_settings_trust_primary_review_kyc"
        | "me_settings_trust_primary_guide_registration"
        | "me_settings_trust_primary_guide_listing";
      href: string;
    }
  | {
      kind: "complete";
      labelKey: "me_settings_trust_primary_all_complete";
      transparencyHref: string;
    };

export type MeSettingsTrustProgressView = {
  primaryCta: MeSettingsTrustPrimaryCta;
  checklist: MeSettingsTrustChecklistStep[];
  coreComplete: boolean;
  showKycDetail: boolean;
  showGuideAdmissionSection: boolean;
  transparencyHref: string;
  securityHref: string;
};

function normKyc(kyc: string): string {
  return kyc.trim().toLowerCase();
}

function kycIsVerified(kyc: string): boolean {
  const s = normKyc(kyc);
  return s === "verified" || s === "approved";
}

function kycIsPending(kyc: string): boolean {
  const s = normKyc(kyc);
  return s === "pending" || s === "in_review" || s === "submitted";
}

function kycNeedsAttention(kyc: string): boolean {
  const s = normKyc(kyc);
  if (kycIsVerified(kyc) || kycIsPending(kyc)) return false;
  return s === "" || s === "none" || s === "rejected" || s === "failed" || s === "declined";
}

function guideRegistrationNeedsAttention(status: string | null | undefined): boolean {
  const raw = status;
  if (raw == null || raw === "") return false;
  const s = raw.toLowerCase();
  if (s === "active") return false;
  return s === "pending" || s === "pending_review" || s === "rejected" || s === "suspended";
}

function guideRegistrationState(status: string | null | undefined): {
  needsAttention: boolean;
  pending: boolean;
  rejected: boolean;
  suspended: boolean;
} {
  const raw = status;
  if (raw == null || raw === "") {
    return { needsAttention: false, pending: false, rejected: false, suspended: false };
  }
  const s = raw.toLowerCase();
  if (s === "active") {
    return { needsAttention: false, pending: false, rejected: false, suspended: false };
  }
  const pending = s === "pending" || s === "pending_review";
  const rejected = s === "rejected";
  const suspended = s === "suspended";
  return {
    needsAttention: guideRegistrationNeedsAttention(status) || (!pending && !rejected && !suspended),
    pending,
    rejected,
    suspended,
  };
}

/** 向导经营准入：挂牌资料是否满足市场展示最低集 */
export function resolveMeSettingsTrustGuideListingComplete(profile: MeGuideProfile | null | undefined): boolean {
  return guideProfileSummaryHasContent(profile);
}

export function resolveMeSettingsTrustProgress(input: {
  emailVerified: boolean;
  trust: MeTrustSummary;
  t: (key: string) => string;
  /** 向导工作台已开通时传入 profile，用于挂牌准入步骤（Trust 唯一真源） */
  guideProfile?: MeGuideProfile | null;
  guideOperator?: boolean;
}): MeSettingsTrustProgressView {
  const { emailVerified, trust, t, guideProfile, guideOperator } = input;
  const transparencyHref = meSettingsNavExtensionHref("/trust");
  const securityHref = "/me/security";
  const walletHref = meSecurityHref("wallet");
  const guideSettingsHref = ME_IDENTITIES_GUIDE_SETTINGS_HREF;
  const showGuideAdmission = guideOperator === true;

  const checklist: MeSettingsTrustChecklistStep[] = [];

  checklist.push({
    id: "email",
    state: emailVerified ? "done" : "action",
    labelKey: "me_settings_trust_step_email",
    descKey: emailVerified
      ? "me_settings_trust_step_email_desc_verified"
      : "me_settings_trust_step_email_desc_use_form_above",
    statusText: emailVerified ? t("me_settings_hub_status_email_verified") : t("me_settings_hub_status_email_unverified"),
  });

  const walletDone = trust.wallet_linked;
  const walletBlocked = !emailVerified;
  checklist.push({
    id: "wallet",
    state: walletBlocked ? "blocked" : walletDone ? "done" : "action",
    labelKey: "me_settings_trust_step_wallet",
    descKey: walletBlocked
      ? walletDone
        ? "me_settings_trust_step_wallet_desc_blocked_linked"
        : "me_settings_trust_step_wallet_desc_blocked"
      : walletDone
        ? "me_settings_trust_step_wallet_desc_done"
        : "me_settings_trust_step_wallet_desc_action",
    statusText: walletBlocked
      ? t("me_settings_trust_step_status_locked")
      : walletDone
        ? t("me_settings_trust_step_wallet_status_done")
        : t("me_settings_trust_step_wallet_status_pending"),
    href: walletBlocked || walletDone ? undefined : walletHref,
  });

  const kyc = trust.kyc_status;
  const kycVerified = kycIsVerified(kyc);
  const kycPending = kycIsPending(kyc);
  checklist.push({
    id: "kyc",
    state: !emailVerified ? "blocked" : kycVerified ? "done" : kycPending ? "pending" : "action",
    labelKey: "me_settings_trust_step_kyc",
    descKey: !emailVerified
      ? "me_settings_trust_step_status_locked_hint"
      : kycVerified
        ? "me_settings_trust_step_kyc_desc_verified"
        : kycPending
          ? "me_settings_trust_step_kyc_desc_pending"
          : kycNeedsAttention(kyc) && normKyc(kyc) === "rejected"
            ? "me_settings_trust_step_kyc_desc_rejected"
            : "me_settings_trust_step_kyc_desc_action",
    statusText: !emailVerified ? t("me_settings_trust_step_status_locked") : formatKycStatusLabelCompact(kyc, t),
  });

  const listingComplete = resolveMeSettingsTrustGuideListingComplete(guideProfile);
  let guideRegOk = true;
  let guideListingOk = true;

  if (showGuideAdmission) {
    const reg = guideRegistrationState(trust.guide_registration_status);
    guideRegOk = !reg.needsAttention;
    guideListingOk = listingComplete;

    const regState: MeSettingsTrustChecklistStepState = reg.needsAttention
      ? reg.pending
        ? "pending"
        : "action"
      : "done";
    checklist.push({
      id: "guide_registration",
      state: regState,
      labelKey: "me_settings_trust_step_guide_registration",
      descKey: reg.rejected
        ? "me_settings_trust_step_guide_registration_desc_rejected"
        : reg.pending
          ? "me_settings_trust_step_guide_registration_desc_pending"
          : reg.suspended
            ? "me_settings_trust_step_guide_registration_desc_suspended"
            : reg.needsAttention
              ? "me_settings_trust_step_guide_registration_desc_attention"
              : "me_settings_trust_step_guide_registration_desc_ok",
      statusText: reg.needsAttention
        ? t(
            reg.pending
              ? "me_settings_trust_step_guide_registration_status_pending"
              : reg.rejected
                ? "me_settings_trust_step_guide_registration_status_rejected"
                : "me_settings_trust_step_guide_registration_status_attention",
          )
        : t("me_settings_trust_step_guide_registration_status_done"),
      href: reg.rejected ? "/guide/register" : undefined,
    });

    checklist.push({
      id: "guide_listing",
      state: !kycVerified ? "blocked" : listingComplete ? "done" : "action",
      labelKey: "me_settings_trust_step_guide_listing",
      descKey: !kycVerified
        ? "me_settings_trust_step_guide_listing_desc_blocked"
        : listingComplete
          ? "me_settings_trust_step_guide_listing_desc_done"
          : "me_settings_trust_step_guide_listing_desc_action",
      statusText: !kycVerified
        ? t("me_settings_trust_step_status_locked")
        : listingComplete
          ? t("me_settings_trust_step_guide_listing_status_done")
          : t("me_settings_trust_step_guide_listing_status_incomplete"),
      href: kycVerified && !listingComplete ? guideSettingsHref : undefined,
    });
  }

  const accountCoreComplete = emailVerified && walletDone && kycVerified;
  const coreComplete =
    accountCoreComplete && (!showGuideAdmission || (guideRegOk && guideListingOk));

  let primaryCta: MeSettingsTrustPrimaryCta;
  if (!emailVerified) {
    primaryCta = { kind: "email_resend", labelKey: "me_settings_trust_primary_verify_email" };
  } else if (!walletDone) {
    primaryCta = { kind: "link", labelKey: "me_settings_trust_primary_verify_wallet", href: walletHref };
  } else if (!kycVerified && !kycPending) {
    primaryCta = {
      kind: "link",
      labelKey: "me_settings_trust_primary_review_kyc",
      href: "#me-settings-trust-kyc-detail",
    };
  } else if (kycPending) {
    primaryCta = {
      kind: "link",
      labelKey: "me_settings_trust_primary_review_kyc",
      href: "#me-settings-trust-kyc-detail",
    };
  } else if (showGuideAdmission && guideRegistrationNeedsAttention(trust.guide_registration_status)) {
    const reg = guideRegistrationState(trust.guide_registration_status);
    primaryCta = {
      kind: "link",
      labelKey: "me_settings_trust_primary_guide_registration",
      href: reg.rejected ? "/guide/register" : "#me-settings-trust-progress-title",
    };
  } else if (showGuideAdmission && !listingComplete) {
    primaryCta = {
      kind: "link",
      labelKey: "me_settings_trust_primary_guide_listing",
      href: guideSettingsHref,
    };
  } else {
    primaryCta = {
      kind: "complete",
      labelKey: "me_settings_trust_primary_all_complete",
      transparencyHref,
    };
  }

  return {
    primaryCta,
    checklist,
    coreComplete,
    showKycDetail: emailVerified && !kycVerified,
    showGuideAdmissionSection: showGuideAdmission,
    transparencyHref,
    securityHref,
  };
}
