"use client";

import Link from "next/link";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { TT_MARKETING_DARK_ROUTE_INLINE_LINK, TT_MARKETING_DID_RANK_FOOTER_NAV_TEXT } from "@/lib/marketingUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type TFunc = (key: string) => string;

export default function DidRankPageFooter({ t }: { t: TFunc }) {
  return (
    <footer className="mt-6 sm:mt-8 text-center space-y-3">
      <ProductCrossNav
        ariaLabelKey="did_rank_relatedNav_aria"
        showGuides
        className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${TT_MARKETING_DID_RANK_FOOTER_NAV_TEXT}`}
        linkClassName={TT_MARKETING_DARK_ROUTE_INLINE_LINK}
        separatorClassName="text-ref-sun/35"
      />
      <div>
        <Link
          href="/"
          className={`${touchTargetLink44Classes} font-medium text-small ${TT_MARKETING_DARK_ROUTE_INLINE_LINK}`}
        >
          {t("didRank_back")}
        </Link>
      </div>
    </footer>
  );
}
