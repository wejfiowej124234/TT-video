"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 应计分录详情段骨架；与列表页同 max-w-5xl */
export default function GovernanceDistributionAccrualDetailLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="mx-auto max-w-5xl px-4 py-8 text-ink-800"
      role="status"
      aria-label={t("governance_distribution_accruals_detail_title")}
      aria-busy="true"
    >
      <div className="h-4 w-40 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none mb-4" aria-hidden />
      <div className="h-8 w-72 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" aria-hidden />
      <div className="mt-2 h-4 w-full max-w-2xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" aria-hidden />
      <div className="mt-2 min-h-[44px] h-11 w-full max-w-lg bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" aria-hidden />
      <div className="mt-8 rounded-[var(--radius-md)] border border-ink-200 overflow-hidden" aria-hidden>
        <div className="h-10 w-full bg-ink-200/80 animate-pulse motion-reduce:animate-none" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 w-full border-t border-ink-100 bg-ink-50/80 animate-pulse motion-reduce:animate-none" />
        ))}
      </div>
      <p className="mt-6 text-meta text-ink-500">{t("common_loading")}</p>
    </main>
  );
}
