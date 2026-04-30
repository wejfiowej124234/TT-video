"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 子站瀑布流底部：演示说明 + 次级导航（与筛选带上方 CTA 形成「列表终点」收口）。 */
export default function MarketSubsiteListFooterStrip({
  variant,
}: {
  variant: "provider" | "acquisition";
}) {
  const { t } = useTranslation();
  const board = variant === "provider" ? "provider" : "acquisition";
  const cta = variant === "provider" ? t("market_segment_provider_cta_did") : t("market_segment_acquisition_cta_did");

  return (
    <section
      className="mx-auto max-w-5xl border-t border-white/10 px-4 pb-12 pt-6"
      aria-label={t("market_subsite_list_footer_aria")}
    >
      <p className="max-w-3xl text-left text-meta leading-relaxed text-slate-400">{t("market_subsite_list_footer_notice")}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
        <Link
          href={`/did-rank?board=${board}`}
          className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-full border border-warning/45 bg-warning/12 px-5 py-2.5 text-small font-semibold text-white hover:bg-warning/22 ${travelFocusRingOffset2Classes}`}
        >
          {cta}
        </Link>
        <Link
          href="/market"
          className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-small font-medium text-slate-100 hover:bg-white/10 ${travelFocusRingOffset2Classes}`}
        >
          {t("market_segment_back_travel")}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta">
          <Link
            href="/terms"
            className={`${touchTargetLink44Classes} text-slate-300 underline decoration-white/30 underline-offset-4 hover:text-cyan-100 ${travelFocusRingOffset2Classes}`}
          >
            {t("market_subsite_demo_terms_cta")}
          </Link>
          <span className="text-slate-600" aria-hidden>
            ·
          </span>
          <Link
            href="/disputes"
            className={`${touchTargetLink44Classes} text-slate-300 underline decoration-white/25 underline-offset-4 hover:text-white ${travelFocusRingOffset2Classes}`}
          >
            {t("market_subsite_demo_disputes_cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
