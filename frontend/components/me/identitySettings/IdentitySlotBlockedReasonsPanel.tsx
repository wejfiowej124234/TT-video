"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import {
  IDENTITY_SLOT_BLOCKED_REASON_I18N,
} from "@/lib/me/identitySlotBlockedReasonsModel";
import { resolveIdentitySlotBlockedReasonKeys } from "@/lib/me/identitySlotReviewStatusModel";

export type { IdentitySlotBlockedReasonKey } from "@/lib/me/identitySlotBlockedReasonsModel";
export {
  IDENTITY_SLOT_BLOCKED_REASON_KEYS,
  IDENTITY_SLOT_BLOCKED_REASON_I18N,
} from "@/lib/me/identitySlotBlockedReasonsModel";

export function IdentitySlotBlockedReasonsPanel({
  blockedReasons,
  applicationStatus,
}: {
  blockedReasons?: string[] | Record<string, boolean> | null;
  applicationStatus?: string | null;
}) {
  const { t } = useTranslation();
  const keys = resolveIdentitySlotBlockedReasonKeys(blockedReasons, applicationStatus);
  if (keys.length === 0) return null;

  return (
    <section
      className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard}
      data-tt-identity-slot-blocked-reasons="1"
      aria-labelledby="identity-slot-blocked-reasons-title"
    >
      <h2 id="identity-slot-blocked-reasons-title" className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionTitle}>
        {t("me_identities_blocked_title")}
      </h2>
      <ul className="mt-3 space-y-2" role="list">
        {keys.map((key) => (
          <li key={key} className="text-meta leading-relaxed text-slate-300/95">
            {t(IDENTITY_SLOT_BLOCKED_REASON_I18N[key])}
          </li>
        ))}
      </ul>
    </section>
  );
}
