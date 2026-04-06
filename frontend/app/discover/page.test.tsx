/**
 * 29 §10：/discover 重定向至 /market（与清单「自由市场」入口一致）
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import DiscoverPage from "./page";

const replace = vi.fn();

const { searchParamsRef } = vi.hoisted(() => ({
  searchParamsRef: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParamsRef.current,
}));

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("/discover page", () => {
  beforeEach(() => {
    replace.mockClear();
    searchParamsRef.current = new URLSearchParams();
  });

  it("replaces route to /market after mount when there is no query", async () => {
    render(<DiscoverPage />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/market");
    });
  });

  it("preserves query string when redirecting to /market", async () => {
    searchParamsRef.current = new URLSearchParams({
      view: "guides",
      country: "xx",
      city: "yy",
      language: "zz",
      guide_id: "g1",
    });
    render(<DiscoverPage />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
      const to = replace.mock.calls[0][0] as string;
      expect(to.startsWith("/market?")).toBe(true);
      const q = new URLSearchParams(to.slice("/market?".length));
      expect(q.get("view")).toBe("guides");
      expect(q.get("country")).toBe("xx");
      expect(q.get("city")).toBe("yy");
      expect(q.get("language")).toBe("zz");
      expect(q.get("guide_id")).toBe("g1");
    });
  });
});
