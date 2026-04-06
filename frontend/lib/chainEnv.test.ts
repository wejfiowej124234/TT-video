import { describe, it, expect, vi, afterEach } from "vitest";
import { getExpectedChainId, getTargetChain } from "./chainEnv";

describe("chainEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getExpectedChainId defaults to 137 when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "");
    expect(getExpectedChainId()).toBe(137);
  });

  it("getExpectedChainId parses env", () => {
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "80002");
    expect(getExpectedChainId()).toBe(80002);
  });

  it("getExpectedChainId falls back on invalid", () => {
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "not-a-number");
    expect(getExpectedChainId()).toBe(137);
  });

  it("getExpectedChainId falls back on non-positive", () => {
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "0");
    expect(getExpectedChainId()).toBe(137);
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "-1");
    expect(getExpectedChainId()).toBe(137);
  });

  it("getTargetChain returns polygon for 137", () => {
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "137");
    expect(getTargetChain().id).toBe(137);
  });

  it("getTargetChain returns anvil local for 31337", () => {
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "31337");
    const c = getTargetChain();
    expect(c.id).toBe(31337);
    expect(c.rpcUrls.default.http[0]).toContain("8545");
  });

  it("getTargetChain uses NEXT_PUBLIC_RPC_URL for unknown id", () => {
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "424242");
    vi.stubEnv("NEXT_PUBLIC_RPC_URL", "https://example.invalid/rpc");
    const c = getTargetChain();
    expect(c.id).toBe(424242);
    expect(c.rpcUrls.default.http[0]).toBe("https://example.invalid/rpc");
  });
});
