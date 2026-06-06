"use client";

import { memo } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_BTN_SECONDARY_HOME_MARKET,
  TT_MARKETING_MARKET_L5_FLOW_BANNER_COUNT,
  TT_MARKETING_MARKET_L5_FLOW_BANNER_CTA_ROW,
  TT_MARKETING_MARKET_L5_FLOW_BANNER_FRAME,
  TT_MARKETING_MARKET_L5_FLOW_BANNER_INNER,
  TT_MARKETING_MARKET_L5_FLOW_BANNER_SUB,
  TT_MARKETING_MARKET_L5_FLOW_BANNER_TITLE,
  TT_MARKETING_MARKET_L5_PAGE_MAX,
} from "@/lib/marketingUi";

export type MarketFlowContextMode = "own-published" | "browse";

function OwnPublishedBannerTitle({ count }: { count: number }) {
  const { t } = useTranslation();
  const template = t("market_own_published_banner_title");
  const needle = "{{n}}";
  const idx = template.indexOf(needle);
  if (idx === -1) {
    return <>{template.replace(needle, String(count))}</>;
  }
  return (
    <>
      {template.slice(0, idx)}
      <span className={`tt-market-l5-banner-count ${TT_MARKETING_MARKET_L5_FLOW_BANNER_COUNT}`}>{count}</span>
      {template.slice(idx + needle.length)}
    </>
  );
}

function MarketFlowContextBanner({
  mode,
  ownPublishedCount = 0,
  multipleOwnOrders = false,
}: {
  mode: MarketFlowContextMode;
  ownPublishedCount?: number;
  multipleOwnOrders?: boolean;
}) {
  const { t } = useTranslation();

  const sub =
    mode === "own-published"
      ? multipleOwnOrders
        ? t("market_own_published_banner_sub_multi")
        : t("market_own_published_banner_sub")
      : t("market_flow_browse_banner_sub");

  return (
    <div className="px-4 flex justify-center" role="note">
      <div
        className={`${TT_MARKETING_MARKET_L5_PAGE_MAX} ${TT_MARKETING_MARKET_L5_FLOW_BANNER_FRAME}`}
        data-testid="market-flow-context-banner"
        data-tt-market-flow={mode}
      >
        <div className={TT_MARKETING_MARKET_L5_FLOW_BANNER_INNER}>
          <p className={TT_MARKETING_MARKET_L5_FLOW_BANNER_TITLE}>
            {mode === "own-published" ? (
              <OwnPublishedBannerTitle count={ownPublishedCount} />
            ) : (
              t("market_flow_browse_banner_title")
            )}
          </p>
          <p className={TT_MARKETING_MARKET_L5_FLOW_BANNER_SUB}>{sub}</p>
          {mode === "own-published" ? (
            <div className={TT_MARKETING_MARKET_L5_FLOW_BANNER_CTA_ROW}>
              <a
                href="#market-guides-section"
                className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_SECONDARY_HOME_MARKET}`}
              >
                {t("market_own_published_banner_cta_guides")}
              </a>
              <Link
                href="/orders"
                className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_SECONDARY_HOME_MARKET}`}
              >
                {t("market_subsite_cta_orders")}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default memo(MarketFlowContextBanner);
