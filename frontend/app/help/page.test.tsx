/**
 * /help：FAQ 与关键链接（51-H2、官方总表 P1-D）
 */
import React, { Suspense } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import HelpPage from "./page";

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
    const pay = screen.getByRole("link", { name: /支付与托管说明/ });
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

  it("FAQ FeeRouter links to governance fee routes and traveltrust anchor (07 §5.2A)", async () => {
    renderHelp();
    await screen.findByRole("heading", { level: 1, name: "帮助中心" });
    const govLinks = screen.getAllByRole("link", { name: /费路由（治理）/ });
    const gov = govLinks.find((a) => a.getAttribute("href") === "/governance/fee-routes");
    expect(gov).toBeTruthy();
    const netLinks = screen.getAllByRole("link", { name: /费路由自检/ });
    const net = netLinks.find((a) => a.getAttribute("href") === "/traveltrust#fee-router");
    expect(net).toBeTruthy();
    expect(gov!.getAttribute("href")).toBe("/governance/fee-routes");
    expect(net!.getAttribute("href")).toBe("/traveltrust#fee-router");
  });

  it("FAQ TTG row links to traveltrust liquidity anchor (v6 § liquidity)", async () => {
    renderHelp();
    await screen.findByRole("heading", { level: 1, name: "帮助中心" });
    const token = screen.getByRole("link", { name: /代币分层说明/ });
    expect(token.getAttribute("href")).toBe("/traveltrust#liquidity");
  });
});
