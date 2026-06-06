"use client";

import { MeSettingsL5Icon } from "@/components/me/MeSettingsL5Icon";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

export function MeSettingsL5ActionRow({
  id,
  iconId,
  label,
  desc,
  onClick,
}: {
  id: string;
  iconId: string;
  label: string;
  desc?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={TT_ME_SETTINGS_L5.row}
      role="listitem"
      data-tt-me-settings-action={id}
      onClick={onClick}
    >
      <span className={TT_ME_SETTINGS_L5.rowIcon} aria-hidden>
        <MeSettingsL5Icon id={iconId} />
      </span>
      <span className={TT_ME_SETTINGS_L5.rowBody}>
        <span className={TT_ME_SETTINGS_L5.rowLabel}>{label}</span>
        {desc ? <span className={TT_ME_SETTINGS_L5.rowDesc}>{desc}</span> : null}
      </span>
      <svg
        className={TT_ME_SETTINGS_L5.rowChevron}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
