"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  MARKETING_FOOTER_PRODUCT_LINKS,
  MARKETING_SITE_FOOTER_ID,
} from "@/lib/marketingSiteFooter";
import {
  TT_MARKETING_HOME_FOOTER,
  TT_MARKETING_HOME_FOOTER_LINK,
} from "@/lib/marketingUi";

/** 54-S16、§2.9：页脚多栏；首页深色叠层上用 marketing 浅色字（V2 · TT-PH1-190） */
export default function LandingFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer
      id={MARKETING_SITE_FOOTER_ID}
      className={TT_MARKETING_HOME_FOOTER}
      role="contentinfo"
      data-tt-marketing-home-footer="1"
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-meta">
          <div>
            <h3 className="font-semibold text-slate-100 mb-3">{t("footer_col_about")}</h3>
            <p className="text-slate-300 mb-2 leading-relaxed">{t("footer_about_desc")}</p>
            <Link href="/market" className={TT_MARKETING_HOME_FOOTER_LINK}>
              {t("footer_link_about")}
            </Link>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 mb-3">{t("footer_col_product")}</h3>
            <ul className="space-y-2 text-slate-300">
              {MARKETING_FOOTER_PRODUCT_LINKS.map(({ href, labelKey }) => (
                <li key={href}>
                  <Link href={href} className={TT_MARKETING_HOME_FOOTER_LINK}>
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 mb-3">{t("footer_col_account")}</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/auth/login" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_login")}
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_register")}
                </Link>
              </li>
              <li>
                <Link href="/community/me" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_me")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 mb-3">{t("footer_col_legal")}</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/terms" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_terms")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms/community-guidelines" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_community_guidelines")}
                </Link>
              </li>
              <li>
                <Link href="/help" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_help")}
                </Link>
              </li>
              <li>
                <Link href="/community/feedback" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_feedback")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 mb-3">{t("footer_col_tech")}</h3>
            <TrustInfraWall />
            <ul className="mt-4 space-y-2 text-slate-300">
              <li>
                <Link href="/governance/fee-routes" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_governance_fee_routes")}
                </Link>
              </li>
              <li>
                <Link href="/traveltrust#fee-router" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("traveltrust_link_feeRouter")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-center space-y-1">
          <ProductCrossNav
            ariaLabelKey="landing_relatedNav_aria"
            showGuides
            className="mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400"
            linkClassName={TT_MARKETING_HOME_FOOTER_LINK}
            separatorClassName="text-slate-500"
          />
          <p className="text-meta text-slate-300 font-medium">
            {t("footer_copyright").replace("{{year}}", String(year))}
          </p>
          <p className="text-meta text-slate-400">{t("footer_tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
