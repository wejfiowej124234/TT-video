import Link from "next/link";

import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { escrowRateZoneClass as zoneClass } from "@/components/escrow/EscrowRateRouteSuspense";
import {
  escrowRateFooterLinkClass,
  escrowRateLinkClass,
  escrowRateMetaClass,
  TT_ESCROW_RATE_PAGE_SHELL,
} from "@/lib/escrowRateL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { RATE_NAV_FOCUS } from "./escrowRatePageModel";

type T = (key: string) => string;

export function EscrowRatePageEmptyIdView({ t }: { t: T }) {
  const linkClass = `${touchTargetLink44Classes} inline-flex items-center ${escrowRateLinkClass} ${RATE_NAV_FOCUS}`;
  return (
    <main
      className={`${TT_ESCROW_RATE_PAGE_SHELL} container py-8 md:py-12 max-w-3xl`}
      aria-label={t("rate_pageTitle")}
      data-tt-escrow-rate-page="1"
    >
      <div className={zoneClass}>
        <h1 className="sr-only">{t("common_errorMessage")}</h1>
        <p className={escrowRateMetaClass}>{t("common_errorMessage")}</p>
        <Link href="/orders" className={linkClass}>
          {t("escrow_backToOrders")}
        </Link>
        <ProductCrossNav
          ariaLabelKey="rate_relatedNav_aria"
          showGuides
          className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-slate-300"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center ${escrowRateFooterLinkClass} ${RATE_NAV_FOCUS}`}
          separatorClassName="text-slate-500"
        />
      </div>
    </main>
  );
}
