"use client";

import { memo } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { MARKETING_FOOTER_PRODUCT_LINKS } from "@/lib/marketingSiteFooter";
import {
  TT_MARKETING_HOME_FOOTER,
  TT_MARKETING_HOME_FOOTER_BODY,
  TT_MARKETING_HOME_FOOTER_CROSS_LINK,
  TT_MARKETING_HOME_FOOTER_DIVIDER,
  TT_MARKETING_HOME_FOOTER_HEADING,
  TT_MARKETING_HOME_FOOTER_LINK,
} from "@/lib/marketingUi";

/** 54-S16、§2.9：页脚多栏（关于/产品/账户/法律/技术栈），仅 Web3 旅游相关；不含未运营社交链接；版权年 + 视觉优化 */
function LandingFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className={TT_MARKETING_HOME_FOOTER} role="contentinfo">
      <div className="mx-auto max-w-5xl">
        <div className={`grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 ${TT_MARKETING_HOME_FOOTER_BODY}`}>
          <div className="col-span-2 sm:col-span-1">
            <h3 className={TT_MARKETING_HOME_FOOTER_HEADING}>{t("footer_col_about")}</h3>
            <p className="mb-3 max-w-xs leading-relaxed">{t("footer_about_desc")}</p>
            <Link href="/traveltrust" className={TT_MARKETING_HOME_FOOTER_LINK}>
              {t("footer_link_about")}
            </Link>
          </div>
          <div>
            <h3 className={TT_MARKETING_HOME_FOOTER_HEADING}>{t("footer_col_product")}</h3>
            <ul className="space-y-1">
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
            <h3 className={TT_MARKETING_HOME_FOOTER_HEADING}>{t("footer_col_account")}</h3>
            <ul className="space-y-1">
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
                <Link href="/me/settings/profile" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_me")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={TT_MARKETING_HOME_FOOTER_HEADING}>{t("footer_col_legal")}</h3>
            <ul className="space-y-1">
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
          <div className="col-span-2 sm:col-span-1">
            <h3 className={TT_MARKETING_HOME_FOOTER_HEADING}>{t("footer_col_trust")}</h3>
            <TrustInfraWall tone="dark" align="start" />
            <ul className="mt-3 space-y-1">
              <li>
                <Link href="/trust" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_trust_center")}
                </Link>
              </li>
              <li>
                <Link href="/governance" className={TT_MARKETING_HOME_FOOTER_LINK}>
                  {t("footer_link_governance_portal")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className={`mt-10 pt-6 text-center ${TT_MARKETING_HOME_FOOTER_DIVIDER}`}>
          <ProductCrossNav
            ariaLabelKey="landing_relatedNav_aria"
            showGuides
            hideFeeRouterLinks
            className="mb-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400"
            linkClassName={TT_MARKETING_HOME_FOOTER_CROSS_LINK}
            separatorClassName="text-slate-500"
          />
          <p className="text-meta font-medium text-slate-200">
            {t("footer_copyright").replace("{{year}}", String(year))}
          </p>
          <p className="mt-1 text-meta text-slate-400">{t("footer_tagline")}</p>
        </div>
      </div>
    </footer>
  );
}

export default memo(LandingFooter);
