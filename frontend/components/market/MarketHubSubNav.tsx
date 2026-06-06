"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE,
  TT_MARKETING_MARKET_HUB_NAV_LINK_IDLE,
  TT_MARKETING_MARKET_HUB_NAV_SHELL,
} from "@/lib/marketingUi";

/** 旅行预约 / 商家 / 旅行收购：`/market` · `/market/provider` · `/market/acquisition`。 */
function MarketHubSubNav() {
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
      className={TT_MARKETING_MARKET_HUB_NAV_SHELL}
      aria-label={t("market_hub_nav_aria")}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={
            `${touchTargetLink44Classes} px-3.5 py-2 text-small transition-colors ` +
            (item.active ? TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE : TT_MARKETING_MARKET_HUB_NAV_LINK_IDLE)
          }
          aria-current={item.active ? "page" : undefined}
        >
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
  );
}

export default memo(MarketHubSubNav);
