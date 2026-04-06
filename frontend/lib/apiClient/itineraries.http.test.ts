/**
 * 行程 POST 客户端：/itineraries、/itineraries/custom（52/49/56-S3）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import { postItineraryCreate, postItineraryCustom } from "./itineraries";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("postItineraryCreate", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs payload with idempotency and optional cities", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order_id: "ord-1", version: 1 })
    );
    const out = await postItineraryCreate(
      {
        destination: "中国",
        city: "北京",
        days: 5,
        cities: ["北京", "上海"],
      },
      "idem-it"
    );
    expect(out.order_id).toBe("ord-1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.itineraries),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-it" }),
      })
    );
    const raw = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.destination).toBe("中国");
    expect(parsed.city).toBe("北京");
    expect(parsed.days).toBe(5);
    expect(parsed.cities).toEqual(["北京", "上海"]);
  });

  it("includes guide_id in JSON when provided", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order_id: "ord-g" })
    );
    await postItineraryCreate({
      destination: "中国",
      city: "杭州",
      days: 2,
      guide_id: "  550e8400-e29b-41d4-a716-446655440000  ",
    });
    const raw = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.guide_id).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("omits guide_id when absent or whitespace", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order_id: "ord-2" })
    );
    await postItineraryCreate({ destination: "x", city: "y", days: 1, guide_id: "   " });
    const raw = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string;
    expect(JSON.parse(raw)).not.toHaveProperty("guide_id");
  });

  it("clamps days to 1..30", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order_id: "o" })
    );
    await postItineraryCreate({ destination: "x", city: "y", days: 999 });
    const raw = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string;
    expect(JSON.parse(raw).days).toBe(30);
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "rate_limit_exceeded" })
    );
    await expect(postItineraryCreate({ destination: "x", city: "y", days: 1 }, "k")).rejects.toThrow();
  });
});

describe("postItineraryCustom", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs custom body to itineraries/custom", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order_id: "cust-1" })
    );
    const body = {
      creator_type: "tourist" as const,
      country: "JP",
      total_days: 3,
      amount: "100",
    };
    const out = await postItineraryCustom(body, "idem-c");
    expect(out.order_id).toBe("cust-1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.itinerariesCustom),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
        headers: expect.objectContaining({ "Idempotency-Key": "idem-c" }),
      })
    );
  });

  it("POSTs optional guide_id on custom body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order_id: "cust-g" })
    );
    const body = {
      creator_type: "tourist" as const,
      country: "CN",
      total_days: 1,
      amount: 100,
      guide_id: "550e8400-e29b-41d4-a716-446655440000",
    };
    await postItineraryCustom(body);
    const raw = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string;
    expect(JSON.parse(raw).guide_id).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("throws when ok envelope but missing order_id", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await expect(
      postItineraryCustom({
        creator_type: "guide",
        country: "CN",
        total_days: 1,
        amount: 1,
      })
    ).rejects.toThrow("unknown");
  });
});
