"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import MarketAmbientBackdrop from "@/components/market/MarketAmbientBackdrop";
import MarketHubSubNav from "@/components/market/MarketHubSubNav";
import MarketPageFooter from "@/components/market/MarketPageFooter";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 独立子站：`/market/provider` · `/market/acquisition`（与 `/market` 撮合列表无共享 client 状态）。 */
export default function MarketStandaloneBusinessPage({ variant }: { variant: "provider" | "acquisition" }) {
  const { t } = useTranslation();
  const isProvider = variant === "provider";
  const title = isProvider ? t("market_segment_provider_title") : t("market_segment_acquisition_title");
  const desc = isProvider ? t("market_segment_provider_desc") : t("market_segment_acquisition_desc");
  const cta = isProvider ? t("market_segment_provider_cta_did") : t("market_segment_acquisition_cta_did");
  const board = isProvider ? "provider" : "acquisition";
  const testId = isProvider ? "market-provider-page" : "market-acquisition-page";

  return (
    <main className="relative min-h-screen" aria-label={title} data-testid={testId}>
      <MarketAmbientBackdrop />
      <div className="relative z-10 isolate min-h-screen">
        <header className="px-4 pt-6 pb-2 text-center">
          <h1 className="text-h2 font-bold tracking-tight text-white drop-shadow-market-hero">{title}</h1>
          <p className="mt-2 text-body text-slate-100/90 max-w-2xl mx-auto">{t("market_standalone_subtitle")}</p>
        </header>
        <div className="flex justify-center px-4 mt-3">
          <div className="w-full max-w-4xl">
            <MarketHubSubNav />
          </div>
        </div>
        <section className="mx-auto max-w-3xl px-4 py-10" aria-labelledby="market-standalone-intro">
          <div className="rounded-[var(--radius-lg)] border border-amber-500/35 bg-slate-950/60 px-5 py-6 text-center shadow-[0_0_28px_-8px_rgba(245,158,11,0.18)] backdrop-blur-md">
            <p id="market-standalone-intro" className="text-body leading-relaxed text-slate-200/95">
              {desc}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={`/did-rank?board=${board}`}
                className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-full border border-amber-400/50 bg-amber-500/15 px-5 py-2.5 text-small font-semibold text-amber-50 hover:bg-amber-500/25 ${travelFocusRingOffset2Classes}`}
              >
                {cta}
              </Link>
              <Link
                href="/market"
                className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-small font-medium text-white hover:bg-white/15 ${travelFocusRingOffset2Classes}`}
              >
                {t("market_segment_back_travel")}
              </Link>
            </div>
          </div>
        </section>
        <MarketPageFooter />
      </div>
    </main>
  );
}
