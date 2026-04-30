"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 链上撮合 / Escrow / 争议 — 单行说明（与子站顶区一致）。 */
export default function MarketHeroTrustPills() {
  const { t } = useTranslation();
  return (
    <p className="mt-3 text-center text-meta leading-relaxed tracking-wide text-slate-400/95">
      <span className="text-slate-300/90">{t("market_hero_pill_match")}</span>
      <span className="mx-1.5 text-slate-600" aria-hidden>
        ·
      </span>
      <span className="text-slate-300/90">{t("market_hero_pill_escrow")}</span>
      <span className="mx-1.5 text-slate-600" aria-hidden>
        ·
      </span>
      <span className="text-ref-coral/90">{t("market_hero_pill_dispute")}</span>
    </p>
  );
}
