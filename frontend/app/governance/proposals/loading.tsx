"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 proposals 占位页壳一致（轻量） */
export default function GovernanceProposalsLoading() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl p-8" role="status" aria-label={t("governance_proposals_title")} aria-busy="true">
      <div className="min-h-[44px] h-11 w-56 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
      <div className="mt-2 h-4 w-full max-w-xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
      <div className="mt-2 h-4 w-11/12 max-w-lg bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
      <div className="mt-8 flex gap-4" aria-hidden>
        <div className="h-4 w-28 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="h-4 w-36 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
      </div>
    </main>
  );
}
