/**
 * 37 §3：CommunityVideoOverlay L5 — aria-labelledby + aria-describedby
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CommunityVideoOverlay from "./CommunityVideoOverlay";

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

beforeEach(() => {
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
});

describe("CommunityVideoOverlay", () => {
  const items = [
    {
      key: "v1",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      caption: "demo",
      author: "Aurora",
    },
  ];

  it("returns null when closed", () => {
    const { container } = render(
      <CommunityVideoOverlay
        open={false}
        onClose={vi.fn()}
        t={(k) => k}
        items={items}
        activeKey="v1"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("dialog references title and description ids", () => {
    render(
      <CommunityVideoOverlay open onClose={vi.fn()} t={(k) => k} items={items} activeKey="v1" />,
    );
    const dialog = screen.getByRole("dialog", { name: "community_video_playing" });
    const describedby = dialog.getAttribute("aria-describedby");
    expect(describedby).toBeTruthy();
    expect(document.getElementById(describedby!)?.textContent).toContain("community_video_swipe_hint");
  });

  it("renders L5 back control", () => {
    render(
      <CommunityVideoOverlay open onClose={vi.fn()} t={(k) => k} items={items} activeKey="v1" />,
    );
    expect(screen.getByLabelText("community_back_drawer")).toBeTruthy();
    expect(screen.getByLabelText("community_close")).toBeTruthy();
  });
});
