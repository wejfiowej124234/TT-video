"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

/** P29 视图切换：Split（双栏）/ Orders（仅订单）/ Guides（仅向导）；glass 为 28 玻璃态 */
export type MarketView = "split" | "orders" | "guides";

export default function ViewSwitcher({
  value,
  onChange,
  glass,
}: {
  value: MarketView;
  onChange: (v: MarketView) => void;
  /** 28 玻璃态（深色背景上用） */
  glass?: boolean;
}) {
  const { t } = useTranslation();
  const options: { id: MarketView; label: string }[] = [
    { id: "split", label: t("view_split") },
    { id: "orders", label: t("view_orders") },
    { id: "guides", label: t("view_guides") },
  ];
  const wrapperClass = glass
    ? "flex rounded-[var(--radius-md)] border border-white/20 bg-white/[0.08] backdrop-blur-md backdrop-saturate-150 p-0.5 ring-1 ring-ref-cyan/20 shadow-[0_0_28px_-8px_rgba(35,206,217,0.12)]"
    : "flex rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft p-0.5";
  return (
    <div className={wrapperClass} role="tablist" aria-label={t("view_switch_aria")}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={
            glass
              ? `${touchTargetLink44Classes} rounded-[var(--radius-sm)] px-3 py-1.5 text-small font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  value === opt.id
                    ? "bg-gradient-to-r from-ref-teal/85 to-ref-cyan/75 text-white shadow-[0_0_20px_-4px_rgba(35,206,217,0.35)] ring-1 ring-ref-coral/25"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                }`
              : `${touchTargetLink44Classes} rounded-[var(--radius-sm)] px-3 py-1.5 text-small font-medium transition-colors ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console ${
                  value === opt.id ? "bg-bg-console text-ink-900 shadow-soft" : "text-ink-600 hover:text-ink-800"
                }`
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
