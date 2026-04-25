"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import MarketRemoteListingImage from "@/components/market/MarketRemoteListingImage";
import MarketSubsiteComplianceDisclosure from "@/components/market/MarketSubsiteComplianceDisclosure";
import type { DemoAcquisitionListing } from "@/lib/marketSubsiteDemo";
import { pickL10n } from "@/lib/marketSubsiteDemo";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export function AcquisitionListingDetailBody({
  listing,
  embed,
}: {
  listing: DemoAcquisitionListing;
  embed?: { onClose: () => void };
}) {
  const { locale, t } = useTranslation();
  const title = pickL10n(listing.title, locale);
  const bountyMeta = `${listing.bountyMinUsdc}–${listing.bountyMaxUsdc} USDC`;
  const articleClass = embed
    ? "mx-0 max-w-none space-y-5 px-0 pb-6 pt-0"
    : "mx-auto max-w-3xl space-y-0 px-4 pb-12 pt-4";

  return (
    <article className={articleClass}>
      {embed ? (
        <p className="m-0">
          <button
            type="button"
            onClick={embed.onClose}
            className={`${touchTargetLink44Classes} font-medium text-cyan-200 underline decoration-cyan-400/45 underline-offset-4 transition-colors motion-reduce:transition-none hover:text-cyan-100 ${travelFocusRingOffset2Classes}`}
          >
            {t("market_subsite_back_to_acquisition")}
          </button>
        </p>
      ) : null}

      <header className="space-y-3">
        <p className="inline-flex rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-meta font-semibold text-white">
          {t("market_subsite_acquisition_badge")}
        </p>
        <p className="text-body text-slate-100/95">{pickL10n(listing.summary, locale)}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-meta text-white/90">
            {pickL10n(listing.route, locale)}
          </span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-meta text-white/90">
            {pickL10n(listing.deadlineNote, locale)}
          </span>
          <span className="rounded-full border border-warning/35 bg-warning/15 px-3 py-1 text-meta font-semibold tabular-nums text-white">
            {bountyMeta}
          </span>
        </div>
      </header>

      <div className="relative mt-6 aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] border border-white/15 ring-1 ring-warning/15">
        <MarketRemoteListingImage
          src={listing.imageSrc}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 28rem"
          priority={!embed}
        />
      </div>

      <section
        className="mt-8 rounded-[var(--radius-lg)] border border-warning/35 bg-ink-900/60 p-5 shadow-[0_0_28px_-8px_rgba(245,158,11,0.15)] backdrop-blur-md"
        aria-labelledby="acq-bounty"
      >
        <h2 id="acq-bounty" className="text-h3 font-semibold text-white">
          {t("market_subsite_acquisition_bounty_title")}
        </h2>
        <p className="mt-2 text-body tabular-nums text-slate-100/95">{bountyMeta}</p>
        <p className="mt-2 text-meta leading-relaxed text-slate-300/95">{t("market_subsite_acquisition_bounty_note")}</p>
        <h3 className="mt-4 text-small font-semibold text-white/90">{t("market_subsite_acquisition_milestones_title")}</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-meta text-slate-200/90">
          <li>{t("market_subsite_acquisition_milestone_1")}</li>
          <li>{t("market_subsite_acquisition_milestone_2")}</li>
          <li>{t("market_subsite_acquisition_milestone_3")}</li>
          <li>{t("market_subsite_acquisition_milestone_4")}</li>
        </ol>
      </section>

      <section className="mt-6 space-y-4 text-body leading-relaxed text-slate-200/95" aria-labelledby="acq-story">
        <h2 id="acq-story" className="text-h3 font-semibold text-white">
          {t("market_subsite_detail_story")}
        </h2>
        {listing.story.map((p, i) => (
          <p key={i}>{pickL10n(p, locale)}</p>
        ))}
      </section>

      <section
        className="mt-8 rounded-[var(--radius-lg)] border border-warning/40 bg-ink-900/65 p-5 backdrop-blur-md"
        aria-labelledby="acq-standards"
      >
        <h2 id="acq-standards" className="text-h3 font-semibold text-white">
          {t("market_subsite_acquisition_standards_title")}
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-small font-semibold text-white">{t("market_subsite_acquisition_inspection")}</h3>
            <p className="mt-1.5 text-body text-slate-200/95">{pickL10n(listing.inspectionStandard, locale)}</p>
          </div>
          <div>
            <h3 className="text-small font-semibold text-white">{t("market_subsite_acquisition_authenticity")}</h3>
            <p className="mt-1.5 text-body text-slate-200/95">{pickL10n(listing.authenticity, locale)}</p>
          </div>
          <div>
            <h3 className="text-small font-semibold text-white">{t("market_subsite_acquisition_condition")}</h3>
            <p className="mt-1.5 text-body text-slate-200/95">{pickL10n(listing.condition, locale)}</p>
          </div>
          <div>
            <h3 className="text-small font-semibold text-white">{t("market_subsite_acquisition_rejections")}</h3>
            <p className="mt-1.5 text-body text-slate-200/95">{pickL10n(listing.rejections, locale)}</p>
          </div>
          <div>
            <h3 className="text-small font-semibold text-white">{t("market_subsite_acquisition_handoff")}</h3>
            <p className="mt-1.5 text-body text-slate-200/95">{pickL10n(listing.handoff, locale)}</p>
          </div>
        </div>
      </section>

      <section
        className="mt-8 rounded-[var(--radius-lg)] border border-ref-cyan/25 bg-ink-900/60 p-5 backdrop-blur-md"
        aria-labelledby="acq-escrow"
      >
        <h2 id="acq-escrow" className="text-h3 font-semibold text-white">
          {t("market_subsite_escrow_section_title")}
        </h2>
        <p className="mt-2 text-body text-slate-200/90">{t("market_subsite_acquisition_escrow_body")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-cyan/45 bg-ref-cyan/20 px-5 py-2.5 text-small font-semibold text-white transition-colors motion-reduce:transition-none hover:bg-ref-cyan/30 ${travelFocusRingOffset2Classes}`}
          >
            {t("market_subsite_cta_orders")}
          </Link>
          <Link
            href="/pay"
            className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-small font-medium text-white transition-colors motion-reduce:transition-none hover:bg-white/15 ${travelFocusRingOffset2Classes}`}
          >
            {t("market_subsite_cta_pay_hub")}
          </Link>
          <Link
            href="/disputes"
            className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-full border border-warning/45 bg-warning/15 px-5 py-2.5 text-small font-semibold text-white transition-colors motion-reduce:transition-none hover:bg-warning/25 ${travelFocusRingOffset2Classes}`}
          >
            {t("market_subsite_cta_disputes")}
          </Link>
        </div>
        <MarketSubsiteComplianceDisclosure
          variant="acquisition"
          lead={<p className="m-0">{t("market_subsite_acquisition_compliance_hint")}</p>}
          extended={<p className="m-0">{t("market_subsite_acquisition_compliance_detail_extra")}</p>}
        />
      </section>
    </article>
  );
}
