"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 params 页：标题 + 费率拆分区 + 国家表骨架 */
export default function GovernanceParamsLoading() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-4xl p-8" role="status" aria-label={t("governance_params_title")} aria-busy="true">
      <div className="min-h-[44px] h-11 w-64 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
      <div className="mt-2 h-4 w-full max-w-2xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
      <div className="mt-2 h-3 w-48 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />

      <section className="mt-8 space-y-3" aria-hidden>
        <div className="min-h-[44px] h-11 w-48 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="space-y-2 pl-2">
          <div className="h-4 w-3/4 max-w-md bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="h-4 w-2/3 max-w-sm bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        </div>
      </section>

      <section className="mt-10 overflow-x-auto" aria-hidden>
        <div className="min-h-[44px] h-11 w-56 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mb-3" />
        <table className="mt-3 w-full min-w-[640px] border-collapse text-left text-small">
          <thead>
            <tr className="border-b border-ink-200">
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="py-2 pr-3">
                  <div className="h-3 w-16 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, r) => (
              <tr key={r} className="border-b border-ink-100">
                {Array.from({ length: 7 }).map((_, c) => (
                  <td key={c} className="py-2 pr-3">
                    <div className="h-3 w-20 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-10 flex gap-4" aria-hidden>
        <div className="h-4 w-24 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="h-4 w-28 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
      </div>
    </main>
  );
}
