"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_MARKETING_BTN_NETWORK_LINK_HOME,
  TT_MARKETING_HOME_HERO_NAV_TAB_ACTIVE,
  TT_MARKETING_HOME_HERO_NAV_TAB_INACTIVE,
} from "@/lib/marketingUi";

function HeroNavLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const warm = useCallback(() => {
    try {
      router.prefetch(href);
    } catch {
      /* noop */
    }
  }, [router, href]);

  return (
    <Link
      href={href}
      className={className}
      prefetch
      onPointerEnter={warm}
    >
      {children}
    </Link>
  );
}

/** `/` Hero 四链 Tab：自由市场 · 创新行程（当前页）· 向导列表 · 了解 TravelTrust 网络 */
function LandingHeroNavTabs({ marketHref = "/market" }: { marketHref?: string }) {
  const { t } = useTranslation();
  return (
    <nav
      className="flex flex-wrap justify-center gap-2 sm:gap-3"
      aria-label={t("landing_hero_nav_aria")}
    >
      <HeroNavLink href={marketHref} className={TT_MARKETING_HOME_HERO_NAV_TAB_INACTIVE}>
        {t("header_market")}
      </HeroNavLink>
      <a href="#form" className={TT_MARKETING_HOME_HERO_NAV_TAB_ACTIVE} aria-current="page">
        {t("landing_cta_create")}
        <span className="sr-only"> ({t("landing_nav_current_page")})</span>
      </a>
      <HeroNavLink href="/guides" className={TT_MARKETING_HOME_HERO_NAV_TAB_INACTIVE}>
        {t("landing_cta_guides")}
      </HeroNavLink>
      <HeroNavLink href="/traveltrust" className={TT_MARKETING_BTN_NETWORK_LINK_HOME}>
        {t("landing_cta_traveltrust_network")}
      </HeroNavLink>
    </nav>
  );
}

export default memo(LandingHeroNavTabs);
