"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE,
  TT_MARKETING_MARKET_HUB_NAV_LINK_IDLE,
  TT_MARKETING_MARKET_HUB_NAV_SHELL,
} from "@/lib/marketingUi";

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
    ? TT_MARKETING_MARKET_HUB_NAV_SHELL
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
              ? `${touchTargetLink44Classes} px-3 py-1.5 text-small font-medium transition-colors ${
                  value === opt.id ? TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE : TT_MARKETING_MARKET_HUB_NAV_LINK_IDLE
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
