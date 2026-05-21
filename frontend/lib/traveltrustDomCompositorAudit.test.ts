import { describe, expect, it } from "vitest";
import {
  TT_DOM_COMPOSITOR_AUDIT_QUERY,
  compositorFlags,
  shouldMountTraveltrustDomCompositorAudit,
} from "./traveltrustDomCompositorAudit";

describe("traveltrustDomCompositorAudit", () => {
  it("enables only with tt_dom_compositor_audit query", () => {
    expect(TT_DOM_COMPOSITOR_AUDIT_QUERY).toBe("tt_dom_compositor_audit");
    expect(shouldMountTraveltrustDomCompositorAudit()).toBe(false);
  });

  it("compositorFlags detects mix-blend and gradient", () => {
    const flags = compositorFlags({
      mixBlendMode: "soft-light",
      backdropFilter: "none",
      filter: "none",
      opacity: "1",
      transform: "none",
      isolation: "auto",
      willChange: "auto",
      maskImage: "none",
      webkitMaskImage: "none",
      background: "transparent",
      backgroundColor: "rgba(0, 0, 0, 0)",
      backgroundImage: "radial-gradient(ellipse, red, blue)",
      position: "absolute",
      zIndex: "9",
      top: "0px",
      left: "0px",
      right: "auto",
      bottom: "auto",
      width: "100px",
      height: "100px",
      contain: "none",
      pointerEvents: "none",
      display: "block",
      visibility: "visible",
      rect: { x: 0, y: 0, w: 100, h: 100 },
    });
    expect(flags).toContain("mix-blend:soft-light");
    expect(flags).toContain("radial/linear-gradient");
  });
});
