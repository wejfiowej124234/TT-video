"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

/** 旅行预约 / 商家 / 旅行收购：`/market` · `/market/provider` · `/market/acquisition`。 */
export default function MarketHubSubNav() {
  const { t } = useTranslation();
  const pathname = usePathname() ?? "";
  const travelActive = pathname === "/market" || pathname === "/market/";
  const providerActive = pathname.startsWith("/market/provider");
  const acquisitionActive = pathname.startsWith("/market/acquisition");

  const items: { href: string; labelKey: "market_hub_nav_travel" | "market_hub_nav_provider" | "market_hub_nav_acquisition"; active: boolean }[] = [
    { href: "/market", labelKey: "market_hub_nav_travel", active: travelActive },
    { href: "/market/provider", labelKey: "market_hub_nav_provider", active: providerActive },
    { href: "/market/acquisition", labelKey: "market_hub_nav_acquisition", active: acquisitionActive },
  ];

  return (
    <nav
      className="flex flex-wrap justify-center gap-2 rounded-[var(--radius-md)] border border-white/20 bg-white/[0.08] backdrop-blur-md backdrop-saturate-150 p-1.5 ring-1 ring-ref-cyan/20 shadow-[0_0_28px_-8px_rgba(35,206,217,0.12)]"
      aria-label={t("market_hub_nav_aria")}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={
            `${touchTargetLink44Classes} rounded-[var(--radius-sm)] px-3.5 py-2 text-small font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ` +
            (item.active
              ? "bg-gradient-to-r from-ref-teal/85 to-ref-cyan/75 text-white shadow-[0_0_20px_-4px_rgba(35,206,217,0.35)] ring-1 ring-ref-coral/25"
              : "text-white/85 hover:bg-white/10 hover:text-white " + travelFocusRingCoreOffset2Classes)
          }
          aria-current={item.active ? "page" : undefined}
        >
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
