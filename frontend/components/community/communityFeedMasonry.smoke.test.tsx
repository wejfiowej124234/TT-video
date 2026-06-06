import { describe, expect, it, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommunityFeedMasonryCard } from "./CommunityFeedMasonryCard";
import { CommunityFeedMasonryGrid } from "./CommunityFeedMasonryGrid";
import { CommunityFeedVideoAutoplayProvider } from "./CommunityFeedVideoAutoplayContext";
import type { CommunityPost } from "@/lib/communityMockData";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
  });
});

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const t = (key: string) => key;

function post(partial: Partial<CommunityPost> & Pick<CommunityPost, "id">): CommunityPost {
  return {
    type: "photo",
    content: "hello",
    title: "Test post",
    destination: "京都",
    tags: ["travel"],
    media_url: "https://cdn.example.test/a.jpg",
    author: { id: "u1", nickname: "Tester", avatar_url: null, role: "traveler" },
    likes: 3,
    comments: 0,
    collects: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

describe("CommunityFeedMasonry smoke", () => {
  it("renders masonry card without runtime ReferenceErrors", () => {
    render(
      <CommunityFeedVideoAutoplayProvider>
        <CommunityFeedMasonryCard post={post({ id: "p1" })} t={t} />
      </CommunityFeedVideoAutoplayProvider>,
    );
    expect(screen.getByText("Test post")).toBeTruthy();
  });

  it("renders masonry grid with promo lead band and in-flow slots", () => {
    render(
      <CommunityFeedMasonryGrid
        t={t}
        postsToShow={[post({ id: "p1" }), post({ id: "p2", title: "Second" })]}
        localCommentsByPostId={{}}
        onViewFull={vi.fn()}
        showPromoSlots
        hotDestinations={["京都"]}
      />,
    );
    expect(screen.getByTestId("community-feed-promo-lead-band")).toBeTruthy();
    expect(screen.getAllByTestId("community-feed-promo-activity-slot")).toHaveLength(2);
    expect(screen.getByTestId("community-feed-first-post")).toBeTruthy();
  });
});
