import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import LoadingText from "@/components/LoadingText";
import { MarketAmbientBackdrop } from "@/components/market";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useTranslation } from "@/components/LocaleProvider";
import {
  GUIDE_DETAIL_CROSS_NAV_LINK_CLASS,
  GUIDE_DETAIL_CROSS_NAV_SEP_CLASS,
} from "./guideDetailPageConstants";

export function GuideDetailPageLoadingView() {
  const { t } = useTranslation();
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center gap-6 p-8"
      aria-label={t("guideDetail_title")}
      data-tt-guides-detail-page="1"
      data-tt-ui-generation="v2"
      data-tt-market-l5="1"
    >
      <MarketAmbientBackdrop />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <LoadingText />
        <ProductCrossNav
          ariaLabelKey="guide_detail_relatedNav_aria"
          showGuides
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400/90"
          linkClassName={`${touchTargetLink44Classes} ${GUIDE_DETAIL_CROSS_NAV_LINK_CLASS}`}
          separatorClassName={GUIDE_DETAIL_CROSS_NAV_SEP_CLASS}
        />
      </div>
    </main>
  );
}
