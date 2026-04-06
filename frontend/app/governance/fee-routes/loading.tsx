"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 fee-routes 页：标题 + 筛选槽 + 表格骨架 */
export default function GovernanceFeeRoutesLoading() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-6xl p-8" role="status" aria-label={t("governance_fee_routes_title")} aria-busy="true">
      <div className="min-h-[44px] h-11 w-72 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
      <div className="mt-2 h-4 w-full max-w-3xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
      <div className="mt-4 flex flex-wrap gap-2" aria-hidden>
        <div className="min-h-[44px] h-11 w-40 rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50 animate-pulse" />
        <div className="min-h-[44px] h-11 w-28 rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50 animate-pulse" />
      </div>
      <div className="mt-6 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200" aria-hidden>
        <table className="min-w-full border-collapse text-left text-small">
          <thead className="bg-ink-50">
            <tr>
              {Array.from({ length: 8 }).map((_, i) => (
                <th key={i} className="px-3 py-2">
                  <div className="h-3 w-12 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {Array.from({ length: 6 }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: 8 }).map((_, c) => (
                  <td key={c} className="px-3 py-2">
                    <div className="h-3 w-full max-w-[5rem] bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
