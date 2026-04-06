/**
 * 37 §3：链上事件时间线 — 区域 + 标题层级（读屏）
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import OnchainEventTimeline from "./OnchainEventTimeline";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({
    t: (k: string) => {
      if (k === "escrow_viewTxAria") return "View tx {{hash}}";
      if (k === "escrow_txHistory") return k;
      if (k === "escrow_blockLabel") return "Block {{n}}";
      if (k === "escrow_viewTx") return k;
      if (k === "escrow_eventsPlaceholder") return k;
      return k;
    },
  }),
}));

describe("OnchainEventTimeline", () => {
  it("wraps content in region labelled by heading", () => {
    render(<OnchainEventTimeline events={[]} />);
    expect(screen.getByRole("region", { name: "escrow_txHistory" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 4, name: "escrow_txHistory" })).toBeTruthy();
  });

  it("gives each explorer link a distinct aria-label with shortened hash", () => {
    render(
      <OnchainEventTimeline
        explorerTxUrl="https://example.com/tx/"
        events={[
          { type: "Funded", txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
          { type: "Released", txHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
        ]}
      />
    );
    const a = screen.getAllByRole("link", { name: /View tx 0x/ });
    expect(a.length).toBe(2);
    expect(a[0]?.getAttribute("aria-label")).toMatch(/View tx 0xaaaa.+aaaa$/);
    expect(a[1]?.getAttribute("aria-label")).toMatch(/View tx 0xbbbb.+bbbb$/);
    expect(a[0]?.getAttribute("title")).toContain("0xaaaa");
  });
});
