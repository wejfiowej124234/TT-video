/**
 * /help：FAQ 与关键链接（51-H2、官方总表 P1-D）
 */
import React, { Suspense } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import HelpPage from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

function renderHelp() {
  return render(
    <LocaleProvider>
      <Suspense fallback={null}>
        <HelpPage />
      </Suspense>
    </LocaleProvider>
  );
}

describe("HelpPage", () => {
  it("renders title and FAQ section (zh default)", async () => {
    renderHelp();
    expect(await screen.findByRole("heading", { level: 1, name: "帮助中心" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "常见问题" })).toBeTruthy();
  });

  it("exposes pay and orders links in FAQ", async () => {
    renderHelp();
    await screen.findByRole("heading", { level: 1, name: "帮助中心" });
    const pay = screen.getByRole("link", { name: /行程付款说明/ });
    expect(pay.getAttribute("href")).toBe("/pay");
    const ordersLinks = screen.getAllByRole("link", { name: /我的订单/ });
    const orders = ordersLinks.find((a) => a.getAttribute("href") === "/orders");
    expect(orders).toBeTruthy();
    expect(orders!.getAttribute("href")).toBe("/orders");
  });

  it("links official feedback to community feedback page", async () => {
    renderHelp();
    await screen.findByRole("heading", { level: 1, name: "帮助中心" });
    expect(screen.getByRole("heading", { level: 2, name: "建议与官方反馈" })).toBeTruthy();
    const fbLinks = screen.getAllByRole("link", { name: /建议与反馈/ });
    expect(fbLinks.length).toBeGreaterThanOrEqual(1);
    for (const a of fbLinks) {
      expect(a.getAttribute("href")).toBe("/community/feedback");
    }
  });

  it("FAQ community links to intro and feed", async () => {
    renderHelp();
    await screen.findByRole("heading", { level: 1, name: "帮助中心" });
    const intro = screen.getByRole("link", { name: /TT 社区介绍页/ });
    const feed = screen.getByRole("link", { name: /浏览社区动态/ });
    expect(intro.getAttribute("href")).toBe("/community/tt");
    expect(feed.getAttribute("href")).toBe("/community");
  });

  it("FAQ fee routing row links to trust center and governance hub (consumer-safe)", async () => {
    renderHelp();
    await screen.findByRole("heading", { level: 1, name: "帮助中心" });
    const trustLinks = screen.getAllByRole("link", { name: /信任中心/ });
    expect(trustLinks.some((a) => a.getAttribute("href") === "/trust")).toBe(true);
    const govLinks = screen.getAllByRole("link", { name: /^治理/ });
    const gov = govLinks.find((a) => a.getAttribute("href") === "/governance");
    expect(gov).toBeTruthy();
  });
});
