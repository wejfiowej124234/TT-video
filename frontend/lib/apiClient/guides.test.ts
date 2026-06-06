/**
 * 向导 API：列表、详情、注册、上传、质押
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import { getGuides, getGuide, getGuideAvailability, postGuideUploadDoc, postGuide, postGuideStake } from "./guides";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getGuides", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs guides with query params", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [{ id: "g1" }] })
    );
    const out = await getGuides({ city: "Tokyo", language: "ja", service_type: "walk" });
    expect(out.items).toEqual([{ id: "g1" }]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${apiUrl(routes.guides)}?city=Tokyo&language=ja&service_type=walk`,
      expect.any(Object)
    );
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "login_required" })
    );
    await expect(getGuides()).rejects.toThrow();
  });
});

describe("getGuide", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("returns guide field", async () => {
    const guide = { id: "gid", city: "Osaka" };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", guide })
    );
    expect(await getGuide("gid")).toEqual(guide);
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.guideById("gid")), expect.any(Object));
  });

  it("throws guide_not_found when ok but missing guide", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await expect(getGuide("x")).rejects.toThrow("guide_not_found");
  });
});

describe("getGuideAvailability", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs availability envelope", async () => {
    const body = {
      status: "ok",
      guide_id: "g1",
      occupied_ranges: [{ order_id: "o1", start_date: "2026-04-01", end_date: "2026-04-03", source: "lock" }],
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, body));
    await expect(getGuideAvailability("g1")).resolves.toEqual(body);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.guideAvailability("g1")),
      expect.any(Object)
    );
  });
});

describe("postGuideUploadDoc", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs base64 payload with idempotency", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", url: "https://example/doc" })
    );
    const out = await postGuideUploadDoc({ content_base64: "YQ==", filename: "a.png" }, "idem-up");
    expect(out.url).toBe("https://example/doc");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.guideUploadDoc),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-up" }),
        body: JSON.stringify({ content_base64: "YQ==", filename: "a.png" }),
      })
    );
  });
});

describe("postGuide", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs registration body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postGuide({ city: "Seoul", languages: ["ko"] }, "idem-reg");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.guides),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ city: "Seoul", languages: ["ko"] }),
        headers: expect.objectContaining({ "Idempotency-Key": "idem-reg" }),
      })
    );
  });
});

describe("postGuideStake", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs stake without idempotency headers when key omitted", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postGuideStake("guide-1", { amount: "10" });
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers["Idempotency-Key"]).toBeUndefined();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.guideStake("guide-1")),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ amount: "10" }),
      })
    );
  });

  it("POSTs stake with idempotency when key provided", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postGuideStake("guide-2", { amount: "1" }, "idem-st");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.guideStake("guide-2")),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key": "idem-st",
          "X-Idempotency-Key": "idem-st",
        }),
      })
    );
  });
});
