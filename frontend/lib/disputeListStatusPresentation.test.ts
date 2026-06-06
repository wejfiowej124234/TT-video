import { describe, expect, it, vi } from "vitest";
import { disputeListStatusPresentation } from "./disputeListStatusPresentation";
describe("disputeListStatusPresentation", () => {
  const t = vi.fn((key: string, params?: Record<string, string>) => {
    if (key === "disputes_statusUnknown" && params?.status) return `unknown:${params.status}`;
    return key;
  });

  it("maps known statuses", () => {
    expect(disputeListStatusPresentation("resolved", t).className).toContain("success");
    expect(disputeListStatusPresentation("open", t).className).toContain("ref-sun");
    expect(disputeListStatusPresentation("pending", t).className).toContain("warning");
  });

  it("falls back for unknown status", () => {
    const out = disputeListStatusPresentation("weird_status", t);
    expect(out.label).toBe("unknown:weird_status");
    expect(out.className).toContain("slate");
  });
});
