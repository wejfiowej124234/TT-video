"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";

const SLOTS = ["traveltrust_allocation_slot_a", "traveltrust_allocation_slot_b", "traveltrust_allocation_slot_c"] as const;

/**
 * 85 §十五：档位 UI 壳；不展示与 84/CRM 未绑定的虚假进度百分比。
 */
export default function TravelTrustAllocationPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="mt-4 space-y-4" role="list">
      {SLOTS.map((labelKey) => (
        <div
          key={labelKey}
          role="listitem"
          className="rounded-[var(--radius-lg)] border border-white/12 bg-slate-900/50 backdrop-blur-md p-4 shadow-scifi-panel ring-1 ring-ref-cyan/15"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-small font-medium text-slate-100">{t(labelKey)}</span>
            <span className="text-meta text-slate-400">{t("traveltrust_allocation_row_status")}</span>
          </div>
          <div
            className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-ref-teal/15 ring-1 ring-ref-cyan/20"
            role="progressbar"
            aria-busy="true"
            aria-valuetext={t("traveltrust_allocation_bar_indeterminate")}
          >
            <div
              className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-transparent via-ref-cyan/55 to-transparent motion-safe:animate-traveltrust-shimmer motion-reduce:animate-none"
              aria-hidden
            />
          </div>
        </div>
      ))}
      <p className="text-meta leading-relaxed text-slate-300">{t("traveltrust_allocation_row_hint")}</p>
      <Link
        href="/market"
        className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-teal/40 bg-ref-teal/10 px-5 py-2 text-small font-semibold text-ref-teal motion-sub hover:bg-ref-cyan/15 hover:border-ref-cyan/50 ${communityCardLinkFocus}`}
      >
        {t("traveltrust_allocation_cta_market")}
      </Link>
    </div>
  );
}
