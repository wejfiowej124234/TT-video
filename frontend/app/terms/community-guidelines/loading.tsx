"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与社区规范页 **`bg-bg-console`** 浅色壳一致（**88 §3.5**） */
export default function CommunityGuidelinesLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="min-h-screen bg-bg-console py-12 px-4"
      role="status"
      aria-label={t("community_guidelines")}
      aria-busy="true"
    >
      <div className="mx-auto max-w-2xl" aria-hidden>
        <div className="min-h-[44px] h-11 w-48 max-w-full animate-pulse rounded-[var(--radius-sm)] bg-ink-200" />
        <div className="mt-2 h-4 w-full max-w-md animate-pulse rounded-[var(--radius-sm)] bg-ink-200" />
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded-[var(--radius-sm)] bg-ink-200/80" />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="min-h-[44px] h-11 w-28 animate-pulse rounded-[var(--radius-md)] bg-ink-200" />
          <div className="min-h-[44px] h-11 w-24 animate-pulse rounded-[var(--radius-md)] bg-ink-200/90" />
        </div>
      </div>
    </main>
  );
}
