"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";

const SLOT_STATE_I18N: Record<string, string> = {
  active: "me_identities_core_phase_active",
  pending: "me_identities_core_phase_reviewing",
  inactive: "me_identities_core_phase_not_applied",
  restricted: "me_identities_core_phase_restricted",
};

export function IdentitySlotSettingsPatchGatePanel({
  slotState,
  patchAllowed,
}: {
  slotState: string;
  patchAllowed: boolean;
}) {
  const { t } = useTranslation();
  if (patchAllowed) return null;

  const phaseKey = SLOT_STATE_I18N[slotState.trim().toLowerCase()] ?? "me_identities_settings_patch_read_only";

  return (
    <section
      className={`${TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard} border-amber-500/30 bg-amber-950/20`}
      data-tt-identity-slot-patch-gate="1"
      role="status"
      aria-live="polite"
    >
      <p className="text-meta leading-relaxed text-amber-100/95">{t("me_identities_settings_patch_read_only")}</p>
      <p className="mt-2 text-meta text-slate-400">{t(phaseKey)}</p>
    </section>
  );
}
