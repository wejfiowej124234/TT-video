/**
 * 「全部」筛选下隐藏空占位轨（SSOT：`PUBLISH-HUB-L5-DESIGN.md` Phase A-4+）
 */
import {
  publishHubFilterShowsRail,
  type PublishHubContentRail,
  type PublishHubRailFilter,
} from "@/lib/me/publishHubModel";

export type PublishHubVisibleRailsSnapshot = {
  tripOrderCount: number;
  tripLoading: boolean;
  tripError: boolean;
  governanceProposalCount: number;
  governanceLoading: boolean;
  governanceError: boolean;
  guideVisible: boolean;
  guideHasListing: boolean;
  guideLoading: boolean;
  guideError: boolean;
  stewardUnlocked: boolean;
  merchantUnlocked: boolean;
  merchantRowCount: number;
  merchantLoading: boolean;
  merchantError: boolean;
  acquisitionUnlocked: boolean;
  acquisitionRowCount: number;
  acquisitionLoading: boolean;
  acquisitionError: boolean;
};

function railHasSignal(loading: boolean, error: boolean, count: number): boolean {
  return loading || error || count > 0;
}

export function publishHubShouldRenderRail(opts: {
  filter: PublishHubRailFilter;
  rail: PublishHubContentRail;
  snapshot: PublishHubVisibleRailsSnapshot;
}): boolean {
  const { filter, rail, snapshot } = opts;
  if (!publishHubFilterShowsRail(filter, rail)) return false;
  if (filter !== "all") return true;

  switch (rail) {
    case "trip":
      return railHasSignal(snapshot.tripLoading, snapshot.tripError, snapshot.tripOrderCount);
    case "guide":
      return (
        snapshot.guideHasListing ||
        snapshot.guideLoading ||
        snapshot.guideError
      );
    case "merchant":
      return railHasSignal(
        snapshot.merchantLoading,
        snapshot.merchantError,
        snapshot.merchantRowCount,
      );
    case "acquisition":
      return railHasSignal(
        snapshot.acquisitionLoading,
        snapshot.acquisitionError,
        snapshot.acquisitionRowCount,
      );
    case "governance":
      return (
        snapshot.stewardUnlocked ||
        railHasSignal(
          snapshot.governanceLoading,
          snapshot.governanceError,
          snapshot.governanceProposalCount,
        )
      );
    default:
      return false;
  }
}

export function publishHubVisibleContentRails(opts: {
  filter: PublishHubRailFilter;
  allRails: readonly PublishHubContentRail[];
  snapshot: PublishHubVisibleRailsSnapshot;
}): PublishHubContentRail[] {
  return opts.allRails.filter((rail) =>
    publishHubShouldRenderRail({
      filter: opts.filter,
      rail,
      snapshot: opts.snapshot,
    }),
  );
}
