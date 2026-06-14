import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { routes } from "@/lib/api/routes";
import { getStewardStakeStatus } from "./stewardApplications";

function mockTextResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

describe("stewardApplications stake-status", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GETs stewardStakeStatus route with jurisdiction and wallet", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse({
        jurisdiction: "CN",
        wallet: "0x4a62316623ad457F02cDC5D997deD67a383EC569",
        has_jurisdiction_stake: false,
        min_stake_amount: "400000000000000000000000",
        pool_address: "0xabc",
        chain_id: 11155111,
      }),
    );
    const out = await getStewardStakeStatus("CN", "0x4a62316623ad457F02cDC5D997deD67a383EC569");
    expect(out?.has_jurisdiction_stake).toBe(false);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${routes.stewardStakeStatus}?jurisdiction=CN&wallet=0x4a62316623ad457F02cDC5D997deD67a383EC569`,
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("returns null on chain-off 503 without throwing", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: async () =>
        JSON.stringify({ error: "stake_pool_unavailable", message: "eth_call result too short" }),
    });
    const out = await getStewardStakeStatus("CN", "0x4a62316623ad457F02cDC5D997deD67a383EC569");
    expect(out).toBeNull();
  });
});
