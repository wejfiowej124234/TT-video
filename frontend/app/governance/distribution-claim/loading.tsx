"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** /governance/distribution-claim：F 区链上 Claim 骨架；与治理读页 loading 同 i18n / motion-reduce 口径（96-16 D4/D8） */
export default function GovernanceDistributionClaimLoading() {
  const { t } = useTranslation();
  const panel =
    "rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft space-y-4";

  return (
    <main
      className="min-h-[60vh] mx-auto max-w-3xl px-4 py-8"
      role="status"
      aria-label={t("governance_claim_title")}
      aria-busy="true"
    >
      <div className="min-h-[44px] h-11 w-64 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none mb-3" aria-hidden />
      <div className="h-4 w-full max-w-xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none mb-2" aria-hidden />
      <div className="h-4 w-5/6 max-w-lg bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none mb-8" aria-hidden />

      <section className={panel} aria-hidden>
        <div className="h-5 w-40 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
        <div className="min-h-[44px] h-11 w-full max-w-md bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none mt-4" />
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="min-h-[44px] h-11 w-32 rounded-[var(--radius-sm)] bg-travel-500/20 animate-pulse motion-reduce:animate-none" />
          <div className="min-h-[44px] h-11 w-28 rounded-[var(--radius-sm)] bg-ink-200 animate-pulse motion-reduce:animate-none" />
        </div>
      </section>

      <p className="mt-8 text-center text-meta text-ink-500 motion-sub animate-pulse motion-reduce:animate-none" aria-live="polite">
        {t("common_loading")}
      </p>
    </main>
  );
}
