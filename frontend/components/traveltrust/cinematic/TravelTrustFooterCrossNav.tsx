"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { MARKETING_SITE_FOOTER_ID } from "@/lib/marketingSiteFooter";
import {
  TT_FOOTER_CROSS_NAV_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import {
  TT_MARKETING_TRAVELTRUST_FOOTER_CROSS_NAV_TRUST_DETAILS,
  TT_MARKETING_TRAVELTRUST_FOOTER_CROSS_NAV_TRUST_SUMMARY,
} from "@/lib/marketingUi";

type CrossNavLink = {
  href: string;
  key: string;
  titleKey?: string;
  siteMap?: true;
};

const PRODUCT_LINKS: readonly CrossNavLink[] = [
  { href: "/traveltrust", key: "traveltrust_footer_network" },
  { href: "/", key: "traveltrust_footer_product_home" },
  { href: "/market", key: "header_market" },
  { href: "/orders", key: "itin_nav_orders" },
  { href: "/pay", key: "header_payHub" },
  { href: "/guides", key: "nav_guides" },
  { href: "/market/provider", key: "traveltrust_footer_merchant" },
  { href: "/market/acquisition", key: "traveltrust_footer_acquisition" },
  { href: "/community", key: "footer_link_community" },
  {
    href: `/#${MARKETING_SITE_FOOTER_ID}`,
    key: "traveltrust_footer_site_map_short",
    titleKey: "traveltrust_footer_site_map",
    siteMap: true,
  },
];

const TRUST_LINKS: readonly CrossNavLink[] = [
  { href: "/help", key: "help_title", titleKey: "traveltrust_footer_help_title" },
  { href: "/trust", key: "trust_nav_short" },
  { href: "/governance", key: "traveltrust_footer_governance_hub", titleKey: "traveltrust_start_governance_title" },
  {
    href: "/governance/fee-routes",
    key: "traveltrust_footer_fee_routes_short",
    titleKey: "traveltrust_footer_fee_routes_title",
  },
  { href: "/privacy", key: "footer_link_privacy" },
  { href: "/terms", key: "footer_link_terms" },
];

function CrossNavLinks({
  links,
  groupLabel,
}: {
  links: readonly CrossNavLink[];
  groupLabel: string;
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <ul className={TT_FOOTER_CROSS_NAV_L5.linkGridClass} aria-label={groupLabel}>
      {links.map(({ href, key, titleKey, siteMap }) => (
        <li key={href}>
          <motion.div
            whileHover={reduceMotion ? undefined : { y: -1 }}
            whileTap={reduceMotion ? undefined : TT_FOOTER_CROSS_NAV_L5.linkTap}
            data-tt-traveltrust-footer-cross-nav-tap-l5="1"
          >
            <Link
              href={href}
              className={`${
                siteMap ? TT_FOOTER_CROSS_NAV_L5.siteMapLinkClass : TT_FOOTER_CROSS_NAV_L5.crossLinkClass
              } ${TT_FOOTER_CROSS_NAV_L5.linkHoverClass}`}
              title={titleKey ? t(titleKey) : undefined}
              data-tt-traveltrust-footer-site-map={siteMap ? "1" : undefined}
              onClick={() =>
                trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                  source: siteMap ? "footer_site_map" : "footer_cross_nav",
                  target: href,
                })
              }
            >
              {t(key)}
            </Link>
          </motion.div>
        </li>
      ))}
    </ul>
  );
}

/** `/traveltrust` 页脚全站横链 */
export function TravelTrustFooterCrossNav() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const productLabel = t("traveltrust_footer_cross_nav_group_product");
  const trustLabel = t("traveltrust_footer_cross_nav_group_trust");

  return (
    <motion.div
      className={TT_FOOTER_CROSS_NAV_L5.shellClass}
      data-tt-traveltrust-footer-cross-nav-grouped="1"
      data-tt-traveltrust-footer-cross-nav-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={TT_FOOTER_CROSS_NAV_L5.groupEntrance}
    >
      <nav aria-label={productLabel} className={TT_FOOTER_CROSS_NAV_L5.productNavClass}>
        <p className={TT_FOOTER_CROSS_NAV_L5.groupTitleClass}>{productLabel}</p>
        <CrossNavLinks links={PRODUCT_LINKS} groupLabel={productLabel} />
      </nav>

      <details
        className={`${TT_MARKETING_TRAVELTRUST_FOOTER_CROSS_NAV_TRUST_DETAILS} ${TT_FOOTER_CROSS_NAV_L5.trustDetailsOpenClass} ${TT_FOOTER_CROSS_NAV_L5.trustDetailsMobileClass} md:hidden`}
        data-tt-traveltrust-footer-cross-nav-trust-collapsible="1"
        data-tt-traveltrust-footer-trust-details-warm-l5="1"
      >
        <summary className={`${TT_MARKETING_TRAVELTRUST_FOOTER_CROSS_NAV_TRUST_SUMMARY} ${TT_FOOTER_CROSS_NAV_L5.trustSummaryHover}`}>
          {trustLabel}
          <span aria-hidden className="text-slate-500 group-open:hidden">
            +
          </span>
          <span aria-hidden className="hidden text-slate-500 group-open:inline">
            −
          </span>
        </summary>
        <CrossNavLinks links={TRUST_LINKS} groupLabel={trustLabel} />
      </details>
      <nav className={TT_FOOTER_CROSS_NAV_L5.trustNavDesktopClass} aria-label={trustLabel}>
        <p className={TT_FOOTER_CROSS_NAV_L5.groupTitleClass}>{trustLabel}</p>
        <CrossNavLinks links={TRUST_LINKS} groupLabel={trustLabel} />
      </nav>
    </motion.div>
  );
}
