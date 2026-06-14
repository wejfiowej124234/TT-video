import type { IdentitySlotBlockedReasonKey } from "@/lib/me/identitySlotBlockedReasonsModel";
import { normalizeIdentitySlotBlockedReasons } from "@/lib/me/identitySlotBlockedReasonsModel";

/** Application / review status labels · settings review panel (P2 · ①) */
export const IDENTITY_SLOT_APPLICATION_STATUS_I18N: Record<string, string> = {
  draft: "me_identities_core_phase_draft",
  submitted: "me_identities_core_phase_reviewing",
  reviewing: "me_identities_core_phase_reviewing",
  pending_review: "me_identities_core_phase_reviewing",
  pending: "me_identities_core_phase_reviewing",
  approved: "me_identities_core_phase_payment_pending",
  rejected: "me_identities_core_phase_restricted",
  active: "me_identities_core_phase_active",
  suspended: "me_identities_core_phase_restricted",
};

export function normalizeIdentitySlotApplicationStatus(raw?: string | null): string | null {
  const status = raw?.trim();
  return status || null;
}

/** Only `rejected` surfaces operator rejection codes / message (stale fields ignored elsewhere). */
export function identitySlotReviewShowsRejectionDetails(applicationStatus: string | null): boolean {
  return (applicationStatus?.toLowerCase() ?? "") === "rejected";
}

export type IdentitySlotReviewStatusView = {
  applicationStatus: string | null;
  statusLabelKey: string | null;
  rejectionCodes: string[];
  rejectionMessage: string | null;
  showRejectionDetails: boolean;
  showPanel: boolean;
};

export function resolveIdentitySlotReviewStatusView(input: {
  applicationStatus?: string | null;
  rejectionCodes?: string[] | null;
  rejectionMessage?: string | null;
}): IdentitySlotReviewStatusView {
  const applicationStatus = normalizeIdentitySlotApplicationStatus(input.applicationStatus);
  const showRejectionDetails = identitySlotReviewShowsRejectionDetails(applicationStatus);
  const rejectionCodes = showRejectionDetails
    ? (input.rejectionCodes ?? []).map((code) => code.trim()).filter(Boolean)
    : [];
  const rejectionMessage =
    showRejectionDetails && input.rejectionMessage?.trim() ? input.rejectionMessage.trim() : null;
  const statusLabelKey = applicationStatus
    ? IDENTITY_SLOT_APPLICATION_STATUS_I18N[applicationStatus.toLowerCase()] ?? null
    : null;
  const showPanel = Boolean(applicationStatus || rejectionCodes.length || rejectionMessage);

  return {
    applicationStatus,
    statusLabelKey,
    rejectionCodes,
    rejectionMessage,
    showRejectionDetails,
    showPanel,
  };
}

/**
 * Align blocked_reasons with review panel:
 * - active / approved: never show stale `review` chip
 * - rejected: review narrative lives in review panel only
 * - pending / reviewing: keep `review` in blocked list
 */
export function filterIdentitySlotBlockedReasonKeysForApplicationStatus(
  keys: readonly IdentitySlotBlockedReasonKey[],
  applicationStatus: string | null,
): IdentitySlotBlockedReasonKey[] {
  const status = applicationStatus?.toLowerCase() ?? "";
  if (status === "active" || status === "approved" || status === "rejected") {
    return keys.filter((key) => key !== "review");
  }
  return [...keys];
}

export function resolveIdentitySlotBlockedReasonKeys(
  raw: string[] | Record<string, boolean> | null | undefined,
  applicationStatus?: string | null,
): IdentitySlotBlockedReasonKey[] {
  const status = normalizeIdentitySlotApplicationStatus(applicationStatus);
  return filterIdentitySlotBlockedReasonKeysForApplicationStatus(
    normalizeIdentitySlotBlockedReasons(raw),
    status,
  );
}
