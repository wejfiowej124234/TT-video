"use client";

import { MeSettingsL5Icon } from "@/components/me/MeSettingsL5Icon";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

export function MeSettingsL5ToggleRow({
  id,
  iconId,
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  iconId: string;
  label: string;
  desc?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div
      className={TT_ME_SETTINGS_L5.toggleRow}
      role="listitem"
      data-tt-me-settings-toggle={id}
    >
      <span className={TT_ME_SETTINGS_L5.rowIcon} aria-hidden>
        <MeSettingsL5Icon id={iconId} />
      </span>
      <span className={TT_ME_SETTINGS_L5.rowBody}>
        <span className={TT_ME_SETTINGS_L5.rowLabel}>{label}</span>
        {desc ? <span className={TT_ME_SETTINGS_L5.rowDesc}>{desc}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        className={`${TT_ME_SETTINGS_L5.toggleSwitch} ${checked ? TT_ME_SETTINGS_L5.toggleSwitchOn : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span id={`${id}-label`} className="sr-only">
          {label}
        </span>
        <span
          className={`${TT_ME_SETTINGS_L5.toggleThumb} ${checked ? TT_ME_SETTINGS_L5.toggleThumbOn : ""}`}
          aria-hidden
        />
      </button>
    </div>
  );
}
