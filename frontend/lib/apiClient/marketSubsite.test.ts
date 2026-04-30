import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import {
  getMarketProviderListings,
  getMarketAcquisitionListings,
  getMarketProviderListing,
  getMarketProviderListingDraft,
  postMarketProviderListingDraft,
  postMarketAcquisitionListingDraft,
  TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID,
} from "./marketSubsite";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("marketSubsite API", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("getMarketProviderListings returns items", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        items: [{ id: "x" }],
        meta: { variant: "provider", source: "postgres_catalog", count: 1 },
      })
    );
    const out = await getMarketProviderListings();
    expect(out.items).toEqual([{ id: "x" }]);
    expect(out.meta).toEqual({ variant: "provider", source: "postgres_catalog", count: 1 });
    expect(out.isPlaceholderCatalog).toBe(false);
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.marketProviderListings), expect.any(Object));
  });

  it("getMarketProviderListings rejects 503 chain_off_unavailable", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        { status: "error", error: "chain_off_unavailable", message: "chain_off_unavailable" },
        503,
      )
    );
    await expect(getMarketProviderListings()).rejects.toThrow("chain_off_unavailable");
  });

  it("getMarketProviderListings postgres_catalog is not placeholder", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        items: [],
        meta: { variant: "provider", source: "postgres_catalog", count: 0 },
      })
    );
    const out = await getMarketProviderListings();
    expect(out.items).toEqual([]);
    expect(out.isPlaceholderCatalog).toBe(false);
  });

  it("getMarketAcquisitionListings returns empty catalog", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        items: [],
        meta: { variant: "acquisition", source: "postgres_catalog", count: 0 },
      })
    );
    const out = await getMarketAcquisitionListings();
    expect(out.items).toEqual([]);
    expect(out.isPlaceholderCatalog).toBe(false);
  });

  it("getMarketProviderListings rejects when items missing on ok envelope", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", meta: { source: "postgres_catalog" } })
    );
    await expect(getMarketProviderListings()).rejects.toThrow(TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID);
  });

  it("getMarketAcquisitionListings rejects when items is not an array", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: {}, meta: { source: "postgres_catalog" } })
    );
    await expect(getMarketAcquisitionListings()).rejects.toThrow(TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID);
  });

  it("getMarketProviderListing returns null on 404", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { status: "error", error: "not_found" }, 404)
    );
    await expect(getMarketProviderListing("missing")).resolves.toBeNull();
  });

  it("postMarketProviderListingDraft rejects 503 database_required via parseResponse", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { status: "error", error: "database_required", message: "database_required" }, 503)
    );
    await expect(postMarketProviderListingDraft({})).rejects.toThrow("database_required");
  });

  it("postMarketAcquisitionListingDraft rejects 503 chain_off_unavailable via parseResponse", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        { status: "error", error: "chain_off_unavailable", message: "business_layer_unavailable" },
        503
      )
    );
    await expect(postMarketAcquisitionListingDraft({})).rejects.toThrow("chain_off_unavailable");
  });

  it("getMarketProviderListingDraft returns payload on 200", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        draft_id: "00000000-0000-4000-8000-000000000099",
        saved_at: "2026-04-20T12:00:00Z",
        payload: { title: "x" },
        meta: { variant: "provider", source: "postgres_draft" },
      })
    );
    const out = await getMarketProviderListingDraft("00000000-0000-4000-8000-000000000099");
    expect(out.draft_id).toBe("00000000-0000-4000-8000-000000000099");
    expect(out.payload).toEqual({ title: "x" });
    expect(out.meta).toEqual({ variant: "provider", source: "postgres_draft" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.marketProviderListingDraftById("00000000-0000-4000-8000-000000000099")),
      expect.any(Object),
    );
  });

  it("getMarketProviderListingDraft rejects 404 listing_draft_not_found via parseResponse", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        { status: "error", error: "listing_draft_not_found", message: "listing_draft_not_found" },
        404,
      )
    );
    await expect(getMarketProviderListingDraft("00000000-0000-4000-8000-000000000099")).rejects.toThrow(
      "listing_draft_not_found",
    );
  });

  it("postMarketProviderListingDraft rejects 503 market_listing_draft_db_persist_failed via parseResponse", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        {
          status: "error",
          error: "market_listing_draft_db_persist_failed",
          message: "market_listing_draft_db_persist_failed",
        },
        503
      )
    );
    await expect(postMarketProviderListingDraft({})).rejects.toThrow("market_listing_draft_db_persist_failed");
  });
});
