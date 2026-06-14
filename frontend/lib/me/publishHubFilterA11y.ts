import type { PublishHubRailFilter } from "@/lib/me/publishHubModel";
import { PUBLISH_HUB_RAILS } from "@/lib/me/publishHubModel";

export function publishHubFilterTabIndex(
  filter: PublishHubRailFilter,
  active: PublishHubRailFilter,
): number {
  return filter === active ? 0 : -1;
}

export function publishHubFilterArrowKeyNext(
  current: PublishHubRailFilter,
  key: "ArrowLeft" | "ArrowRight",
): PublishHubRailFilter {
  const idx = PUBLISH_HUB_RAILS.indexOf(current);
  if (idx < 0) return current;
  const delta = key === "ArrowRight" ? 1 : -1;
  const next = (idx + delta + PUBLISH_HUB_RAILS.length) % PUBLISH_HUB_RAILS.length;
  return PUBLISH_HUB_RAILS[next] ?? current;
}
