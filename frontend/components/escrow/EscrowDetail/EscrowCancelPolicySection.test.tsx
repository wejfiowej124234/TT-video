/**
 * 54-S6：取消规则区对比度（深底 + text-slate-300 正文）
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import EscrowCancelPolicySection from "./EscrowCancelPolicySection";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("EscrowCancelPolicySection (54-S6)", () => {
  it("title and body use light text on dark panel", () => {
    const { container } = render(<EscrowCancelPolicySection headingId="cp-h" />);
    const h = container.querySelector("#cp-h");
    const p = container.querySelector("p");
    expect(h?.className).toContain("text-slate-300");
    expect(p?.className).toContain("text-slate-300");
    expect(h?.textContent).toBe("order_cancelPolicyTitle");
  });
});
