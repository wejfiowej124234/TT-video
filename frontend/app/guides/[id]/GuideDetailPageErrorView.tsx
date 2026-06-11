import type { FormEvent } from "react";
import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { MarketAmbientBackdrop } from "@/components/market";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL_COMPACT } from "@/lib/marketingUi";
import { useTranslation } from "@/components/LocaleProvider";
import {
  GUIDE_DETAIL_BREADCRUMB_LINK_CLASS,
  GUIDE_DETAIL_CROSS_NAV_LINK_CLASS,
  GUIDE_DETAIL_CROSS_NAV_SEP_CLASS,
  GUIDE_DETAIL_PANEL_FRAME_CLASS,
  GUIDE_DETAIL_PANEL_INNER_CLASS,
} from "./guideDetailPageConstants";

export function GuideDetailPageErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const inlineLink = `${touchTargetLink44Classes} ${GUIDE_DETAIL_BREADCRUMB_LINK_CLASS}`;
  return (
    <main
      className="relative min-h-screen flex items-center justify-center p-8"
      aria-label={t("guideDetail_title")}
      data-tt-guides-detail-page="1"
      data-tt-ui-generation="v2"
      data-tt-market-l5="1"
    >
      <MarketAmbientBackdrop />
      <div className="relative z-10 w-full max-w-md">
        <div className={GUIDE_DETAIL_PANEL_FRAME_CLASS}>
          <div className={`${GUIDE_DETAIL_PANEL_INNER_CLASS} p-6 w-full text-center space-y-3`}>
            <h1 className="sr-only">{t("guideDetail_title")}</h1>
            <ApiErrorAlert message={message} tone="dark" />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                onRetry();
              }}
            >
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`${TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL_COMPACT} rounded-full px-4 py-2`}
              >
                {t("common_retry")}
              </button>
            </form>
            <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-small">
              <Link href="/guides" className={inlineLink}>
                {t("guideDetail_backList")}
              </Link>
              <Link href="/market" className={inlineLink}>
                {t("market_hero_title")}
              </Link>
            </p>
            <ProductCrossNav
              ariaLabelKey="guide_detail_relatedNav_aria"
              showGuides
              className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400/90"
              linkClassName={`${touchTargetLink44Classes} ${GUIDE_DETAIL_CROSS_NAV_LINK_CLASS}`}
              separatorClassName={GUIDE_DETAIL_CROSS_NAV_SEP_CLASS}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
