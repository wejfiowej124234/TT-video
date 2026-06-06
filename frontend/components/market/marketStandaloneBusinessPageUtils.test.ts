import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchMarketStandaloneCatalog,
  invalidateMarketStandaloneCatalogCache,
} from "./marketStandaloneBusinessPageUtils";

vi.mock("@/lib/apiClient/marketSubsite", () => ({
  getMarketProviderListings: vi.fn(),
  getMarketAcquisitionListings: vi.fn(),
}));

import {
  getMarketAcquisitionListings,
  getMarketProviderListings,
} from "@/lib/apiClient/marketSubsite";

const providerMock = vi.mocked(getMarketProviderListings);
const acquisitionMock = vi.mocked(getMarketAcquisitionListings);

describe("fetchMarketStandaloneCatalog cache", () => {
  beforeEach(() => {
    providerMock.mockReset();
    acquisitionMock.mockReset();
    invalidateMarketStandaloneCatalogCache();
  });

  it("reuses TTL cache for identical provider query", async () => {
    providerMock.mockResolvedValue({
      items: [{ id: "l1", title: "Shop" }],
      meta: { source: "postgres_catalog" },
      isPlaceholderCatalog: false,
    });
    await fetchMarketStandaloneCatalog(true, "country=CN");
    await fetchMarketStandaloneCatalog(true, "country=CN");
    expect(providerMock).toHaveBeenCalledTimes(1);
  });

  it("bypassCache forces a fresh provider fetch", async () => {
    providerMock.mockResolvedValue({
      items: [{ id: "l1", title: "Shop" }],
      meta: { source: "postgres_catalog" },
      isPlaceholderCatalog: false,
    });
    await fetchMarketStandaloneCatalog(true, "country=CN");
    await fetchMarketStandaloneCatalog(true, "country=CN", { bypassCache: true });
    expect(providerMock).toHaveBeenCalledTimes(2);
  });

  it("invalidateMarketStandaloneCatalogCache clears acquisition cache", async () => {
    acquisitionMock.mockResolvedValue({
      items: [{ id: "a1", title: "Route" }],
      meta: { source: "postgres_catalog" },
      isPlaceholderCatalog: false,
    });
    await fetchMarketStandaloneCatalog(false, "country=JP");
    invalidateMarketStandaloneCatalogCache();
    await fetchMarketStandaloneCatalog(false, "country=JP");
    expect(acquisitionMock).toHaveBeenCalledTimes(2);
  });
});
