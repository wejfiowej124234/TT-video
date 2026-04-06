/**
 * 36 单测：34 组件 TrustBadgesRow（28 Hero 下三徽章；随 app locale 切换）
 */
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n";
import TrustBadgesRow from "./TrustBadgesRow";

function wrap(ui: React.ReactElement) {
  return <LocaleProvider>{ui}</LocaleProvider>;
}

describe("TrustBadgesRow", () => {
  beforeEach(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
  });

  it("renders three badges in Chinese when locale is zh (default)", () => {
    render(wrap(<TrustBadgesRow />));
    expect(screen.getByText("非托管")).toBeTruthy();
    expect(screen.getByText("链上托管")).toBeTruthy();
    expect(screen.getByText("争议支持")).toBeTruthy();
  });

  it("renders three badges in English when locale is en", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "en");
    render(wrap(<TrustBadgesRow />));
    expect(screen.getByText("Non-custodial")).toBeTruthy();
    expect(screen.getByText("On-chain escrow")).toBeTruthy();
    expect(screen.getByText("Dispute support")).toBeTruthy();
  });

  it("uses 22 tokens / no forbidden classes", () => {
    const { container } = render(wrap(<TrustBadgesRow />));
    const html = container.innerHTML;
    expect(html).not.toMatch(/\btext-gray-\d/);
    expect(html).not.toMatch(/\btext-blue-\d/);
    expect(html).toMatch(/bg-white\/20|backdrop-blur/);
  });
});
