"use client";

import Link from "next/link";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";
import { GUIDE_WORKSPACE_HREF } from "@/lib/workspace/workspaceIdentityModel";

export function GuideProfileSettingsActiveBar({
  t,
}: {
  t: (key: string) => string;
}) {
  return (
    <section
      className={`${TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard} flex flex-wrap items-center justify-between gap-3 py-3`}
      data-tt-me-guide-profile-active-bar="1"
    >
      <p className="text-meta text-emerald-200/95">
        <span className="rounded-full border border-emerald-400/35 bg-emerald-950/40 px-2.5 py-0.5 text-small font-medium text-emerald-100">
          {t("me_identities_core_phase_active")}
        </span>
        <span className="ml-2 text-slate-300/90">{t("me_guide_profile_active_edit_hint")}</span>
      </p>
      <Link
        href={GUIDE_WORKSPACE_HREF}
        className={`text-meta text-ref-sun/88 underline ${authL5InlineLinkFocusClasses}`}
      >
        {t("me_guide_profile_open_workspace")}
      </Link>
    </section>
  );
}
