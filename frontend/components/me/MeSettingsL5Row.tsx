"use client";

import Link from "next/link";
import { MeSettingsL5Icon } from "@/components/me/MeSettingsL5Icon";
import type { MeSettingsNavItem } from "@/lib/me/meSettingsNavModel";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

function Chevron() {
  return (
    <svg className={TT_ME_SETTINGS_L5.rowChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MeSettingsL5Row({
  item,
  label,
  desc,
  soonLabel,
}: {
  item: MeSettingsNavItem;
  label: string;
  desc?: string;
  soonLabel: string;
}) {
  const icon = (
    <span className={TT_ME_SETTINGS_L5.rowIcon} aria-hidden>
      <MeSettingsL5Icon id={item.iconId} />
    </span>
  );
  const text = (
    <span className={TT_ME_SETTINGS_L5.rowBody}>
      <span className={TT_ME_SETTINGS_L5.rowLabel}>{label}</span>
      {desc ? <span className={TT_ME_SETTINGS_L5.rowDesc}>{desc}</span> : null}
    </span>
  );

  if (item.comingSoon) {
    return (
      <div className={TT_ME_SETTINGS_L5.rowSoon} role="listitem">
        {icon}
        {text}
        <span className={TT_ME_SETTINGS_L5.badgeSoon}>{soonLabel}</span>
      </div>
    );
  }

  const soonBadge = item.partialSoon === true ? <span className={TT_ME_SETTINGS_L5.badgeSoon}>{soonLabel}</span> : null;

  if (item.staticOnly || !item.href) {
    return (
      <div className={TT_ME_SETTINGS_L5.rowStatic} role="listitem">
        {icon}
        {text}
      </div>
    );
  }

  const external = item.external === true;

  return (
    <Link
      href={item.href}
      className={TT_ME_SETTINGS_L5.row}
      role="listitem"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {icon}
      {text}
      {soonBadge}
      {external ? <ExternalIcon /> : <Chevron />}
    </Link>
  );
}

function ExternalIcon() {
  return (
    <svg
      className={TT_ME_SETTINGS_L5.rowExternalIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M14 3h7v7M10 14L21 3M21 14v7h-7M3 10v11h11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
