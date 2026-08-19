"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import {
  formatTraveltrustTtgAmount,
  listTraveltrustTtgPublicRounds,
  resolveTraveltrustTtgRoundDistributionText,
  traveltrustTtgRoundStatusLabelKey,
} from "@/lib/traveltrustTtgPublicRounds";
import { TT_FAQ_ACCORDION_L5, TT_PULSE_UPDATES_PANEL_L5, TT_ROADMAP_L5 } from "@/lib/traveltrust/l5";

function roundStatusClass(status: string): string {
  switch (status) {
    case "active":
      return TT_ROADMAP_L5.tierLiveClass;
    case "paused":
      return "border-amber-400/30 bg-amber-400/8 text-amber-200/95";
    case "closed":
      return "border-slate-500/30 bg-slate-500/10 text-slate-300/90";
    case "cancelled":
      return "border-rose-500/25 bg-rose-500/8 text-rose-200/85";
    case "governance_approval_required":
      return "border-violet-400/30 bg-violet-400/8 text-violet-200/95";
    default:
      return TT_ROADMAP_L5.tierUpcomingClass;
  }
}

/** TTG 公众认购三轮 · 用户向周期卡 */
export function TravelTrustTtgRoundPanel() {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const rounds = listTraveltrustTtgPublicRounds();

  return (
    <div data-tt-traveltrust-ttg-round-panel="1">
      <p
        className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-meta leading-relaxed text-amber-100/90"
        data-tt-traveltrust-ttg-disclaimer="1"
      >
        {t("traveltrust_ttg_round_disclaimer")}
      </p>
      <div className="grid gap-3 sm:grid-cols-3" role="list">
        {rounds.map((round, index) => {
          const distributionText = resolveTraveltrustTtgRoundDistributionText(round, t, locale ?? "en");
          return (
            <motion.article
              key={round.id}
              role="listitem"
              className={`${TT_FAQ_ACCORDION_L5.warmPlateClass} flex flex-col gap-3 p-4 sm:p-5`}
              data-tt-traveltrust-ttg-round={round.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.05 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ref-sun/80">
                  {t("traveltrust_ttg_round_label", { n: round.roundNumber })}
                </p>
                <span className={`${TT_ROADMAP_L5.statusBadgeClass} ${roundStatusClass(round.status)}`}>
                  {t(traveltrustTtgRoundStatusLabelKey(round.status))}
                </span>
              </div>
              <h3 className="text-small font-semibold leading-snug text-slate-50">{t(round.titleKey)}</h3>
              <dl className="space-y-2 text-meta text-slate-300/92">
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-slate-400/90">{t("traveltrust_ttg_round_allocation")}</dt>
                  <dd className="font-mono tabular-nums text-right text-slate-100">
                    {formatTraveltrustTtgAmount(round.allocationTtg, locale ?? "en")} TTG
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-slate-400/90">{t("traveltrust_ttg_round_wallet_cap")}</dt>
                  <dd className="font-mono tabular-nums text-right text-slate-100">
                    {round.perWalletCapTtg === 0
                      ? t("traveltrust_ttg_round_wallet_cap_none")
                      : `${formatTraveltrustTtgAmount(round.perWalletCapTtg, locale ?? "en")} TTG`}
                  </dd>
                </div>
                <div className="border-t border-white/6 pt-2.5">
                  <dt className="text-slate-400/90">{t("traveltrust_ttg_round_distribution")}</dt>
                  <dd className="mt-1.5 leading-relaxed text-slate-100/95">{distributionText}</dd>
                </div>
              </dl>
              <Link
                href={round.ctaHref}
                className={`${TT_PULSE_UPDATES_PANEL_L5.rowCtaClass} mt-auto self-start`}
                data-tt-traveltrust-ttg-round-cta={round.id}
              >
                {t(round.ctaLabelKey)}
                <span className="text-ref-sun/50" aria-hidden>
                  ›
                </span>
              </Link>
            </motion.article>
          );
        })}
      </div>
      <p className="mt-3 text-meta text-slate-400/85" data-tt-traveltrust-ttg-steward-lock-note="1">
        {t("traveltrust_ttg_round_steward_lock_note")}
      </p>
    </div>
  );
}
