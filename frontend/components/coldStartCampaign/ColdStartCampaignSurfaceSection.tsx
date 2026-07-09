"use client";

import Link from "next/link";
import { memo } from "react";

import { ConsumerSurfaceStatePanel } from "@/components/consumer/ConsumerSurfaceStatePanel";
import { useTranslation } from "@/components/LocaleProvider";
import {
  COLD_START_SURFACE_COMMUNITY_FEED,
  COLD_START_SURFACE_HOME_HERO,
  COLD_START_SURFACE_MARKET_FEED,
  type ColdStartCampaignItem,
  type ColdStartSurfaceId,
} from "@/lib/coldStartCampaign/types";
import { coldStartCampaignItemLabel } from "@/lib/coldStartCampaign/coldStartCampaignItemLabel";
import { useColdStartCampaignSurface } from "@/lib/coldStartCampaign/useColdStartCampaignSurface";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

function itemHref(item: ColdStartCampaignItem): string | null {
  const r = item.resolved as Record<string, unknown>;
  if (item.item_type === "official_account" && typeof r.linked_guide_id === "string") {
    return `/guides/${encodeURIComponent(r.linked_guide_id)}`;
  }
  if (item.item_type === "itinerary_template" && typeof r.id === "string") {
    return `/market?view=split&cold_start_template=${encodeURIComponent(r.id)}`;
  }
  if (item.item_type === "guide_post" && typeof r.community_post_id === "string") {
    return `/community?post=${encodeURIComponent(r.community_post_id)}`;
  }
  if (item.item_type === "guide_post" && typeof r.id === "string") {
    return `/community?official_guide=${encodeURIComponent(r.id)}`;
  }
  return null;
}

function itemLabel(item: ColdStartCampaignItem): string {
  return coldStartCampaignItemLabel(item);
}

function itemMeta(item: ColdStartCampaignItem): string | null {
  const r = item.resolved as Record<string, unknown>;
  if (item.item_type === "guide_post" && typeof r.destination === "string" && r.destination) {
    return r.destination;
  }
  if (item.item_type === "itinerary_template" && typeof r.country_iso === "string" && r.country_iso) {
    return r.country_iso;
  }
  if (item.item_type === "official_account" && typeof r.account_kind === "string") {
    return r.account_kind;
  }
  return null;
}

export type ColdStartCampaignSurfaceSectionProps = {
  surface: ColdStartSurfaceId;
  className?: string;
};

function ColdStartCampaignSurfaceSectionInner({
  surface,
  className = "",
}: ColdStartCampaignSurfaceSectionProps) {
  const { t } = useTranslation();
  const { campaign, items, loading, error, refetch } = useColdStartCampaignSurface(surface);

  if (loading) {
    return <ConsumerSurfaceStatePanel state="loading" surface={surface} className={className} />;
  }
  if (error) {
    return (
      <ConsumerSurfaceStatePanel
        state="error"
        surface={surface}
        className={className}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!campaign || items.length === 0) {
    return <ConsumerSurfaceStatePanel state="empty" surface={surface} className={className} />;
  }

  return (
    <ConsumerSurfaceStatePanel state="ready" surface={surface} className={className}>
      <section
        className={`mx-auto w-full max-w-3xl px-3 sm:px-4 ${className}`.trim()}
        data-tt-cold-start-surface={surface}
        data-tt-cold-start-campaign={campaign.id}
        data-tt-cold-start-campaign-items={items.length}
        data-tt-cold-start-ready="1"
        aria-label={t("cold_start_campaign_surface_aria", { surface, name: campaign.name })}
      >
        <div
          className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-900/55 px-3 py-2.5 text-slate-100 backdrop-blur-sm ring-1 ring-ref-sun/15"
          data-tt-cold-start-campaign-panel="1"
        >
          <p
            data-tt-cold-start-kicker="1"
            className="text-meta font-medium uppercase tracking-wide text-ref-sun [color:var(--ref-sun)]"
          >
            {t("cold_start_campaign_surface_kicker")}
          </p>
          <p className="mt-0.5 text-small font-semibold text-white">{campaign.name}</p>
          <ul className="mt-2 flex flex-wrap gap-2" data-tt-cold-start-campaign-item-list="1">
            {items.map((item) => {
              const href = itemHref(item);
              const label = itemLabel(item);
              const meta = itemMeta(item);
              const chipClass = `inline-flex max-w-full items-center gap-1 rounded-full border border-ref-sun/30 bg-ink-900/85 px-2.5 py-1 text-meta text-slate-100 ${travelFocusRingOffset2Classes}`;
              const content = (
                <>
                  <span className="truncate">{label}</span>
                  {meta ? <span className="text-slate-300">· {meta}</span> : null}
                </>
              );
              return (
                <li key={item.id} data-tt-cold-start-campaign-item={item.id}>
                  {href ? (
                    <Link href={href} className={chipClass}>
                      {content}
                    </Link>
                  ) : (
                    <span className={chipClass}>{content}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </ConsumerSurfaceStatePanel>
  );
}

export const ColdStartCampaignSurfaceSection = memo(ColdStartCampaignSurfaceSectionInner);

export {
  COLD_START_SURFACE_HOME_HERO,
  COLD_START_SURFACE_MARKET_FEED,
  COLD_START_SURFACE_COMMUNITY_FEED,
};
