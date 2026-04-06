"use client";

import { useTranslation } from "@/components/LocaleProvider";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

const FOOTER_LINK =
  "inline-flex min-h-[44px] items-center justify-center text-white hover:underline rounded-[var(--radius-sm)] px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900/80";

export default function MarketPageFooter() {
  const { t } = useTranslation();
  return (
    <footer className="mt-12 border-t border-ref-cyan/20 px-4 py-8" role="contentinfo">
      <div className="rounded-[var(--radius-lg)] border border-white/20 bg-white/[0.07] backdrop-blur-md p-6 max-w-5xl mx-auto ring-1 ring-ref-coral/15 shadow-[0_0_40px_-12px_rgba(35,206,217,0.1)]">
        <TrustInfraWall />
        <ProductCrossNav
          ariaLabelKey="market_footer_nav_aria"
          showGuides
          className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-white/95"
          linkClassName={FOOTER_LINK}
          separatorClassName="text-white/40"
        />
      </div>
    </footer>
  );
}
