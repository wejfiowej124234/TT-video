import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import TravelTrustSectionNav from "./TravelTrustSectionNav";

describe("TravelTrustSectionNav", () => {
  it("exposes landmark and in-page anchor links (85 IA)", () => {
    render(
      <LocaleProvider>
        <TravelTrustSectionNav />
      </LocaleProvider>,
    );
    expect(screen.getByRole("navigation", { name: "本页章节导航" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "首屏" }).getAttribute("href")).toBe("#hero");
    expect(screen.getByRole("link", { name: "概览与亮点" }).getAttribute("href")).toBe("#overview");
    expect(screen.getByRole("link", { name: "视频" }).getAttribute("href")).toBe("#video");
    expect(screen.getByRole("link", { name: "痛点" }).getAttribute("href")).toBe("#problem");
    expect(screen.getByRole("link", { name: "方案" }).getAttribute("href")).toBe("#solution");
    expect(screen.getByRole("link", { name: "实时网络" }).getAttribute("href")).toBe("#live-network");
    expect(screen.getByRole("link", { name: "费路由" }).getAttribute("href")).toBe("#fee-router");
    expect(screen.getByRole("link", { name: "信任事实" }).getAttribute("href")).toBe("#trust-facts");
  });
});
