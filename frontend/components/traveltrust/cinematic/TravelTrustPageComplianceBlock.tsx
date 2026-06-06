"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_PAGE_COMPLIANCE_L5,
  TT_TRAVELTRUST_MARKETING_WARM_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import {
  TT_MARKETING_TRAVELTRUST_FOOTER_COMPLIANCE_DETAILS,
  TT_MARKETING_TRAVELTRUST_FOOTER_COMPLIANCE_SUMMARY,
  TT_MARKETING_TRAVELTRUST_FOOTER_NAV_GROUP_TITLE,
} from "@/lib/marketingUi";
import { TravelTrustIllustrativeBadge } from "./TravelTrustIllustrativeBadge";

/** `#start` 底 · 品牌一句 + 合规折叠（含演示数据说明） */
export function TravelTrustPageComplianceBlock() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={TT_PAGE_COMPLIANCE_L5.shellClass}
      data-tt-traveltrust-start-about="1"
      data-tt-traveltrust-page-compliance-l5="1"
      data-tt-traveltrust-page-compliance-readable-l5="1"
      data-tt-traveltrust-start-footer-divider-unified-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={TT_PAGE_COMPLIANCE_L5.entrance}
    >
      <motion.div className={TT_PAGE_COMPLIANCE_L5.contentClass}>
        <h3 className={TT_MARKETING_TRAVELTRUST_FOOTER_NAV_GROUP_TITLE}>{t("traveltrust_start_about_title")}</h3>
        <p className={TT_PAGE_COMPLIANCE_L5.introClass}>{t("traveltrust_footer_t2")}</p>
        <motion.details
          className={`${TT_MARKETING_TRAVELTRUST_FOOTER_COMPLIANCE_DETAILS} mt-4 ${TT_PAGE_COMPLIANCE_L5.detailsClass}`}
          data-tt-traveltrust-footer-compliance="1"
          data-tt-traveltrust-page-compliance-details-l5="1"
          data-tt-traveltrust-page-compliance-details-warm-open-l5="1"
        >
          <motion.summary
            className={`${TT_TRAVELTRUST_MARKETING_WARM_L5.complianceSummaryClass} ${TT_PAGE_COMPLIANCE_L5.summaryWarmHover}`}
            whileTap={reduceMotion ? undefined : TT_PAGE_COMPLIANCE_L5.summaryTap}
          >
            {t("traveltrust_footer_compliance_summary")}
            <span aria-hidden className="text-slate-500 group-open:hidden">
              +
            </span>
            <span aria-hidden className="hidden text-slate-500 group-open:inline">
              −
            </span>
          </motion.summary>
          <motion.div className={TT_PAGE_COMPLIANCE_L5.detailsBodyClass}>
            <p data-tt-traveltrust-page-illustrative-notice="1">
              <TravelTrustIllustrativeBadge variant="footer" />
            </p>
            <p>{t("traveltrust_footer_compliance")}</p>
          </motion.div>
        </motion.details>
      </motion.div>
    </motion.div>
  );
}
