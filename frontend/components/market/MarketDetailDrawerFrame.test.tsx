import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MarketDetailDrawerFrame from "./MarketDetailDrawerFrame";

describe("MarketDetailDrawerFrame", () => {
  it("calls onRequestClose when clicking scrim (dialog root)", () => {
    const onClose = vi.fn();
    render(
      <MarketDetailDrawerFrame
        onRequestClose={onClose}
        aria-labelledby="t1"
        rootHtmlProps={{ "data-testid": "drawer-root" }}
      >
        <h2 id="t1">Title</h2>
        <span>Body</span>
      </MarketDetailDrawerFrame>,
    );
    const root = screen.getByTestId("drawer-root");
    expect(root.getAttribute("role")).toBe("dialog");
    fireEvent.click(root);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("merges scrimClassName onto scrim", () => {
    render(
      <MarketDetailDrawerFrame
        onRequestClose={vi.fn()}
        aria-labelledby="t3"
        scrimClassName="motion-sub"
        rootHtmlProps={{ "data-testid": "mdf-scrim-class-root" }}
      >
        <span id="t3">T</span>
      </MarketDetailDrawerFrame>,
    );
    expect(screen.getByTestId("mdf-scrim-class-root").className).toMatch(/motion-sub/);
  });

  it("stickyFooter panel variant uses overflow-hidden sticky layout class", () => {
    render(
      <MarketDetailDrawerFrame
        onRequestClose={vi.fn()}
        panelVariant="stickyFooter"
        aria-labelledby="t-sticky"
        rootHtmlProps={{ "data-testid": "mdf-sticky-root" }}
      >
        <span id="t-sticky">Sticky</span>
      </MarketDetailDrawerFrame>,
    );
    const panel = screen.getByTestId("mdf-sticky-root").querySelector(".overflow-hidden");
    expect(panel).toBeTruthy();
    expect(panel?.className).toMatch(/max-h-\[100dvh\]/);
  });

  it("does not close when clicking panel content", () => {
    const onClose = vi.fn();
    render(
      <MarketDetailDrawerFrame onRequestClose={onClose} aria-labelledby="t2">
        <h2 id="t2">T</h2>
        <button type="button">Inside</button>
      </MarketDetailDrawerFrame>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Inside" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
