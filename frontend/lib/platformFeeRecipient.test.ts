import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchPlatformFeeRecipientFromMeta,
  requirePlatformFeeRecipient,
  resolvePlatformFeeRecipient,
} from "./platformFeeRecipient";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("platformFeeRecipient", () => {
  const origFetch = globalThis.fetch;
  const origEnv = process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS;

  afterEach(() => {
    globalThis.fetch = origFetch;
    if (origEnv === undefined) delete process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS;
    else process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS = origEnv;
    vi.restoreAllMocks();
  });

  it("fetchPlatformFeeRecipientFromMeta returns null on bad response", async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 500 }));
    await expect(fetchPlatformFeeRecipientFromMeta()).resolves.toBeNull();
  });

  it("fetch parses escrow_platform_fee_recipient", async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({
        chain: {
          contracts: {
            escrow_platform_fee_recipient: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
        },
      })
    );
    const a = await fetchPlatformFeeRecipientFromMeta();
    expect(a).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("fetch falls back to fee_router_address", async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({
        chain: {
          contracts: {
            fee_router_address: "0xdddddddddddddddddddddddddddddddddddddddd",
          },
        },
      })
    );
    const a = await fetchPlatformFeeRecipientFromMeta();
    expect(a).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("requirePlatformFeeRecipient uses env when meta empty", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ chain: { contracts: null } }));
    process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS =
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const a = await requirePlatformFeeRecipient();
    expect(a).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("requirePlatformFeeRecipient throws on env vs meta mismatch", async () => {
    process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS =
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({
        chain: {
          contracts: {
            escrow_platform_fee_recipient: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
        },
      })
    );
    await expect(requirePlatformFeeRecipient()).rejects.toThrow(/mismatch/);
  });

  it("requirePlatformFeeRecipient throws when neither env nor meta", async () => {
    delete process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS;
    globalThis.fetch = vi.fn(async () => jsonResponse({ chain: { contracts: null } }));
    await expect(requirePlatformFeeRecipient()).rejects.toThrow(/unconfigured/);
  });

  it("resolvePlatformFeeRecipient prefers env over meta", async () => {
    process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS =
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({
        chain: {
          contracts: {
            escrow_platform_fee_recipient: "0xffffffffffffffffffffffffffffffffffffffff",
          },
        },
      })
    );
    const a = await resolvePlatformFeeRecipient();
    expect(a).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(a?.toLowerCase()).toBe("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
  });
});
