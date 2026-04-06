import { afterEach, describe, expect, it } from "vitest";
import { getEscrowFactoryAddress } from "./escrowFactoryEnv";

describe("getEscrowFactoryAddress", () => {
  const orig = process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS;

  afterEach(() => {
    if (orig === undefined) delete process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS;
    else process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS = orig;
  });

  it("returns null when unset", () => {
    delete process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS;
    expect(getEscrowFactoryAddress()).toBeNull();
  });

  it("returns checksummed address when valid", () => {
    process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS =
      "0xcccccccccccccccccccccccccccccccccccccccc";
    expect(getEscrowFactoryAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("returns null for invalid", () => {
    process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS = "not-an-address";
    expect(getEscrowFactoryAddress()).toBeNull();
  });
});
