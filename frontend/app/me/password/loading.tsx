"use client";

import { useTranslation } from "@/components/LocaleProvider";

const CARD = "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6";

/** 与 me/password 居中卡片表单一致 */
export default function MePasswordLoading() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-main flex items-center justify-center p-6" role="status" aria-label={t("mePassword_title")} aria-busy="true">
      <div className={`w-full max-w-md ${CARD} space-y-4`} aria-hidden>
        <div className="min-h-[44px] h-11 w-40 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-28 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-11 w-full border border-ink-200 rounded-[var(--radius-sm)] bg-bg-main animate-pulse" />
          </div>
        ))}
        <div className="min-h-[44px] h-11 w-full rounded-[var(--radius-sm)] bg-travel-500/25 border border-travel-500/40 animate-pulse" />
      </div>
    </main>
  );
}
