"use client";

import Link from "next/link";
import { memo, useState } from "react";

import type { ColdStartConsumerHighlightCard } from "@/lib/coldStartCampaign/coldStartConsumerPresentation";
import { COLD_START_CONSUMER_COVER_FALLBACK } from "@/lib/coldStartCampaign/coldStartConsumerPresentation";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export type ColdStartOfficialHighlightCardProps = {
  card: ColdStartConsumerHighlightCard;
};

function ColdStartOfficialHighlightCardInner({ card }: ColdStartOfficialHighlightCardProps) {
  const [coverSrc, setCoverSrc] = useState(card.coverUrl);

  return (
    <article
      className="overflow-hidden rounded-[var(--radius-md)] border border-white/12 bg-ink-900/60 shadow-lg backdrop-blur-sm"
      data-tt-cold-start-consumer-card={card.id}
      data-tt-cold-start-consumer-category={card.category}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] w-full shrink-0 sm:aspect-auto sm:h-[7.5rem] sm:w-[8.5rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => {
              if (coverSrc !== COLD_START_CONSUMER_COVER_FALLBACK) {
                setCoverSrc(COLD_START_CONSUMER_COVER_FALLBACK);
              }
            }}
          />
          <span className="absolute left-2 top-2 rounded-full border border-ref-sun/35 bg-ink-950/75 px-2 py-0.5 text-meta font-medium text-ref-sun [color:var(--ref-sun)]">
            {card.categoryLabel}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3 sm:p-3.5">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-small font-semibold text-white">{card.title}</h3>
              <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-meta text-emerald-100">
                {card.statusLabel}
              </span>
            </div>
            <p className="text-meta leading-snug text-ref-sun/95 [color:color-mix(in_srgb,var(--ref-sun)_92%,white)]">
              {card.valueLine}
            </p>
            <p className="text-meta text-white/65">{card.subtitle}</p>
          </div>
          <div>
            <Link
              href={card.href}
              className={`inline-flex min-h-9 items-center justify-center rounded-full border border-ref-sun/40 bg-ref-sun/15 px-3.5 py-1.5 text-meta font-semibold text-white transition hover:bg-ref-sun/25 ${travelFocusRingOffset2Classes}`}
              data-tt-cold-start-consumer-cta={card.id}
            >
              {card.ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export const ColdStartOfficialHighlightCard = memo(ColdStartOfficialHighlightCardInner);
