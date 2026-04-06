"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { travelFocusRingCoreSoftOffset2Classes } from "@/lib/travelLinkFocus";

const FOOTER_LINK_CLASS =
  `inline-flex min-h-[44px] items-center justify-center text-ink-500 hover:text-travel-500 hover:underline transition-colors duration-150 rounded ${travelFocusRingCoreSoftOffset2Classes}`;

/** 54-S16、§2.9：页脚多栏（关于/产品/账户/法律/技术栈），仅 Web3 旅游相关；不含未运营社交链接；版权年 + 视觉优化 */
export default function LandingFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t-2 border-ref-teal/15 bg-bg-console/95 backdrop-blur-sm px-6 py-12 shadow-[0_-12px_40px_-20px_rgba(9,124,135,0.06)]" role="contentinfo">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-meta">
          <div>
            <h3 className="font-semibold text-ink-800 mb-3">{t("footer_col_about")}</h3>
            <p className="text-ink-600 mb-2 leading-relaxed">{t("footer_about_desc")}</p>
            <Link href="/market" className={FOOTER_LINK_CLASS}>{t("footer_link_about")}</Link>
          </div>
          <div>
            <h3 className="font-semibold text-ink-800 mb-3">{t("footer_col_product")}</h3>
            <ul className="space-y-2 text-ink-600">
              <li><Link href="/traveltrust" className={FOOTER_LINK_CLASS}>{t("footer_link_traveltrust_network")}</Link></li>
              <li><Link href="/market" className={FOOTER_LINK_CLASS}>{t("header_market")}</Link></li>
              <li><Link href="/itinerary/new" className={FOOTER_LINK_CLASS}>{t("footer_link_create")}</Link></li>
              <li><Link href="/orders" className={FOOTER_LINK_CLASS}>{t("footer_link_orders")}</Link></li>
              <li><Link href="/guides" className={FOOTER_LINK_CLASS}>{t("footer_link_guides")}</Link></li>
              <li><Link href="/community" className={FOOTER_LINK_CLASS}>{t("footer_link_community")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-ink-800 mb-3">{t("footer_col_account")}</h3>
            <ul className="space-y-2 text-ink-600">
              <li><Link href="/auth/login" className={FOOTER_LINK_CLASS}>{t("footer_link_login")}</Link></li>
              <li><Link href="/auth/register" className={FOOTER_LINK_CLASS}>{t("footer_link_register")}</Link></li>
              <li><Link href="/me" className={FOOTER_LINK_CLASS}>{t("footer_link_me")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-ink-800 mb-3">{t("footer_col_legal")}</h3>
            <ul className="space-y-2 text-ink-600">
              <li><Link href="/terms" className={FOOTER_LINK_CLASS}>{t("footer_link_terms")}</Link></li>
              <li><Link href="/privacy" className={FOOTER_LINK_CLASS}>{t("footer_link_privacy")}</Link></li>
              <li><Link href="/terms/community-guidelines" className={FOOTER_LINK_CLASS}>{t("footer_link_community_guidelines")}</Link></li>
              <li><Link href="/help" className={FOOTER_LINK_CLASS}>{t("footer_link_help")}</Link></li>
              <li><Link href="/community/feedback" className={FOOTER_LINK_CLASS}>{t("footer_link_feedback")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-ink-800 mb-3">{t("footer_col_tech")}</h3>
            <TrustInfraWall />
            <ul className="mt-4 space-y-2 text-ink-600">
              <li>
                <Link href="/governance/fee-routes" className={FOOTER_LINK_CLASS}>
                  {t("footer_link_governance_fee_routes")}
                </Link>
              </li>
              <li>
                <Link href="/traveltrust#fee-router" className={FOOTER_LINK_CLASS}>
                  {t("traveltrust_link_feeRouter")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-ink-100 text-center space-y-1">
          <ProductCrossNav
            ariaLabelKey="landing_relatedNav_aria"
            showGuides
            className="mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
            linkClassName={FOOTER_LINK_CLASS}
            separatorClassName="text-ink-300"
          />
          <p className="text-meta text-ink-500 font-medium">
            {t("footer_copyright").replace("{{year}}", String(year))}
          </p>
          <p className="text-meta text-ink-400">{t("footer_tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
