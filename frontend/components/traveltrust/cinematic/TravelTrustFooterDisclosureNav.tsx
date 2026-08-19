"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TT_FOOTER_DISCLOSURE_L5 } from "@/lib/traveltrust/l5";
import { TRAVELTRUST_FOOTER_DISCLOSURE_LINKS } from "@/lib/traveltrustListingDisclosure";

/** 版权行下的送审占位链：条款 / 隐私 / 品牌 / 审计说明 / 联系 */
export function TravelTrustFooterDisclosureNav() {
  const { t } = useTranslation();

  return (
    <nav
      className={TT_FOOTER_DISCLOSURE_L5.navClass}
      aria-label={t("traveltrust_footer_disclosure_aria")}
      data-tt-traveltrust-footer-disclosure="1"
    >
      {TRAVELTRUST_FOOTER_DISCLOSURE_LINKS.map((link, index) => (
        <span key={link.href} className={TT_FOOTER_DISCLOSURE_L5.itemClass}>
          {index > 0 ? (
            <span className={TT_FOOTER_DISCLOSURE_L5.sepClass} aria-hidden>
              ·
            </span>
          ) : null}
          <Link
            href={link.href}
            className={TT_FOOTER_DISCLOSURE_L5.linkClass}
            {...{ [link.marker]: "1" }}
            onClick={() =>
              trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                source: "footer_disclosure",
                target: link.href,
              })
            }
          >
            {t(link.labelKey)}
          </Link>
        </span>
      ))}
    </nav>
  );
}
