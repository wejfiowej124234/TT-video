"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

type Variant = "merchant" | "acquisition";

type Props = {
  variant: Variant;
  lead: ReactNode;
  extended: ReactNode;
};

/**
 * 必读合规折叠区：默认收起长文，降低首屏噪音；展开后保留完整提示。
 * 用于商家橱窗 / 旅行收购详情等深底页面。
 */
export default function MarketSubsiteComplianceDisclosure({ variant: _variant, lead, extended }: Props) {
  const { t } = useTranslation();
  const shell = TT_MARKETING_MARKET_DARK_PATH.subsiteComplianceShellMerchant;

  return (
    <details className={`mt-4 rounded-[var(--radius-md)] border backdrop-blur-md ${shell}`}>
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left text-small font-semibold text-slate-100 outline-none [&::-webkit-details-marker]:hidden ${travelFocusRingCoreOffset2Classes} rounded-[var(--radius-md)] focus-visible:ring-offset-ink-900`}
      >
        <span>{t("market_subsite_compliance_details_title")}</span>
        <svg
          className="h-4 w-4 shrink-0 text-ref-sun/70 transition-transform open:rotate-180 open:text-ref-sun motion-reduce:transition-none"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <div className={`space-y-3 border-t ${TT_MARKETING_MARKET_DARK_PATH.filterBarGlassDivider} px-4 pb-4 pt-3 text-meta leading-relaxed text-slate-200`}>
        <div>{lead}</div>
        <div>{extended}</div>
      </div>
    </details>
  );
}
