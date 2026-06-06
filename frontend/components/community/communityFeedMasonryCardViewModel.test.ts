import { describe, expect, it } from "vitest";
import type { CommunityPost } from "@/lib/communityMockData";
import { communityFeedMasonryCardViewModel } from "./communityFeedMasonryCardViewModel";

const t = (key: string) => key;

function post(partial: Partial<CommunityPost> & Pick<CommunityPost, "id">): CommunityPost {
  return {
    type: "photo",
    content: "",
    tags: [],
    author: { id: "u1", nickname: "U", avatar_url: null, role: "traveler" },
    likes: 2,
    comments: 0,
    collects: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

describe("communityFeedMasonryCardViewModel", () => {
  it("separates domain post from presentation fields", () => {
    const vm = communityFeedMasonryCardViewModel(
      post({
        id: "p1",
        title: "c5-staging-image-delivery-1780246240",
        type: "photo",
        tags: ["c5-img-1780266240"],
      }),
      t,
    );
    expect(vm.displayTitle).toBe("U");
    expect(vm.location?.name).toBe("community_type_photo");
    expect(vm.location?.distanceIsPlaceholder).toBe(true);
    expect(vm.mediaAspectClass).toMatch(/^aspect-/);
  });

  it("uses destination when present", () => {
    const tZh = (key: string) => (key === "community_dest_kyoto" ? "京都" : key);
    const vm = communityFeedMasonryCardViewModel(
      post({ id: "p2", destination: "京都", title: "Nice trip" }),
      tZh,
    );
    expect(vm.displayTitle).toBe("Nice trip");
    expect(vm.location?.name).toBe("京都");
    expect(vm.location?.distanceIsPlaceholder).toBe(true);
  });

  it("prefers venue_name and real distance_m from API", () => {
    const tKm = (key: string) =>
      key === "community_feed_distance_km" ? "{{km}} km" : key;
    const vm = communityFeedMasonryCardViewModel(
      post({
        id: "p3",
        venueName: "秋那果·云贵川菜 Bistro",
        distanceM: 2400,
        type: "food",
      }),
      tKm,
    );
    expect(vm.location?.name).toBe("秋那果·云贵川菜 Bistro");
    expect(vm.location?.distanceIsPlaceholder).toBe(false);
    expect(vm.location?.distanceLabel).toBe("2.4 km");
  });

  it("marks sponsored posts", () => {
    expect(communityFeedMasonryCardViewModel(post({ id: "ad1", tags: ["ad"] }), t).isSponsored).toBe(
      true,
    );
    expect(
      communityFeedMasonryCardViewModel(
        post({ id: "ad2", commerceShowcaseKind: "sponsored" }),
        t,
      ).isSponsored,
    ).toBe(true);
  });
});
