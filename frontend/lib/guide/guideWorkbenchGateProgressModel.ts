/** @deprecated 准入 checklist 已迁至 `meSettingsTrustProgressModel`（Trust 唯一真源）；保留供回归对照。 */
import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import { guideProfileSettingsHrefFromWorkbench } from "@/lib/guide/guideProfileSettingsNav";
import { guideProfileSummaryHasContent } from "@/lib/guide/guideWorkbenchProfileSummaryModel";
import {
  shouldShowGuideRegistrationBanner,
  shouldShowGuideWorkbenchTrustAnomaly,
} from "@/lib/guide/guideWorkbenchWorkspaceL5";
import { ME_TRUST_KYC_STATUS_HREF } from "@/lib/me/meTrustKycL5";
import { formatKycStatusLabelCompact, type MeTrustSummary } from "@/lib/meTrust";
import { resolveGuideWorkbenchTrustCta } from "@/lib/guide/guideWorkbenchTrustCta";

import { GUIDE_WORKBENCH_MARKET_EXPOSURE_ANCHOR } from "./guideOrderCorridorModel";

export { GUIDE_WORKBENCH_MARKET_EXPOSURE_ANCHOR } from "./guideOrderCorridorModel";

export type GuideGateStepId = "registration" | "kyc" | "listing";

export type GuideGateStepState = "done" | "action" | "pending" | "blocked";

export type GuideWorkbenchGateStep = {
  id: GuideGateStepId;
  state: GuideGateStepState;
  labelKey: string;
  descKey: string;
  statusText: string;
  href?: string;
};

export type GuideWorkbenchGatePrimaryCta =
  | { kind: "link"; href: string; labelKey: string }
  | { kind: "refresh"; labelKey: string };

export type GuideWorkbenchGateProgressView = {
  variant: "onboarding" | "compact";
  titleKey: string;
  subtitleKey: string;
  steps: GuideWorkbenchGateStep[];
  primaryCta: GuideWorkbenchGatePrimaryCta;
  showRiskStrip: boolean;
  registrationPending: boolean;
  registrationRejected: boolean;
  registrationCodes: string[];
  registrationMessage: string;
};

function normKyc(kyc: string): string {
  return kyc.trim().toLowerCase();
}

function kycIsVerified(kyc: string): boolean {
  const s = normKyc(kyc);
  return s === "verified" || s === "approved";
}

function registrationState(trust: MeTrustSummary): {
  needsAttention: boolean;
  pending: boolean;
  rejected: boolean;
  suspended: boolean;
  unknown: boolean;
} {
  const raw = trust.guide_registration_status;
  if (raw == null || raw === "") {
    return { needsAttention: false, pending: false, rejected: false, suspended: false, unknown: false };
  }
  const s = raw.toLowerCase();
  if (s === "active") {
    return { needsAttention: false, pending: false, rejected: false, suspended: false, unknown: false };
  }
  const pending = s === "pending" || s === "pending_review";
  const rejected = s === "rejected";
  const suspended = s === "suspended";
  const unknown = !pending && !rejected && !suspended;
  return {
    needsAttention: shouldShowGuideRegistrationBanner(trust) || unknown,
    pending,
    rejected,
    suspended,
    unknown,
  };
}

function listingIsComplete(profile: MeGuideProfile | null | undefined): boolean {
  return guideProfileSummaryHasContent(profile);
}

/** 合并资质横幅 + 新向导引导 + 信任快照为单一准入进度（① · L5 数据链）。 */
export function resolveGuideWorkbenchGateProgress(input: {
  trust: MeTrustSummary;
  profile: MeGuideProfile | null | undefined;
  guideHasReceptionHistory: boolean;
  showInboxEmpty: boolean;
  t: (key: string) => string;
}): GuideWorkbenchGateProgressView | null {
  const { trust, profile, guideHasReceptionHistory, showInboxEmpty, t } = input;
  const reg = registrationState(trust);
  const kycDone = kycIsVerified(trust.kyc_status);
  const listingDone = listingIsComplete(profile);
  const riskAnomaly = shouldShowGuideWorkbenchTrustAnomaly(trust);

  const coreBlocking = reg.needsAttention || !kycDone || !listingDone;
  const riskOnly = !coreBlocking && riskAnomaly;
  if (!coreBlocking && !riskOnly) return null;

  const variant: GuideWorkbenchGateProgressView["variant"] =
    !guideHasReceptionHistory && showInboxEmpty ? "onboarding" : "compact";

  const steps: GuideWorkbenchGateStep[] = [];

  if (reg.needsAttention || variant === "onboarding") {
    const regState: GuideGateStepState = reg.needsAttention
      ? reg.pending
        ? "pending"
        : "action"
      : "done";
    steps.push({
      id: "registration",
      state: regState,
      labelKey: "guide_workbench_gate_step_registration",
      descKey: reg.rejected
        ? "guide_workbench_gate_step_registration_desc_rejected"
        : reg.pending
          ? "guide_workbench_gate_step_registration_desc_pending"
          : reg.suspended
            ? "guide_workbench_gate_step_registration_desc_suspended"
            : "guide_workbench_gate_step_registration_desc_ok",
      statusText: reg.needsAttention
        ? t(
            reg.pending
              ? "guide_workbench_gate_status_pending"
              : reg.rejected
                ? "guide_workbench_gate_status_rejected"
                : "guide_workbench_gate_status_attention",
          )
        : t("guide_workbench_gate_status_done"),
      href: reg.rejected ? "/guide/register" : undefined,
    });
  }

  steps.push({
    id: "kyc",
    state: kycDone ? "done" : "action",
    labelKey: "guide_workbench_gate_step_kyc",
    descKey: kycDone
      ? "guide_workbench_gate_step_kyc_desc_done"
      : "guide_workbench_gate_step_kyc_desc_action",
    statusText: formatKycStatusLabelCompact(trust.kyc_status, t),
    href: kycDone ? undefined : ME_TRUST_KYC_STATUS_HREF,
  });

  steps.push({
    id: "listing",
    state: !kycDone ? "blocked" : listingDone ? "done" : "action",
    labelKey: "guide_workbench_gate_step_listing",
    descKey: !kycDone
      ? "guide_workbench_gate_step_listing_desc_blocked"
      : listingDone
        ? "guide_workbench_gate_step_listing_desc_done"
        : "guide_workbench_gate_step_listing_desc_action",
    statusText: !kycDone
      ? t("guide_workbench_gate_status_locked")
      : listingDone
        ? t("guide_workbench_gate_status_done")
        : t("guide_workbench_gate_status_incomplete"),
    href:
      kycDone && !listingDone
        ? guideProfileSettingsHrefFromWorkbench()
        : listingDone
          ? `#${GUIDE_WORKBENCH_MARKET_EXPOSURE_ANCHOR}`
          : undefined,
  });

  let primaryCta: GuideWorkbenchGatePrimaryCta;
  if (reg.pending && reg.needsAttention) {
    primaryCta = { kind: "refresh", labelKey: "guide_registration_banner_refresh" };
  } else if (reg.rejected) {
    primaryCta = { kind: "link", href: "/guide/register", labelKey: "guide_workbench_gate_cta_registration" };
  } else if (!kycDone) {
    const kycCta = resolveGuideWorkbenchTrustCta(trust);
    primaryCta = { kind: "link", href: kycCta.href, labelKey: kycCta.labelKey };
  } else if (!listingDone) {
    primaryCta = {
      kind: "link",
      href: guideProfileSettingsHrefFromWorkbench(),
      labelKey: "guide_workbench_profile_summary_edit",
    };
  } else if (riskOnly) {
    const trustCta = resolveGuideWorkbenchTrustCta(trust);
    primaryCta = { kind: "link", href: trustCta.href, labelKey: trustCta.labelKey };
  } else {
    primaryCta = {
      kind: "link",
      href: `#${GUIDE_WORKBENCH_MARKET_EXPOSURE_ANCHOR}`,
      labelKey: "guide_workbench_gate_cta_market_exposure",
    };
  }

  const titleKey =
    variant === "onboarding"
      ? "guide_workbench_gate_title_onboarding"
      : "guide_workbench_gate_title_compact";
  const subtitleKey =
    variant === "onboarding"
      ? "guide_workbench_gate_subtitle_onboarding"
      : "guide_workbench_gate_subtitle_compact";

  return {
    variant,
    titleKey,
    subtitleKey,
    steps,
    primaryCta,
    showRiskStrip: riskAnomaly && kycDone,
    registrationPending: reg.pending,
    registrationRejected: reg.rejected,
    registrationCodes: trust.guide_registration_rejection_codes ?? [],
    registrationMessage: trust.guide_registration_rejection_message?.trim() ?? "",
  };
}
