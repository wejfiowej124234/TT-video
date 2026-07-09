import type { ColdStartCampaignItem } from "./types";

function payloadTitle(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const title = p.title;
  if (typeof title === "string" && title.trim()) return title.trim();
  return null;
}

/** Consumer chip label — never expose raw item_type when resolved payload exists. */
export function coldStartCampaignItemLabel(item: ColdStartCampaignItem): string {
  const r = item.resolved as Record<string, unknown>;

  if (item.item_type === "official_account" && typeof r.display_label === "string") {
    return r.display_label.trim() || "Official";
  }
  if (item.item_type === "itinerary_template" && typeof r.title === "string") {
    return r.title.trim() || "Route";
  }
  if (item.item_type === "guide_post" && typeof r.title === "string") {
    return r.title.trim() || "Official guide";
  }
  if (item.item_type === "community_post") {
    if (typeof r.body === "string" && r.body.trim()) {
      const line = r.body.trim().split(/\r?\n/)[0]?.trim() || r.body.trim();
      return line.length > 48 ? `${line.slice(0, 47)}…` : line;
    }
    if (typeof r.destination === "string" && r.destination.trim()) {
      return r.destination.trim();
    }
  }
  if (item.item_type === "market_listing") {
    const fromPayload = payloadTitle(r.payload);
    if (fromPayload) return fromPayload;
    if (typeof r.variant === "string" && r.variant.trim()) {
      return r.variant.trim();
    }
  }

  return item.item_type.replace(/_/g, " ");
}
