"use client";

import type { PublishHubContentRail } from "@/lib/me/publishHubModel";
import { PUBLISH_HUB_ITEM_RAIL_FALLBACK_LABEL, type PublishHubItem } from "@/lib/me/publishHubItemModel";
import { TT_PUBLISH_HUB_L5, publishHubL5ItemThumbFallbackRailClass } from "@/lib/me/publishHubL5";

export default function PublishHubItemThumb({
  item,
  alt,
}: {
  item: Pick<PublishHubItem, "rail" | "coverUrl" | "title">;
  alt: string;
}) {
  const cover = item.coverUrl?.trim();
  if (cover) {
    return (
      <img
        src={cover}
        alt={alt}
        className={TT_PUBLISH_HUB_L5.itemThumbImage}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span
      className={`${TT_PUBLISH_HUB_L5.itemThumbFallback} ${publishHubL5ItemThumbFallbackRailClass(item.rail)}`}
      aria-hidden
      data-tt-publish-hub-item-fallback={item.rail}
    >
      {railFallbackGlyph(item.rail)}
    </span>
  );
}

function railFallbackGlyph(rail: PublishHubContentRail): string {
  return PUBLISH_HUB_ITEM_RAIL_FALLBACK_LABEL[rail];
}
