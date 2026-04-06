/**
 * 37 §3：CustomItinerary DetailOverlay — aria-labelledby / aria-describedby
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DetailOverlay from "./DetailOverlay";

describe("DetailOverlay", () => {
  it("dialog uses labelledby and describedby for title and description", () => {
    render(
      <DetailOverlay
        image="/x.jpg"
        title="Overlay title"
        description="Overlay body"
        onClose={vi.fn()}
        closeLabel="common_close"
      />
    );
    const dialog = screen.getByRole("dialog", { name: "Overlay title" });
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toContain("Overlay body");
  });
});
