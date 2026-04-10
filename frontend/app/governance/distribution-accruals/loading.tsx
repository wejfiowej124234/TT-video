"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 distribution-accruals 列表页骨架一致 */
export default function GovernanceDistributionAccrualsLoading() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-ink-800">
      <div className="h-8 w-64 animate-pulse rounded bg-ink-200" aria-hidden />
      <p className="mt-2 h-4 w-full max-w-2xl animate-pulse rounded bg-ink-100" aria-hidden />
      <p className="mt-6 text-meta text-ink-500">{t("common_loading")}</p>
    </main>
  );
}
