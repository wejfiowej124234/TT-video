"use client";

import type { LocaleTranslateFn } from "@/lib/i18n";

export type PublishDrawerTextTypePanelProps = {
  t: LocaleTranslateFn;
};

export function PublishDrawerTextTypePanel({ t }: PublishDrawerTextTypePanelProps) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-ref-sun/22 bg-ink-800/40 px-4 py-3" aria-label={t("community_publish_text_section")}>
      <p className="text-small text-slate-300">{t("community_publish_text_hint")}</p>
    </section>
  );
}
