import { resolveIdentitySlotBlockedReasonKeys } from "@/lib/me/identitySlotReviewStatusModel";

/** Shared blocked-reason keys · settings panels + Hub cards (P2-3 · ①) */
export const IDENTITY_SLOT_BLOCKED_REASON_KEYS = [
  "wallet",
  "payment",
  "review",
  "stake",
  "bond",
  "suspend",
] as const;

export type IdentitySlotBlockedReasonKey = (typeof IDENTITY_SLOT_BLOCKED_REASON_KEYS)[number];

export const IDENTITY_SLOT_BLOCKED_REASON_I18N: Record<IdentitySlotBlockedReasonKey, string> = {
  wallet: "me_identities_blocked_wallet",
  payment: "me_identities_blocked_payment",
  review: "me_identities_blocked_review",
  stake: "me_identities_blocked_stake",
  bond: "me_identities_blocked_bond",
  suspend: "me_identities_blocked_suspend",
};

/** Hub cards show at most three operator-facing lines (P2-3). */
export const ME_IDENTITIES_HUB_BLOCKED_REASON_MAX_LINES = 3 as const;

export function normalizeIdentitySlotBlockedReasons(
  raw: string[] | Record<string, boolean> | null | undefined,
): IdentitySlotBlockedReasonKey[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((k) => k.trim().toLowerCase())
      .filter((k): k is IdentitySlotBlockedReasonKey =>
        (IDENTITY_SLOT_BLOCKED_REASON_KEYS as readonly string[]).includes(k),
      );
  }
  return IDENTITY_SLOT_BLOCKED_REASON_KEYS.filter((k) => Boolean(raw[k]));
}

export function formatIdentitySlotBlockedReasonLabels(
  raw: string[] | Record<string, boolean> | null | undefined,
  t: (key: string) => string,
  maxLines = ME_IDENTITIES_HUB_BLOCKED_REASON_MAX_LINES,
  applicationStatus?: string | null,
): string[] {
  return resolveIdentitySlotBlockedReasonKeys(raw, applicationStatus)
    .slice(0, maxLines)
    .map((key) => t(IDENTITY_SLOT_BLOCKED_REASON_I18N[key]));
}
