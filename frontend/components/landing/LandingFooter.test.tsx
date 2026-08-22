/**
 * 54-S16 / §2.9：页脚多栏含法律；关注我们为 Owner 官方六席外链
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import LandingFooter from "./LandingFooter";

function renderFooter() {
  return render(
    <LocaleProvider initialLocale="zh">
      <LandingFooter />
    </LocaleProvider>
  );
}

describe("LandingFooter (54-S16)", () => {
  it("legal column links to terms, privacy, help, feedback", () => {
    renderFooter();
    expect(screen.getByRole("link", { name: "服务条款" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "隐私政策" }).getAttribute("href")).toBe("/privacy");
    expect(screen.getAllByRole("link", { name: "帮助" }).some((a) => a.getAttribute("href") === "/help")).toBe(true);
    expect(screen.getByRole("link", { name: "建议与反馈" }).getAttribute("href")).toBe("/community/feedback");
    expect(screen.getByRole("heading", { name: "法律" })).toBeTruthy();
  });

  it("trust column links to trust center and governance — no operator FeeRouter links", () => {
    renderFooter();
    expect(screen.getAllByRole("link", { name: "信任中心" }).some((a) => a.getAttribute("href") === "/trust")).toBe(true);
    expect(screen.getByRole("link", { name: "治理门户" }).getAttribute("href")).toBe("/governance");
    expect(screen.getByRole("heading", { name: "信任与治理" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "费路由（治理）" })).toBeNull();
    expect(screen.queryByRole("link", { name: "费路由自检" })).toBeNull();
  });

  it("follow-us row exposes Owner Instagram / X / Discord (no stale platforms)", () => {
    renderFooter();
    expect(screen.getByRole("heading", { name: "关注我们" })).toBeTruthy();
    const hrefs = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.some((h) => h.includes("instagram.com/traveltrust.ir"))).toBe(true);
    expect(hrefs.some((h) => h.includes("x.com/TravelTrust_"))).toBe(true);
    expect(hrefs.some((h) => h.includes("discord.com/channels/"))).toBe(true);
    expect(hrefs.some((h) => /github\.com|youtube\.com|snapchat|facebook\.com|reddit\.com|t\.me\//i.test(h))).toBe(
      false,
    );
  });
});
