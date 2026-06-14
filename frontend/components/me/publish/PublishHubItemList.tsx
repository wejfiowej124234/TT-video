"use client";

import PublishHubItemCard from "@/components/me/publish/PublishHubItemCard";
import type { PublishHubItem } from "@/lib/me/publishHubItemModel";

export default function PublishHubItemList({
  items,
  listDataAttr,
  coverAlt,
}: {
  items: readonly PublishHubItem[];
  listDataAttr?: string;
  coverAlt: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul
      className="space-y-2"
      role="list"
      data-tt-publish-hub-item-list={listDataAttr ?? "1"}
    >
      {items.map((item) => (
        <li key={item.key}>
          <PublishHubItemCard item={item} coverAlt={coverAlt} />
        </li>
      ))}
    </ul>
  );
}
