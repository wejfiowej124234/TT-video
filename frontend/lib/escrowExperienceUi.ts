/**
 * Escrow draft / pre-chain order page — Experience L5 tokens (warm ink + ref-sun).
 * On-chain protocol shell uses `escrowProtocolUi.ts` when `!experienceDraft`.
 */

/** Page shell already uses warm gradient — avoid nested heavy card on draft orders. */
export const TT_ESCROW_EXPERIENCE_ZONE = "order-experience-zone space-y-6";

export const TT_ESCROW_EXPERIENCE_ZONE_LEGACY =
  "order-experience-zone rounded-[var(--radius-xl)] border border-ref-sun/12 bg-gradient-to-b from-[#1a1410] via-[#14100c] to-ink-950 text-slate-100 space-y-6 p-4 md:p-6 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)]";

export const TT_ESCROW_EXPERIENCE_PANEL =
  "rounded-[var(--radius-md)] border border-ref-sun/15 bg-white/[0.04] backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]";

export const TT_ESCROW_EXPERIENCE_PANEL_INNER =
  "rounded-[var(--radius-sm)] border border-ref-sun/8 bg-black/20 p-4 space-y-3";

/** Draft page footer / inline nav — warm accent on dark scrim; globals `a { inherit }` overridden in .order-experience-zone */
export const escrowExperienceFooterLinkClass =
  "tt-escrow-experience-footer-action text-ref-sun font-medium hover:text-[#ffe9a8] hover:underline underline-offset-2 decoration-ref-sun/50 transition-colors rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c0a]";

export const escrowExperienceGhostButtonClass =
  `${escrowExperienceFooterLinkClass} inline-flex min-h-[44px] items-center justify-center px-2 py-1 text-small bg-transparent border-0`;

/** Footer / compliance strip — always on dark panel (see EscrowDraftExperienceFooter) */
export const TT_ESCROW_EXPERIENCE_FOOTER_PANEL =
  "rounded-[var(--radius-md)] border border-ref-sun/22 bg-[#0f0c0a] px-4 py-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.65)]";

/** L5 footer section labels (tools / help) */
export const escrowExperienceFooterSectionLabelClass =
  "text-meta font-semibold uppercase tracking-[0.06em] text-slate-400 mb-2.5";

export const escrowExperienceFooterRowClass =
  "flex flex-wrap items-center gap-x-5 gap-y-2.5 text-small leading-relaxed";

export const escrowExperienceFooterDividerClass = "border-t border-white/12 pt-3.5 mt-3.5";

export const escrowExperienceHeadingClass = "text-body-l font-semibold text-ref-sun/95";

export const escrowExperienceMetaClass = "text-meta text-white/75 leading-relaxed";

export const escrowExperienceControlClass =
  "px-4 py-2 text-small font-medium rounded-[var(--radius-md)] bg-ref-sun/20 text-ref-sun border border-ref-sun/35 hover:bg-ref-sun/28 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

/** Secondary action (save itinerary) — not the gold primary CTA */
export const escrowExperienceSecondaryBtnClass =
  "px-4 py-2 text-small font-medium rounded-[var(--radius-md)] border border-white/25 bg-transparent text-white/90 hover:bg-white/10 hover:border-white/35 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const escrowExperienceDangerLinkClass =
  "text-small font-medium text-danger/85 hover:text-danger hover:underline transition-colors rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const escrowExperienceInputClass =
  "w-full rounded-[var(--radius-md)] border border-white/15 bg-black/40 text-small text-slate-100 px-3 py-2 resize-y min-h-[5rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const escrowExperienceSelectClass =
  "inline-flex w-full min-h-[44px] sm:max-w-xs items-center justify-start rounded-[var(--radius-md)] border border-white/15 bg-black/40 text-small text-slate-100 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const escrowExperienceLinkClass =
  "text-small font-medium text-ref-sun hover:text-ref-sun/90 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 rounded-[var(--radius-sm)]";

/** Secondary actions (edit itinerary) — not the gold primary CTA */
export const escrowExperienceMutedLinkClass =
  "text-small font-medium text-white/70 hover:text-white/90 underline underline-offset-2 decoration-white/30 hover:decoration-white/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 rounded-[var(--radius-sm)]";

/** `tt-escrow-experience-primary-cta` — globals 压过 `a { color: inherit }`，金底须深字 */
export const escrowExperiencePrimaryCtaClass =
  "tt-escrow-experience-primary-cta w-full min-h-[48px] px-4 py-3 text-body font-semibold rounded-[var(--radius-md)] bg-ref-sun !text-ink-950 hover:bg-ref-sun/95 hover:!text-ink-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const escrowExperienceQuoteStickyClass =
  "sticky top-4 z-[1] lg:top-6 self-start w-full max-lg:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]";

export const escrowExperienceChatShellClass =
  "rounded-[var(--radius-md)] border border-ref-sun/10 bg-black/25 p-4 min-h-[min(22rem,52vh)] flex flex-col gap-2";

export const escrowExperienceCompactFlowClass =
  "rounded-[var(--radius-md)] border border-ref-sun/20 bg-ref-sun/8 px-4 py-3 space-y-1";
