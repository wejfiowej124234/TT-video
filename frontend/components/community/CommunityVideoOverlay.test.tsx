/**
 * 37 §3：CommunityVideoOverlay — aria-labelledby + aria-describedby
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CommunityVideoOverlay from "./CommunityVideoOverlay";

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

describe("CommunityVideoOverlay", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <CommunityVideoOverlay open={false} onClose={vi.fn()} t={(k) => k} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("dialog references title and description ids", () => {
    render(<CommunityVideoOverlay open onClose={vi.fn()} t={(k) => k} />);
    const dialog = screen.getByRole("dialog", { name: "community_video_placeholder" });
    const describedby = dialog.getAttribute("aria-describedby");
    expect(describedby).toBeTruthy();
    expect(document.getElementById(describedby!)?.textContent).toContain("community_subtitle");
  });
});
