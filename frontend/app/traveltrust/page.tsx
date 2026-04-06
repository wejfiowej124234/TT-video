"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Fragment, useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import TravelTrustAllocationPlaceholder from "@/components/traveltrust/TravelTrustAllocationPlaceholder";
import TravelTrustDemoPreview from "@/components/traveltrust/TravelTrustDemoPreview";
import TravelTrustGlobalMap from "@/components/traveltrust/TravelTrustGlobalMap";
import TravelTrustHeroBackdrop from "@/components/traveltrust/TravelTrustHeroBackdrop";
import TravelTrustLiveStats from "@/components/traveltrust/TravelTrustLiveStats";
import TravelTrustNetworkParticles from "@/components/traveltrust/TravelTrustNetworkParticles";
import TravelTrustParticleLegend from "@/components/traveltrust/TravelTrustParticleLegend";
import TravelTrustSectionNav from "@/components/traveltrust/TravelTrustSectionNav";
import TravelTrustStickyCta from "@/components/traveltrust/TravelTrustStickyCta";
import TravelTrustVideoBlock from "@/components/traveltrust/TravelTrustVideoBlock";
import WalletStatusMini from "@/components/trust/WalletStatusMini";
import FeeRouterWiringNotice from "@/components/escrow/FeeRouterWiringNotice";

/**
 * TravelTrust 网络落地页 — [85]：专业落地页式分段（参考公开 ICO 站的信息节奏，**非** ICO 功能）：
 * Hero（旅游柔光 + 内嵌粒子）→ 概览（核心能力栅格 + 痛点/方案双栏）→ 锚点导航 → Live Network（可交互粒子）→ … → CTA。
 * 全页环境粒子见 `TravelTrustAmbientCanvas`（layout）；**禁止**真实认购/checkout。
 */
const HIGHLIGHT_KEYS = [
  ["traveltrust_highlight_escrow_title", "traveltrust_highlight_escrow_body"],
  ["traveltrust_highlight_match_title", "traveltrust_highlight_match_body"],
  ["traveltrust_highlight_gov_title", "traveltrust_highlight_gov_body"],
  ["traveltrust_highlight_trust_title", "traveltrust_highlight_trust_body"],
] as const;

const QUICK_STEPS = [
  { title: "traveltrust_step_book_title", body: "traveltrust_step_book_body" },
  { title: "traveltrust_step_match_title", body: "traveltrust_step_match_body" },
  { title: "traveltrust_step_travel_title", body: "traveltrust_step_travel_body" },
] as const;

const TRAVELTRUST_FAQ_KEYS = [
  { q: "traveltrust_faq_q1", a: "traveltrust_faq_a1" },
  { q: "traveltrust_faq_q2", a: "traveltrust_faq_a2" },
  { q: "traveltrust_faq_q3", a: "traveltrust_faq_a3" },
  { q: "traveltrust_faq_q4", a: "traveltrust_faq_a4" },
  { q: "traveltrust_faq_q5", a: "traveltrust_faq_a5" },
] as const;

const FLOW_KEYS = ["create", "accept", "confirm", "travel", "complete", "release"] as const;

export default function TravelTrustNetworkPage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const heroTitleId = useId();
  const liveNetId = useId();
  const videoId = useId();
  const flowId = useId();
  const tokenId = useId();
  const allocationId = useId();
  const mapId = useId();
  const settlementHeadingId = useId();
  const feeRouterSectionId = useId();
  const quickId = useId();
  const overviewId = useId();
  const problemId = useId();
  const solutionId = useId();
  const trustFactsId = useId();
  const faqTitleId = useId();
  const ctaId = useId();

  /** 深色玻璃卡片 + Tropical jade 竖条（与自由市场 / 排行榜同系） */
  const stepCard =
    "relative overflow-hidden rounded-[var(--radius-lg)] border border-white/12 bg-slate-900/45 p-5 pl-6 shadow-scifi-panel backdrop-blur-md motion-sub hover:border-ref-cyan/35 before:pointer-events-none before:absolute before:left-3 before:top-4 before:bottom-4 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-ref-coral/90 before:via-ref-cyan/75 before:to-ref-teal/80 before:content-['']";
  const sectionTitle = "text-body-l font-bold text-white tracking-tight";
  const sectionBody = "mt-2 text-small leading-relaxed text-slate-300";
  const ctaBtn =
    "inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] bg-cta-gradient px-6 py-2.5 text-small font-semibold text-white shadow-medium transition-transform hover:brightness-110 hover:shadow-[0_0_28px_rgba(59,130,246,0.35)] active:scale-[0.98] motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
  const ctaBtnSecondary =
    "inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border border-white/18 bg-slate-900/55 px-6 py-2.5 text-small font-semibold text-slate-100 shadow-scifi-card-faint backdrop-blur-md hover:border-ref-coral/40 hover:bg-slate-800/60 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

  return (
    <Fragment>
    <main
      className="mx-auto max-w-5xl px-4 py-10 pb-24 sm:px-6 sm:pb-28"
      aria-label={t("traveltrust_title")}
    >
      <div className="rounded-[var(--radius-xl)] p-[1px] bg-gradient-to-br from-ref-cyan/50 via-ref-coral/40 to-ref-sun/35 shadow-[0_0_48px_-14px_rgba(35,206,217,0.22)]">
      <section
        id="hero"
        className="relative min-h-[min(520px,72svh)] overflow-hidden rounded-[var(--radius-xl)] border border-white/10 bg-slate-900/45 backdrop-blur-md"
        aria-labelledby={heroTitleId}
      >
        <TravelTrustHeroBackdrop />
        <div className="pointer-events-none absolute inset-0 z-[1] min-h-[min(280px,40svh)] sm:min-h-[min(320px,48svh)]">
          <TravelTrustNetworkParticles
            tone="hero"
            frameClassName="absolute inset-0 h-full min-h-[280px] w-full sm:min-h-[320px]"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-transparent via-[rgba(24,14,10,0.32)] to-[rgba(18,10,8,0.68)]"
          aria-hidden
        />
        <div className="relative z-[3] grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_min(17rem,34%)] lg:items-center">
          <div className="space-y-4">
            <p className="text-kicker font-semibold uppercase tracking-[0.2em] text-ref-coral/90">{t("traveltrust_hero_kicker")}</p>
            <h1 id={heroTitleId} className="text-h3 font-bold tracking-tight text-white sm:text-h2 drop-shadow-scifi-cyan-title">
              {t("traveltrust_title")}
            </h1>
            <p className="max-w-xl text-small leading-relaxed text-slate-300">{t("traveltrust_intro")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/market" className={ctaBtn}>
                {t("traveltrust_hero_earlyAccess")}
              </Link>
              <Link href="#demo" className={ctaBtnSecondary}>
                {t("traveltrust_hero_exploreDemo")}
              </Link>
              <div className="min-w-[9rem] rounded-[var(--radius-lg)] border border-white/15 bg-slate-950/60 px-3 py-2 shadow-scifi-panel backdrop-blur-md">
                <WalletStatusMini variant="dark" />
              </div>
            </div>
            <p className="text-meta text-slate-400">{t("traveltrust_hero_walletHint")}</p>
          </div>
          <aside
            className="rounded-[var(--radius-lg)] border border-ref-coral/30 bg-gradient-to-b from-slate-950/90 via-slate-900/95 to-ref-teal/25 p-6 text-slate-100 shadow-scifi-panel ring-1 ring-ref-cyan/20 backdrop-blur-md"
            aria-label={t("traveltrust_hero_card_kicker")}
          >
            <p className="text-micro font-semibold uppercase tracking-[0.18em] text-ref-sun">{t("traveltrust_hero_card_kicker")}</p>
            <p className="mt-3 text-h4 font-bold text-white">{t("traveltrust_hero_card_title")}</p>
            <p className="mt-3 text-meta leading-relaxed text-slate-300">{t("traveltrust_hero_card_note")}</p>
          </aside>
        </div>
      </section>
      </div>

      <details className="mt-5 rounded-[var(--radius-lg)] border border-white/12 bg-slate-900/40 px-4 py-2 text-meta text-slate-300 shadow-scifi-card-faint backdrop-blur-md">
        <summary className={`cursor-pointer select-none font-medium text-slate-200 hover:text-white ${communityCardLinkFocus}`}>{t("traveltrust_spec_toggle")}</summary>
        <p className="mt-2 border-t border-white/10 pt-2 font-mono text-kicker leading-snug text-slate-400">{t("traveltrust_specRef")}</p>
      </details>

      <section
        id="overview"
        className="mt-10 scroll-mt-28 space-y-10 rounded-[var(--radius-xl)] border border-white/10 bg-slate-950/35 p-5 shadow-scifi-panel ring-1 ring-ref-cyan/15 backdrop-blur-md sm:p-8"
        aria-labelledby={overviewId}
      >
        <div>
          <h2 id={overviewId} className={sectionTitle}>
            {t("traveltrust_highlights_title")}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHT_KEYS.map(([titleKey, bodyKey], i) => (
              <motion.div
                key={titleKey}
                className={stepCard}
                {...(reduceMotion
                  ? {}
                  : {
                      /* opacity 始终保持 1：避免 whileInView 未触发时段落长期透明（overflow/IO 边缘情况） */
                      initial: { opacity: 1, y: 12 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, margin: "0px 0px 12% 0px", amount: 0.15 },
                      transition: { duration: 0.38, delay: i * 0.06 },
                    })}
              >
                <h3 className="text-body font-semibold text-white">{t(titleKey)}</h3>
                <p className="mt-2 text-meta leading-relaxed text-slate-300">{t(bodyKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <h3 className={sectionTitle}>{t("traveltrust_matrix_title")}</h3>
          <p className={`${sectionBody} max-w-3xl`}>{t("traveltrust_matrix_lead")}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article
              id="problem"
              className={`${stepCard} scroll-mt-28 border-ref-coral/25`}
              aria-labelledby={problemId}
            >
              <h4 id={problemId} className="text-body font-semibold text-ref-sun">
                {t("traveltrust_problem_title")}
              </h4>
              <p className="mt-2 text-small leading-relaxed text-slate-300">{t("traveltrust_problem_body")}</p>
            </article>
            <article
              id="solution"
              className={`${stepCard} scroll-mt-28 border-ref-cyan/25`}
              aria-labelledby={solutionId}
            >
              <h4 id={solutionId} className="text-body font-semibold text-ref-cyan">
                {t("traveltrust_solution_title")}
              </h4>
              <p className="mt-2 text-small leading-relaxed text-slate-300">{t("traveltrust_solution_body")}</p>
            </article>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <TravelTrustSectionNav variant="glass" />
      </div>

      <section id="live-network" className="mt-10 scroll-mt-28" aria-labelledby={liveNetId}>
        <h2 id={liveNetId} className={sectionTitle}>
          {t("traveltrust_liveNetwork_title")}
        </h2>
        <p className={`${sectionBody} mb-4`}>{t("traveltrust_liveNetwork_note")}</p>
        <p className="text-meta text-slate-400 mb-3">{t("traveltrust_liveNetwork_interactive_note")}</p>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-white/12 bg-slate-900/50 p-3 shadow-scifi-panel ring-1 ring-ref-cyan/20 backdrop-blur-md sm:p-4">
          <TravelTrustNetworkParticles frameClassName="h-56 w-full sm:h-80" />
        </div>
        <TravelTrustParticleLegend />
      </section>

      <div className="mt-10">
        <TravelTrustLiveStats variant="glass" />
      </div>

      <section id="quick-explain" className="mt-10 scroll-mt-28" aria-labelledby={quickId}>
        <p className="text-kicker font-semibold uppercase tracking-[0.18em] text-ref-cyan/80">{t("traveltrust_quick_section_eyebrow")}</p>
        <h2 id={quickId} className={`${sectionTitle} mt-1`}>
          {t("traveltrust_quickExplainTitle")}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {QUICK_STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              className={stepCard}
              {...(reduceMotion
                ? {}
                : {
                    initial: { opacity: 1, y: 10 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: "0px 0px 12% 0px", amount: 0.15 },
                    transition: { duration: 0.35, delay: i * 0.07 },
                  })}
            >
              <h3 className="text-body font-semibold text-white">{t(step.title)}</h3>
              <p className="mt-2 text-meta leading-relaxed text-slate-300">{t(step.body)}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-3 text-meta text-slate-400" role="note">
          {t("traveltrust_quickExplain_footnote")}
        </p>
      </section>

      <section id="video" className="mt-10 scroll-mt-24" aria-labelledby={videoId}>
        <h2 id={videoId} className={sectionTitle}>
          {t("traveltrust_video_title")}
        </h2>
        <p className={sectionBody}>{t("traveltrust_video_lead")}</p>
        <TravelTrustVideoBlock />
      </section>

      <section id="flow" className="mt-10 scroll-mt-28" aria-labelledby={flowId}>
        <h2 id={flowId} className={sectionTitle}>
          {t("traveltrust_flow_title")}
        </h2>
        <p className={sectionBody}>{t("traveltrust_flow_intro")}</p>
        <ol className="mt-4 flex list-none flex-wrap items-center gap-2 p-0">
          {FLOW_KEYS.map((k, i) => (
            <li key={k} className="flex items-center gap-2">
              {i > 0 ? (
                <span className="text-meta text-slate-400" aria-hidden>
                  →
                </span>
              ) : null}
              <span className="rounded-full border border-ref-teal/35 bg-slate-900/70 px-3 py-1.5 text-meta font-semibold text-ref-cyan shadow-scifi-card-faint ring-1 ring-ref-cyan/25 backdrop-blur-sm">
                {t(`traveltrust_flow_step_${k}`)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <TravelTrustDemoPreview />

      <section id="token-system" className="mt-10 scroll-mt-24" aria-labelledby={tokenId}>
        <h2 id={tokenId} className={sectionTitle}>
          {t("traveltrust_token_title")}
        </h2>
        <p className={sectionBody}>{t("traveltrust_token_intro")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["traveltrust_token_layer_settlement_title", "traveltrust_token_layer_settlement_body"],
              ["traveltrust_token_layer_governance_title", "traveltrust_token_layer_governance_body"],
              ["traveltrust_token_layer_utility_title", "traveltrust_token_layer_utility_body"],
            ] as const
          ).map(([titleKey, bodyKey], i) => (
            <motion.div
              key={titleKey}
              className={stepCard}
              {...(reduceMotion
                ? {}
                : {
                    initial: { opacity: 1, y: 10 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: "0px 0px 12% 0px", amount: 0.15 },
                    transition: { duration: 0.35, delay: i * 0.07 },
                  })}
            >
              <h3 className="text-body font-semibold text-white">{t(titleKey)}</h3>
              <p className="mt-2 text-meta leading-relaxed text-slate-300">{t(bodyKey)}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-3 text-meta text-slate-400" role="note">
          {t("traveltrust_token_layers_note")}
        </p>
      </section>

      <section id="allocation" className="mt-8 scroll-mt-24" aria-labelledby={allocationId}>
        <h2 id={allocationId} className={sectionTitle}>
          {t("traveltrust_allocation_title")}
        </h2>
        <p className={sectionBody}>{t("traveltrust_allocation_body")}</p>
        <TravelTrustAllocationPlaceholder />
      </section>

      <section
        id="settlement"
        className="mt-10 scroll-mt-24 rounded-[var(--radius-lg)] border border-ref-sun/25 bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-ref-teal/20 p-6 text-slate-100 shadow-scifi-panel ring-1 ring-ref-coral/20"
        aria-labelledby={settlementHeadingId}
      >
        <h2 id={settlementHeadingId} className="text-body-l font-bold text-ref-sun">
          {t("traveltrust_settlementTitle")}
        </h2>
        <p className="mt-2 text-small leading-relaxed text-slate-300">{t("traveltrust_settlementBody")}</p>
      </section>

      <section
        id="fee-router"
        className="mt-8 scroll-mt-24 rounded-[var(--radius-lg)] border border-white/12 bg-slate-900/45 p-6 shadow-scifi-panel ring-1 ring-ref-cyan/15 backdrop-blur-md"
        aria-labelledby={feeRouterSectionId}
      >
        <h2 id={feeRouterSectionId} className={sectionTitle}>
          {t("traveltrust_feeRouter_section_title")}
        </h2>
        <p className={sectionBody}>{t("traveltrust_feeRouter_section_lead")}</p>
        <div className="mt-4">
          <FeeRouterWiringNotice variant="did" />
        </div>
      </section>

      <section id="trust-facts" className="mt-8 scroll-mt-24" aria-labelledby={trustFactsId}>
        <h2 id={trustFactsId} className={sectionTitle}>
          {t("traveltrust_trust_title")}
        </h2>
        <p className={sectionBody}>{t("traveltrust_trust_body")}</p>
        <ul className="mt-4 list-none space-y-2.5 p-0">
          {(
            [
              "traveltrust_trust_bullet_escrow",
              "traveltrust_trust_bullet_allowlist",
              "traveltrust_trust_bullet_guide",
              "traveltrust_trust_bullet_disputes",
              "traveltrust_trust_bullet_target",
            ] as const
          ).map((key) => (
            <li
              key={key}
              className="flex gap-2.5 rounded-[var(--radius-lg)] border border-white/10 bg-slate-900/50 px-4 py-3 text-small leading-relaxed text-slate-200 shadow-scifi-card-faint backdrop-blur-md ring-1 ring-ref-cyan/10"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-ref-cyan to-ref-teal shadow-[0_0_8px_rgba(35,206,217,0.5)]" aria-hidden />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="global-map" className="mt-8 scroll-mt-24" aria-labelledby={mapId}>
        <h2 id={mapId} className={sectionTitle}>
          {t("traveltrust_map_title")}
        </h2>
        <p className={sectionBody}>{t("traveltrust_map_body")}</p>
        <TravelTrustGlobalMap />
      </section>

      <section id="faq" className="mt-10 scroll-mt-24" aria-labelledby={faqTitleId}>
        <h2 id={faqTitleId} className={sectionTitle}>
          {t("traveltrust_faq_title")}
        </h2>
        <p className={`${sectionBody} mb-4`}>{t("traveltrust_faq_intro")}</p>
        <div className="space-y-2">
          {TRAVELTRUST_FAQ_KEYS.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-[var(--radius-lg)] border border-white/12 bg-slate-900/45 backdrop-blur-md shadow-scifi-card-faint motion-sub open:border-ref-coral/35 open:ring-1 open:ring-ref-cyan/25"
            >
              <summary className={`flex cursor-pointer select-none list-none items-center justify-between gap-2 px-4 py-3 text-small font-semibold text-slate-100 [&::-webkit-details-marker]:hidden ${communityCardLinkFocus}`}>
                <span>{t(q)}</span>
                <span
                  className="shrink-0 text-meta text-slate-400 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden
                >
                  ▼
                </span>
              </summary>
              <div className="border-t border-white/10 px-4 pb-3 pt-2">
                <p className="text-small leading-relaxed text-slate-300">{t(a)}</p>
              </div>
            </details>
          ))}
        </div>
        <p className="mt-4 text-meta text-slate-400" role="note">
          {t("traveltrust_faq_visual_note")}
        </p>
      </section>

      <section
        id="cta"
        className="mt-10 scroll-mt-24 rounded-[var(--radius-xl)] border border-ref-coral/35 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-ref-teal/20 p-8 shadow-[0_0_40px_-12px_rgba(252,164,124,0.15)] ring-1 ring-ref-cyan/20 backdrop-blur-md"
        aria-labelledby={ctaId}
      >
        <h2 id={ctaId} className="text-h4 font-bold text-white">
          {t("traveltrust_cta_title")}
        </h2>
        <p className="mt-2 text-small text-slate-300">{t("traveltrust_cta_body")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/market" className={ctaBtn}>
            {t("traveltrust_cta_market")}
          </Link>
          <Link href="#fee-router" className={ctaBtnSecondary}>
            {t("traveltrust_link_feeRouter")}
          </Link>
          <Link href="#token-system" className={ctaBtnSecondary}>
            {t("traveltrust_link_tokenSystem")}
          </Link>
          <Link href="/" className={ctaBtnSecondary}>
            {t("traveltrust_cta_home")}
          </Link>
          <Link href="/help" className={ctaBtnSecondary}>
            {t("footer_link_help")}
          </Link>
        </div>
      </section>
    </main>
    <TravelTrustStickyCta />
    </Fragment>
  );
}
