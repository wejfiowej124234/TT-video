"use client";

import { useId, useState } from "react";
import { MeSettingsL5Row } from "@/components/me/MeSettingsL5Row";
import type { UserShape } from "@/components/me/constants";
import { meSettingsHubSectionDefaultCollapsed } from "@/lib/me/meSettingsNavModel";
import type { MeSettingsNavItem, MeSettingsNavSection } from "@/lib/me/meSettingsNavModel";
import type { MeSettingsHubStatusSnapshot } from "@/lib/me/meSettingsNavEnrich";
import { meSettingsRowDescription } from "@/lib/me/meSettingsNavEnrich";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

function NavList({
  items,
  t,
  hubStatus,
  user,
  soonLabel,
}: {
  items: readonly MeSettingsNavItem[];
  t: (key: string, vars?: Record<string, string | number>) => string;
  hubStatus: MeSettingsHubStatusSnapshot;
  user: UserShape | null;
  soonLabel: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul className={TT_ME_SETTINGS_L5.sectionCard} role="list">
      {items.map((item) => (
        <li key={item.id} className="list-none">
          <MeSettingsL5Row
            item={item}
            label={t(item.labelKey)}
            desc={meSettingsRowDescription(item, t, hubStatus, user)}
            soonLabel={soonLabel}
          />
        </li>
      ))}
    </ul>
  );
}

export function MeSettingsHubSection({
  section,
  t,
  hubStatus,
  user,
  soonLabel,
}: {
  section: MeSettingsNavSection;
  t: (key: string, vars?: Record<string, string | number>) => string;
  hubStatus: MeSettingsHubStatusSnapshot;
  user: UserShape | null;
  soonLabel: string;
}) {
  const titleId = useId();
  const collapsible = meSettingsHubSectionDefaultCollapsed(section.id);
  const [open, setOpen] = useState(!collapsible);

  const list = (
    <NavList items={section.items} t={t} hubStatus={hubStatus} user={user} soonLabel={soonLabel} />
  );

  const hintBlock =
    section.hintKey != null ? (
      <p className={TT_ME_SETTINGS_L5.sectionCallout}>{t(section.hintKey)}</p>
    ) : null;

  return (
    <section className={TT_ME_SETTINGS_L5.section} aria-labelledby={titleId}>
      {collapsible ? (
        <button
          type="button"
          id={titleId}
          className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-lg px-1 py-1 text-left transition-colors motion-reduce:transition-none hover:bg-ref-sun/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={TT_ME_SETTINGS_L5.sectionTitle}>{t(section.labelKey)}</span>
          <span
            className={`text-ref-sun/60 transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
            aria-hidden
          >
            ›
          </span>
        </button>
      ) : (
        <h2 id={titleId} className={TT_ME_SETTINGS_L5.sectionTitle}>
          {t(section.labelKey)}
        </h2>
      )}
      {!collapsible ? hintBlock : open ? hintBlock : null}
      {collapsible ? (open ? list : null) : list}
    </section>
  );
}
