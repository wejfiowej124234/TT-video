import Link from "next/link";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { MarketPageAmbientLayers } from "@/components/market";
import { marketCyanInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useTranslation } from "@/components/LocaleProvider";
import { GUIDE_DETAIL_PANEL_CLASS } from "./guideDetailPageConstants";

export function GuideDetailPageNotFoundView() {
  const { t } = useTranslation();
  return (
    <main
      className="relative min-h-screen flex items-center justify-center p-8"
      aria-label={t("guideDetail_title")}
      data-tt-guides-detail-page="1"
      data-tt-ui-generation="v2"
    >
      <MarketPageAmbientLayers />
      <div className="relative z-10 w-full max-w-md">
        <div className={`${GUIDE_DETAIL_PANEL_CLASS} p-6 w-full text-center`}>
          <h1 className="sr-only">{t("guideDetail_notFound")}</h1>
          <p className="text-body text-slate-200">{t("guideDetail_notFound")}</p>
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-small">
            <Link
              href="/guides"
              className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
            >
              {t("guideDetail_backList")}
            </Link>
            <Link
              href="/market"
              className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
            >
              {t("market_meta_title")}
            </Link>
          </p>
          <ProductCrossNav
            ariaLabelKey="guide_detail_relatedNav_aria"
            showGuides
            className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
            linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
            separatorClassName="text-slate-500"
          />
        </div>
      </div>
    </main>
  );
}
