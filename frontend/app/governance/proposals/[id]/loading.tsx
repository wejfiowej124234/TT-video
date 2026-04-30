"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 提案详情段骨架；与 `governance/proposals/loading` 同构 */
export default function GovernanceProposalDetailLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="mx-auto max-w-3xl p-8"
      role="status"
      aria-label={t("governance_proposal_detail_title")}
      aria-busy="true"
    >
      <div className="min-h-[44px] h-11 w-56 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" aria-hidden />
      <div className="mt-2 h-4 w-full max-w-xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" aria-hidden />
      <div className="mt-2 h-4 w-11/12 max-w-lg bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" aria-hidden />
      <div className="mt-8 flex gap-4" aria-hidden>
        <div className="h-4 w-28 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
        <div className="h-4 w-36 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
      </div>
      <p className="mt-8 text-meta text-ink-500 motion-sub animate-pulse motion-reduce:animate-none" aria-live="polite">
        {t("common_loading")}
      </p>
    </main>
  );
}
