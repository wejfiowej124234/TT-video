import { afterEach, describe, expect, it } from "vitest";
import { getFeeRouterAddress } from "./feeRouterEnv";

describe("getFeeRouterAddress", () => {
  const orig = process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS;

  afterEach(() => {
    if (orig === undefined) delete process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS;
    else process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS = orig;
  });

  it("returns null when unset", () => {
    delete process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS;
    expect(getFeeRouterAddress()).toBeNull();
  });

  it("returns checksummed address when valid", () => {
    process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS =
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    expect(getFeeRouterAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("returns null for invalid", () => {
    process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS = "not-an-address";
    expect(getFeeRouterAddress()).toBeNull();
  });
});
