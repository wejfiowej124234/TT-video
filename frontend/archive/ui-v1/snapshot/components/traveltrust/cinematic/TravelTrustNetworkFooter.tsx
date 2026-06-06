"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { MARKETING_SITE_FOOTER_ID } from "@/lib/marketingSiteFooter";
import { TRAVELTRUST_V6_IN_PAGE_PLAN_HREF } from "@/lib/traveltrustPlanTripHref";
import { TravelTrustCinematicLowQualityToggle } from "./TravelTrustCinematicLowQualityToggle";
import { TravelTrustIllustrativeBadge } from "./TravelTrustIllustrativeBadge";

const TT_TRAVELTRUST_FOOTER_CROSS_LINK =
  "inline-flex min-h-[44px] max-w-[14rem] items-center truncate text-meta font-medium text-slate-400 underline-offset-2 hover:text-ref-cyan hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50";

const FOOTER_LINKS = [
  { href: "/help", key: "traveltrust_nav_help" },
  { href: "/governance", key: "traveltrust_nav_governance" },
  { href: "/privacy", key: "footer_link_privacy" },
  { href: TRAVELTRUST_V6_IN_PAGE_PLAN_HREF, key: "traveltrust_footer_plan" },
] as const;

export function TravelTrustNetworkFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative z-[10] left-1/2 mt-4 w-screen max-w-[100vw] -translate-x-1/2 border-t border-white/10 bg-ink-950/80 px-4 py-10 sm:px-6"
      data-tt-traveltrust-network-footer="1"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8 xl:px-12">
        <div>
          <p className="text-small font-semibold text-white">{t("traveltrust_title_brand")}</p>
          <p className="mt-2 max-w-md text-meta leading-relaxed text-slate-500">
            {t("traveltrust_footer_t2")}
          </p>
          <p className="mt-3" data-tt-traveltrust-page-illustrative-notice="1">
            <TravelTrustIllustrativeBadge />
          </p>
          <p
            className="mt-3 max-w-lg text-[11px] leading-relaxed text-slate-500"
            data-tt-traveltrust-footer-compliance="1"
          >
            {t("traveltrust_footer_compliance")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <TravelTrustCinematicLowQualityToggle />
        <nav aria-label={t("traveltrust_footer_nav_label")}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {FOOTER_LINKS.map(({ href, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  data-tt-traveltrust-plan-href={
                    href === TRAVELTRUST_V6_IN_PAGE_PLAN_HREF ? href : undefined
                  }
                  title={t(key)}
                  onClick={() =>
                    trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                      source: "footer",
                      target: href,
                    })
                  }
                  className="max-w-[14rem] truncate text-meta font-medium text-slate-300 underline-offset-2 hover:text-ref-cyan hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-white/8 px-4 pt-6 sm:px-6 lg:px-8 xl:px-12">
        <ProductCrossNav
          ariaLabelKey="traveltrust_footer_cross_nav_aria"
          showGuides
          className="mb-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta"
          linkClassName={TT_TRAVELTRUST_FOOTER_CROSS_LINK}
          separatorClassName="text-slate-600"
        />
        <p className="text-center">
          <Link
            href={`/#${MARKETING_SITE_FOOTER_ID}`}
            className={TT_TRAVELTRUST_FOOTER_CROSS_LINK}
            data-tt-traveltrust-footer-site-map="1"
            onClick={() =>
              trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                source: "footer",
                target: `/#${MARKETING_SITE_FOOTER_ID}`,
              })
            }
          >
            {t("traveltrust_footer_site_map")}
          </Link>
        </p>
        <p className="mt-4 text-center text-meta text-slate-600">
          {t("traveltrust_footer_copyright", { year: String(year) })}
        </p>
      </div>
    </footer>
  );
}
