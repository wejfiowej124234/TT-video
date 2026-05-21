"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import {
  TT_FOOTER_CROSS_NAV_L5,
  TT_FOOTER_L5_SEQUENTIAL,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import { traveltrustL5SequentialChildProps } from "./traveltrustSectionMotion";
import {
  TT_MARKETING_TRAVELTRUST_FOOTER_CROSS_NAV_TRUST_DETAILS,
  TT_MARKETING_TRAVELTRUST_FOOTER_CROSS_NAV_TRUST_SUMMARY,
} from "@/lib/marketingUi";

type CrossNavLink = {
  href: string;
  key: string;
  titleKey?: string;
  secondary?: boolean;
};

const PRODUCT_LINKS: readonly CrossNavLink[] = [
  { href: "/traveltrust#start", key: "traveltrust_footer_plan", titleKey: "traveltrust_start_cta" },
  { href: "/orders", key: "itin_nav_orders" },
  { href: "/pay", key: "header_payHub" },
  { href: "/guides", key: "nav_guides" },
  { href: "/market", key: "header_market" },
  { href: "/market/provider", key: "traveltrust_footer_merchant" },
  {
    href: "/market/acquisition",
    key: "traveltrust_footer_acquisition_secondary",
    titleKey: "traveltrust_footer_acquisition",
    secondary: true,
  },
  { href: "/community", key: "footer_link_community" },
  { href: "/", key: "traveltrust_footer_web3_home", titleKey: "traveltrust_footer_product_home" },
];

const TRUST_LINKS: readonly CrossNavLink[] = [
  { href: "/trust", key: "trust_nav_short" },
  { href: "/governance", key: "traveltrust_footer_governance_hub", titleKey: "traveltrust_start_governance_title" },
  {
    href: "/governance/fee-routes",
    key: "traveltrust_footer_fee_routes_short",
    titleKey: "traveltrust_footer_fee_routes_title",
  },
  { href: "/help", key: "help_title", titleKey: "traveltrust_footer_help_title" },
  { href: "/privacy", key: "footer_link_privacy" },
  { href: "/terms", key: "footer_link_terms" },
];

function CrossNavLinkGrid({
  links,
  groupLabel,
  linkWaveOffset = 0,
}: {
  links: readonly CrossNavLink[];
  groupLabel: string;
  linkWaveOffset?: number;
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <ul
      className={TT_FOOTER_CROSS_NAV_L5.linkGridClass}
      aria-label={groupLabel}
      data-tt-traveltrust-footer-cross-nav-links-l5="1"
    >
      {links.map(({ href, key, titleKey, secondary }, index) => (
        <motion.li
          key={`${href}-${key}`}
          className="list-none"
          {...traveltrustL5SequentialChildProps(index, reduceMotion, {
            baseDelay: linkWaveOffset + TT_FOOTER_L5_SEQUENTIAL.linkDelayChildren,
            step: TT_FOOTER_L5_SEQUENTIAL.linkStagger,
          })}
          data-tt-traveltrust-footer-cross-nav-link-index={String(index)}
        >
          <motion.div
            whileTap={reduceMotion ? undefined : TT_FOOTER_CROSS_NAV_L5.linkTap}
            data-tt-traveltrust-footer-cross-nav-tap-l5="1"
          >
            <Link
              href={href}
              className={`${TT_FOOTER_CROSS_NAV_L5.crossLinkClass} ${TT_FOOTER_CROSS_NAV_L5.linkHoverClass} ${
                secondary ? TT_FOOTER_CROSS_NAV_L5.secondaryLinkClass : ""
              }`}
              title={titleKey ? t(titleKey) : undefined}
              onClick={() =>
                trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                  source: "footer_cross_nav",
                  target: href,
                })
              }
            >
              {t(key)}
            </Link>
          </motion.div>
        </motion.li>
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
      <motion.nav
        aria-label={productLabel}
        className={TT_FOOTER_CROSS_NAV_L5.productNavClass}
        {...traveltrustL5SequentialChildProps(0, reduceMotion, { step: TT_FOOTER_L5_SEQUENTIAL.groupStagger })}
        data-tt-traveltrust-footer-cross-nav-group-l5="product"
      >
        <p className={TT_FOOTER_CROSS_NAV_L5.groupTitleClass}>{productLabel}</p>
        <CrossNavLinkGrid links={PRODUCT_LINKS} groupLabel={productLabel} linkWaveOffset={0} />
      </motion.nav>

      <details
        className={`${TT_MARKETING_TRAVELTRUST_FOOTER_CROSS_NAV_TRUST_DETAILS} ${TT_FOOTER_CROSS_NAV_L5.trustDetailsOpenClass} ${TT_FOOTER_CROSS_NAV_L5.trustDetailsMobileClass} sm:col-span-2 md:hidden`}
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
        <CrossNavLinkGrid
          links={TRUST_LINKS}
          groupLabel={trustLabel}
          linkWaveOffset={PRODUCT_LINKS.length * TT_FOOTER_L5_SEQUENTIAL.linkStagger}
        />
      </details>
      <motion.nav
        className={TT_FOOTER_CROSS_NAV_L5.trustNavDesktopClass}
        aria-label={trustLabel}
        {...traveltrustL5SequentialChildProps(1, reduceMotion, { step: TT_FOOTER_L5_SEQUENTIAL.groupStagger })}
        data-tt-traveltrust-footer-cross-nav-group-l5="trust"
      >
        <p className={TT_FOOTER_CROSS_NAV_L5.groupTitleClass}>{trustLabel}</p>
        <CrossNavLinkGrid
          links={TRUST_LINKS}
          groupLabel={trustLabel}
          linkWaveOffset={PRODUCT_LINKS.length * TT_FOOTER_L5_SEQUENTIAL.linkStagger}
        />
      </motion.nav>
    </motion.div>
  );
}
