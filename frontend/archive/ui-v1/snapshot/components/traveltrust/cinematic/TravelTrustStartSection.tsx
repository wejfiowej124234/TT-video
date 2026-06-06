"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import FeeRouterWiringNotice from "@/components/escrow/FeeRouterWiringNotice";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { resolveTraveltrustPlanTripHref } from "@/lib/traveltrustPlanTripHref";
import { scrollTraveltrustHashIntoView } from "@/lib/traveltrustSectionHash";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
export function TravelTrustStartSection() {
  const { t } = useTranslation();
  const { brief } = useTravelTrustPageBriefContext();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.start.title;
  const [feeOpen, setFeeOpen] = useState(false);
  const feePanelRef = useRef<HTMLDivElement>(null);
  const planHref = resolveTraveltrustPlanTripHref(brief?.cta_contract.primary_target);
  const governanceHref = brief?.cta_contract.secondary_target ?? "/governance";

  useEffect(() => {
    const syncHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash.replace(/^#/, "") !== "fee-router") return;
      setFeeOpen(true);
      scrollTraveltrustHashIntoView("fee-router", { behavior: "smooth" });
      requestAnimationFrame(() => {
        feePanelRef.current?.querySelector("button")?.focus();
      });
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <motion.section
      id="start"
      className="scroll-mt-28 border-t border-white/10 py-12 sm:py-16"
      aria-labelledby={titleId}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-kicker font-semibold uppercase tracking-[0.2em] text-ref-teal/80">
        {t("traveltrust_start_eyebrow")}
      </p>
      <h2 id={titleId} className="mt-3 max-w-xl text-h3 font-bold text-white sm:text-h2">
        {t("traveltrust_start_title")}
      </h2>
      <p className="mt-2 max-w-2xl text-meta leading-relaxed text-slate-400">{t("traveltrust_start_disclaimer")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={planHref}
          data-tt-traveltrust-plan-href={planHref}
          onClick={() =>
            trackTravelTrustEvent("traveltrust_plan_trip_click", { source: "start", target: planHref })
          }
          className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] bg-cta-gradient px-8 py-3 text-small font-semibold text-white shadow-medium transition hover:brightness-110 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/70"
        >
          {t("traveltrust_start_cta")}
        </Link>
        <Link
          href={governanceHref}
          onClick={() =>
            trackTravelTrustEvent("traveltrust_secondary_cta_click", {
              source: "start",
              target: governanceHref,
            })
          }
          className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border border-white/18 bg-ink-800/55 px-6 py-3 text-small font-semibold text-slate-100 hover:border-ref-coral/40 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60"
        >
          {t("traveltrust_nav_governance")}
        </Link>
        <Link
          href="/help"
          onClick={() =>
            trackTravelTrustEvent("traveltrust_secondary_cta_click", { source: "start", target: "/help" })
          }
          className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border border-white/18 bg-ink-800/55 px-6 py-3 text-small font-semibold text-slate-100 hover:border-ref-coral/40 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60"
        >
          {t("traveltrust_nav_help")}
        </Link>
      </div>
      <motion.div
        ref={feePanelRef}
        id="fee-router"
        className="scroll-mt-28 mt-8 max-w-2xl rounded-xl border border-white/8 bg-ink-900/30"
        data-tt-traveltrust-fee-router-panel="1"
      >
        <button
          type="button"
          onClick={() => setFeeOpen((o) => !o)}
          aria-expanded={feeOpen}
          data-tt-traveltrust-fee-router-trigger="1"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-meta font-medium text-slate-300 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
        >
          <span>{t("traveltrust_fee_router_summary")}</span>
          <span aria-hidden className="text-slate-500">
            {feeOpen ? "−" : "+"}
          </span>
        </button>
        {feeOpen ? (
          <div className="border-t border-white/8 px-4 pb-4 pt-3">
            <p className="mb-3 text-meta leading-relaxed text-slate-500">{t("traveltrust_fee_router_disclaimer")}</p>
            <FeeRouterWiringNotice variant="did" />
          </div>
        ) : null}
      </motion.div>
      <p className="mt-10 max-w-2xl text-meta leading-relaxed text-slate-500">{t("traveltrust_footer_t2")}</p>
    </motion.section>
  );
}
