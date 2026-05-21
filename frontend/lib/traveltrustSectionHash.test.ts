import { describe, expect, it, vi } from "vitest";
import {
  isTraveltrustRoleHash,
  isTraveltrustSectionHash,
  normalizeTraveltrustHash,
  scrollTraveltrustHashIntoView,
} from "./traveltrustSectionHash";

describe("traveltrustSectionHash (TT-PH1-022)", () => {
  it("normalizes hash fragments", () => {
    expect(normalizeTraveltrustHash("#roles")).toBe("roles");
    expect(normalizeTraveltrustHash("guide")).toBe("guide");
  });

  it("classifies role vs section hashes", () => {
    expect(isTraveltrustRoleHash("guide")).toBe(true);
    expect(isTraveltrustSectionHash("liquidity")).toBe(true);
    expect(isTraveltrustRoleHash("liquidity")).toBe(false);
  });

  it("scrolls role hashes to roles section", () => {
    document.body.innerHTML = '<section id="roles"></section><section id="faq"></section>';
    const roles = document.getElementById("roles")!;
    const scrollIntoView = vi.fn();
    roles.scrollIntoView = scrollIntoView;
    expect(scrollTraveltrustHashIntoView("#guide")).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start", inline: "nearest" });
  });

  it("scrolls section hashes to their element ids", () => {
    document.body.innerHTML =
      '<section id="trust"></section><section id="fee-router"></section><section id="liquidity"></section>';
    const trust = document.getElementById("trust")!;
    trust.scrollIntoView = vi.fn();
    expect(scrollTraveltrustHashIntoView("trust", { behavior: "auto" })).toBe(true);
    expect(trust.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start", inline: "nearest" });
  });
});
