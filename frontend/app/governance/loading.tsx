"use client";

import LoadingText from "@/components/LoadingText";
import { useTranslation } from "@/components/LocaleProvider";

/** 51-F6/51-31-25：治理路由 loading，i18n 与读屏可播报 */
export default function GovernanceLoading() {
  const { t } = useTranslation();
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-8" role="status" aria-label={t("governance_title")} aria-busy="true">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="min-h-[44px] h-11 bg-ink-200 rounded-[var(--radius-sm)] w-48" aria-hidden />
        <div className="h-4 bg-ink-100 rounded-[var(--radius-sm)] w-32" aria-hidden />
        <LoadingText />
      </div>
    </main>
  );
}
