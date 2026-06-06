import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommunityMePostGridThumb } from "@/components/community/CommunityMePostGridThumb";
import type { CommunityPost } from "@/lib/communityMockData";

const t = (k: string) => k;

function videoPost(): CommunityPost {
  return {
    id: "p1",
    type: "video",
    is_video: true,
    media_url: "http://127.0.0.1:19000/traveltrust-community-media/v1/u/a/clip.mp4",
    media_urls: ["http://127.0.0.1:19000/traveltrust-community-media/v1/u/a/clip.mp4"],
    content: "test",
    author: { id: "u1", nickname: "U" },
    likes: 0,
    comments: 0,
    collects: 0,
    created_at: "2026-01-01T00:00:00Z",
  } as CommunityPost;
}

describe("CommunityMePostGridThumb", () => {
  it("renders video element for mp4-only posts (never Next Image on .mp4)", () => {
    const { container } = render(
      <div className="relative aspect-square">
        <CommunityMePostGridThumb post={videoPost()} t={t} />
      </div>,
    );
    expect(container.querySelector("video")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders image when cover_url is present on video post", () => {
    const post = { ...videoPost(), cover_url: "http://127.0.0.1:19000/cover.jpg" };
    const { container } = render(
      <div className="relative aspect-square">
        <CommunityMePostGridThumb post={post} t={t} />
      </div>,
    );
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")).toBeTruthy();
  });
});
