import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MarketGlassModalFrame from "./MarketGlassModalFrame";

describe("MarketGlassModalFrame", () => {
  it("calls onRequestClose when clicking scrim", () => {
    const onClose = vi.fn();
    render(
      <MarketGlassModalFrame
        onRequestClose={onClose}
        aria-labelledby="t1"
        aria-describedby="d1"
        rootHtmlProps={{ "data-testid": "glass-root" }}
      >
        <p id="t1">Title</p>
        <p id="d1">Desc</p>
        <span>Body</span>
      </MarketGlassModalFrame>,
    );
    const root = screen.getByTestId("glass-root");
    expect(root.getAttribute("role")).toBe("dialog");
    const scrim = root.firstElementChild;
    expect(scrim?.getAttribute("aria-hidden")).toBe("true");
    fireEvent.click(scrim!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("merges scrimClassName onto scrim", () => {
    render(
      <MarketGlassModalFrame
        onRequestClose={vi.fn()}
        aria-labelledby="t3"
        aria-describedby="d3"
        scrimClassName="motion-sub"
        rootHtmlProps={{ "data-testid": "glass-scrim-class-root" }}
      >
        <span id="t3">T</span>
        <span id="d3">D</span>
      </MarketGlassModalFrame>,
    );
    const root = screen.getByTestId("glass-scrim-class-root");
    expect(root.getAttribute("role")).toBe("dialog");
    const scrim = root.firstElementChild;
    expect(scrim?.className).toMatch(/motion-sub/);
  });

  it("does not close when clicking panel content", () => {
    const onClose = vi.fn();
    render(
      <MarketGlassModalFrame onRequestClose={onClose} aria-labelledby="t2" aria-describedby="d2">
        <h2 id="t2">T</h2>
        <p id="d2">D</p>
        <button type="button">Inside</button>
      </MarketGlassModalFrame>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Inside" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
