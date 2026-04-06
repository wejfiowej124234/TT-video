/**
 * 5.2 / P29：市场空态次要导航与主站订单/支付/帮助闭环
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import EmptyState from "./EmptyState";

function wrap(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("EmptyState", () => {
  it("no-orders exposes market, orders, pay, help links (zh default)", async () => {
    wrap(<EmptyState kind="no-orders" />);
    await screen.findByText("暂无待撮合订单");
    const nav = screen.getByRole("navigation", { name: "空状态页相关入口" });
    expect(within(nav).getByRole("link", { name: "自由市场" }).getAttribute("href")).toBe("/market");
    expect(within(nav).getByRole("link", { name: "我的订单" }).getAttribute("href")).toBe("/orders");
    expect(within(nav).getByRole("link", { name: "支付与托管" }).getAttribute("href")).toBe("/pay");
    expect(within(nav).getByRole("link", { name: "帮助中心" }).getAttribute("href")).toBe("/help");
  });

  it("no-guides exposes market, orders, help", async () => {
    wrap(<EmptyState kind="no-guides" />);
    await screen.findByRole("link", { name: "申请向导" });
    const nav = screen.getByRole("navigation", { name: "空状态页相关入口" });
    expect(within(nav).getByRole("link", { name: "自由市场" }).getAttribute("href")).toBe("/market");
    expect(within(nav).getByRole("link", { name: "我的订单" }).getAttribute("href")).toBe("/orders");
    expect(within(nav).getByRole("link", { name: "帮助中心" }).getAttribute("href")).toBe("/help");
  });

  it("no-matches exposes secondary links with reset when handler provided", async () => {
    wrap(<EmptyState kind="no-matches" onResetFilters={() => {}} />);
    await screen.findByRole("button", { name: /清除筛选条件/ });
    const nav = screen.getByRole("navigation", { name: "空状态页相关入口" });
    expect(within(nav).getByRole("link", { name: "自由市场" }).getAttribute("href")).toBe("/market");
    expect(within(nav).getByRole("link", { name: "我的订单" }).getAttribute("href")).toBe("/orders");
  });
});
