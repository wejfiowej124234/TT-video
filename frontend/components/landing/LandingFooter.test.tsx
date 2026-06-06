/**
 * 54-S16 / §2.9：页脚多栏含法律（条款、隐私）；不含未运营社交外链
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import LandingFooter from "./LandingFooter";

function renderFooter() {
  return render(
    <LocaleProvider>
      <LandingFooter />
    </LocaleProvider>
  );
}

describe("LandingFooter (54-S16)", () => {
  it("legal column links to terms, privacy, help, feedback", () => {
    renderFooter();
    expect(screen.getByRole("link", { name: "服务条款" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "隐私政策" }).getAttribute("href")).toBe("/privacy");
    expect(screen.getByRole("link", { name: "帮助" }).getAttribute("href")).toBe("/help");
    expect(screen.getByRole("link", { name: "建议与反馈" }).getAttribute("href")).toBe("/community/feedback");
    expect(screen.getByRole("heading", { name: "法律" })).toBeTruthy();
  });

  it("tech column links to governance fee routes; bottom strip omits duplicate (07 §5.2A)", () => {
    renderFooter();
    const feeRouteLinks = screen.getAllByRole("link", { name: "费路由（治理）" });
    expect(feeRouteLinks.length).toBe(1);
    expect(feeRouteLinks[0]?.getAttribute("href")).toBe("/governance/fee-routes");
    const selfCheckLinks = screen.getAllByRole("link", { name: "费路由自检" });
    expect(selfCheckLinks.length).toBe(1);
  });

  it("has no social platform outbound links in footer", () => {
    renderFooter();
    const hrefs = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href") ?? "");
    const socialPattern = /twitter\.com|x\.com\/|youtube\.com|tiktok\.com|discord\.(gg|com)|t\.me\/|facebook\.com|instagram\.com/i;
    expect(hrefs.filter((h) => socialPattern.test(h))).toEqual([]);
  });
});
