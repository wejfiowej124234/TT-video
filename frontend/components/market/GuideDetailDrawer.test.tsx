/**
 * B-062：向导抽屉 GET 失败 ApiErrorAlert + 重试；无效 id / 未找到中性块
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GuideDetailDrawer from "./GuideDetailDrawer";
import type { GuideCardItem } from "@/lib/marketTypes";

const { stableT, getGuideMock } = vi.hoisted(() => {
  function t(k: string) {
    return k;
  }
  return { stableT: t, getGuideMock: vi.fn() };
});

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: stableT }),
}));

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: function MockImage(props: { alt: string }) {
    return <img alt={props.alt} />;
  },
}));

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...mod,
    getGuide: (id: string) => getGuideMock(id),
  };
});

const sampleListGuide: GuideCardItem = {
  id: "11111111-1111-1111-1111-111111111111",
  city: "Tokyo",
  languages: ["ja"],
  service_types: ["walk"],
  bio: "List bio",
  hourly_rate: "50",
  hourly_currency: "USDC",
};

describe("GuideDetailDrawer (B-062)", () => {
  beforeEach(() => {
    getGuideMock.mockReset();
  });

  it("invalid id shows neutral copy and market link", () => {
    render(
      <GuideDetailDrawer
        guide={{ ...sampleListGuide, id: "   " }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("market_guideDrawer_invalidId")).toBeTruthy();
    const marketLink = screen.getByRole("link", { name: "market_meta_title" });
    expect(marketLink.getAttribute("href")).toBe("/market");
  });

  it("guide_not_found shows not found neutral block", async () => {
    getGuideMock.mockRejectedValue(new Error("guide_not_found"));
    render(<GuideDetailDrawer guide={sampleListGuide} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("guideDetail_notFound")).toBeTruthy();
    });
    expect(screen.getByText("market_guideDrawer_notFoundHint")).toBeTruthy();
  });

  it("GET failure shows ApiErrorAlert and common_retry refetches", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      getGuideMock.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({
        bio: "API bio",
        hourly_rate: "99",
      });

      render(<GuideDetailDrawer guide={sampleListGuide} onClose={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText("guideDetail_loadFailed")).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: "common_retry" }));

      await waitFor(() => {
        expect(screen.getByText("API bio")).toBeTruthy();
      });
      expect(screen.queryByText("guideDetail_loadFailed")).toBeNull();
      expect(getGuideMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      errSpy.mockRestore();
    }
  });

  it("merges GET guide into list snapshot", async () => {
    getGuideMock.mockResolvedValue({ bio: "Merged from API", hourly_rate: "120" });
    render(<GuideDetailDrawer guide={sampleListGuide} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Merged from API")).toBeTruthy();
    });
    expect(getGuideMock).toHaveBeenCalledWith(sampleListGuide.id);
  });
});
