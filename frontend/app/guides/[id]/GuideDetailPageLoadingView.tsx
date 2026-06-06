import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import LoadingText from "@/components/LoadingText";
import { MarketPageAmbientLayers } from "@/components/market";
import { marketCyanInlineLinkFocusClasses } from "@/lib/travelLinkFocus";
import { useTranslation } from "@/components/LocaleProvider";

export function GuideDetailPageLoadingView() {
  const { t } = useTranslation();
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center gap-6 p-8"
      aria-label={t("guideDetail_title")}
      data-tt-guides-detail-page="1"
      data-tt-ui-generation="v2"
    >
      <MarketPageAmbientLayers />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <LoadingText />
        <ProductCrossNav
          ariaLabelKey="guide_detail_relatedNav_aria"
          showGuides
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
          separatorClassName="text-slate-500"
        />
      </div>
    </main>
  );
}
