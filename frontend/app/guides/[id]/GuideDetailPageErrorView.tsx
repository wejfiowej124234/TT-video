import type { FormEvent } from "react";
import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { MarketPageAmbientLayers } from "@/components/market";
import { marketCyanInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL_COMPACT } from "@/lib/marketingUi";
import { useTranslation } from "@/components/LocaleProvider";
import { GUIDE_DETAIL_PANEL_CLASS } from "./guideDetailPageConstants";

export function GuideDetailPageErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
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
        <div className={`${GUIDE_DETAIL_PANEL_CLASS} p-6 w-full text-center space-y-3`}>
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
