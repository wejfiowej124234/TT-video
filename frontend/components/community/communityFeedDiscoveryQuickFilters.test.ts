import { describe, expect, it, vi } from "vitest";
import {
  COMMUNITY_DISCOVERY_FUN_TOPIC_TAG,
  applyCommunityDiscoveryFunFilter,
  applyCommunityDiscoveryProximityFilter,
  applyCommunityDiscoveryStreamTab,
  communityDiscoverySecondaryFiltersActive,
  isCommunityDiscoveryFunTopicActive,
} from "./communityFeedDiscoveryQuickFilters";

describe("communityFeedDiscoveryQuickFilters", () => {
  it("detects fun topic chip active state", () => {
    expect(isCommunityDiscoveryFunTopicActive("fun")).toBe(true);
    expect(isCommunityDiscoveryFunTopicActive("Fun")).toBe(true);
    expect(isCommunityDiscoveryFunTopicActive("travel")).toBe(false);
  });

  it("applyCommunityDiscoveryProximityFilter sets nearby_1km on recommend latest", () => {
    const setFeedTab = vi.fn();
    const setSortBy = vi.fn();
    const setDestinationFilter = vi.fn();
    const setTypeFilter = vi.fn();
    const setRegionFilter = vi.fn();
    const setTagFilter = vi.fn();
    const setProximityFilter = vi.fn();

    applyCommunityDiscoveryProximityFilter(
      {
        setFeedTab,
        setSortBy,
        setDestinationFilter,
        setTypeFilter,
        setRegionFilter,
        setTagFilter,
        setProximityFilter,
      },
      "nearby_1km",
    );

    expect(setFeedTab).toHaveBeenCalledWith("recommend");
    expect(setSortBy).toHaveBeenCalledWith("latest");
    expect(setProximityFilter).toHaveBeenCalledWith("nearby_1km");
    expect(setTagFilter).toHaveBeenCalledWith(null);
  });

  it("applyCommunityDiscoveryFunFilter uses fun topic tag", () => {
    const setTagFilter = vi.fn();
    applyCommunityDiscoveryFunFilter({
      setFeedTab: vi.fn(),
      setSortBy: vi.fn(),
      setDestinationFilter: vi.fn(),
      setTypeFilter: vi.fn(),
      setRegionFilter: vi.fn(),
      setTagFilter,
      setProximityFilter: vi.fn(),
    });
    expect(setTagFilter).toHaveBeenCalledWith(COMMUNITY_DISCOVERY_FUN_TOPIC_TAG);
  });

  it("applyCommunityDiscoveryStreamTab clears proximity on recommend/hot", () => {
    const setProximityFilter = vi.fn();
    applyCommunityDiscoveryStreamTab(
      {
        setFeedTab: vi.fn(),
        setSortBy: vi.fn(),
        setDestinationFilter: vi.fn(),
        setTypeFilter: vi.fn(),
        setRegionFilter: vi.fn(),
        setTagFilter: vi.fn(),
        setProximityFilter,
      },
      "recommend",
    );
    expect(setProximityFilter).toHaveBeenCalledWith("none");

    setProximityFilter.mockClear();
    applyCommunityDiscoveryStreamTab(
      {
        setFeedTab: vi.fn(),
        setSortBy: vi.fn(),
        setDestinationFilter: vi.fn(),
        setTypeFilter: vi.fn(),
        setRegionFilter: vi.fn(),
        setTagFilter: vi.fn(),
        setProximityFilter,
      },
      "hot",
    );
    expect(setProximityFilter).toHaveBeenCalledWith("none");
  });

  it("communityDiscoverySecondaryFiltersActive ignores primary food/fun chips", () => {
    expect(
      communityDiscoverySecondaryFiltersActive({
        regionFilter: "all",
        destinationFilter: "all",
        typeFilter: "food",
        tagFilter: "fun",
        sortBy: "latest",
      }),
    ).toBe(false);
    expect(
      communityDiscoverySecondaryFiltersActive({
        regionFilter: "all",
        destinationFilter: "all",
        typeFilter: "photo",
        tagFilter: null,
        sortBy: "latest",
      }),
    ).toBe(true);
  });
});
