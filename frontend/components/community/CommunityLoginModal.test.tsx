/**
 * 37 §3：CommunityLoginModal — aria-labelledby + aria-describedby
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CommunityLoginModal from "./CommunityLoginModal";

describe("CommunityLoginModal", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <CommunityLoginModal open={false} onClose={vi.fn()} t={(k) => k} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("dialog references title and hint by id", () => {
    render(<CommunityLoginModal open onClose={vi.fn()} t={(k) => k} />);
    const dialog = screen.getByRole("dialog", { name: "community_login_to_publish" });
    expect(dialog.getAttribute("data-tt-community-login-for-publish")).toBe("1");
    const labelledby = dialog.getAttribute("aria-labelledby");
    const describedby = dialog.getAttribute("aria-describedby");
    expect(labelledby).toBeTruthy();
    expect(describedby).toBeTruthy();
    expect(document.getElementById(labelledby!)?.textContent).toContain("community_login_to_publish");
    expect(document.getElementById(describedby!)?.textContent).toContain("community_login_modal_hint");
  });
});
